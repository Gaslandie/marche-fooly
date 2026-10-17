const { body } = require("express-validator");

const { normalizePersonName, isPersonName, normalizeGuineaPhone } = require("../models/shared/validators");

const nameValidator = (field, label, optional = false) => {
  let rule = body(field);
  if (optional) rule = rule.optional();
  return rule.isString().withMessage(`${label} requis`).bail()
    .customSanitizer(normalizePersonName)
    .isLength({ min: 2, max: 80 }).withMessage(`${label} : entre 2 et 80 caractères`).bail()
    .custom(isPersonName).withMessage(`${label} : utilisez des lettres, espaces, apostrophes ou traits d’union, sans chiffres.`);
};
const phoneValidator = (optional = false) => {
  let rule = body("phone");
  if (optional) rule = rule.optional();
  return rule.isString().withMessage("Téléphone requis").bail()
    .custom((value) => normalizeGuineaPhone(value) !== null)
    .withMessage("Saisissez 9 chiffres, avec ou sans +224. Exemple : 612 34 56 78.")
    .bail().customSanitizer(normalizeGuineaPhone);
};

// bcrypt ignore les octets au-delà de 72 : ne jamais tronquer un nouveau secret.
const newPasswordValidator = () => body("password")
  .isString().withMessage("Mot de passe requis").bail()
  .isLength({ min: 8, max: 72 }).withMessage("Mot de passe : entre 8 et 72 caractères").bail()
  .custom(value => Buffer.byteLength(value, "utf8") <= 72)
  .withMessage("Mot de passe trop long. Raccourcissez-le : les accents et emojis prennent plus de place.");

const registerValidators = [
  nameValidator("firstName", "Prénom"),
  nameValidator("lastName", "Nom"),
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
  phoneValidator(),
  newPasswordValidator(),
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

const forgotPasswordValidators = [
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
];

const resetPasswordValidators = [
  // Token genere par crypto.randomBytes(32).toString("hex") : 64 hexa.
  body("token")
    .isString()
    .withMessage("Lien invalide")
    .bail()
    .trim()
    .matches(/^[a-f0-9]{64}$/)
    .withMessage("Lien invalide"),
  newPasswordValidator(),
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
  nameValidator("firstName", "Prénom", true),
  nameValidator("lastName", "Nom", true),
  phoneValidator(true),
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
  forgotPasswordValidators,
  resetPasswordValidators,
  updateMeValidators,
  UPDATE_ME_ALLOWED_FIELDS,
};
