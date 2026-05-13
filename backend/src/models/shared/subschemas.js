const mongoose = require("mongoose");

const { createSchemaOptions } = require("./schemaOptions");
const {
  isEmail,
  isPhoneNumber,
  isNonNegativeInteger,
  optionalUrlValidator,
} = require("./validators");

/**
 * Sous-schema d'adresse reutilisable pour les profils et commandes.
 * Sans _id pour eviter des sous-documents inutiles et garder la sortie legere.
 */
const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "Sangarédi",
    },
    region: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "Boké",
    },
    country: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "Guinée",
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
  },
  createSchemaOptions({ _id: false }),
);

/**
 * Contact reutilisable pour eviter de redefinir les memes regles email/telephone.
 */
const contactDetailsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      validate: {
        validator: (value) => !value || isEmail(value),
        message: "Adresse email invalide",
      },
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      validate: {
        validator: (value) => !value || isPhoneNumber(value),
        message: "Numero de telephone invalide",
      },
      default: "",
    },
  },
  createSchemaOptions({ _id: false }),
);

/**
 * Image produit ou categorie.
 * On limite les champs au strict utile pour le front et le SEO.
 */
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      validate: optionalUrlValidator,
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
      validate: {
        validator: isNonNegativeInteger,
        message: "Le tri doit etre un entier positif ou nul",
      },
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  createSchemaOptions({ _id: false }),
);

module.exports = {
  addressSchema,
  contactDetailsSchema,
  imageSchema,
};
