const crypto = require("node:crypto");
const sharp = require("sharp");
const mongoose = require("mongoose");

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_INPUT_PIXELS = 20000000;
const PRODUCT_IMAGE_BUCKET = "product_images";
const PRODUCT_IMAGE_PATH = "/api/media/images";
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const INTERNAL_PRODUCT_IMAGE_URL_REGEX =
  /^\/api\/media\/images\/[a-f0-9]{24}\?v=[A-Za-z0-9._-]{1,120}$/;

let fileTypeModulePromise = null;

class ProductImageError extends Error {
  constructor(message, status = 422) {
    super(message);
    this.name = "ProductImageError";
    this.status = status;
  }
}

const getFileTypeFromBuffer = async (buffer) => {
  if (!fileTypeModulePromise) {
    fileTypeModulePromise = import("file-type");
  }
  const { fileTypeFromBuffer } = await fileTypeModulePromise;
  return fileTypeFromBuffer(buffer);
};

const getBucket = () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new ProductImageError("Stockage image indisponible.", 503);
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: PRODUCT_IMAGE_BUCKET,
  });
};

const getFilesCollection = () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new ProductImageError("Stockage image indisponible.", 503);
  }
  return mongoose.connection.db.collection(`${PRODUCT_IMAGE_BUCKET}.files`);
};

const toObjectId = (value) => {
  const raw = value && value.toString ? value.toString() : String(value || "");
  if (!mongoose.Types.ObjectId.isValid(raw)) return null;
  return new mongoose.Types.ObjectId(raw);
};

const hashBuffer = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

const sanitizeFilename = (value) =>
  String(value || "produit")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "produit";

const buildProductImageUrl = (fileId, version) =>
  `${PRODUCT_IMAGE_PATH}/${fileId.toString()}?v=${encodeURIComponent(version)}`;

const ensureValidUploadBuffer = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length <= 0) {
    throw new ProductImageError("Image requise.");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ProductImageError("Image trop lourde. Taille maximum: 4 Mo.");
  }

  const detected = await getFileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_IMAGE_MIME_TYPES.has(detected.mime)) {
    throw new ProductImageError(
      "Format image non supporte. Utilisez JPG, PNG, WebP ou AVIF.",
    );
  }

  let metadata;
  try {
    metadata = await sharp(buffer, {
      animated: false,
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();
  } catch {
    throw new ProductImageError("Image invalide ou corrompue.");
  }

  if ((metadata.pages || 1) > 1) {
    throw new ProductImageError("Les images animees ne sont pas supportees.");
  }

  return { mimeType: detected.mime };
};

const processVariant = async (buffer, { width, quality }) => {
  const result = await sharp(buffer, {
    animated: false,
    limitInputPixels: MAX_INPUT_PIXELS,
  })
    .rotate()
    .resize({
      width,
      height: width,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    bytes: result.data.length,
    contentHash: hashBuffer(result.data),
  };
};

const uploadBufferToGridFs = (bucket, buffer, filename, metadata) =>
  new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: "image/webp",
      metadata,
    });
    uploadStream.once("error", reject);
    uploadStream.once("finish", () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });

const createProductImageAsset = async ({
  buffer,
  originalName,
  sellerProfileId,
}) => {
  const { mimeType: sourceMimeType } = await ensureValidUploadBuffer(buffer);
  const bucket = getBucket();
  const assetId = crypto.randomUUID();
  const version = `${Date.now().toString(36)}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
  const ownerSeller = sellerProfileId.toString();
  const originalBase = sanitizeFilename(originalName);
  const createdIds = [];

  const [large, thumb] = await Promise.all([
    processVariant(buffer, { width: 1200, quality: 78 }),
    processVariant(buffer, { width: 480, quality: 72 }),
  ]);

  const now = new Date();
  const commonMetadata = {
    kind: "product-image",
    assetId,
    ownerSeller,
    status: "temporary",
    version,
    sourceMimeType,
    mimeType: "image/webp",
    originalName: originalBase,
    createdAt: now,
  };

  try {
    const largeFileId = await uploadBufferToGridFs(
      bucket,
      large.buffer,
      `${assetId}-large.webp`,
      {
        ...commonMetadata,
        variant: "large",
        width: large.width,
        height: large.height,
        bytes: large.bytes,
        contentHash: large.contentHash,
      },
    );
    createdIds.push(largeFileId);

    const thumbFileId = await uploadBufferToGridFs(
      bucket,
      thumb.buffer,
      `${assetId}-thumb.webp`,
      {
        ...commonMetadata,
        variant: "thumb",
        width: thumb.width,
        height: thumb.height,
        bytes: thumb.bytes,
        contentHash: thumb.contentHash,
      },
    );
    createdIds.push(thumbFileId);

    return {
      id: assetId,
      fileId: largeFileId.toString(),
      largeFileId: largeFileId.toString(),
      thumbFileId: thumbFileId.toString(),
      url: buildProductImageUrl(largeFileId, version),
      largeUrl: buildProductImageUrl(largeFileId, version),
      thumbUrl: buildProductImageUrl(thumbFileId, version),
      version,
      width: large.width,
      height: large.height,
      format: "webp",
      bytes: large.bytes + thumb.bytes,
      mimeType: "image/webp",
      sourceMimeType,
    };
  } catch (error) {
    await Promise.all(
      createdIds.map((id) => bucket.delete(id).catch(() => null)),
    );
    throw error;
  }
};

const verifyProductImageForSeller = async (value, sellerProfileId) => {
  if (!value || typeof value !== "object") {
    throw new ProductImageError("Reference image invalide.");
  }

  const largeFileId = toObjectId(value.largeFileId || value.fileId);
  const thumbFileId = toObjectId(value.thumbFileId);
  const version = String(value.version || "").trim();

  if (!largeFileId || !thumbFileId || largeFileId.equals(thumbFileId)) {
    throw new ProductImageError("Reference image invalide.");
  }
  if (!/^[A-Za-z0-9._-]{1,120}$/.test(version)) {
    throw new ProductImageError("Version image invalide.");
  }

  const bucket = getBucket();
  const files = await bucket
    .find({ _id: { $in: [largeFileId, thumbFileId] } })
    .toArray();

  const large = files.find((file) => file._id.equals(largeFileId));
  const thumb = files.find((file) => file._id.equals(thumbFileId));
  if (!large || !thumb) {
    throw new ProductImageError("Image produit introuvable.");
  }

  const largeMeta = large.metadata || {};
  const thumbMeta = thumb.metadata || {};
  const expectedSeller = sellerProfileId.toString();
  const validStatuses = new Set(["temporary", "attached"]);

  const commonChecks =
    largeMeta.kind === "product-image" &&
    thumbMeta.kind === "product-image" &&
    largeMeta.assetId &&
    largeMeta.assetId === thumbMeta.assetId &&
    largeMeta.ownerSeller === expectedSeller &&
    thumbMeta.ownerSeller === expectedSeller &&
    largeMeta.version === version &&
    thumbMeta.version === version &&
    validStatuses.has(largeMeta.status) &&
    validStatuses.has(thumbMeta.status);

  if (
    !commonChecks ||
    largeMeta.variant !== "large" ||
    thumbMeta.variant !== "thumb"
  ) {
    throw new ProductImageError("Image produit non autorisee.");
  }

  return {
    largeFileId,
    thumbFileId,
    version,
    largeUrl: buildProductImageUrl(largeFileId, version),
    thumbUrl: buildProductImageUrl(thumbFileId, version),
    contentHash: largeMeta.contentHash || "",
    width: largeMeta.width || 0,
    height: largeMeta.height || 0,
    mimeType: "image/webp",
    bytes: (largeMeta.bytes || large.length || 0) + (thumbMeta.bytes || 0),
    uploadedAt: large.uploadDate || new Date(),
  };
};

const markProductImageAttached = async (image, productId) => {
  if (!image) return;
  const ids = [image.largeFileId, image.thumbFileId]
    .map(toObjectId)
    .filter(Boolean);
  if (!ids.length) return;

  await getFilesCollection().updateMany(
    { _id: { $in: ids }, "metadata.kind": "product-image" },
    {
      $set: {
        "metadata.status": "attached",
        "metadata.productId": productId.toString(),
        "metadata.attachedAt": new Date(),
      },
    },
  );
};

const cleanupTemporaryProductImages = async ({ olderThanHours = 24 } = {}) => {
  const bucket = getBucket();
  const filesCollection = getFilesCollection();
  const Product = require("../models/Product");
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  const candidates = await filesCollection
    .find({
      "metadata.kind": "product-image",
      "metadata.status": "temporary",
      uploadDate: { $lt: cutoff },
    })
    .project({ _id: 1 })
    .toArray();

  const [coverLargeRefs, coverThumbRefs, imageLargeRefs, imageThumbRefs] =
    await Promise.all([
    Product.distinct("coverImage.largeFileId", {
      "coverImage.largeFileId": { $exists: true, $ne: null },
    }),
    Product.distinct("coverImage.thumbFileId", {
      "coverImage.thumbFileId": { $exists: true, $ne: null },
    }),
    Product.distinct("images.largeFileId", {
      "images.largeFileId": { $exists: true, $ne: null },
    }),
    Product.distinct("images.thumbFileId", {
      "images.thumbFileId": { $exists: true, $ne: null },
    }),
  ]);
  const referenced = new Set(
    [...coverLargeRefs, ...coverThumbRefs, ...imageLargeRefs, ...imageThumbRefs].map(
      (id) => id.toString(),
    ),
  );

  let deleted = 0;
  for (const file of candidates) {
    if (referenced.has(file._id.toString())) continue;
    await bucket.delete(file._id);
    deleted += 1;
  }

  return { candidates: candidates.length, deleted, cutoff };
};

module.exports = {
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  INTERNAL_PRODUCT_IMAGE_URL_REGEX,
  ProductImageError,
  buildProductImageUrl,
  createProductImageAsset,
  verifyProductImageForSeller,
  markProductImageAttached,
  cleanupTemporaryProductImages,
  getBucket,
};
