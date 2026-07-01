const multer = require("multer");

const {
  MAX_IMAGE_BYTES,
  ProductImageError,
  createProductImageAsset,
} = require("../services/productImageService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
    fields: 0,
  },
});

const parseProductImageUpload = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Image trop lourde. Taille maximum: 4 Mo."
          : "Fichier image invalide.";
      return res.status(422).json({
        success: false,
        message,
        data: null,
      });
    }

    return next(error);
  });
};

const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.sellerProfile) {
      return res.status(403).json({
        success: false,
        message: "Seuls les vendeurs approuves peuvent televerser une image",
        data: null,
      });
    }

    if (!req.file?.buffer) {
      return res.status(422).json({
        success: false,
        message: "Image requise.",
        data: null,
      });
    }

    const image = await createProductImageAsset({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      sellerProfileId: req.sellerProfile._id,
    });

    return res.status(201).json({
      success: true,
      message: "Image produit televersee",
      data: { image },
    });
  } catch (error) {
    if (error instanceof ProductImageError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
    return next(error);
  }
};

module.exports = {
  parseProductImageUpload,
  uploadProductImage,
};
