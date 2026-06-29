/**
 * Routes: favoriteRoutes
 *
 * Toutes les routes exigent authenticate. Le controleur filtre toujours
 * sur req.user._id pour garantir l'ownership.
 */

const express = require("express");

const {
  listMine,
  add,
  remove,
} = require("../controllers/favoriteController");
const { authenticate } = require("../middlewares/authenticate");
const { runValidators } = require("../middlewares/validate");
const {
  listFavoritesQueryValidators,
  addFavoriteValidators,
  productIdParamValidator,
} = require("../validators/favoriteValidators");

const router = express.Router();

router.get(
  "/",
  authenticate,
  runValidators(listFavoritesQueryValidators),
  listMine,
);

router.post(
  "/",
  authenticate,
  runValidators(addFavoriteValidators),
  add,
);

router.delete(
  "/:productId",
  authenticate,
  runValidators(productIdParamValidator),
  remove,
);

module.exports = router;
