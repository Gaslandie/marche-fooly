const express = require("express");

const {
  listMine,
  unreadCount,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");
const { authenticate } = require("../middlewares/authenticate");
const { runValidators } = require("../middlewares/validate");
const {
  listNotificationsValidators,
  paramNotificationIdValidator,
} = require("../validators/notificationValidators");

const router = express.Router();

router.get(
  "/",
  authenticate,
  runValidators(listNotificationsValidators),
  listMine,
);

router.get(
  "/unread-count",
  authenticate,
  unreadCount,
);

router.patch(
  "/read-all",
  authenticate,
  markAllRead,
);

router.patch(
  "/:id/read",
  authenticate,
  runValidators(paramNotificationIdValidator),
  markRead,
);

module.exports = router;

