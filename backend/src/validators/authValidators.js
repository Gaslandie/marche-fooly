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

module.exports = {
  registerValidators,
  loginValidators,
};
