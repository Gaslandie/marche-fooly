/**
 * Controller: productController
 *
 * Role exact du fichier:
 *   Implemente les 6 endpoints produits:
 *     - listPublic         GET    /api/products                                 (public)
 *     - listByCategory     GET    /api/products/category/:categorySlug          (public, alias REST)
 *     - getBySellerAndSlug GET    /api/products/:sellerSlug/:productSlug        (public)
 *     - create             POST   /api/products                                 (seller approved)
 *     - update             PATCH  /api/products/:id                             (owner OR admin)
 *     - softDelete         DELETE /api/products/:id                             (owner OR admin)
 *
 * Ou il est utilise:
 *   - backend/src/routes/productRoutes.js
 *
 * Chaines de middlewares attendues:
 *   - listPublic, listByCategory, getBySellerAndSlug: publiques.
 *   - create: authenticate + requireApprovedSeller.
 *   - update, softDelete: authenticate.
 *       Le controleur charge le Product, puis branche:
 *         - admin            -> autorise tout
 *         - seller approved  -> verifie ownership (product.seller == sellerProfile._id)
 *         - autre            -> 403
 *
 * Pourquoi pas de requireApprovedSeller sur PATCH/DELETE:
 *   On veut que l'admin puisse modifier/supprimer sans avoir de
 *   SellerProfile. Le controleur fait la verification fine: si l'user
 *   est admin -> OK; sinon, on charge son SellerProfile et on verifie
 *   l'ownership. Cela evite les faux 403 pour les admins.
 *
 * Regles de securite / metier:
 *   - product.seller est TOUJOURS injecte cote serveur depuis
 *     req.sellerProfile (jamais lu depuis req.body).
 *   - currency forcee a "GNF" si non fournie ou si le validator a laisse
 *     passer un cas limite.
 *   - Ownership: comparaison ObjectId via .toString() (les ObjectId ne
 *     sont pas egaux avec ===).
 *   - Category check au POST/PATCH: la categorie cible doit exister ET
 *     etre isActive: true.
 *   - isFeatured: rejete 422 si fourni par un non-admin (cf. decision E
 *     du Jour 18).
 *   - Routes publiques: filtre status IN ["active","out_of_stock"]
 *     pour ne JAMAIS fuiter "draft" ou "archived".
 *   - DELETE = soft-delete (status="archived"), idempotent.
 *   - VersionError de Mongoose (optimisticConcurrency) -> 409 lisible.
 *   - 11000 sur (seller, slug) ou sku -> 409 lisible.
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - toPublicProduct() detecte si seller/category sont populated et
 *     adapte la sortie en consequence (objet vs string ObjectId).
 *   - escapeRegex() utilise pour ?q= (anti-ReDoS).
 */

const Product = require("../models/Product");
const Category = require("../models/Category");
const SellerProfile = require("../models/SellerProfile");
const { ADMIN_OPERATION_ROLES } = require("../models/shared/constants");

const {
  CREATE_PRODUCT_ALLOWED_FIELDS,
  UPDATE_PRODUCT_ALLOWED_FIELDS,
  PUBLIC_PRODUCT_STATUSES,
  escapeRegex,
} = require("../validators/productValidators");
const {
  ProductImageError,
  markProductImageAttached,
  verifyProductImageForSeller,
} = require("../services/productImageService");

// Helper: serialise le ref soit comme objet (si populated) soit comme
// string ObjectId, soit null. Garde un contrat API stable.
const serializeRef = (value, populatedShape) => {
  if (!value) return null;
  if (typeof value === "object" && value._id && populatedShape) {
    return populatedShape(value);
  }
  return value.toString ? value.toString() : null;
};

const sellerShape = (s) => ({
  id: s._id.toString(),
  slug: s.slug,
  storeName: s.storeName,
});

const categoryShape = (c) => ({
  id: c._id.toString(),
  slug: c.slug,
  name: c.name,
});

const coverImageShape = (coverImage) => {
  if (!coverImage) return null;
  return {
    largeFileId: coverImage.largeFileId?.toString?.() || "",
    thumbFileId: coverImage.thumbFileId?.toString?.() || "",
    largeUrl: coverImage.largeUrl || "",
    thumbUrl: coverImage.thumbUrl || "",
    version: coverImage.version || "",
    width: coverImage.width || 0,
    height: coverImage.height || 0,
    mimeType: coverImage.mimeType || "",
    bytes: coverImage.bytes || 0,
  };
};

const toPublicProduct = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  shortDescription: doc.shortDescription || "",
  description: doc.description,
  price: doc.price,
  currency: doc.currency,
  stockQuantity: doc.stockQuantity,
  sku: doc.sku || "",
  images: (doc.images || []).map((img) => ({
    url: img.url,
    altText: img.altText || "",
    sortOrder: img.sortOrder || 0,
    isPrimary: !!img.isPrimary,
  })),
  coverImageUrl: doc.coverImageUrl || "",
  coverImage: coverImageShape(doc.coverImage),
  status: doc.status,
  tags: doc.tags || [],
  deliveryFee: doc.deliveryFee || 0,
  isFreeDelivery: !!doc.isFreeDelivery,
  pickupAddress: {
    city: doc.pickupAddress?.city || "",
    region: doc.pickupAddress?.region || "",
    country: doc.pickupAddress?.country || "",
  },
  isFeatured: !!doc.isFeatured,
  category: serializeRef(doc.category, categoryShape),
  seller: serializeRef(doc.seller, sellerShape),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// --- Verifications metier reutilisables ------------------------------------

const ensureCategoryActive = async (categoryId) => {
  const cat = await Category.findById(categoryId).select("_id isActive").lean();
  if (!cat) {
    return { ok: false, status: 422, message: "Categorie introuvable" };
  }
  if (!cat.isActive) {
    return { ok: false, status: 422, message: "Categorie inactive" };
  }
  return { ok: true };
};

const mapDuplicateKey = (error) => {
  if (!error || error.code !== 11000) return null;
  const field = Object.keys(error.keyPattern || {})[0] || "name";
  let message;
  if (field === "sku") {
    message = "Ce SKU est deja utilise";
  } else if (field === "slug" || error.keyPattern?.seller) {
    message = "Vous avez deja un produit avec ce nom";
  } else {
    message = "Conflit d'unicite";
  }
  return {
    status: 409,
    body: { success: false, message, data: { field } },
  };
};

const mapVersionError = (error) => {
  if (!error || error.name !== "VersionError") return null;
  return {
    status: 409,
    body: {
      success: false,
      message: "Le produit a ete modifie entre temps. Rechargez et reessayez.",
      data: null,
    },
  };
};

const reject403 = (res) =>
  res.status(403).json({ success: false, message: "Acces refuse", data: null });

const reject404 = (res) =>
  res
    .status(404)
    .json({ success: false, message: "Produit introuvable", data: null });

const applyCoverImagePayload = async (payload, sellerId) => {
  if (!Object.prototype.hasOwnProperty.call(payload, "coverImage")) {
    return null;
  }

  if (!payload.coverImage) {
    payload.coverImage = null;
    payload.coverImageUrl = "";
    return null;
  }

  const coverImage = await verifyProductImageForSeller(
    payload.coverImage,
    sellerId,
  );
  payload.coverImage = coverImage;
  payload.coverImageUrl = coverImage.largeUrl;
  return coverImage;
};

// --- Listing public --------------------------------------------------------

const listPublic = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { status: { $in: PUBLIC_PRODUCT_STATUSES } };

    // ?category=<slug>: categorie doit exister et etre active.
    if (req.query.category) {
      const cat = await Category.findOne({
        slug: req.query.category,
        isActive: true,
      })
        .select("_id")
        .lean();
      if (!cat) {
        return res.status(200).json({
          success: true,
          message: "Liste des produits",
          data: {
            items: [],
            pagination: { page, limit, total: 0, totalPages: 1 },
          },
        });
      }
      filter.category = cat._id;
    }

    // ?seller=<slug>: vendeur approuve uniquement.
    if (req.query.seller) {
      const sp = await SellerProfile.findOne({
        slug: req.query.seller,
        status: "approved",
      })
        .select("_id")
        .lean();
      if (!sp) {
        return res.status(200).json({
          success: true,
          message: "Liste des produits",
          data: {
            items: [],
            pagination: { page, limit, total: 0, totalPages: 1 },
          },
        });
      }
      filter.seller = sp._id;
    }

    // ?q=<recherche>: regex case-insensitive sur name + description.
    // L'entree est escapee pour empecher l'injection regex / ReDoS.
    if (req.query.q) {
      const safe = escapeRegex(req.query.q);
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
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
        items: items.map(toPublicProduct),
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

// Alias REST: GET /api/products/category/:categorySlug.
// Reutilise listPublic en injectant le slug dans req.query.
const listByCategory = (req, res, next) => {
  req.query = { ...req.query, category: req.params.categorySlug };
  return listPublic(req, res, next);
};

const getBySellerAndSlug = async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({
      slug: req.params.sellerSlug,
      status: "approved",
    })
      .select("_id")
      .lean();
    if (!seller) return reject404(res);

    const product = await Product.findOne({
      seller: seller._id,
      slug: req.params.productSlug,
      status: { $in: PUBLIC_PRODUCT_STATUSES },
    })
      .populate("category", "name slug")
      .populate("seller", "storeName slug");

    if (!product) return reject404(res);

    return res.status(200).json({
      success: true,
      message: "Produit",
      data: { product: toPublicProduct(product) },
    });
  } catch (error) {
    return next(error);
  }
};

// --- Ecriture (seller + admin) ---------------------------------------------

const create = async (req, res, next) => {
  try {
    // req.sellerProfile garanti par requireApprovedSeller.
    // Pour un admin sans SellerProfile, ce middleware laisse passer ET
    // req.sellerProfile reste undefined. On bloque ici car au MVP, POST
    // est reserve aux vendeurs (decision B).
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: "Seuls les vendeurs approuves peuvent creer un produit",
        data: null,
      });
    }

    // Whitelist stricte: aucune lecture de seller/slug/_id/etc.
    const payload = {};
    for (const field of CREATE_PRODUCT_ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    }

    // category check (existence + isActive).
    const catCheck = await ensureCategoryActive(payload.category);
    if (!catCheck.ok) {
      return res.status(catCheck.status).json({
        success: false,
        message: catCheck.message,
        data: null,
      });
    }

    // Forces serveur.
    payload.seller = req.sellerProfile._id;
    payload.currency = "GNF";

    const pendingCoverImage = await applyCoverImagePayload(
      payload,
      req.sellerProfile._id,
    );

    const created = await Product.create(payload);
    if (pendingCoverImage) {
      await markProductImageAttached(created.coverImage, created._id).catch(
        (error) => {
          console.warn("Attachement image produit:", error?.message || error);
        },
      );
    }

    return res.status(201).json({
      success: true,
      message: "Produit cree",
      data: { product: toPublicProduct(created) },
    });
  } catch (error) {
    if (error instanceof ProductImageError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
    const dup = mapDuplicateKey(error);
    if (dup) return res.status(dup.status).json(dup.body);
    return next(error);
  }
};

const loadOwnSellerProfile = async (user) => {
  if (!user || user.role !== "seller") return null;
  return SellerProfile.findOne({
    user: user._id,
    status: "approved",
  })
    .select("_id")
    .lean();
};

const update = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return reject404(res);

    const isAdmin = ADMIN_OPERATION_ROLES.includes(req.user.role);

    // Ownership pour non-admins.
    if (!isAdmin) {
      const sellerProfile = await loadOwnSellerProfile(req.user);
      if (!sellerProfile) return reject403(res);
      if (product.seller.toString() !== sellerProfile._id.toString()) {
        return reject403(res);
      }
    }

    // isFeatured: admin-only. Pour un non-admin qui le fournit -> 422.
    if (
      Object.prototype.hasOwnProperty.call(req.body, "isFeatured") &&
      !isAdmin
    ) {
      return res.status(422).json({
        success: false,
        message: "Le champ \"isFeatured\" est reserve aux administrateurs",
        data: null,
      });
    }

    // category change: revalider existence + active.
    if (Object.prototype.hasOwnProperty.call(req.body, "category")) {
      const catCheck = await ensureCategoryActive(req.body.category);
      if (!catCheck.ok) {
        return res.status(catCheck.status).json({
          success: false,
          message: catCheck.message,
          data: null,
        });
      }
    }

    const incoming = { ...req.body };
    const pendingCoverImage = await applyCoverImagePayload(
      incoming,
      product.seller,
    );

    // Whitelist effective selon le role.
    const allowed = isAdmin
      ? [...UPDATE_PRODUCT_ALLOWED_FIELDS, "isFeatured"]
      : UPDATE_PRODUCT_ALLOWED_FIELDS;

    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(incoming, field)) {
        product[field] = incoming[field];
      }
    }

    // Securite supplementaire: garantir GNF cote serveur si le validator
    // a laisse passer une valeur (ne devrait pas arriver, defense en
    // profondeur).
    product.currency = "GNF";

    await product.save();
    if (pendingCoverImage) {
      await markProductImageAttached(product.coverImage, product._id).catch(
        (error) => {
          console.warn("Attachement image produit:", error?.message || error);
        },
      );
    }

    return res.status(200).json({
      success: true,
      message: "Produit mis a jour",
      data: { product: toPublicProduct(product) },
    });
  } catch (error) {
    if (error instanceof ProductImageError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
    const ver = mapVersionError(error);
    if (ver) return res.status(ver.status).json(ver.body);
    const dup = mapDuplicateKey(error);
    if (dup) return res.status(dup.status).json(dup.body);
    return next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return reject404(res);

    const isAdmin = ADMIN_OPERATION_ROLES.includes(req.user.role);
    if (!isAdmin) {
      const sellerProfile = await loadOwnSellerProfile(req.user);
      if (!sellerProfile) return reject403(res);
      if (product.seller.toString() !== sellerProfile._id.toString()) {
        return reject403(res);
      }
    }

    // Idempotent: si deja archive, retour 200 sans changement.
    if (product.status === "archived") {
      return res.status(200).json({
        success: true,
        message: "Produit deja archive",
        data: { product: toPublicProduct(product) },
      });
    }

    product.status = "archived";
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Produit archive",
      data: { product: toPublicProduct(product) },
    });
  } catch (error) {
    const ver = mapVersionError(error);
    if (ver) return res.status(ver.status).json(ver.body);
    return next(error);
  }
};

module.exports = {
  listPublic,
  listByCategory,
  getBySellerAndSlug,
  create,
  update,
  softDelete,
};
