/**
 * Validators: contactValidators
 *
 * Role exact du fichier:
 *   Definit la chaine express-validator de la route publique:
 *     - createContactMessageValidators -> POST /api/contact
 *   Pas de PATCH/DELETE au Jour 20 (suivi admin reporte).
 *   Expose la whitelist CREATE_CONTACT_ALLOWED_FIELDS et la liste
 *   FORBIDDEN_AT_CREATE utilisees par le controleur pour la defense en
 *   profondeur.
 *
 * Ou il est utilise:
 *   - backend/src/routes/contactRoutes.js (via runValidators)
 *   - backend/src/controllers/contactController.js (whitelist)
 *
 * Prerequis importants:
 *   - express-validator >= 7.
 *   - Bornes alignees sur models/ContactMessage.js. Toute modification du
 *     modele DOIT etre repercutee ici.
 *
 * Regles de securite / metier:
 *   - Route PUBLIQUE (pas d'authenticate) -> cible classique de spam.
 *     Le middleware publicFormRateLimiter (10/15min/IP) la protege.
 *   - Le client envoie strictement: fullName, email, phone (opt),
 *     subject, message, sourcePage (opt).
 *   - Champs interdits (422 si fournis): status, handledBy, handledAt,
 *     _id, id, createdAt, updatedAt. Ces champs sont gere par le serveur
 *     (status="new" force, handledBy/handledAt setes plus tard par admin).
 *   - email normalise: trim + lowercase + isEmail.
 *   - phone optionnel; si fourni, format PHONE_REGEX.
 *   - sourcePage optionnel: tracking de provenance (decision R2).
 *
 * Notes pour GitHub Copilot / autocompletion:
 *   - PHONE_REGEX miroir des autres validators du backend.
 *   - forbidValidators(): helper d'usage repete dans les autres modules.
 */

const { body } = require("express-validator");

const PHONE_REGEX = /^\+?[0-9\s\-()]{8,20}$/;

const FORBIDDEN_AT_CREATE = [
  "status",
  "handledBy",
  "handledAt",
  "_id",
  "id",
  "createdAt",
  "updatedAt",
];

const CREATE_CONTACT_ALLOWED_FIELDS = [
  "fullName",
  "email",
  "phone",
  "subject",
  "message",
  "sourcePage",
];

const forbidValidators = FORBIDDEN_AT_CREATE.map((field) =>
  body(field)
    .not()
    .exists()
    .withMessage(
      `Le champ "${field}" ne peut pas etre fourni par le client`,
    ),
);

const createContactMessageValidators = [
  ...forbidValidators,
  body("fullName")
    .isString()
    .withMessage("fullName requis")
    .bail()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("fullName: entre 2 et 120 caracteres"),
  body("email")
    .isString()
    .withMessage("email requis")
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("email invalide")
    .isLength({ max: 160 })
    .withMessage("email trop long"),
  body("phone")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("phone: format invalide"),
  body("subject")
    .isString()
    .withMessage("subject requis")
    .bail()
    .trim()
    .isLength({ min: 3, max: 180 })
    .withMessage("subject: entre 3 et 180 caracteres"),
  body("message")
    .isString()
    .withMessage("message requis")
    .bail()
    .trim()
    .isLength({ min: 10, max: 3000 })
    .withMessage("message: entre 10 et 3000 caracteres"),
  body("sourcePage")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 120 })
    .withMessage("sourcePage: 120 caracteres maximum"),
];

module.exports = {
  createContactMessageValidators,
  CREATE_CONTACT_ALLOWED_FIELDS,
  FORBIDDEN_AT_CREATE,
};
