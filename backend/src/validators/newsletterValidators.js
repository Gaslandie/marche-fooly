/**
 * Validators: newsletterValidators
 *
 * Role exact du fichier:
 *   Definit la chaine express-validator de la route publique:
 *     - subscribeNewsletterValidators -> POST /api/newsletter
 *   Pas de DELETE/unsubscribe au Jour 20 (decision D3).
 *   Expose la whitelist SUBSCRIBE_NEWSLETTER_ALLOWED_FIELDS et la liste
 *   FORBIDDEN_AT_SUBSCRIBE pour la defense en profondeur.
 *
 * Ou il est utilise:
 *   - backend/src/routes/newsletterRoutes.js (via runValidators)
 *   - backend/src/controllers/newsletterController.js (whitelist)
 *
 * Prerequis importants:
 *   - express-validator >= 7.
 *   - Bornes alignees sur models/NewsletterSubscriber.js.
 *
 * Regles de securite / metier:
 *   - Route PUBLIQUE -> protege par publicFormRateLimiter (10/15min/IP).
 *   - Le client envoie strictement: email, source (opt).
 *   - Champs interdits (422 si fournis): isActive, subscribedAt,
 *     unsubscribedAt, _id, id, createdAt, updatedAt. Ces champs sont
 *     entierement administres serveur (idempotence + reactivation).
 *   - email normalise: trim + lowercase + isEmail.
 *   - source optionnelle: tracking de provenance (decision R3).
 *   - Idempotence cote controleur (decisions R4/R5):
 *       email existant + isActive=true  -> 200 alreadySubscribed
 *       email existant + isActive=false -> reactivation 200
 *       email nouveau                    -> 201
 */

const { body } = require("express-validator");

const FORBIDDEN_AT_SUBSCRIBE = [
  "isActive",
  "subscribedAt",
  "unsubscribedAt",
  "_id",
  "id",
  "createdAt",
  "updatedAt",
];

const SUBSCRIBE_NEWSLETTER_ALLOWED_FIELDS = ["email", "source"];

const forbidValidators = FORBIDDEN_AT_SUBSCRIBE.map((field) =>
  body(field)
    .not()
    .exists()
    .withMessage(
      `Le champ "${field}" ne peut pas etre fourni par le client`,
    ),
);

const subscribeNewsletterValidators = [
  ...forbidValidators,
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
  body("source")
    .optional({ values: "falsy" })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 120 })
    .withMessage("source: 120 caracteres maximum"),
];

module.exports = {
  subscribeNewsletterValidators,
  SUBSCRIBE_NEWSLETTER_ALLOWED_FIELDS,
  FORBIDDEN_AT_SUBSCRIBE,
};
