/**
 * Script: restoreAdminUser
 *
 * Retablit un compte back-office en `admin` lorsqu'il a ete transforme en
 * vendeur par erreur. La fiche vendeur n'est supprimee que si aucun produit
 * ni aucune commande ne la reference.
 *
 * Usage depuis backend/:
 *   npm run admin:restore -- --email=sdkante0515@gmail.com
 *   RESTORE_ADMIN_EMAIL=sdkante0515@gmail.com npm run admin:restore
 */

const path = require("node:path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
  quiet: true,
});

const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const SellerProfile = require("../models/SellerProfile");
const User = require("../models/User");
const { isEmail } = require("../models/shared/validators");

const DEFAULT_EMAIL = "sdkante0515@gmail.com";

const getEmailArg = () => {
  const emailFlag = process.argv.find((arg) => arg.startsWith("--email="));
  if (emailFlag) {
    return emailFlag.slice("--email=".length);
  }

  const emailFlagIndex = process.argv.indexOf("--email");
  if (emailFlagIndex !== -1 && process.argv[emailFlagIndex + 1]) {
    return process.argv[emailFlagIndex + 1];
  }

  return process.env.RESTORE_ADMIN_EMAIL || DEFAULT_EMAIL;
};

const restoreEmail = getEmailArg().trim().toLowerCase();

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI manquant (verifier backend/.env)");
  }

  if (!restoreEmail || !isEmail(restoreEmail)) {
    throw new Error("Email de restauration invalide ou manquant");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email: restoreEmail });
  if (!user) {
    throw new Error(`Compte introuvable pour ${restoreEmail}`);
  }

  const sellerProfile = await SellerProfile.findOne({ user: user._id });

  if (sellerProfile) {
    const [productCount, orderCount] = await Promise.all([
      Product.countDocuments({ seller: sellerProfile._id }),
      Order.countDocuments({ seller: sellerProfile._id }),
    ]);

    if (productCount > 0 || orderCount > 0) {
      throw new Error(
        [
          "Suppression refusee: la fiche vendeur est encore referencee.",
          `Produits lies: ${productCount}.`,
          `Commandes liees: ${orderCount}.`,
          "Suspendre ou traiter ces donnees avant de supprimer la fiche.",
        ].join(" "),
      );
    }

    await SellerProfile.deleteOne({ _id: sellerProfile._id });
    console.log(`[OK] Fiche vendeur supprimee: ${sellerProfile._id}`);
  } else {
    console.log("[INFO] Aucune fiche vendeur liee a ce compte.");
  }

  user.role = "admin";
  user.status = "active";
  await user.save();

  console.log(`[OK] Compte restaure en admin actif: ${restoreEmail}`);
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Erreur admin:restore:", error && error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors
    }
    process.exit(1);
  });
