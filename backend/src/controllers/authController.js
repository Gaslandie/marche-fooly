const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");
const { signAuthToken } = require("../utils/jwt");

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

module.exports = {
  register,
  login,
  me,
};
