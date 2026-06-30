const express = require("express");

const { uploadProductImage } = require("../controllers/uploadController");
const { authenticate } = require("../middlewares/authenticate");
const {
  requireApprovedSeller,
} = require("../middlewares/requireApprovedSeller");

const router = express.Router();

router.post(
  "/product-image",
  authenticate,
  requireApprovedSeller,
  uploadProductImage,
);

module.exports = router;
