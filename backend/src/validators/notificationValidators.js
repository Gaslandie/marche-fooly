const { param, query } = require("express-validator");

const listNotificationsValidators = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page doit etre un entier positif"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit doit etre entre 1 et 50"),
  query("unread")
    .optional()
    .isIn(["true", "false"])
    .withMessage("unread doit valoir true ou false"),
];

const paramNotificationIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("id notification invalide"),
];

module.exports = {
  listNotificationsValidators,
  paramNotificationIdValidator,
};

