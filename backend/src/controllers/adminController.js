/**
 * Controller: adminController
 *
 * Role exact du fichier:
 *   Implemente la supervision admin (lecture seule + approbation vendeur):
 *     - listUsers          GET   /api/admin/users
 *     - listSellers        GET   /api/admin/sellers
 *     - updateSellerStatus PATCH /api/admin/sellers/:id/status
 *     - listProducts       GET   /api/admin/products
 *     - listOrders         GET   /api/admin/orders
 *
 * Ou il est utilise:
 *   - backend/src/routes/adminRoutes.js (toutes les routes sont protegees
 *     par authenticate + requireRole("admin") au niveau du routeur).
 *
 * Regles de securite / metier (IMPORTANT):
 *   - WHITELIST de sortie stricte (toAdminUser/toAdminSeller/...): on
 *     n'expose JAMAIS passwordHash (deja select:false) ni aucun secret.
 *   - Approbation vendeur (decisions Jour 27):
 *       approved  -> SellerProfile.status=approved + approvedAt=now
 *                    + promotion User.role="seller".
 *       rejected  -> status=rejected (role inchange).
 *       suspended -> status=suspended (role reste seller).
 *   - PAS DE TRANSACTION au MVP: la mise a jour SellerProfile puis User
 *     est SEQUENTIELLE. En cas d'echec entre les deux ecritures, on peut
 *     avoir un profil approved sans role seller. C'est sans danger:
 *     requireApprovedSeller verifie SellerProfile.status (pas seulement le
 *     role), donc l'incoherence ne donne aucun droit indu. A renforcer
 *     plus tard via une transaction Mongoose.
 *   - PAS DE SUPPRESSION admin au Jour 27 (lecture + statut vendeur only).
 *
 * Notes pour GitHub Copilot:
 *   - Pagination simple (limit defaut 50, max 100 borne par les validators).
 *   - Les serializers detectent les refs peuplees (objet) vs ObjectId.
 */

const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const Product = require("../models/Product");
const Order = require("../models/Order");
const {
  BACKOFFICE_ROLES,
  BACKOFFICE_SELLER_CONFLICT_MESSAGE,
} = require("../models/shared/constants");
const {
  notifySellerStatusChanged,
} = require("../services/notificationEvents");

const DEFAULT_LIMIT = 50;

const parsePagination = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/* --- Serializers (whitelist explicite) ------------------------------------ */

// JAMAIS passwordHash. Champs utiles a la supervision uniquement.
const toAdminUser = (doc) => ({
  id: doc._id.toString(),
  firstName: doc.firstName,
  lastName: doc.lastName,
  email: doc.email,
  phone: doc.phone,
  role: doc.role,
  status: doc.status,
  isEmailVerified: !!doc.isEmailVerified,
  isPhoneVerified: !!doc.isPhoneVerified,
  createdAt: doc.createdAt,
  lastLoginAt: doc.lastLoginAt || null,
});

const adminUserRef = (user) => {
  if (user && typeof user === "object" && user._id) {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  }
  return user ? { id: user.toString() } : null;
};

const toAdminSeller = (doc) => ({
  id: doc._id.toString(),
  storeName: doc.storeName,
  slug: doc.slug,
  status: doc.status,
  isFeatured: !!doc.isFeatured,
  approvedAt: doc.approvedAt || null,
  createdAt: doc.createdAt,
  user: adminUserRef(doc.user),
});

const refShape = (value, shape) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) return shape(value);
  return value.toString ? value.toString() : null;
};

const sellerCardShape = (s) => ({
  id: s._id.toString(),
  storeName: s.storeName,
  slug: s.slug,
});

const categoryCardShape = (c) => ({
  id: c._id.toString(),
  name: c.name,
  slug: c.slug,
});

const toAdminProduct = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  price: doc.price,
  currency: doc.currency,
  stockQuantity: doc.stockQuantity,
  status: doc.status,
  isFeatured: !!doc.isFeatured,
  category: refShape(doc.category, categoryCardShape),
  seller: refShape(doc.seller, sellerCardShape),
  createdAt: doc.createdAt,
});

const toAdminOrder = (doc) => ({
  id: doc._id.toString(),
  reference: doc.reference,
  status: doc.status,
  totalAmount: doc.totalAmount,
  currency: doc.currency,
  paymentMethod: doc.paymentMethod,
  fulfillmentMethod: doc.fulfillmentMethod,
  customer: doc.customer ? doc.customer.toString() : null,
  seller: refShape(doc.seller, sellerCardShape),
  placedAt: doc.placedAt,
  createdAt: doc.createdAt,
});

/* --- Handlers -------------------------------------------------------------- */

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Liste des utilisateurs",
      data: {
        items: items.map(toAdminUser),
        pagination: buildPagination(page, limit, total),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const listSellers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      SellerProfile.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "firstName lastName email"),
      SellerProfile.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Liste des vendeurs",
      data: {
        items: items.map(toAdminSeller),
        pagination: buildPagination(page, limit, total),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateSellerStatus = async (req, res, next) => {
  try {
    const profile = await SellerProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil vendeur introuvable",
        data: null,
      });
    }

    const target = req.body.status; // approved | rejected | suspended

    if (target === "approved") {
      const profileUser = await User.findById(profile.user).select("role");
      if (!profileUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur vendeur introuvable",
          data: null,
        });
      }

      if (BACKOFFICE_ROLES.includes(profileUser.role)) {
        return res.status(409).json({
          success: false,
          message: BACKOFFICE_SELLER_CONFLICT_MESSAGE,
          data: null,
        });
      }
    }

    profile.status = target;
    if (target === "approved") {
      profile.approvedAt = new Date();
    }
    await profile.save();

    // Mise a jour SEQUENTIELLE (pas de transaction au MVP, cf. en-tete).
    // Promotion du role a l'approbation uniquement. Rejet/suspension ne
    // touchent pas au role (decisions Jour 27).
    if (target === "approved") {
      await User.findByIdAndUpdate(profile.user, { role: "seller" });
    }

    await profile.populate("user", "firstName lastName email");

    await notifySellerStatusChanged({ profile, status: target }).catch((error) => {
      console.warn("Notifications statut vendeur:", error?.message || error);
    });

    return res.status(200).json({
      success: true,
      message: "Statut vendeur mis a jour",
      data: { sellerProfile: toAdminSeller(profile) },
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
        data: null,
      });
    }

    if (targetUser.role === "owner") {
      return res.status(403).json({
        success: false,
        message: "Le compte proprietaire ne peut pas etre modifie",
        data: null,
      });
    }

    if (targetUser._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas modifier votre propre role",
        data: null,
      });
    }

    const targetRole = req.body.role;
    if (targetRole === "admin" || targetRole === "staff") {
      const conflictingSellerProfile = await SellerProfile.findOne({
        user: targetUser._id,
        status: { $in: ["pending", "approved"] },
      })
        .select("_id status")
        .lean();

      if (conflictingSellerProfile) {
        return res.status(409).json({
          success: false,
          message:
            "Ce compte possède déjà une fiche vendeur active ou en attente. Supprimez ou suspendez cette fiche avant de lui donner un rôle back-office.",
          data: { sellerStatus: conflictingSellerProfile.status },
        });
      }
    }

    targetUser.role = targetRole;
    targetUser.status = "active";
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "Role utilisateur mis a jour",
      data: { user: toAdminUser(targetUser) },
    });
  } catch (error) {
    return next(error);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .populate("seller", "storeName slug"),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Liste des produits",
      data: {
        items: items.map(toAdminProduct),
        pagination: buildPagination(page, limit, total),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const listOrders = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("seller", "storeName slug"),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Liste des commandes",
      data: {
        items: items.map(toAdminOrder),
        pagination: buildPagination(page, limit, total),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listUsers,
  listSellers,
  updateSellerStatus,
  updateUserRole,
  listProducts,
  listOrders,
};
