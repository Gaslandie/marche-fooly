const express = require("express");

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  me,
  updateMe,
  logout,
} = require("../controllers/authController");
const { runValidators } = require("../middlewares/validate");
const { authenticate } = require("../middlewares/authenticate");
const {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  updateMeValidators,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", runValidators(registerValidators), register);
router.post("/login", runValidators(loginValidators), login);
// Mot de passe oublie (routes publiques, couvertes par authRateLimiter
// applique a tout /api/auth dans app.js).
router.post(
  "/forgot-password",
  runValidators(forgotPasswordValidators),
  forgotPassword,
);
router.post(
  "/reset-password",
  runValidators(resetPasswordValidators),
  resetPassword,
);

router.get("/me", authenticate, me);
router.patch(
  "/me",
  authenticate,
  runValidators(updateMeValidators),
  updateMe,
);

router.post("/logout", authenticate, logout);

module.exports = router;
