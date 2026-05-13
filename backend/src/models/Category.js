const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");
const {
  optionalUrlValidator,
  isSlug,
  isNonNegativeInteger,
} = require("./shared/validators");
const { slugify } = require("../utils/slugify");

const { ObjectId } = mongoose.Schema.Types;

/**
 * Categorie de produits, avec support des sous-categories via parentCategory.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      default: function defaultCategorySlug() {
        return slugify(this.name || "");
      },
      set: slugify,
      validate: {
        validator: isSlug,
        message: "Slug categorie invalide",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 600,
      default: "",
    },
    imageUrl: {
      type: String,
      trim: true,
      validate: optionalUrlValidator,
      default: "",
    },
    parentCategory: {
      type: ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "L'ordre de tri doit etre un entier positif ou nul",
      },
    },
  },
  createSchemaOptions(),
);

categorySchema.index({ parentCategory: 1, isActive: 1, sortOrder: 1 });

module.exports =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
