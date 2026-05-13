const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");
const {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  FULFILLMENT_METHODS,
  SUPPORTED_CURRENCIES,
} = require("./shared/constants");
const {
  isPositiveInteger,
  isNonNegativeInteger,
  isPhoneNumber,
} = require("./shared/validators");
const { addressSchema } = require("./shared/subschemas");

const { ObjectId } = mongoose.Schema.Types;

/**
 * Snapshot d'article commande.
 * On copie le nom et le prix pour proteger l'historique meme si le produit change plus tard.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 64,
      default: "",
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Le prix unitaire doit etre un entier positif ou nul",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: isPositiveInteger,
        message: "La quantite doit etre un entier strictement positif",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Le sous-total doit etre un entier positif ou nul",
      },
    },
  },
  createSchemaOptions({ _id: false }),
);

/**
 * Commande principale.
 * Les totaux sont recalcules avant validation pour eviter les montants incoherents.
 */
const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seller: {
      type: ObjectId,
      ref: "SellerProfile",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Une commande doit contenir au moins un article",
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    fulfillmentMethod: {
      type: String,
      enum: FULFILLMENT_METHODS,
      required: true,
    },
    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: "GNF",
    },
    subtotalAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Le sous-total de commande doit etre un entier positif ou nul",
      },
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Les frais de livraison doivent etre un entier positif ou nul",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Le total de commande doit etre un entier positif ou nul",
      },
    },
    shippingAddress: {
      type: addressSchema,
      default: () => ({}),
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      validate: {
        validator: isPhoneNumber,
        message: "Numero de telephone client invalide",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 800,
      default: "",
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  createSchemaOptions({
    optimisticConcurrency: true,
    versionKey: "version",
  }),
);

orderSchema.pre("validate", function recalculateOrderTotals(next) {
  const normalizedItems = Array.isArray(this.items) ? this.items : [];

  this.items = normalizedItems.map((item) => {
    item.subtotal = item.unitPrice * item.quantity;
    return item;
  });

  this.subtotalAmount = this.items.reduce(
    (accumulator, item) => accumulator + item.subtotal,
    0,
  );

  if (this.fulfillmentMethod === "seller_pickup") {
    this.deliveryFee = 0;
  }

  this.totalAmount = this.subtotalAmount + this.deliveryFee;

  next();
});

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, placedAt: -1 });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
