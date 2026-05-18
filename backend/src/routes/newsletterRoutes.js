/**
 * Routes: newsletterRoutes
 *
 * Role exact du fichier:
 *   Declare la route publique d'inscription a la newsletter:
 *     POST /api/newsletter/subscribe   -> subscribe (idempotent)
 *
 * Ou il est monte:
 *   - backend/src/app.js: app.use("/api/newsletter", publicFormRateLimiter, newsletterRoutes)
 *   Le rate-limiter est applique en amont du routeur dans app.js.
 *
 * Pas de DELETE/unsubscribe au Jour 20 (decision D3).
 * Pas de route admin (list) au Jour 20: reportee Dashboard admin (Jour 27).
 *
 * Chaine de middlewares pour POST /subscribe:
 *   publicFormRateLimiter        (applique au prefixe dans app.js)
 *   -> runValidators(subscribeNewsletterValidators)
 *   -> controller.subscribe
 *
 * Pourquoi pas d'authenticate:
 *   La route est PUBLIQUE: tout visiteur doit pouvoir s'abonner. Le spam
 *   est limite par le publicFormRateLimiter (10 req/15min/IP) et par
 *   l'idempotence (unique sur email + branche serveur deja-inscrit).
 */

const express = require("express");

const { subscribe } = require("../controllers/newsletterController");
const { runValidators } = require("../middlewares/validate");
const {
  subscribeNewsletterValidators,
} = require("../validators/newsletterValidators");

const router = express.Router();

router.post(
  "/subscribe",
  runValidators(subscribeNewsletterValidators),
  subscribe,
);

module.exports = router;
