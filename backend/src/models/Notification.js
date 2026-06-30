const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");

const { ObjectId } = mongoose.Schema.Types;

const NOTIFICATION_TYPES = [
  "seller_application_created",
  "seller_application_status",
  "order_created",
  "order_status_updated",
  "admin_alert",
];

/**
 * Notification interne affichee dans la cloche utilisateur.
 * Le champ recipient garantit l'ownership: chaque utilisateur ne lit que ses
 * propres notifications via les routes authentifiees.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    href: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
      select: false,
    },
  },
  createSchemaOptions(),
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

