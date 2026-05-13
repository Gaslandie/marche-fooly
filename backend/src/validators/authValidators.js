const { body } = require("express-validator");

const PHONE_REGEX = /^\+?[0-9\s\-()]{8,20}$/;

const registerValidators = [
  body("firstName")
    .isString()
    .withMessage("Prenom requis")
    .bail()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Prenom: entre 2 et 80 caracteres"),
  body("lastName")
    .isString()
    .withMessage("Nom requis")
    .bail()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Nom: entre 2 et 80 caracteres"),
  body("email")
    .isString()
    .withMessage("Email requis")
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Adresse email invalide")
    .isLength({ max: 160 })
    .withMessage("Email trop long"),
  body("phone")
    .isString()
    .withMessage("Telephone requis")
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Numero de telephone invalide"),
  body("password")
    .isString()
    .withMessage("Mot de passe requis")
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage("Mot de passe: entre 8 et 128 caracteres"),
];

const loginValidators = [
  body("email")
    .isString()
    .withMessage("Email requis")
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Adresse email invalide"),
  body("password")
    .isString()
    .withMessage("Mot de passe requis")
    .bail()
    .notEmpty()
    .withMessage("Mot de passe requis"),
];

const HTTP_URL_REGEX = /^https?:\/\/.+/i;

// Champs autorises pour la mise a jour du profil (whitelist).
// Tout autre champ (role, status, email, passwordHash, etc.) est ignore.
const UPDATE_ME_ALLOWED_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "avatarUrl",
  "address",
];

const updateMeValidators = [
  body("firstName")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Prenom: entre 2 et 80 caracteres"),
  body("lastName")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Nom: entre 2 et 80 caracteres"),
  body("phone")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Numero de telephone invalide"),
  body("avatarUrl")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .matches(HTTP_URL_REGEX)
    .withMessage("L'URL doit commencer par http:// ou https://"),
  body("address").optional().isObject().withMessage("Adresse invalide"),
  body("address.street").optional().isString().trim().isLength({ max: 180 }),
  body("address.city").optional().isString().trim().isLength({ max: 80 }),
  body("address.region").optional().isString().trim().isLength({ max: 80 }),
  body("address.country").optional().isString().trim().isLength({ max: 80 }),
  body("address.postalCode").optional().isString().trim().isLength({ max: 20 }),
];

module.exports = {
  registerValidators,
  loginValidators,
  updateMeValidators,
  UPDATE_ME_ALLOWED_FIELDS,
};
