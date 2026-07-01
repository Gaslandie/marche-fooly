require("dotenv").config();

const mongoose = require("mongoose");

const { cleanupTemporaryProductImages } = require("../services/productImageService");

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI manquant");
  }

  const olderThanHours = Number.parseInt(
    process.env.PRODUCT_IMAGE_TEMP_TTL_HOURS || "24",
    10,
  );

  await mongoose.connect(process.env.MONGODB_URI);
  const result = await cleanupTemporaryProductImages({
    olderThanHours: Number.isFinite(olderThanHours) ? olderThanHours : 24,
  });

  console.log(
    `Images temporaires analysees: ${result.candidates}, supprimees: ${result.deleted}`,
  );
};

run()
  .catch((error) => {
    console.error("Erreur images:cleanup:", error && error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors
    }
  });
