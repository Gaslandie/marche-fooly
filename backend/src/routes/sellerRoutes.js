/**
 * Routes: sellerRoutes
 *
 * Role exact du fichier:
 *   Declare les endpoints vendeur sous /api/sellers:
 *     PUBLIC (sans auth):
 *       - GET    /          -> liste paginee des vendeurs approuves
 *       - GET    /:slug     -> detail public d'un vendeur approuve
 *     PRIVE (authentifie):
 *       - POST   /apply     -> candidature vendeur (cree un SellerProfile pending)
 *       - GET    /me        -> lecture de sa propre fiche vendeur
 *       - PATCH  /me        -> mise a jour de sa fiche (vendeur approuve uniquement)
 *
 * Ou il est monte:
 *   - backend/src/app.js: app.use("/api/sellers", sellerRoutes)
 *
 * ORDRE DES ROUTES IMPORTANT:
 *   Les routes statiques (/apply, /me) sont declarees AVANT la route
 *   parametree /:slug. Sinon Express matcherait "apply" et "me" comme des
 *   slugs et la route /:slug attraperait tout. Avec l'ordre ci-dessous,
 *   /apply et /me sont prioritaires et /:slug ne capture que le reste.
 *
 * Chaines de middlewares (ordre IMPORTANT):
 *   - GET /  et  GET /:slug:
 *       (publiques, aucun middleware d'auth)
 *       -> runValidators(...) si query string
 *       -> handler controleur
 *
 *   - POST /apply:
 *       authenticate
 *       -> runValidators(applyValidators)
 *       -> sellerController.apply
 *     N'importe quel utilisateur authentifie peut candidater. Le controleur
 *     refuse 409 si une candidature existe deja pour ce compte.
 *
 *   - GET /me:
 *       authenticate
 *       -> sellerController.getMe
 *     Renvoie 404 si l'utilisateur n'a pas (encore) de SellerProfile.
 *
 *   - PATCH /me:
 *       authenticate
 *       -> requireRole("seller")
 *       -> requireApprovedSeller
 *       -> runValidators(updateMeSellerValidators)
 *       -> sellerController.updateMe
 *     Reserve aux comptes role=seller ET SellerProfile.status=approved.
 *     Les admins ne passent PAS par cette route (ils utiliseront les futures
 *     routes admin pour gerer n'importe quelle fiche vendeur).
 *
 * Pourquoi requireRole AVANT requireApprovedSeller:
 *   requireRole est synchrone et rejette en O(1) un mauvais role, evitant
 *   un findOne Mongo inutile pour les requetes hostiles.
 *
 * Pourquoi runValidators APRES requireApprovedSeller:
 *   On ne valide le corps qu'apres avoir confirme que l'appelant a le droit
 *   d'appeler la route. Cela evite d'exposer des messages de validation
 *   detailles a des appelants non autorises (limite l'oracle de probing).
 */

const express = require("express");

const {
  apply,
  getMe,
  updateMe,
  listPublic,
  getPublicBySlug,
} = require("../controllers/sellerController");
const { authenticate } = require("../middlewares/authenticate");
const { requireRole } = require("../middlewares/requireRole");
const {
  requireApprovedSeller,
} = require("../middlewares/requireApprovedSeller");
const { runValidators } = require("../middlewares/validate");
const {
  applyValidators,
  updateMeSellerValidators,
  listSellersQueryValidators,
  paramSellerSlugValidator,
} = require("../validators/sellerValidators");

const router = express.Router();

// --- Routes privees (authentifiees) ---
// On les declare AVANT /:slug pour qu'Express ne confonde pas "apply" ou
// "me" avec un slug de vendeur.

router.post(
  "/apply",
  authenticate,
  runValidators(applyValidators),
  apply,
);

router.get("/me", authenticate, getMe);

router.patch(
  "/me",
  authenticate,
  requireRole("seller"),
  requireApprovedSeller,
  runValidators(updateMeSellerValidators),
  updateMe,
);

// --- Routes publiques (sans auth) ---

router.get("/", runValidators(listSellersQueryValidators), listPublic);

router.get("/:slug", runValidators(paramSellerSlugValidator), getPublicBySlug);

module.exports = router;
