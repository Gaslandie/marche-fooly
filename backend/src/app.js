const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { corsOrigins } = require("./config/env");
const {
  authRateLimiter,
  generalApiRateLimiter,
  publicFormRateLimiter,
} = require("./middlewares/rateLimiters");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");

const app = express();

// Securite: en-tetes HTTP par defaut recommandes par helmet.
app.use(helmet());

// CORS limite aux origines declarees dans CORS_ORIGIN.
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

app.use(express.json());

// Rate limiting cible sur l'authentification (anti brute-force, 30/15min).
app.use("/api/auth", authRateLimiter);

// Rate limiting general sur les routes API metier (anti-scraping, 300/15min).
// /api/health et "/" restent libres (sondes infra).
app.use("/api/sellers", generalApiRateLimiter);
app.use("/api/categories", generalApiRateLimiter);
app.use("/api/products", generalApiRateLimiter);
app.use("/api/orders", generalApiRateLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Routes publiques de formulaires (anti-spam plus strict que generalApi).
// publicFormRateLimiter (10/15min/IP) protege contact + newsletter d'un
// flood par un bot. Le compteur est PARTAGE entre les deux routes car
// c'est la meme instance de limiter (cf. middlewares/rateLimiters.js).
app.use("/api/contact", publicFormRateLimiter, contactRoutes);
app.use("/api/newsletter", publicFormRateLimiter, newsletterRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Marche Fooly operationnel",
  });
});

module.exports = app;
