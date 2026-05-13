const express = require("express");

const { register, login } = require("../controllers/authController");
const { runValidators } = require("../middlewares/validate");
const {
  registerValidators,
  loginValidators,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", runValidators(registerValidators), register);
router.post("/login", runValidators(loginValidators), login);

module.exports = router;
