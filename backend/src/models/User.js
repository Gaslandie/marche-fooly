const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");
const { USER_ROLES, ACCOUNT_STATUSES } = require("./shared/constants");
const {
  isEmail,
  isPhoneNumber,
  optionalUrlValidator,
} = require("./shared/validators");
const { addressSchema } = require("./shared/subschemas");

/**
 * Utilisateur principal de la plateforme.
 * Le mot de passe n'est jamais stocke en clair: on garde uniquement un hash.
 */
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
      validate: {
        validator: isEmail,
        message: "Adresse email invalide",
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      validate: {
        validator: isPhoneNumber,
        message: "Numero de telephone invalide",
      },
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 255,
      select: false,
    },
    // Reinitialisation de mot de passe: on ne stocke JAMAIS le token en
    // clair, uniquement son hash SHA-256 + une expiration courte. Champs
    // absents sur les comptes existants (aucune migration necessaire).
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
      index: true,
    },
    status: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: "pending",
      index: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
      validate: optionalUrlValidator,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  createSchemaOptions(),
);

// Index utile pour les listings d'administration par role et statut.
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
