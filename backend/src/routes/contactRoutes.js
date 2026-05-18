/**
 * Routes: contactRoutes
 *
 * Role exact du fichier:
 *   Declare la route publique du formulaire de contact:
 *     POST /api/contact   -> creer un ContactMessage
 *
 * Ou il est monte:
 *   - backend/src/app.js: app.use("/api/contact", publicFormRateLimiter, contactRoutes)
 *   Le rate-limiter est applique en amont du routeur dans app.js pour
 *   eviter un import croise et pour garder la chaine de middlewares
 *   visible au meme endroit que les autres montages.
 *
 * Pas de routes admin (status, list, mark spam) au Jour 20:
 *   Le suivi support (status -> in_progress, resolved, spam) sera traite
 *   au Jour 27 (Dashboard admin).
 *
 * Chaine de middlewares pour POST /:
 *   publicFormRateLimiter        (deja applique au prefixe dans app.js)
 *   -> runValidators(createContactMessageValidators)
 *   -> controller.create
 *
 * Pourquoi pas d'authenticate:
 *   La route est PUBLIQUE par definition (un visiteur non connecte doit
 *   pouvoir contacter le support). Le risque de spam est gere par le
 *   publicFormRateLimiter (10 req/15min/IP).
 */

const express = require("express");

const { create } = require("../controllers/contactController");
const { runValidators } = require("../middlewares/validate");
const {
  createContactMessageValidators,
} = require("../validators/contactValidators");

const router = express.Router();

router.post("/", runValidators(createContactMessageValidators), create);

module.exports = router;
