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
const favoriteRoutes = require("./routes/favoriteRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");

const app = express();

// Confiance proxy: en production (Render, etc.), le service tourne DERRIERE
// un load-balancer qui ajoute l'en-tete X-Forwarded-For. Sans ce reglage,
// Express ignore cet en-tete: express-rate-limit voit alors une seule IP
// (celle du proxy) pour tous les clients et leve l'erreur
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
// On utilise la valeur numerique 1 ("faire confiance au 1er proxy") et NON
// `true`: `true` accepte l'IP la plus a gauche de X-Forwarded-For, qui peut
// etre usurpee par un client malveillant pour contourner le rate-limit.
app.set("trust proxy", 1);

// Securite: en-tetes HTTP par defaut recommandes par helmet.
app.use(helmet());

// CORS limite aux origines declarees dans CORS_ORIGIN.
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// Upload images produit: limite JSON dediee, car le frontend transmet
// temporairement l'image en data URL avant stockage Cloudinary.
app.use(
  "/api/uploads",
  generalApiRateLimiter,
  express.json({ limit: "7mb" }),
  uploadRoutes,
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
app.use("/api/favorites", generalApiRateLimiter);
app.use("/api/admin", generalApiRateLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);

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
