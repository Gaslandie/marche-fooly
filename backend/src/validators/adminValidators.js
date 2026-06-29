/**
 * Validators: adminValidators
 *
 * Role exact du fichier:
 *   Chaines express-validator des routes admin (/api/admin/*):
 *     - listUsersValidators        -> GET /api/admin/users     (?role, ?status, page, limit)
 *     - listSellersValidators      -> GET /api/admin/sellers   (?status, page, limit)
 *     - listProductsValidators     -> GET /api/admin/products  (?status, page, limit)
 *     - listOrdersValidators       -> GET /api/admin/orders    (?status, page, limit)
 *     - paramIdValidator           -> :id (ObjectId)
 *     - updateSellerStatusValidators -> PATCH /api/admin/sellers/:id/status
 *
 * Ou il est utilise:
 *   - backend/src/routes/adminRoutes.js (via runValidators).
 *
 * Regles de securite / metier:
 *   - L'admin ne peut fixer un statut vendeur QUE parmi
 *     ["approved","rejected","suspended"]. "pending" n'est PAS une cible
 *     admin (c'est l'etat initial cree par la candidature).
 *   - Les filtres de statut/role sont bornes aux enums metier
 *     (constants.js) pour eviter toute requete arbitraire.
 *   - Pagination bornee (limit max 100) pour limiter la charge.
 *
 * Notes pour GitHub Copilot:
 *   - isObjectId: garde-fou ObjectId Mongoose pour :id.
 *   - ADMIN_SELLER_TARGET_STATUSES exporte pour reutilisation eventuelle.
 */

const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const {
  USER_ROLES,
  ACCOUNT_STATUSES,
  TEAM_TARGET_ROLES,
  SELLER_STATUSES,
  PRODUCT_STATUSES,
  ORDER_STATUSES,
} = require("../models/shared/constants");

const isObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

// Statuts vendeur qu'un admin peut FIXER (decision Jour 27).
const ADMIN_SELLER_TARGET_STATUSES = ["approved", "rejected", "suspended"];

const paginationValidators = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("page doit etre un entier >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit doit etre un entier entre 1 et 100"),
];

const listUsersValidators = [
  ...paginationValidators,
  query("role")
    .optional()
    .isIn(USER_ROLES)
    .withMessage(`role: doit valoir ${USER_ROLES.join(", ")}`),
  query("status")
    .optional()
    .isIn(ACCOUNT_STATUSES)
    .withMessage(`status: doit valoir ${ACCOUNT_STATUSES.join(", ")}`),
];

const listSellersValidators = [
  ...paginationValidators,
  query("status")
    .optional()
    .isIn(SELLER_STATUSES)
    .withMessage(`status: doit valoir ${SELLER_STATUSES.join(", ")}`),
];

const listProductsValidators = [
  ...paginationValidators,
  query("status")
    .optional()
    .isIn(PRODUCT_STATUSES)
    .withMessage(`status: doit valoir ${PRODUCT_STATUSES.join(", ")}`),
];

const listOrdersValidators = [
  ...paginationValidators,
  query("status")
    .optional()
    .isIn(ORDER_STATUSES)
    .withMessage(`status: doit valoir ${ORDER_STATUSES.join(", ")}`),
];

const paramIdValidator = [
  param("id").custom(isObjectId).withMessage("id: ObjectId valide requis"),
];

const updateSellerStatusValidators = [
  body("status")
    .isString()
    .withMessage("status requis")
    .bail()
    .isIn(ADMIN_SELLER_TARGET_STATUSES)
    .withMessage(
      `status: doit valoir ${ADMIN_SELLER_TARGET_STATUSES.join(", ")}`,
    ),
];

const updateUserRoleValidators = [
  body("role")
    .isString()
    .withMessage("role requis")
    .bail()
    .isIn(TEAM_TARGET_ROLES)
    .withMessage(`role: doit valoir ${TEAM_TARGET_ROLES.join(", ")}`),
];

module.exports = {
  listUsersValidators,
  listSellersValidators,
  listProductsValidators,
  listOrdersValidators,
  paramIdValidator,
  updateSellerStatusValidators,
  updateUserRoleValidators,
  ADMIN_SELLER_TARGET_STATUSES,
};
