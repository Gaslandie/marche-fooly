/**
 * Routes: adminRoutes
 *
 * Role exact du fichier:
 *   Declare les endpoints de supervision admin sous /api/admin. TOUTES
 *   les routes sont reservees au role admin (lecture + approbation
 *   vendeur). Aucune route publique.
 *
 *     GET    /users                 liste des utilisateurs (?role, ?status)
 *     GET    /sellers               liste des vendeurs (?status)
 *     PATCH  /sellers/:id/status    approuver / rejeter / suspendre un vendeur
 *     GET    /products              liste des produits (?status)
 *     GET    /orders                liste des commandes (?status)
 *
 * Ou il est monte:
 *   - backend/src/app.js: app.use("/api/admin", adminRoutes)
 *   - generalApiRateLimiter applique en amont sur /api/admin dans app.js.
 *
 * Chaines de middlewares (ordre IMPORTANT, defense en profondeur):
 *   - router.use(authenticate, requireRole("admin")):
 *       Applique a TOUTES les routes ci-dessous. 401 si non authentifie,
 *       403 si le role n'est pas admin. C'est la garde RBAC au niveau
 *       fonction (OWASP API5:2023). On ne se fie jamais au frontend.
 *   - Puis runValidators(...) par route (apres la garde admin pour ne pas
 *     devoiler les champs attendus a un appelant non admin).
 *
 * Pourquoi PATCH /sellers/:id/status et non PATCH /sellers/:id:
 *   On expose une action ciblee (changement de statut) plutot qu'un
 *   update generique, pour limiter la surface d'ecriture admin au strict
 *   necessaire du Jour 27 (pas de suppression, pas d'edition libre).
 */

const express = require("express");

const {
  listUsers,
  listSellers,
  updateSellerStatus,
  listProducts,
  listOrders,
} = require("../controllers/adminController");
const { authenticate } = require("../middlewares/authenticate");
const { requireRole } = require("../middlewares/requireRole");
const { runValidators } = require("../middlewares/validate");
const {
  listUsersValidators,
  listSellersValidators,
  listProductsValidators,
  listOrdersValidators,
  paramIdValidator,
  updateSellerStatusValidators,
} = require("../validators/adminValidators");

const router = express.Router();

// Garde RBAC appliquee a TOUTES les routes admin.
router.use(authenticate, requireRole("admin"));

router.get("/users", runValidators(listUsersValidators), listUsers);

router.get("/sellers", runValidators(listSellersValidators), listSellers);

router.patch(
  "/sellers/:id/status",
  runValidators(paramIdValidator),
  runValidators(updateSellerStatusValidators),
  updateSellerStatus,
);

router.get("/products", runValidators(listProductsValidators), listProducts);

router.get("/orders", runValidators(listOrdersValidators), listOrders);

module.exports = router;
