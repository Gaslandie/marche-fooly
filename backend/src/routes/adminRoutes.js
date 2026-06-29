/**
 * Routes: adminRoutes
 *
 * Role exact du fichier:
 *   Declare les endpoints de supervision sous /api/admin. TOUTES les
 *   routes sont reservees aux roles back office. Aucune route publique.
 *
 *     GET    /users                 liste des utilisateurs (?role, ?status)
 *     PATCH  /users/:id/role        changer role customer/admin/staff (owner)
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
 *   - router.use(authenticate, requireRole(...BACKOFFICE_ROLES)):
 *       Applique a TOUTES les routes ci-dessous. Les routes sensibles
 *       ajoutent une garde plus stricte (owner/admin ou owner seul).
 *   - Puis runValidators(...) par route (apres la garde admin pour ne pas
 *     devoiler les champs attendus a un appelant non admin).
 *
 * Pourquoi PATCH /sellers/:id/status et non PATCH /sellers/:id:
 *   On expose une action ciblee (changement de statut) plutot qu'un
 *   update generique, pour limiter la surface d'ecriture au strict
 *   necessaire du Jour 27 (pas de suppression, pas d'edition libre).
 */

const express = require("express");

const {
  listUsers,
  listSellers,
  updateSellerStatus,
  updateUserRole,
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
  updateUserRoleValidators,
} = require("../validators/adminValidators");
const {
  ADMIN_OPERATION_ROLES,
  BACKOFFICE_ROLES,
} = require("../models/shared/constants");

const router = express.Router();

// Garde RBAC appliquee a TOUTES les routes admin.
router.use(authenticate, requireRole(...BACKOFFICE_ROLES));

router.get(
  "/users",
  requireRole(...ADMIN_OPERATION_ROLES),
  runValidators(listUsersValidators),
  listUsers,
);

router.get("/sellers", runValidators(listSellersValidators), listSellers);

router.patch(
  "/sellers/:id/status",
  requireRole(...ADMIN_OPERATION_ROLES),
  runValidators(paramIdValidator),
  runValidators(updateSellerStatusValidators),
  updateSellerStatus,
);

router.patch(
  "/users/:id/role",
  requireRole("owner"),
  runValidators(paramIdValidator),
  runValidators(updateUserRoleValidators),
  updateUserRole,
);

router.get("/products", runValidators(listProductsValidators), listProducts);

router.get("/orders", runValidators(listOrdersValidators), listOrders);

module.exports = router;
