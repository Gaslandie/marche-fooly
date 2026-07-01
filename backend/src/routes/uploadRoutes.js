const express = require("express");

const {
  parseProductImageUpload,
  uploadProductImage,
} = require("../controllers/uploadController");
const { authenticate } = require("../middlewares/authenticate");
const {
  requireApprovedSeller,
} = require("../middlewares/requireApprovedSeller");

const router = express.Router();

router.post(
  "/product-image",
  authenticate,
  requireApprovedSeller,
  parseProductImageUpload,
  uploadProductImage,
);

module.exports = router;
