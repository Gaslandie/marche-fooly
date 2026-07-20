const crypto = require("node:crypto");

const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");
const { signAuthToken } = require("../utils/jwt");
const {
  isMailerEnabled,
  sendPasswordResetEmail,
} = require("../utils/mailer");
const {
  UPDATE_ME_ALLOWED_FIELDS,
} = require("../validators/authValidators");

/** Duree de validite d'un lien de reinitialisation (1 heure). */
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Format de sortie commun pour un utilisateur expose via l'API.
 * Le champ passwordHash est deja `select: false` cote modele, mais on
 * filtre explicitement ici pour eviter toute fuite accidentelle.
 */
const toPublicUser = (userDoc) => ({
  id: userDoc._id.toString(),
  firstName: userDoc.firstName,
  lastName: userDoc.lastName,
  email: userDoc.email,
  phone: userDoc.phone,
  role: userDoc.role,
  status: userDoc.status,
  avatarUrl: userDoc.avatarUrl || "",
  isEmailVerified: userDoc.isEmailVerified,
  isPhoneVerified: userDoc.isPhoneVerified,
  address: userDoc.address
    ? {
        street: userDoc.address.street || "",
        city: userDoc.address.city || "",
        region: userDoc.address.region || "",
        country: userDoc.address.country || "",
        postalCode: userDoc.address.postalCode || "",
      }
    : null,
  createdAt: userDoc.createdAt,
});

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { phone }] })
      .select("_id email phone")
      .lean();

    if (existing) {
      const conflictField = existing.email === email ? "email" : "phone";
      return res.status(409).json({
        success: false,
        message:
          conflictField === "email"
            ? "Un compte existe deja avec cet email"
            : "Un compte existe deja avec ce numero de telephone",
        data: { field: conflictField },
      });
    }

    const passwordHash = await hashPassword(password);

    // Le role est force cote serveur: l'inscription publique ne cree
    // que des comptes client. Le statut "active" permet la connexion
    // immediate tant que la verification email n'est pas implementee.
    const created = await User.create({
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      role: "customer",
      status: "active",
    });

    const token = signAuthToken(created);

    return res.status(201).json({
      success: true,
      message: "Compte cree avec succes",
      data: {
        user: toPublicUser(created),
        token,
      },
    });
  } catch (error) {
    // Garde-fou: si une course condition cree un doublon entre le
    // findOne et le create, Mongo renvoie le code 11000 sur l'index
    // unique email.
    if (error && error.code === 11000) {
      const field = Object.keys(error.keyPattern || { email: 1 })[0];
      return res.status(409).json({
        success: false,
        message: "Un compte existe deja avec ces informations",
        data: { field },
      });
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");

    // Message identique pour email inconnu ET mot de passe faux:
    // limite l'enumeration des comptes existants.
    const genericFailure = {
      success: false,
      message: "Email ou mot de passe incorrect",
      data: null,
    };

    if (!user) {
      return res.status(401).json(genericFailure);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json(genericFailure);
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Ce compte est suspendu",
        data: null,
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken(user);

    return res.status(200).json({
      success: true,
      message: "Connexion reussie",
      data: {
        user: toPublicUser(user),
        token,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Anti-enumeration: la reponse est TOUJOURS le meme 200 generique, que
 * l'email existe ou non. Le token n'est jamais stocke en clair (hash
 * SHA-256 + expiration 1h). `updateOne` evite de re-valider les anciens
 * documents (protection des donnees de production).
 */
const forgotPassword = async (req, res, next) => {
  try {
    // Reponse honnete si l'envoi d'emails n'est pas configure: on ne
    // promet pas un email qui ne partira jamais. (Le frontend affiche
    // son propre message neutre sur ce 503.)
    if (!isMailerEnabled()) {
      return res.status(503).json({
        success: false,
        message: "La reinitialisation par email est momentanement indisponible.",
        data: null,
      });
    }

    const { email } = req.body;

    const genericResponse = {
      success: true,
      message:
        "Si un compte existe avec cet email, un lien de reinitialisation " +
        "vient d'etre envoye. Pensez a verifier vos spams.",
      data: null,
    };

    const user = await User.findOne({ email }).select("_id email").lean();
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString("hex");
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetTokenHash: hashResetToken(token),
          passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      },
    );

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetPath: `/reinitialiser-mot-de-passe?token=${token}`,
      });
    } catch (mailError) {
      // Echec SMTP transitoire: on journalise sans casser l'anti-enumeration
      // (une erreur ciblee revelerait que le compte existe).
      console.error("[forgotPassword] envoi email impossible:", mailError.message);
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Verifie le token (hash + expiration), remplace le mot de passe puis
 * invalide le token (usage unique).
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("_id status");

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Ce lien de reinitialisation est invalide ou expire. " +
          "Refaites une demande depuis « Mot de passe oublie ».",
        data: null,
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Ce compte est suspendu",
        data: null,
      });
    }

    const passwordHash = await hashPassword(password);
    await User.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: { passwordResetTokenHash: "", passwordResetExpiresAt: "" },
      },
    );

    return res.status(200).json({
      success: true,
      message:
        "Mot de passe mis a jour. Vous pouvez maintenant vous connecter.",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res) => {
  // req.user est garanti par le middleware authenticate.
  return res.status(200).json({
    success: true,
    message: "Utilisateur authentifie",
    data: {
      user: toPublicUser(req.user),
    },
  });
};

const updateMe = async (req, res, next) => {
  try {
    const user = req.user;

    // Whitelist stricte: tout champ hors UPDATE_ME_ALLOWED_FIELDS est
    // ignore. Cela bloque toute tentative de modifier role, status,
    // email, passwordHash, isEmailVerified, etc. via PATCH /me.
    for (const field of UPDATE_ME_ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === "address" && req.body.address) {
          // Merge partiel: on ne remplace que les sous-champs fournis
          // pour ne pas effacer ceux que le client n'a pas envoyes.
          user.address = {
            ...(user.address ? user.address.toObject() : {}),
            ...req.body.address,
          };
        } else {
          user[field] = req.body[field];
        }
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profil mis a jour",
      data: { user: toPublicUser(user) },
    });
  } catch (error) {
    // Telephone en doublon -> 409 lisible.
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ces informations sont deja utilisees par un autre compte",
        data: { field: Object.keys(error.keyPattern || {})[0] || null },
      });
    }
    return next(error);
  }
};

/**
 * Logout sans etat: avec un JWT pur (sans refresh token), la revocation
 * cote serveur n'est pas possible sans store partage (Redis + jti).
 * L'endpoint existe pour homogeneite cote client (qui doit supprimer
 * son token local) et pour permettre d'ajouter plus tard une blacklist
 * sans casser le contrat d'API.
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Deconnexion effectuee",
    data: null,
  });
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  me,
  updateMe,
  logout,
};
