/**
 * Validators: categoryValidators
 *
 * Role exact du fichier:
 *   Definit les regles express-validator appliquees aux routes catégories:
 *     - createCategoryValidators       -> POST   /api/categories
 *     - updateCategoryValidators       -> PATCH  /api/categories/:id
 *     - paramIdValidator               -> :id sur PATCH/DELETE
 *     - paramSlugValidator             -> :slug sur GET /:slug
 *     - listCategoriesQueryValidators  -> query string de GET /api/categories
 *   Expose aussi la whitelist UPDATE_CATEGORY_ALLOWED_FIELDS, utilisee par le
 *   controleur pour ignorer tout champ hors perimetre (defense en profondeur).
 *
 * Ou il est utilise:
 *   - backend/src/routes/categoryRoutes.js (via runValidators)
 *   - backend/src/controllers/categoryController.js (whitelist)
 *
 * Prerequis importants:
 *   - express-validator >= 7 (cf. backend/package.json).
 *   - Bornes (min/max, regex) alignees sur le modele Mongoose
 *     backend/src/models/Category.js. Toute modification du modele doit etre
 *     repercutee ici.
 *
 * Regles de securite / metier:
 *   - Le SLUG n'est JAMAIS accepte en entree. Il est genere par le modele
 *     Mongoose a partir de `name` via le setter slugify (cf. Category.js).
 *   - Les champs internes (_id, id, slug, createdAt, updatedAt) sont
 *     EXPLICITEMENT refuses avec un 422 plutot qu'ignores silencieusement,
 *     pour donner un signal clair en cas de tentative de mass-assignment.
 *   - Les autres champs hors whitelist (UPDATE_CATEGORY_ALLOWED_FIELDS) sont
 *     ignores silencieusement par le controleur (defense en profondeur).
 *   - parentCategory accepte null (catégorie racine) ou un ObjectId valide.
 *     La verification d'existence du parent et la detection de cycle se font
 *     dans le controleur (besoin d'un acces a la base).
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - HTTP_URL_REGEX et SLUG_REGEX reprennent les regex utilisees dans les
 *     autres validators du backend.
 *   - FORBIDDEN_INPUT_FIELDS centralise la liste pour eviter la divergence.
 *   - mongoose.Types.ObjectId.isValid() est utilise pour valider les
 *     references ObjectId (parentCategory, :id).
 */

const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const HTTP_URL_REGEX = /^https?:\/\/.+/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Whitelist stricte des champs modifiables via POST et PATCH.
// Tout champ hors de cette liste est ignore par le controleur, meme s'il
// passe par hasard la validation.
const UPDATE_CATEGORY_ALLOWED_FIELDS = [
  "name",
  "description",
  "imageUrl",
  "parentCategory",
  "isActive",
  "sortOrder",
];

// Champs jamais acceptes en entree client. Ils sont refuses avec un 422
// pour signaler clairement une tentative anormale (mass-assignment,
// payload bogue, mauvais usage du client).
const FORBIDDEN_INPUT_FIELDS = ["slug", "_id", "id", "createdAt", "updatedAt"];

const forbiddenFieldsValidators = FORBIDDEN_INPUT_FIELDS.map((field) =>
  body(field)
    .not()
    .exists()
    .withMessage(
      `Le champ "${field}" ne peut pas etre fourni par le client`,
    ),
);

const isObjectIdString = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

// --- Champs individuels reutilisables ---

const nameRequired = body("name")
  .isString()
  .withMessage("Nom de categorie requis")
  .bail()
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage("Nom: entre 2 et 100 caracteres");

const nameOptional = body("name")
  .optional()
  .isString()
  .bail()
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage("Nom: entre 2 et 100 caracteres");

const descriptionOptional = body("description")
  .optional({ values: "falsy" })
  .isString()
  .bail()
  .trim()
  .isLength({ max: 600 })
  .withMessage("Description: 600 caracteres maximum");

const imageUrlOptional = body("imageUrl")
  .optional({ values: "falsy" })
  .isString()
  .bail()
  .trim()
  .matches(HTTP_URL_REGEX)
  .withMessage("imageUrl doit commencer par http:// ou https://");

// parentCategory: accepte explicitement null (categorie racine) ou un
// ObjectId valide. Un objet vide ou une chaine vide est refuse.
const parentCategoryOptional = body("parentCategory")
  .optional({ nullable: true })
  .custom((value) => {
    if (value === null) return true;
    if (!isObjectIdString(value)) {
      throw new Error("parentCategory doit etre un ObjectId valide ou null");
    }
    return true;
  });

const isActiveOptional = body("isActive")
  .optional()
  .isBoolean()
  .withMessage("isActive doit etre un booleen")
  .toBoolean();

const sortOrderOptional = body("sortOrder")
  .optional()
  .isInt({ min: 0 })
  .withMessage("sortOrder doit etre un entier >= 0")
  .toInt();

// --- Chaines exportees ---

const createCategoryValidators = [
  ...forbiddenFieldsValidators,
  nameRequired,
  descriptionOptional,
  imageUrlOptional,
  parentCategoryOptional,
  isActiveOptional,
  sortOrderOptional,
];

const updateCategoryValidators = [
  ...forbiddenFieldsValidators,
  nameOptional,
  descriptionOptional,
  imageUrlOptional,
  parentCategoryOptional,
  isActiveOptional,
  sortOrderOptional,
];

// PATCH/DELETE /:id : le path param doit etre un ObjectId Mongo valide,
// sinon on renvoie 422 plutot qu'une erreur de cast Mongoose 500.
const paramIdValidator = [
  param("id")
    .custom(isObjectIdString)
    .withMessage("Identifiant de categorie invalide"),
];

// GET /:slug : on impose le format slug strict (a-z, 0-9, tirets).
// Cela evite des requetes degenerees et permet un 404 propre plutot qu'un
// match accidentel sur des chaines bizarres.
const paramSlugValidator = [
  param("slug")
    .isString()
    .bail()
    .matches(SLUG_REGEX)
    .withMessage("Slug invalide"),
];

// GET /api/categories?page=&limit=&parent=
//   parent: slug de la categorie parente (optionnel). Si fourni, le
//   controleur filtre par categorie parente. Si parent introuvable -> liste
//   vide (200), pas 404, pour simplifier le code front.
const listCategoriesQueryValidators = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("page doit etre un entier >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit doit etre un entier entre 1 et 100"),
  query("parent")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(SLUG_REGEX)
    .withMessage("parent doit etre un slug valide"),
];

module.exports = {
  createCategoryValidators,
  updateCategoryValidators,
  paramIdValidator,
  paramSlugValidator,
  listCategoriesQueryValidators,
  UPDATE_CATEGORY_ALLOWED_FIELDS,
  FORBIDDEN_INPUT_FIELDS,
};
