const express = require("express");

const { register, login, me } = require("../controllers/authController");
const { runValidators } = require("../middlewares/validate");
const { authenticate } = require("../middlewares/authenticate");
const {
  registerValidators,
  loginValidators,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", runValidators(registerValidators), register);
router.post("/login", runValidators(loginValidators), login);
router.get("/me", authenticate, me);

module.exports = router;
