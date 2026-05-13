const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");
const { isEmail } = require("./shared/validators");

/**
 * Inscription newsletter.
 * On garde un statut actif/inactif plutot que supprimer pour conserver la trace opt-in.
 */
const newsletterSubscriberSchema = new mongoose.Schema(
  {
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "website-footer",
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  createSchemaOptions(),
);

newsletterSubscriberSchema.index({ isActive: 1, createdAt: -1 });

module.exports =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
