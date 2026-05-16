/**
 * Routes: productRoutes
 *
 * Role exact du fichier:
 *   Declare les 6 endpoints produits sous /api/products:
 *     PUBLIC (sans auth):
 *       - GET    /                             -> liste publique paginee
 *       - GET    /category/:categorySlug       -> liste par categorie (alias REST)
 *       - GET    /:sellerSlug/:productSlug     -> detail public d'un produit
 *     PRIVE (authentifie):
 *       - POST   /                             -> creer un produit (seller approved)
 *       - PATCH  /:id                          -> modifier (owner OR admin)
 *       - DELETE /:id                          -> archiver (owner OR admin, soft)
 *
 * Ou il est monte:
 *   - backend/src/app.js: app.use("/api/products", productRoutes)
 *
 * ORDRE DES ROUTES IMPORTANT (Express 5 matche dans l'ordre de declaration):
 *   1. POST     /             (sans collision)
 *   2. PATCH    /:id          (methode differente des GET, pas de risque)
 *   3. DELETE   /:id          (idem)
 *   4. GET      /             (route exacte)
 *   5. GET      /category/:categorySlug
 *        Doit etre AVANT /:sellerSlug/:productSlug, sinon Express
 *        interpreterait "category" comme un sellerSlug et capturerait
 *        ce qu'on voulait envoyer au handler listByCategory.
 *   6. GET      /:sellerSlug/:productSlug
 *        Route fourre-tout des GET a deux segments, doit etre la
 *        derniere route GET declaree.
 *
 * Chaines de middlewares (ordre IMPORTANT, principe defense en profondeur):
 *   - GET / et GET /category/:slug:
 *       runValidators(...) -> handler
 *     Publiques, le filtre status est applique dans le controleur.
 *
 *   - GET /:sellerSlug/:productSlug:
 *       runValidators(paramSlugPairValidator) -> handler
 *
 *   - POST /:
 *       authenticate
 *       -> requireApprovedSeller         (bloque customer, pending, rejected, suspended;
 *                                         laisse passer admin SANS sellerProfile)
 *       -> runValidators(createProductValidators)
 *       -> controller.create             (refuse 403 si !req.sellerProfile,
 *                                         soit le cas admin: decision B du MVP)
 *
 *   - PATCH /:id:
 *       authenticate                     (PAS requireApprovedSeller ici car on
 *                                         veut laisser passer l'admin pour qu'il
 *                                         puisse modifier le produit d'un vendeur)
 *       -> runValidators(paramIdValidator)
 *       -> runValidators(updateProductValidators)
 *       -> controller.update             (gere admin/owner/403, isFeatured admin-only)
 *
 *   - DELETE /:id:
 *       authenticate
 *       -> runValidators(paramIdValidator)
 *       -> controller.softDelete         (admin/owner/403, idempotent)
 *
 * Pourquoi requireApprovedSeller UNIQUEMENT sur POST:
 *   POST exige un sellerProfile en source de verite (champ seller=<id>).
 *   PATCH/DELETE peuvent venir d'un admin SANS sellerProfile, donc on
 *   delegue la decision d'autorisation au controleur (admin pass-through,
 *   sinon ownership check). Cela evite des faux 403 sur les admins.
 *
 * Pourquoi runValidators APRES authenticate:
 *   Pas devoiler la liste des champs attendus a un appelant anonyme:
 *   401 d'abord, validation ensuite.
 *
 * Pas d'ownership middleware:
 *   La verification d'ownership necessite de charger le Product (Mongo)
 *   pour comparer product.seller a sellerProfile._id. On fait cette
 *   verification dans le controleur (qui a deja besoin du document pour
 *   le mettre a jour), evitant un findById dupliquant.
 */

const express = require("express");

const {
  listPublic,
  listByCategory,
  getBySellerAndSlug,
  create,
  update,
  softDelete,
} = require("../controllers/productController");
const { authenticate } = require("../middlewares/authenticate");
const {
  requireApprovedSeller,
} = require("../middlewares/requireApprovedSeller");
const { runValidators } = require("../middlewares/validate");
const {
  createProductValidators,
  updateProductValidators,
  paramIdValidator,
  paramSlugPairValidator,
  paramCategorySlugValidator,
  listProductsQueryValidators,
} = require("../validators/productValidators");

const router = express.Router();

// --- Routes privees (ecriture) ----------------------------------------------

router.post(
  "/",
  authenticate,
  requireApprovedSeller,
  runValidators(createProductValidators),
  create,
);

router.patch(
  "/:id",
  authenticate,
  runValidators(paramIdValidator),
  runValidators(updateProductValidators),
  update,
);

router.delete(
  "/:id",
  authenticate,
  runValidators(paramIdValidator),
  softDelete,
);

// --- Routes publiques (lecture) ---------------------------------------------

router.get("/", runValidators(listProductsQueryValidators), listPublic);

router.get(
  "/category/:categorySlug",
  runValidators(paramCategorySlugValidator),
  runValidators(listProductsQueryValidators),
  listByCategory,
);

// IMPORTANT: cette route a deux parametres doit rester DERNIERE pour ne
// pas absorber "/category/..." (cf. commentaire d'en-tete).
router.get(
  "/:sellerSlug/:productSlug",
  runValidators(paramSlugPairValidator),
  getBySellerAndSlug,
);

module.exports = router;
