const crypto = require("node:crypto");

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 128;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_PRODUCT_FOLDER || "marche-fooly/products",
  };
};

const signCloudinaryParams = (params, apiSecret) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
};

const parseImageDataUrl = (value) => {
  if (typeof value !== "string" || value.length > MAX_DATA_URL_LENGTH) {
    return { ok: false, message: "Image invalide ou trop lourde" };
  }

  const match = value.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match) {
    return { ok: false, message: "Format image invalide" };
  }

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    return {
      ok: false,
      message: "Format image non supporte. Utilisez JPG, PNG, WebP ou AVIF.",
    };
  }

  const base64Payload = match[2];
  const size = Buffer.byteLength(base64Payload, "base64");
  if (size <= 0 || size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      message: "Image trop lourde. Taille maximum: 4 Mo.",
    };
  }

  return { ok: true, mimeType, size };
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

    const parsed = parseImageDataUrl(req.body?.imageDataUrl);
    if (!parsed.ok) {
      return res.status(422).json({
        success: false,
        message: parsed.message,
        data: null,
      });
    }

    const config = getCloudinaryConfig();
    if (!config) {
      return res.status(503).json({
        success: false,
        message:
          "Upload image non configure. Ajoutez les variables Cloudinary cote backend.",
        data: null,
      });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign = {
      folder: config.folder,
      timestamp,
    };
    const signature = signCloudinaryParams(paramsToSign, config.apiSecret);

    const form = new FormData();
    form.append("file", req.body.imageDataUrl);
    form.append("api_key", config.apiKey);
    form.append("timestamp", timestamp);
    form.append("folder", config.folder);
    form.append("signature", signature);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
      {
        method: "POST",
        body: form,
      },
    );

    const cloudinaryBody = await cloudinaryRes.json().catch(() => null);

    if (!cloudinaryRes.ok || !cloudinaryBody?.secure_url) {
      return res.status(502).json({
        success: false,
        message: "Upload image impossible. Reessayez plus tard.",
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Image produit televersee",
      data: {
        image: {
          url: cloudinaryBody.secure_url,
          publicId: cloudinaryBody.public_id || "",
          width: cloudinaryBody.width || null,
          height: cloudinaryBody.height || null,
          format: cloudinaryBody.format || "",
          bytes: cloudinaryBody.bytes || parsed.size,
          mimeType: parsed.mimeType,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadProductImage,
};
