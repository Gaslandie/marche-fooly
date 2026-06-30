/**
 * Controller: orderController
 *
 * Role exact du fichier:
 *   Implemente les 6 endpoints commandes:
 *     - create           POST   /api/orders                       (authenticate)
 *     - listMine         GET    /api/orders/mine                  (authenticate)
 *     - statsMine        GET    /api/orders/mine/stats            (authenticate)
 *     - listSeller       GET    /api/orders/seller                (authenticate + requireApprovedSeller)
 *     - getByReference   GET    /api/orders/:reference            (authenticate)
 *     - updateStatus     PATCH  /api/orders/:reference/status     (authenticate)
 *
 * Ou il est utilise:
 *   - backend/src/routes/orderRoutes.js
 *
 * Chaines de middlewares attendues:
 *   - Toutes les routes sont authentifiees (aucune route publique).
 *   - listSeller exige en plus un SellerProfile approved (chargement
 *     req.sellerProfile par le middleware).
 *
 * Pourquoi pas d'ownership middleware reutilisable:
 *   La verification d'ownership commande necessite de charger l'ordre
 *   (et eventuellement le SellerProfile du user). On fait ces lookups
 *   dans chaque handler qui en a besoin, evitant un middleware qui ferait
 *   deja le findById en avance.
 *
 * Regles metier critiques (cf. decisions Jour 19):
 *   - MONO-VENDEUR strict: tous les items[].product doivent avoir le meme
 *     seller. Sinon 422 "Panier multi-vendeur non supporte".
 *   - Seul status="active" est commandable. "out_of_stock"/"draft"/
 *     "archived" -> 422.
 *   - Snapshot productName + unitPrice a la creation (proteger l'historique
 *     si le vendeur modifie le produit plus tard).
 *   - DECREMENT STOCK ATOMIQUE via findOneAndUpdate avec condition
 *     stockQuantity >= q. En cas d'echec partiel, COMPENSATION manuelle
 *     (restitution des items deja decrementes).
 *   - deliveryFee:
 *       seller_pickup        -> 0
 *       home_delivery        -> max(product.deliveryFee) des items non-gratuits
 *                               (ou 0 si tous gratuits)
 *   - customer (=req.user._id) et seller (=produit) sont injectes serveur.
 *     currency forcee a "GNF".
 *   - shippingAddress: REQUISE si fulfillmentMethod=home_delivery.
 *     Sinon optionnelle (peut etre vide).
 *   - reference: generee + retry sur E11000 (collision tres rare).
 *
 *   Machine d'etat:
 *     pending  -> confirmed | cancelled
 *     confirmed -> preparing | cancelled
 *     preparing -> shipped | cancelled
 *     shipped  -> delivered
 *     delivered/cancelled = etats terminaux
 *
 *   Autorisations transitions:
 *     pending -> cancelled              : customer-owner | seller-owner | admin
 *     pending -> confirmed              : seller-owner | admin
 *     confirmed -> preparing            : seller-owner | admin
 *     confirmed -> cancelled            : seller-owner | admin
 *     preparing -> shipped              : seller-owner | admin
 *     preparing -> cancelled            : seller-owner | admin
 *     shipped -> delivered              : seller-owner | admin
 *
 *   A l'annulation: restituer le stock decremente.
 *
 *   Visibilite GET /:reference: customer-owner | seller-owner | admin.
 *   Non-autorise -> 404 (pas 403) pour ne pas reveler l'existence d'une
 *   reference a un attaquant qui scrute.
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - toPublicOrder() inclut le snapshot complet, populate seller (slug,
 *     storeName) pour la vue client; le seller voit aussi ses propres
 *     commandes via le meme shape.
 *   - determineActor(): factorise la decision admin/seller/customer/none.
 */

const Product = require("../models/Product");
const SellerProfile = require("../models/SellerProfile");
const Order = require("../models/Order");
const { BACKOFFICE_ROLES } = require("../models/shared/constants");

const {
  CREATE_ORDER_ALLOWED_FIELDS,
} = require("../validators/orderValidators");
const { generateOrderReference } = require("../utils/orderReference");
const {
  notifyOrderCreated,
  notifyOrderStatusChanged,
} = require("../services/notificationEvents");

const MAX_REFERENCE_RETRIES = 3;

// --- Serialisation ---------------------------------------------------------

const serializeSellerRef = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) {
    return {
      id: value._id.toString(),
      slug: value.slug,
      storeName: value.storeName,
    };
  }
  return value.toString ? value.toString() : null;
};

const toPublicOrder = (doc) => ({
  id: doc._id.toString(),
  reference: doc.reference,
  customer: doc.customer ? doc.customer.toString() : null,
  seller: serializeSellerRef(doc.seller),
  status: doc.status,
  paymentMethod: doc.paymentMethod,
  fulfillmentMethod: doc.fulfillmentMethod,
  currency: doc.currency,
  items: (doc.items || []).map((item) => ({
    product: item.product ? item.product.toString() : null,
    productName: item.productName,
    sku: item.sku || "",
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  })),
  subtotalAmount: doc.subtotalAmount,
  deliveryFee: doc.deliveryFee,
  totalAmount: doc.totalAmount,
  shippingAddress: {
    street: doc.shippingAddress?.street || "",
    city: doc.shippingAddress?.city || "",
    region: doc.shippingAddress?.region || "",
    country: doc.shippingAddress?.country || "",
    postalCode: doc.shippingAddress?.postalCode || "",
  },
  customerPhone: doc.customerPhone,
  notes: doc.notes || "",
  placedAt: doc.placedAt,
  deliveredAt: doc.deliveredAt,
  cancelledAt: doc.cancelledAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// --- Helpers metier --------------------------------------------------------

const STATUS_TRANSITIONS = {
  pending: {
    confirmed: ["seller", "admin"],
    cancelled: ["customer", "seller", "admin"],
  },
  confirmed: {
    preparing: ["seller", "admin"],
    cancelled: ["seller", "admin"],
  },
  preparing: {
    shipped: ["seller", "admin"],
    cancelled: ["seller", "admin"],
  },
  shipped: {
    delivered: ["seller", "admin"],
  },
  delivered: {},
  cancelled: {},
};

const computeDeliveryFee = (fulfillmentMethod, productsData) => {
  if (fulfillmentMethod === "seller_pickup") return 0;
  const paying = productsData.filter((p) => !p.isFreeDelivery);
  if (paying.length === 0) return 0;
  return Math.max(...paying.map((p) => p.deliveryFee || 0));
};

// Retourne l'acteur metier ("customer" | "seller" | "admin" | null)
// pour un order donne et un req.
const determineActor = async (order, req) => {
  if (BACKOFFICE_ROLES.includes(req.user.role)) return "admin";
  if (order.customer.equals(req.user._id)) return "customer";
  // Sinon, verifier s'il est le vendeur owner via son sellerProfile.
  const sp = await SellerProfile.findOne({
    user: req.user._id,
    status: "approved",
  })
    .select("_id")
    .lean();
  if (sp && order.seller.equals(sp._id)) return "seller";
  return null;
};

const restoreStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stockQuantity: item.quantity },
    });
  }
};

// --- POST /api/orders ------------------------------------------------------

const create = async (req, res, next) => {
  try {
    // Whitelist body
    const payload = {};
    for (const field of CREATE_ORDER_ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    }

    // 1) Verifier fulfillment + shippingAddress coherent
    if (payload.fulfillmentMethod === "home_delivery") {
      const a = payload.shippingAddress || {};
      if (!a.street || !a.city) {
        return res.status(422).json({
          success: false,
          message:
            "shippingAddress.street et shippingAddress.city sont requis pour home_delivery",
          data: null,
        });
      }
    }

    // 2) Charger les produits demandes
    const requestedItems = payload.items || [];
    const productIds = requestedItems.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(422).json({
        success: false,
        message: "Un ou plusieurs produits sont introuvables",
        data: null,
      });
    }

    const productsById = new Map(products.map((p) => [p._id.toString(), p]));

    // 3) Tous les produits doivent etre status="active"
    //    (out_of_stock visible mais NON commandable, draft/archived idem)
    for (const p of products) {
      if (p.status !== "active") {
        return res.status(422).json({
          success: false,
          message: `Produit non commandable: ${p.name} (status: ${p.status})`,
          data: { productId: p._id.toString() },
        });
      }
    }

    // 4) Mono-vendeur strict: tous les produits doivent avoir le meme seller
    const sellerIds = [...new Set(products.map((p) => p.seller.toString()))];
    if (sellerIds.length > 1) {
      return res.status(422).json({
        success: false,
        message:
          "Panier multi-vendeur non supporte. Creer une commande par vendeur.",
        data: null,
      });
    }
    const sellerId = sellerIds[0];

    // 5) Snapshot items + decrement stock atomique avec compensation
    const decrementedItems = [];
    const snapshotItems = [];
    for (const requested of requestedItems) {
      const product = productsById.get(requested.product);
      const quantity = requested.quantity;

      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stockQuantity: { $gte: quantity } },
        { $inc: { stockQuantity: -quantity } },
      );
      if (!updated) {
        // Compensation: restituer les decrement deja effectues
        await restoreStock(decrementedItems);
        return res.status(422).json({
          success: false,
          message: `Stock insuffisant pour: ${product.name}`,
          data: { productId: product._id.toString() },
        });
      }
      decrementedItems.push({
        product: product._id,
        quantity,
      });
      snapshotItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku || "",
        unitPrice: product.price,
        quantity,
        // subtotal sera recalcule par le pre-validate hook
      });
    }

    // 6) deliveryFee selon regle metier (decision D)
    const deliveryFee = computeDeliveryFee(
      payload.fulfillmentMethod,
      products,
    );

    // 7) Construire le doc et tenter la creation avec retry sur E11000 reference
    let created = null;
    for (let attempt = 0; attempt < MAX_REFERENCE_RETRIES; attempt += 1) {
      try {
        created = await Order.create({
          reference: generateOrderReference(),
          customer: req.user._id,
          seller: sellerId,
          items: snapshotItems,
          status: "pending",
          paymentMethod: payload.paymentMethod,
          fulfillmentMethod: payload.fulfillmentMethod,
          currency: "GNF",
          deliveryFee,
          shippingAddress: payload.shippingAddress || {},
          customerPhone: payload.customerPhone,
          notes: payload.notes || "",
        });
        break;
      } catch (error) {
        const isRefCollision =
          error &&
          error.code === 11000 &&
          error.keyPattern &&
          error.keyPattern.reference;
        if (isRefCollision && attempt < MAX_REFERENCE_RETRIES - 1) {
          continue;
        }
        // Tout autre echec (incluant validation, version, etc.) -> compenser le stock
        await restoreStock(decrementedItems);
        throw error;
      }
    }

    await notifyOrderCreated({ order: created }).catch((error) => {
      console.warn("Notifications creation commande:", error?.message || error);
    });

    return res.status(201).json({
      success: true,
      message: "Commande creee",
      data: { order: toPublicOrder(created) },
    });
  } catch (error) {
    return next(error);
  }
};

// --- GET /api/orders/mine --------------------------------------------------

const listMine = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { customer: req.user._id };
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
        items: items.map(toPublicOrder),
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

// --- GET /api/orders/mine/stats -------------------------------------------

const statsMine = async (req, res, next) => {
  try {
    const [stats] = await Order.aggregate([
      { $match: { customer: req.user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
            },
          },
          deliveredCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
            },
          },
          inProgressCount: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["pending", "confirmed", "preparing", "shipped"],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Statistiques commandes",
      data: {
        stats: {
          totalOrders: stats?.totalOrders || 0,
          totalSpent: stats?.totalSpent || 0,
          deliveredCount: stats?.deliveredCount || 0,
          inProgressCount: stats?.inProgressCount || 0,
          currency: "GNF",
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// --- GET /api/orders/seller ------------------------------------------------

const listSeller = async (req, res, next) => {
  try {
    // req.sellerProfile garanti par requireApprovedSeller (sauf admin).
    // Un admin sans sellerProfile sur cette route -> 403 explicite.
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message:
          "Cette route est reservee aux vendeurs approuves. Les admins utilisent les routes admin dediees.",
        data: null,
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = { seller: req.sellerProfile._id };
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
      message: "Liste des commandes vendeur",
      data: {
        items: items.map(toPublicOrder),
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

// --- GET /api/orders/:reference --------------------------------------------

const getByReference = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      reference: req.params.reference,
    }).populate("seller", "storeName slug");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable",
        data: null,
      });
    }

    const actor = await determineActor(order, req);
    if (!actor) {
      // Non-owner et non-admin: 404 pour ne pas reveler l'existence de
      // la reference a un attaquant qui scrute.
      return res.status(404).json({
        success: false,
        message: "Commande introuvable",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Commande",
      data: { order: toPublicOrder(order) },
    });
  } catch (error) {
    return next(error);
  }
};

// --- PATCH /api/orders/:reference/status -----------------------------------

const updateStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ reference: req.params.reference });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable",
        data: null,
      });
    }

    const actor = await determineActor(order, req);
    if (!actor) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable",
        data: null,
      });
    }

    const target = req.body.status;
    const previousStatus = order.status;
    const allowedActors = STATUS_TRANSITIONS[order.status]?.[target];

    // Pas de transition definie -> transition interdite (etat terminal,
    // ou cible non joignable depuis l'etat courant).
    if (!allowedActors) {
      return res.status(422).json({
        success: false,
        message: `Transition interdite: ${order.status} -> ${target}`,
        data: { currentStatus: order.status, targetStatus: target },
      });
    }

    if (!allowedActors.includes(actor)) {
      return res.status(403).json({
        success: false,
        message: "Acces refuse pour cette transition",
        data: null,
      });
    }

    // Effets de bord metier
    if (target === "cancelled") {
      await restoreStock(
        order.items.map((it) => ({
          product: it.product,
          quantity: it.quantity,
        })),
      );
      order.cancelledAt = new Date();
    }
    if (target === "delivered") {
      order.deliveredAt = new Date();
    }

    order.status = target;
    await order.save();

    await notifyOrderStatusChanged({
      order,
      previousStatus,
      actor,
    }).catch((error) => {
      console.warn("Notifications statut commande:", error?.message || error);
    });

    // Repopulate seller pour le retour.
    await order.populate("seller", "storeName slug");

    return res.status(200).json({
      success: true,
      message: "Statut commande mis a jour",
      data: { order: toPublicOrder(order) },
    });
  } catch (error) {
    if (error && error.name === "VersionError") {
      return res.status(409).json({
        success: false,
        message: "La commande a ete modifiee entre temps. Rechargez et reessayez.",
        data: null,
      });
    }
    return next(error);
  }
};

module.exports = {
  create,
  listMine,
  statsMine,
  listSeller,
  getByReference,
  updateStatus,
  STATUS_TRANSITIONS,
};
