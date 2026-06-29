/**
 * Script: promoteOwner
 *
 * Promeut le compte proprietaire existant vers le role `owner`.
 *
 * Usage depuis backend/:
 *   OWNER_EMAIL=proprietaire@marchefooly.com npm run owner:promote
 *
 * Ce script ne cree aucun compte et n'expose aucune route publique.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const { isEmail } = require("../models/shared/validators");

const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI manquant (verifier backend/.env)");
  }

  if (!ownerEmail || !isEmail(ownerEmail)) {
    throw new Error("OWNER_EMAIL invalide ou manquant");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email: ownerEmail });
  if (!user) {
    throw new Error(`Compte introuvable pour ${ownerEmail}`);
  }

  user.role = "owner";
  user.status = "active";
  await user.save();

  console.log(`[OK] Compte proprietaire promu owner: ${ownerEmail}`);
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Erreur owner:promote:", error && error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors
    }
    process.exit(1);
  });
