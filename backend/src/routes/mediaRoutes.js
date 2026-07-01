const express = require("express");

const { getProductImage } = require("../controllers/mediaController");

const router = express.Router();

router.get("/images/:fileId", getProductImage);

module.exports = router;
