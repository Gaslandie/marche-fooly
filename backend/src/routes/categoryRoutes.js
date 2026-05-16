/**
 * Routes: categoryRoutes
 *
 * Role exact du fichier:
 *   Declare les 5 endpoints catégories sous /api/categories:
 *     PUBLIC (sans auth):
 *       - GET    /          -> liste paginee des categories actives
 *       - GET    /:slug     -> detail d'une categorie active
 *     ADMIN (authentifie + role=admin):
 *       - POST   /          -> creer une categorie
 *       - PATCH  /:id       -> mettre a jour une categorie
 *       - DELETE /:id       -> soft-delete (isActive: false)
 *
 * Ou il est monte:
 *   - backend/src/app.js: app.use("/api/categories", categoryRoutes)
 *
 * ORDRE DES ROUTES IMPORTANT:
 *   - Les routes /:slug et /:id sont parametrees. On declare d'abord les
 *     routes sans collision (POST sur "/", PATCH/DELETE sur "/:id"), puis
 *     GET "/" et GET "/:slug". Comme :id et :slug sont sur des methodes
 *     differentes (PATCH/DELETE vs GET), il n'y a pas de risque de
 *     collision Express.
 *
 * Chaines de middlewares (ordre IMPORTANT, principe defense en profondeur):
 *   - GET / et GET /:slug:
 *       runValidators(...) si query/param a valider -> handler
 *     Publiques: aucun auth.
 *
 *   - POST /:
 *       authenticate
 *       -> requireRole("admin")          (BFLA: OWASP API5:2023)
 *       -> runValidators(createCategoryValidators)
 *       -> controller.create
 *
 *   - PATCH /:id:
 *       authenticate
 *       -> requireRole("admin")
 *       -> runValidators(paramIdValidator)        (rejet 422 si id non ObjectId)
 *       -> runValidators(updateCategoryValidators)
 *       -> controller.update
 *
 *   - DELETE /:id:
 *       authenticate
 *       -> requireRole("admin")
 *       -> runValidators(paramIdValidator)
 *       -> controller.softDelete
 *
 * Pourquoi requireRole AVANT runValidators:
 *   On ne devoile pas la liste exacte des champs attendus aux appelants
 *   non admins (limite l'oracle de probing). Memes raisons qu'au Jour 16
 *   pour les routes vendeur.
 *
 * Pas d'ownership:
 *   Les categories sont une taxonomie globale du systeme. Aucun
 *   utilisateur ne "possede" une categorie. L'autorisation se limite a
 *   la verification de role admin (cf. commentaire d'en-tete du
 *   controleur pour le detail).
 */

const express = require("express");

const {
  listPublic,
  getPublicBySlug,
  create,
  update,
  softDelete,
} = require("../controllers/categoryController");
const { authenticate } = require("../middlewares/authenticate");
const { requireRole } = require("../middlewares/requireRole");
const { runValidators } = require("../middlewares/validate");
const {
  createCategoryValidators,
  updateCategoryValidators,
  paramIdValidator,
  paramSlugValidator,
  listCategoriesQueryValidators,
} = require("../validators/categoryValidators");

const router = express.Router();

// --- Routes admin (POST/PATCH/DELETE) ---

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  runValidators(createCategoryValidators),
  create,
);

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  runValidators(paramIdValidator),
  runValidators(updateCategoryValidators),
  update,
);

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  runValidators(paramIdValidator),
  softDelete,
);

// --- Routes publiques (GET) ---

router.get("/", runValidators(listCategoriesQueryValidators), listPublic);

router.get("/:slug", runValidators(paramSlugValidator), getPublicBySlug);

module.exports = router;
