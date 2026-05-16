const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");
const { PRODUCT_STATUSES, SUPPORTED_CURRENCIES } = require("./shared/constants");
const {
  isSlug,
  isNonNegativeInteger,
  optionalUrlValidator,
} = require("./shared/validators");
const { imageSchema, addressSchema } = require("./shared/subschemas");
const { slugify } = require("../utils/slugify");

const { ObjectId } = mongoose.Schema.Types;

/**
 * Produit vendable sur la marketplace.
 * Les montants sont stockes en nombre entier pour eviter les erreurs de formatage.
 */
const productSchema = new mongoose.Schema(
  {
    seller: {
      type: ObjectId,
      ref: "SellerProfile",
      required: true,
      index: true,
    },
    category: {
      type: ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: function defaultProductSlug() {
        return slugify(this.name || "");
      },
      set: slugify,
      validate: {
        validator: isSlug,
        message: "Slug produit invalide",
      },
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 220,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 4000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Le prix doit etre un entier positif ou nul",
      },
    },
    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: "GNF",
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Le stock doit etre un entier positif ou nul",
      },
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 64,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: "draft",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
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
    isFreeDelivery: {
      type: Boolean,
      default: false,
    },
    pickupAddress: {
      type: addressSchema,
      default: () => ({}),
    },
    coverImageUrl: {
      type: String,
      trim: true,
      validate: optionalUrlValidator,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  createSchemaOptions({
    optimisticConcurrency: true,
    versionKey: "version",
  }),
);

// On derive les champs repetitifs pour eviter les incoherences cote API.
// Note (Mongoose 7+): les hooks pre("validate") ne recoivent PLUS de
// callback `next`. La fonction doit etre soit synchrone (return implicite)
// soit async. Ne pas reintroduire de parametre `next` ici.
productSchema.pre("validate", function normalizeProductFields() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  if (this.isFreeDelivery) {
    this.deliveryFee = 0;
  }

  if (this.stockQuantity === 0 && this.status === "active") {
    this.status = "out_of_stock";
  }

  const normalizedTags = Array.isArray(this.tags) ? this.tags : [];
  this.tags = [...new Set(normalizedTags.map((tag) => slugify(tag)).filter(Boolean))];
});

productSchema.index({ seller: 1, slug: 1 }, { unique: true });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ seller: 1, status: 1, createdAt: -1 });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
