const mongoose = require("mongoose");

const { createSchemaOptions } = require("./shared/schemaOptions");

const { ObjectId } = mongoose.Schema.Types;

/**
 * Produit sauvegarde par un utilisateur.
 * Ownership strict: chaque ligne appartient a un seul user.
 */
const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
  },
  createSchemaOptions({
    optimisticConcurrency: true,
    versionKey: "version",
  }),
);

favoriteSchema.index({ user: 1, product: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });

module.exports =
  mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
