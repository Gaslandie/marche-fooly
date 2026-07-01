const mongoose = require("mongoose");

const { getBucket } = require("../services/productImageService");

const buildEtag = (file) => {
  const hash = file.metadata?.contentHash || file._id.toString();
  const variant = file.metadata?.variant || "image";
  return `"${hash}-${variant}"`;
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

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Image introuvable",
        data: null,
      });
    }

    const etag = buildEtag(file);
    const lastModified = file.uploadDate
      ? new Date(file.uploadDate).toUTCString()
      : new Date().toUTCString();

    res.set({
      "Content-Type": file.contentType || "image/webp",
      "Content-Length": String(file.length || 0),
      "Cache-Control": "public, max-age=31536000, immutable",
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
