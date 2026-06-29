/**
 * Validators: favoriteValidators
 *
 * Routes protegees:
 *   - GET    /api/favorites
 *   - POST   /api/favorites
 *   - DELETE /api/favorites/:productId
 */

const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isObjectIdString = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const listFavoritesQueryValidators = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page: entier >= 1 requis")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit: entier entre 1 et 100 requis")
    .toInt(),
];

const addFavoriteValidators = [
  body("product")
    .custom(isObjectIdString)
    .withMessage("product: ObjectId valide requis"),
];

const productIdParamValidator = [
  param("productId")
    .custom(isObjectIdString)
    .withMessage("productId: ObjectId valide requis"),
];

module.exports = {
  listFavoritesQueryValidators,
  addFavoriteValidators,
  productIdParamValidator,
};
