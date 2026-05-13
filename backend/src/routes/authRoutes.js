const express = require("express");

const {
  register,
  login,
  me,
  updateMe,
  logout,
} = require("../controllers/authController");
const { runValidators } = require("../middlewares/validate");
const { authenticate } = require("../middlewares/authenticate");
const {
  registerValidators,
  loginValidators,
  updateMeValidators,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", runValidators(registerValidators), register);
router.post("/login", runValidators(loginValidators), login);

router.get("/me", authenticate, me);
router.patch(
  "/me",
  authenticate,
  runValidators(updateMeValidators),
  updateMe,
);

router.post("/logout", authenticate, logout);

module.exports = router;
