/**
 * Validators: sellerValidators
 *
 * Role exact du fichier:
 *   Definit les chaines express-validator utilisees par les routes vendeur
 *   (POST /api/sellers/apply, PATCH /api/sellers/me). Centralise aussi la
 *   whitelist des champs modifiables via PATCH /me pour eviter les divergences
 *   entre validators et controleur.
 *
 * Ou il est utilise:
 *   - backend/src/routes/sellerRoutes.js (via runValidators)
 *   - backend/src/controllers/sellerController.js (UPDATE_SELLER_ME_ALLOWED_FIELDS)
 *
 * Regles importantes:
 *   - applyValidators: storeName est OBLIGATOIRE (le reste est optionnel pour
 *     permettre une candidature minimale, le vendeur completera apres).
 *   - updateMeSellerValidators: tous les champs sont .optional() car c'est un
 *     PATCH (mise a jour partielle).
 *   - Aucune validation ici ne touche aux champs proteges (status, isFeatured,
 *     ratingAverage, slug, user, approvedAt). Ils sont filtres au niveau du
 *     controleur via la whitelist UPDATE_SELLER_ME_ALLOWED_FIELDS.
 *   - Les regex telephone/URL et longueurs reprennent celles d'authValidators
 *     et des sous-schemas Mongoose pour rester coherent.
 */

const { body, param, query } = require("express-validator");

const PHONE_REGEX = /^\+?[0-9\s\-()]{8,20}$/;
const HTTP_URL_REGEX = /^https?:\/\/.+/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Whitelist stricte: tout champ hors de cette liste est ignore par
// sellerController.updateMe. Toute extension future du modele doit etre
// ajoutee ici de maniere explicite.
const UPDATE_SELLER_ME_ALLOWED_FIELDS = [
  "storeName",
  "description",
  "logoUrl",
  "coverImageUrl",
  "contactDetails",
  "address",
];

const applyValidators = [
  body("storeName")
    .isString()
    .withMessage("Nom de boutique requis")
    .bail()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Nom de boutique: entre 2 et 120 caracteres"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 1500 })
    .withMessage("Description: 1500 caracteres maximum"),
  body("logoUrl")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .matches(HTTP_URL_REGEX)
    .withMessage("L'URL du logo doit commencer par http:// ou https://"),
  body("coverImageUrl")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .matches(HTTP_URL_REGEX)
    .withMessage("L'URL de couverture doit commencer par http:// ou https://"),
  body("contactDetails").optional().isObject().withMessage("Contacts invalides"),
  body("contactDetails.email")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Email de contact invalide")
    .isLength({ max: 160 })
    .withMessage("Email de contact trop long"),
  body("contactDetails.phone")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Telephone de contact invalide"),
  body("address").optional().isObject().withMessage("Adresse invalide"),
  body("address.street").optional().isString().trim().isLength({ max: 180 }),
  body("address.city").optional().isString().trim().isLength({ max: 80 }),
  body("address.region").optional().isString().trim().isLength({ max: 80 }),
  body("address.country").optional().isString().trim().isLength({ max: 80 }),
  body("address.postalCode").optional().isString().trim().isLength({ max: 20 }),
];

const updateMeSellerValidators = [
  body("storeName")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Nom de boutique: entre 2 et 120 caracteres"),
  body("description")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 1500 })
    .withMessage("Description: 1500 caracteres maximum"),
  body("logoUrl")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .matches(HTTP_URL_REGEX)
    .withMessage("L'URL du logo doit commencer par http:// ou https://"),
  body("coverImageUrl")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .matches(HTTP_URL_REGEX)
    .withMessage("L'URL de couverture doit commencer par http:// ou https://"),
  body("contactDetails").optional().isObject().withMessage("Contacts invalides"),
  body("contactDetails.email")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Email de contact invalide")
    .isLength({ max: 160 })
    .withMessage("Email de contact trop long"),
  body("contactDetails.phone")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Telephone de contact invalide"),
  body("address").optional().isObject().withMessage("Adresse invalide"),
  body("address.street").optional().isString().trim().isLength({ max: 180 }),
  body("address.city").optional().isString().trim().isLength({ max: 80 }),
  body("address.region").optional().isString().trim().isLength({ max: 80 }),
  body("address.country").optional().isString().trim().isLength({ max: 80 }),
  body("address.postalCode").optional().isString().trim().isLength({ max: 20 }),
];

// GET /api/sellers/:slug : valide le format strict du slug.
// Sans ce validator, le controleur recoit n'importe quelle chaine et
// renvoie 404 silencieux. Ici on prefere un 422 explicite "Slug invalide"
// quand le format est anormal, pour rester coherent avec categories et
// products.
const paramSellerSlugValidator = [
  param("slug")
    .isString()
    .bail()
    .matches(SLUG_REGEX)
    .withMessage("Slug vendeur invalide"),
];

// GET /api/sellers?page=...&limit=... : valide la pagination publique.
// Les valeurs hors bornes sont rejetees avec un 422 plutot que clampees
// silencieusement, pour ne pas masquer une erreur cote client.
const listSellersQueryValidators = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("page doit etre un entier >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit doit etre un entier entre 1 et 50"),
];

module.exports = {
  applyValidators,
  updateMeSellerValidators,
  listSellersQueryValidators,
  paramSellerSlugValidator,
  UPDATE_SELLER_ME_ALLOWED_FIELDS,
};
