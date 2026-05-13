const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");
const { SELLER_STATUSES } = require("./shared/constants");
const {
  optionalUrlValidator,
  isSlug,
  isNonNegativeInteger,
} = require("./shared/validators");
const {
  addressSchema,
  contactDetailsSchema,
} = require("./shared/subschemas");
const { slugify } = require("../utils/slugify");

const { ObjectId } = mongoose.Schema.Types;

/**
 * Profil vendeur separe du compte utilisateur.
 * Cette separation aide a garder l'authentification simple et le metier vendeur extensible.
 */
const sellerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      default: function defaultSellerSlug() {
        return slugify(this.storeName || "");
      },
      set: slugify,
      validate: {
        validator: isSlug,
        message: "Slug vendeur invalide",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },
    logoUrl: {
      type: String,
      trim: true,
      validate: optionalUrlValidator,
      default: "",
    },
    coverImageUrl: {
      type: String,
      trim: true,
      validate: optionalUrlValidator,
      default: "",
    },
    contactDetails: {
      type: contactDetailsSchema,
      default: () => ({}),
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: SELLER_STATUSES,
      default: "pending",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    ratingAverage: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Le nombre d'avis doit etre un entier positif ou nul",
      },
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  createSchemaOptions(),
);

sellerProfileSchema.index({ status: 1, isFeatured: 1 });
sellerProfileSchema.index({ storeName: 1 });

module.exports =
  mongoose.models.SellerProfile ||
  mongoose.model("SellerProfile", sellerProfileSchema);
