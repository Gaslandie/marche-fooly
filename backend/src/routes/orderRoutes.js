/**
 * Routes: orderRoutes
 *
 * Role exact du fichier:
 *   Declare les 5 endpoints commandes sous /api/orders. AUCUNE route
 *   publique: une commande contient de la donnee transactionnelle et
 *   personnelle (adresse, telephone, montants). Toutes les routes
 *   exigent authenticate au minimum.
 *
 *     POST   /                       creer une commande (tout user authentifie)
 *     GET    /mine                   liste des commandes du CLIENT connecte
 *     GET    /seller                 liste des commandes du VENDEUR connecte (approved)
 *     PATCH  /:reference/status      transition statut (machine d'etat + RBAC)
 *     GET    /:reference             detail (visible: customer | seller | admin)
 *
 * Ou il est monte:
 *   - backend/src/app.js: app.use("/api/orders", orderRoutes)
 *   - generalApiRateLimiter est applique en amont sur /api/orders dans app.js
 *     pour cohérence avec /api/sellers /categories /products.
 *
 * ORDRE DES ROUTES IMPORTANT (Express 5 matche dans l'ordre de declaration):
 *   1. POST     /                       (sans collision)
 *   2. GET      /mine                   (segment statique)
 *   3. GET      /seller                 (segment statique)
 *   4. PATCH    /:reference/status      (methode differente des GET, pas de conflit)
 *   5. GET      /:reference             (paramétrée, doit etre DERNIERE des GET
 *                                        pour ne pas absorber /mine et /seller)
 *
 * Chaines de middlewares (ordre IMPORTANT, principe defense en profondeur):
 *
 *   - POST /:
 *       authenticate
 *       -> runValidators(createOrderValidators)
 *       -> controller.create
 *     Tout user authentifie peut commander (un vendeur peut commander
 *     chez un autre vendeur, c'est volontaire).
 *
 *   - GET /mine:
 *       authenticate
 *       -> runValidators(listOrdersQueryValidators)
 *       -> controller.listMine
 *     Le controleur filtre strictement customer === req.user._id.
 *
 *   - GET /seller:
 *       authenticate
 *       -> requireApprovedSeller   (charge req.sellerProfile pour les sellers;
 *                                   laisse passer les admins SANS sellerProfile)
 *       -> runValidators(listOrdersQueryValidators)
 *       -> controller.listSeller
 *     Le controleur renvoie 403 si !req.sellerProfile (admin sans sellerProfile
 *     doit utiliser une route admin dediee, hors scope Jour 19).
 *
 *   - PATCH /:reference/status:
 *       authenticate
 *       -> runValidators(paramReferenceValidator)
 *       -> runValidators(updateOrderStatusValidators)
 *       -> controller.updateStatus
 *     Le controleur applique la machine d'etat STATUS_TRANSITIONS:
 *       - 422 si transition non definie depuis l'etat courant
 *       - 403 si l'acteur (customer-owner | seller-owner | admin) n'est pas
 *         autorise pour cette transition
 *       - Effets de bord: restoreStock si target=cancelled; deliveredAt
 *         si target=delivered.
 *
 *   - GET /:reference:
 *       authenticate
 *       -> runValidators(paramReferenceValidator)
 *       -> controller.getByReference
 *     Le controleur applique determineActor(); si l'utilisateur n'est ni
 *     customer-owner, ni seller-owner, ni admin -> 404 (pas 403) pour ne
 *     pas reveler l'existence d'une reference a un attaquant qui scrute.
 *
 * Pourquoi pas de requireApprovedSeller sur PATCH /:reference/status:
 *   Les transitions peuvent etre faites par le customer (cancel d'un
 *   pending) ou l'admin (toute transition). Forcer requireApprovedSeller
 *   en amont bloquerait ces deux cas. Le controleur fait la branche fine
 *   via determineActor().
 *
 * Pourquoi runValidators APRES authenticate:
 *   On ne devoile pas la liste exacte des champs attendus a un appelant
 *   anonyme: 401 d'abord, validation ensuite. Coherent avec les autres
 *   jours du backend.
 */

const express = require("express");

const {
  create,
  listMine,
  listSeller,
  getByReference,
  updateStatus,
} = require("../controllers/orderController");
const { authenticate } = require("../middlewares/authenticate");
const {
  requireApprovedSeller,
} = require("../middlewares/requireApprovedSeller");
const { runValidators } = require("../middlewares/validate");
const {
  createOrderValidators,
  updateOrderStatusValidators,
  paramReferenceValidator,
  listOrdersQueryValidators,
} = require("../validators/orderValidators");

const router = express.Router();

// --- Routes "static" d'abord (POST /, GET /mine, GET /seller) ---

router.post(
  "/",
  authenticate,
  runValidators(createOrderValidators),
  create,
);

router.get(
  "/mine",
  authenticate,
  runValidators(listOrdersQueryValidators),
  listMine,
);

router.get(
  "/seller",
  authenticate,
  requireApprovedSeller,
  runValidators(listOrdersQueryValidators),
  listSeller,
);

// --- PATCH a deux segments (methode differente des GET, sans conflit) ---

router.patch(
  "/:reference/status",
  authenticate,
  runValidators(paramReferenceValidator),
  runValidators(updateOrderStatusValidators),
  updateStatus,
);

// --- GET parametree EN DERNIER pour ne pas absorber /mine et /seller ---

router.get(
  "/:reference",
  authenticate,
  runValidators(paramReferenceValidator),
  getByReference,
);

module.exports = router;
