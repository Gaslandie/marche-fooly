/**
 * Validators: productValidators
 *
 * Role exact du fichier:
 *   Definit les chaines express-validator des routes produits:
 *     - createProductValidators        -> POST   /api/products
 *     - updateProductValidators        -> PATCH  /api/products/:id
 *     - paramIdValidator               -> :id sur PATCH/DELETE
 *     - paramSlugPairValidator         -> :sellerSlug/:productSlug sur GET detail
 *     - paramCategorySlugValidator     -> :categorySlug sur GET listing categorie
 *     - listProductsQueryValidators    -> query string de GET /api/products
 *   Expose aussi les whitelists CREATE/UPDATE et la liste des champs
 *   interdits, utilisees par le controleur (defense en profondeur).
 *
 * Ou il est utilise:
 *   - backend/src/routes/productRoutes.js (via runValidators)
 *   - backend/src/controllers/productController.js (whitelists)
 *
 * Prerequis importants:
 *   - express-validator >= 7.
 *   - Bornes alignees sur le modele Mongoose Product.js et les
 *     sous-schemas (image, addressSchema). Toute modification du
 *     modele DOIT etre repercutee ici.
 *
 * Regles de securite / metier:
 *   - Le slug, le seller, et tous les champs internes (_id, id,
 *     createdAt, updatedAt, version) sont JAMAIS acceptes en entree
 *     (422 si fournis). seller est determine cote serveur a partir
 *     de req.sellerProfile (set par requireApprovedSeller).
 *   - status accepte uniquement ["draft","active","archived"] en
 *     entree. "out_of_stock" est un statut DERIVE: le hook pre-validate
 *     du modele bascule "active" -> "out_of_stock" si stock = 0.
 *   - currency: si absent, default GNF du modele s'applique. Si fourni,
 *     doit valoir EXACTEMENT "GNF" (sinon 422). Aucune autre devise
 *     supportee a ce stade (cf. SUPPORTED_CURRENCIES dans constants.js).
 *   - price, stockQuantity, deliveryFee: ENTIERS >= 0. La GNF n'ayant
 *     pas de centimes, on refuse explicitement les decimales.
 *   - isFeatured n'est PAS valide ici en mode "forbidden" pour le PATCH
 *     car les admins ont le droit. C'est le controleur qui differencie:
 *     si role != admin et isFeatured fourni -> 422 cote controleur.
 *   - Au POST en revanche, isFeatured est dans FORBIDDEN_INPUT_FIELDS
 *     car POST est reserve aux vendeurs (cf. decision MVP).
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - PUBLIC_PRODUCT_STATUSES centralise la liste pour le controleur.
 *   - escapeRegex() centralise l'echappement pour ?q=.
 */

const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const HTTP_URL_REGEX = /^https?:\/\/.+/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Statuts visibles cote public. Le controleur les utilise pour filtrer
// les routes GET. Le statut "out_of_stock" est inclus (un produit
// epuise reste visible pour informer le client) mais "draft" et
// "archived" sont exclus.
const PUBLIC_PRODUCT_STATUSES = ["active", "out_of_stock"];

// Statuts acceptes EN ENTREE (POST/PATCH). "out_of_stock" est exclu:
// c'est un statut derive par le hook pre-validate du modele quand
// stockQuantity === 0 et status === "active".
const INPUT_PRODUCT_STATUSES = ["draft", "active", "archived"];

// Whitelist des champs creables (POST). Tout champ hors liste est
// ignore par le controleur, meme s'il passe le validator.
const CREATE_PRODUCT_ALLOWED_FIELDS = [
  "name",
  "shortDescription",
  "description",
  "price",
  "currency",
  "stockQuantity",
  "sku",
  "images",
  "coverImageUrl",
  "status",
  "tags",
  "deliveryFee",
  "isFreeDelivery",
  "pickupAddress",
  "category",
];

// Whitelist des champs modifiables (PATCH) pour un VENDEUR.
// Le controleur ajoute "isFeatured" UNIQUEMENT si l'appelant est admin.
const UPDATE_PRODUCT_ALLOWED_FIELDS = [...CREATE_PRODUCT_ALLOWED_FIELDS];

// Champs interdits au POST (refus 422 explicite, signal anti
// mass-assignment).
const FORBIDDEN_AT_CREATE = [
  "seller",
  "slug",
  "_id",
  "id",
  "createdAt",
  "updatedAt",
  "version",
  "isFeatured",
];

// Champs interdits au PATCH (note: isFeatured n'y est PAS car l'admin
// peut le toggle. Le controleur rejette en 422 pour non-admin).
const FORBIDDEN_AT_UPDATE = [
  "seller",
  "slug",
  "_id",
  "id",
  "createdAt",
  "updatedAt",
  "version",
];

const forbidValidators = (list) =>
  list.map((field) =>
    body(field)
      .not()
      .exists()
      .withMessage(
        `Le champ "${field}" ne peut pas etre fourni par le client`,
      ),
  );

const isObjectIdString = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

// --- Sous-validators reutilisables -----------------------------------------

const nameRequired = body("name")
  .isString()
  .withMessage("Nom requis")
  .bail()
  .trim()
  .isLength({ min: 2, max: 160 })
  .withMessage("Nom: entre 2 et 160 caracteres");

const nameOptional = body("name")
  .optional()
  .isString()
  .bail()
  .trim()
  .isLength({ min: 2, max: 160 })
  .withMessage("Nom: entre 2 et 160 caracteres");

const shortDescriptionOptional = body("shortDescription")
  .optional({ values: "falsy" })
  .isString()
  .bail()
  .trim()
  .isLength({ max: 220 })
  .withMessage("shortDescription: 220 caracteres maximum");

const descriptionRequired = body("description")
  .isString()
  .withMessage("Description requise")
  .bail()
  .trim()
  .isLength({ min: 10, max: 4000 })
  .withMessage("Description: entre 10 et 4000 caracteres");

const descriptionOptional = body("description")
  .optional()
  .isString()
  .bail()
  .trim()
  .isLength({ min: 10, max: 4000 })
  .withMessage("Description: entre 10 et 4000 caracteres");

// Pour les montants en GNF, on n'accepte que des entiers >= 0.
const intNonNegative = (field, label) =>
  body(field)
    .isInt({ min: 0, allow_leading_zeroes: false })
    .withMessage(`${label}: entier >= 0 requis`)
    .toInt();

const intNonNegativeOptional = (field, label) =>
  body(field)
    .optional()
    .isInt({ min: 0, allow_leading_zeroes: false })
    .withMessage(`${label}: entier >= 0 requis`)
    .toInt();

const currencyOptional = body("currency")
  .optional()
  .isString()
  .bail()
  .isIn(["GNF"])
  .withMessage("currency: seule \"GNF\" est supportee");

const skuOptional = body("sku")
  .optional({ values: "falsy" })
  .isString()
  .bail()
  .trim()
  .isLength({ max: 64 })
  .withMessage("sku: 64 caracteres maximum");

const coverImageUrlOptional = body("coverImageUrl")
  .optional({ values: "falsy" })
  .isString()
  .bail()
  .trim()
  .matches(HTTP_URL_REGEX)
  .withMessage("coverImageUrl: l'URL doit commencer par http:// ou https://");

const categoryRequired = body("category")
  .custom(isObjectIdString)
  .withMessage("category: ObjectId valide requis");

const categoryOptional = body("category")
  .optional()
  .custom(isObjectIdString)
  .withMessage("category: ObjectId valide requis");

const statusInputRequiredOptional = (required) => {
  const chain = required
    ? body("status").optional().isString()
    : body("status").optional({ values: "falsy" }).isString();
  return chain
    .bail()
    .isIn(INPUT_PRODUCT_STATUSES)
    .withMessage(
      `status: doit valoir ${INPUT_PRODUCT_STATUSES.join(", ")} (out_of_stock est derive)`,
    );
};

const imagesValidators = [
  body("images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("images: tableau de 10 elements maximum"),
  body("images.*.url")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(HTTP_URL_REGEX)
    .withMessage("images[].url: URL http(s) requise"),
  body("images.*.altText")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 160 }),
  body("images.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("images[].sortOrder: entier >= 0"),
  body("images.*.isPrimary").optional().isBoolean().toBoolean(),
];

const tagsValidators = [
  body("tags")
    .optional()
    .isArray({ max: 20 })
    .withMessage("tags: 20 elements maximum"),
  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 40 })
    .withMessage("tags[]: 40 caracteres maximum par tag"),
];

const isFreeDeliveryOptional = body("isFreeDelivery")
  .optional()
  .isBoolean()
  .withMessage("isFreeDelivery: booleen attendu")
  .toBoolean();

const pickupAddressValidators = [
  body("pickupAddress")
    .optional()
    .isObject()
    .withMessage("pickupAddress: objet attendu"),
  body("pickupAddress.street").optional({ values: "falsy" }).isString().trim().isLength({ max: 180 }),
  body("pickupAddress.city").optional({ values: "falsy" }).isString().trim().isLength({ max: 80 }),
  body("pickupAddress.region").optional({ values: "falsy" }).isString().trim().isLength({ max: 80 }),
  body("pickupAddress.country").optional({ values: "falsy" }).isString().trim().isLength({ max: 80 }),
  body("pickupAddress.postalCode").optional({ values: "falsy" }).isString().trim().isLength({ max: 20 }),
];

// isFeatured: valide booleen si fourni. Le controleur fait le check
// admin/non-admin pour decider 200 ou 422.
const isFeaturedOptional = body("isFeatured")
  .optional()
  .isBoolean()
  .withMessage("isFeatured: booleen attendu")
  .toBoolean();

// --- Chaines exportees -----------------------------------------------------

const createProductValidators = [
  ...forbidValidators(FORBIDDEN_AT_CREATE),
  nameRequired,
  shortDescriptionOptional,
  descriptionRequired,
  intNonNegative("price", "price"),
  currencyOptional,
  intNonNegative("stockQuantity", "stockQuantity"),
  skuOptional,
  ...imagesValidators,
  coverImageUrlOptional,
  statusInputRequiredOptional(false),
  ...tagsValidators,
  intNonNegativeOptional("deliveryFee", "deliveryFee"),
  isFreeDeliveryOptional,
  ...pickupAddressValidators,
  categoryRequired,
];

const updateProductValidators = [
  ...forbidValidators(FORBIDDEN_AT_UPDATE),
  nameOptional,
  shortDescriptionOptional,
  descriptionOptional,
  intNonNegativeOptional("price", "price"),
  currencyOptional,
  intNonNegativeOptional("stockQuantity", "stockQuantity"),
  skuOptional,
  ...imagesValidators,
  coverImageUrlOptional,
  statusInputRequiredOptional(true),
  ...tagsValidators,
  intNonNegativeOptional("deliveryFee", "deliveryFee"),
  isFreeDeliveryOptional,
  ...pickupAddressValidators,
  categoryOptional,
  isFeaturedOptional,
];

// PATCH/DELETE /api/products/:id -> id doit etre un ObjectId Mongo.
const paramIdValidator = [
  param("id")
    .custom(isObjectIdString)
    .withMessage("Identifiant de produit invalide"),
];

// GET /api/products/:sellerSlug/:productSlug -> deux slugs au format strict.
const paramSlugPairValidator = [
  param("sellerSlug")
    .isString()
    .bail()
    .matches(SLUG_REGEX)
    .withMessage("sellerSlug invalide"),
  param("productSlug")
    .isString()
    .bail()
    .matches(SLUG_REGEX)
    .withMessage("productSlug invalide"),
];

const paramCategorySlugValidator = [
  param("categorySlug")
    .isString()
    .bail()
    .matches(SLUG_REGEX)
    .withMessage("categorySlug invalide"),
];

// GET /api/products?page=&limit=&category=&seller=&q=
const listProductsQueryValidators = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("page doit etre un entier >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit doit etre un entier entre 1 et 100"),
  query("category")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(SLUG_REGEX)
    .withMessage("category doit etre un slug valide"),
  query("seller")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(SLUG_REGEX)
    .withMessage("seller doit etre un slug valide"),
  query("q")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("q: 1-100 caracteres"),
];

// Echappe les caracteres regex pour utilisation safe dans une regex
// generee a partir de l'entree utilisateur ?q=. Evite la ReDoS et les
// matches inattendus (parentheses, etoiles, etc.).
const escapeRegex = (value) =>
  String(value).replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

module.exports = {
  createProductValidators,
  updateProductValidators,
  paramIdValidator,
  paramSlugPairValidator,
  paramCategorySlugValidator,
  listProductsQueryValidators,
  CREATE_PRODUCT_ALLOWED_FIELDS,
  UPDATE_PRODUCT_ALLOWED_FIELDS,
  FORBIDDEN_AT_CREATE,
  FORBIDDEN_AT_UPDATE,
  PUBLIC_PRODUCT_STATUSES,
  INPUT_PRODUCT_STATUSES,
  escapeRegex,
};
