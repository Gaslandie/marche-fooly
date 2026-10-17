const mongoose = require("mongoose");

const { getBucket } = require("../services/productImageService");
const Product = require("../models/Product");
const SellerProfile = require("../models/SellerProfile");
const { authenticate } = require("../middlewares/authenticate");
const { BACKOFFICE_ROLES, ADMIN_OPERATION_ROLES } = require("../models/shared/constants");

const buildEtag = (file) => {
  const hash = file.metadata?.contentHash || file._id.toString();
  const variant = file.metadata?.variant || "image";
  return `"${hash}-${variant}"`;
};

// Vérifier les références réelles : le même fichier peut servir à plusieurs produits.
// Le champ metadata.productId seul ne suffit pas, car il désigne le dernier produit.
const productReferences = (fileId, ownerSeller) => ({
  seller: ownerSeller,
  $or: [
    { "coverImage.largeFileId": fileId },
    { "coverImage.thumbFileId": fileId },
    { "images.largeFileId": fileId },
    { "images.thumbFileId": fileId },
    // Compatibilité avec les anciennes références enregistrées comme URL.
    ...["coverImageUrl", "coverImage.largeUrl", "coverImage.thumbUrl", "images.url", "images.thumbUrl"]
      .map(field => ({ [field]: new RegExp(`^(?:https?://[^/]+)?/api/media/images/${fileId.toString()}(?:\\?v=[A-Za-z0-9._-]{1,120})?$`) })),
  ],
});

const canReadPrivateImage = async (req, res, file, references) => {
  let authenticated = false;
  await authenticate(req, res, error => {
    if (error) throw error;
    authenticated = true;
  });
  if (!authenticated) return false;
  if (ADMIN_OPERATION_ROLES.includes(req.user.role)) return true;
  // Le collaborateur peut consulter un produit, mais pas un upload sans produit.
  if (BACKOFFICE_ROLES.includes(req.user.role)) return Boolean(await Product.exists(references));
  if (req.user.role !== "seller") return false;
  return Boolean(await SellerProfile.exists({
    _id: file.metadata.ownerSeller,
    user: req.user._id,
    status: "approved",
  }));
};

const getProductImage = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.fileId)) {
      return res.status(404).json({
        success: false,
        message: "Image introuvable",
        data: null,
      });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const bucket = getBucket();
    const [file] = await bucket
      .find({ _id: fileId, "metadata.kind": "product-image" })
      .limit(1)
      .toArray();

    if (!file || file.contentType !== "image/webp" ||
        !mongoose.Types.ObjectId.isValid(file.metadata?.ownerSeller)) {
      return res.status(404).json({
        success: false,
        message: "Image introuvable",
        data: null,
      });
    }

    const references = productReferences(fileId, file.metadata.ownerSeller);
    const isPublic = Boolean(await Product.exists({
      ...references,
      status: { $in: ["active", "out_of_stock"] },
    }));
    if (!isPublic && !await canReadPrivateImage(req, res, file, references)) {
      if (res.headersSent) return;
      return res.status(404).json({ success: false, message: "Image introuvable", data: null });
    }
    const privateResponse = !isPublic || Boolean(req.headers.authorization);

    const etag = buildEtag(file);
    const lastModified = file.uploadDate
      ? new Date(file.uploadDate).toUTCString()
      : new Date().toUTCString();

    res.set({
      "Content-Type": file.contentType || "image/webp",
      "Content-Length": String(file.length || 0),
      "Cache-Control": privateResponse
        ? "private, no-store, max-age=0"
        : "public, max-age=60, must-revalidate",
      ETag: etag,
      "Last-Modified": lastModified,
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "cross-origin",
    });

    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    return bucket
      .openDownloadStream(fileId)
      .once("error", next)
      .pipe(res);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProductImage,
};
