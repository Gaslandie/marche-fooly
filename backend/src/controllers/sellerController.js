/**
 * Controller: sellerController
 *
 * Role exact du fichier:
 *   Implemente les 3 endpoints "self-service" du vendeur:
 *     - apply():     POST   /api/sellers/apply   -> creer son SellerProfile
 *     - getMe():     GET    /api/sellers/me      -> lire sa fiche vendeur
 *     - updateMe():  PATCH  /api/sellers/me      -> editer sa fiche (approved)
 *
 * Ou il est utilise:
 *   - backend/src/routes/sellerRoutes.js
 *
 * Chaine de middlewares attendue par chaque handler:
 *   - apply:    authenticate
 *   - getMe:    authenticate
 *   - updateMe: authenticate, requireRole("seller","admin"), requireApprovedSeller
 *
 * Regles metier importantes:
 *   - Le status est TOUJOURS force a "pending" cote serveur dans apply().
 *     Un vendeur ne peut pas s'auto-approuver. Seul un admin pourra basculer
 *     vers "approved" via une future route admin.
 *   - Une seule candidature par utilisateur (index unique sur SellerProfile.user).
 *     Doublon -> 409.
 *   - updateMe() s'appuie sur req.sellerProfile deja charge par
 *     requireApprovedSeller: aucun second findOne, et donc aucun risque qu'un
 *     vendeur "pending" passe par ce point.
 *   - Whitelist UPDATE_SELLER_ME_ALLOWED_FIELDS: protege status, isFeatured,
 *     ratingAverage, ratingCount, approvedAt, slug, user contre toute
 *     modification via PATCH /me. On ne touche pas au slug ici: il reste
 *     celui defini a la creation pour eviter les collisions et casser des
 *     URL publiques deja partagees.
 *   - Format de reponse uniforme: { success, message, data }.
 *   - Helper toPublicSellerProfile(): centralise le shape API pour eviter
 *     toute fuite de champ interne et garder un contrat stable cote front.
 */

const SellerProfile = require("../models/SellerProfile");
const {
  UPDATE_SELLER_ME_ALLOWED_FIELDS,
} = require("../validators/sellerValidators");

// Shape pour les routes PUBLIQUES (GET /api/sellers, GET /api/sellers/:slug).
// Volontairement plus restreint que toPublicSellerProfile:
//   - n'expose pas `user` (lien interne vers le compte) ni `status` /
//     `approvedAt` (info admin).
//   - n'expose pas `address.street` ni `address.postalCode` (vie privee).
//   - garde `contactDetails` et la localisation ville/region/pays car le
//     vendeur les a renseignes EXPRESSEMENT pour etre contacte par les
//     clients.
const toPublicSellerCard = (doc) => ({
  id: doc._id.toString(),
  storeName: doc.storeName,
  slug: doc.slug,
  description: doc.description || "",
  logoUrl: doc.logoUrl || "",
  coverImageUrl: doc.coverImageUrl || "",
  contactDetails: {
    email: doc.contactDetails?.email || "",
    phone: doc.contactDetails?.phone || "",
  },
  address: {
    city: doc.address?.city || "",
    region: doc.address?.region || "",
    country: doc.address?.country || "",
  },
  isFeatured: doc.isFeatured,
  ratingAverage: doc.ratingAverage,
  ratingCount: doc.ratingCount,
  createdAt: doc.createdAt,
});

const toPublicSellerProfile = (doc) => ({
  id: doc._id.toString(),
  user: doc.user.toString(),
  storeName: doc.storeName,
  slug: doc.slug,
  description: doc.description || "",
  logoUrl: doc.logoUrl || "",
  coverImageUrl: doc.coverImageUrl || "",
  contactDetails: {
    email: doc.contactDetails?.email || "",
    phone: doc.contactDetails?.phone || "",
  },
  address: {
    street: doc.address?.street || "",
    city: doc.address?.city || "",
    region: doc.address?.region || "",
    country: doc.address?.country || "",
    postalCode: doc.address?.postalCode || "",
  },
  status: doc.status,
  isFeatured: doc.isFeatured,
  ratingAverage: doc.ratingAverage,
  ratingCount: doc.ratingCount,
  approvedAt: doc.approvedAt,
  createdAt: doc.createdAt,
});

const apply = async (req, res, next) => {
  try {
    const user = req.user;

    const existing = await SellerProfile.findOne({ user: user._id })
      .select("_id status")
      .lean();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Une candidature vendeur existe deja pour ce compte",
        data: { status: existing.status },
      });
    }

    const {
      storeName,
      description,
      logoUrl,
      coverImageUrl,
      contactDetails,
      address,
    } = req.body;

    // status est FORCE cote serveur. Un payload qui contiendrait status
    // ou isFeatured serait silencieusement ignore (champ non lu ici).
    const created = await SellerProfile.create({
      user: user._id,
      storeName,
      description: description || "",
      logoUrl: logoUrl || "",
      coverImageUrl: coverImageUrl || "",
      contactDetails: contactDetails || {},
      address: address || {},
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Candidature vendeur enregistree",
      data: { sellerProfile: toPublicSellerProfile(created) },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === "slug") {
        return res.status(409).json({
          success: false,
          message: "Ce nom de boutique est deja utilise",
          data: { field: "storeName" },
        });
      }
      return res.status(409).json({
        success: false,
        message: "Une candidature vendeur existe deja pour ce compte",
        data: { field: "user" },
      });
    }
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Aucun profil vendeur pour ce compte",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profil vendeur charge",
      data: { sellerProfile: toPublicSellerProfile(profile) },
    });
  } catch (error) {
    return next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    // req.sellerProfile est garanti par requireApprovedSeller pour un vendeur
    // approuve. Un admin sans SellerProfile ne doit PAS atteindre ce handler:
    // c'est au routeur de ne pas exposer PATCH /me a un admin. On garde
    // neanmoins ce filet de securite pour echouer proprement plutot que de
    // planter sur profile.save().
    const profile = req.sellerProfile;
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: "Aucun profil vendeur a mettre a jour",
        data: null,
      });
    }

    for (const field of UPDATE_SELLER_ME_ALLOWED_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
        continue;
      }
      const value = req.body[field];

      if (field === "contactDetails" && value) {
        // Merge partiel: on ne remplace que les sous-champs fournis.
        profile.contactDetails = {
          ...(profile.contactDetails
            ? profile.contactDetails.toObject()
            : {}),
          ...value,
        };
      } else if (field === "address" && value) {
        profile.address = {
          ...(profile.address ? profile.address.toObject() : {}),
          ...value,
        };
      } else {
        profile[field] = value;
      }
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profil vendeur mis a jour",
      data: { sellerProfile: toPublicSellerProfile(profile) },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/sellers
 * Liste publique paginee des vendeurs APPROUVES uniquement.
 * Tri: vendeurs mis en avant d'abord, puis plus recents en premier.
 * Pagination: page=1.., limit=1..50 (defauts: 1 et 12). Les bornes sont
 * deja validees par listSellersQueryValidators, on se contente ici de
 * parser et appliquer des defauts.
 */
const listPublic = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const filter = { status: "approved" };

    const [items, total] = await Promise.all([
      SellerProfile.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SellerProfile.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Liste des vendeurs",
      data: {
        items: items.map(toPublicSellerCard),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/sellers/:slug
 * Detail public d'un vendeur APPROUVE par slug.
 * 404 si non trouve OU non approuve: on ne distingue pas les deux cas
 * pour ne pas reveler l'existence de comptes pending/rejected/suspended.
 */
const getPublicBySlug = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({
      slug: req.params.slug,
      status: "approved",
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Vendeur introuvable",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendeur",
      data: { sellerProfile: toPublicSellerCard(profile) },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  apply,
  getMe,
  updateMe,
  listPublic,
  getPublicBySlug,
};
