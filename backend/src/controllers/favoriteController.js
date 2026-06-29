/**
 * Controller: favoriteController
 *
 * Ownership:
 *   Toutes les requetes filtrent par user === req.user._id.
 *   Aucun utilisateur ne peut lire, creer ou supprimer les favoris
 *   d'un autre compte.
 */

const Favorite = require("../models/Favorite");
const Product = require("../models/Product");
const { PUBLIC_PRODUCT_STATUSES } = require("../validators/productValidators");

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

const toPublicFavorite = (favorite, product) => ({
  id: favorite._id.toString(),
  product: toPublicProduct(product),
  createdAt: favorite.createdAt,
  updatedAt: favorite.updatedAt,
});

const findPublicProduct = (productId) =>
  Product.findOne({
    _id: productId,
    status: { $in: PUBLIC_PRODUCT_STATUSES },
  })
    .populate("category", "name slug")
    .populate("seller", "storeName slug");

// --- GET /api/favorites ----------------------------------------------------

const listMine = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [result] = await Favorite.aggregate([
      { $match: { user: req.user._id } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      { $unwind: "$productDoc" },
      { $match: { "productDoc.status": { $in: PUBLIC_PRODUCT_STATUSES } } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                product: "$productDoc._id",
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ]);

    const rows = result?.items || [];
    const productIds = rows.map((row) => row.product);
    const products = await Product.find({
      _id: { $in: productIds },
      status: { $in: PUBLIC_PRODUCT_STATUSES },
    })
      .populate("category", "name slug")
      .populate("seller", "storeName slug");

    const productsById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const items = rows
      .map((row) => {
        const product = productsById.get(row.product.toString());
        return product ? toPublicFavorite(row, product) : null;
      })
      .filter(Boolean);

    const total = result?.meta?.[0]?.total || 0;

    return res.status(200).json({
      success: true,
      message: "Liste des favoris",
      data: {
        items,
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

// --- POST /api/favorites ---------------------------------------------------

const add = async (req, res, next) => {
  try {
    const product = await findPublicProduct(req.body.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit introuvable",
        data: null,
      });
    }

    const existing = await Favorite.findOne({
      user: req.user._id,
      product: product._id,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Produit deja dans vos favoris",
        data: { favorite: toPublicFavorite(existing, product) },
      });
    }

    const created = await Favorite.create({
      user: req.user._id,
      product: product._id,
    });

    return res.status(201).json({
      success: true,
      message: "Produit ajoute aux favoris",
      data: { favorite: toPublicFavorite(created, product) },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Produit deja dans vos favoris",
        data: null,
      });
    }
    return next(error);
  }
};

// --- DELETE /api/favorites/:productId --------------------------------------

const remove = async (req, res, next) => {
  try {
    const result = await Favorite.deleteOne({
      user: req.user._id,
      product: req.params.productId,
    });

    return res.status(200).json({
      success: true,
      message: result.deletedCount
        ? "Produit retire des favoris"
        : "Produit absent de vos favoris",
      data: { removed: result.deletedCount > 0 },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listMine,
  add,
  remove,
};
