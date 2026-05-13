const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");
const { CONTACT_MESSAGE_STATUSES } = require("./shared/constants");
const { isEmail, isPhoneNumber } = require("./shared/validators");

const { ObjectId } = mongoose.Schema.Types;

/**
 * Message issu du formulaire de contact.
 * Le statut permet au support de suivre le traitement sans perdre l'historique.
 */
const contactMessageSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
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
      trim: true,
      maxlength: 20,
      validate: {
        validator: (value) => !value || isPhoneNumber(value),
        message: "Numero de telephone invalide",
      },
      default: "",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 180,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: CONTACT_MESSAGE_STATUSES,
      default: "new",
      index: true,
    },
    sourcePage: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "contact",
    },
    handledBy: {
      type: ObjectId,
      ref: "User",
      default: null,
    },
    handledAt: {
      type: Date,
      default: null,
    },
  },
  createSchemaOptions(),
);

contactMessageSchema.index({ status: 1, createdAt: -1 });

module.exports =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactMessageSchema);
