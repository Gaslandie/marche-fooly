const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { corsOrigins } = require("./config/env");
const {
  authRateLimiter,
  generalApiRateLimiter,
  publicFormRateLimiter,
  uploadRateLimiter,
} = require("./middlewares/rateLimiters");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
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

// Les réponses métier peuvent contenir des données privées, même en erreur.
// Seules les images publiques versionnées remplacent cette règle plus bas.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "private, no-store, max-age=0");
  next();
});

// Upload images produit: multipart en memoire, optimise puis stocke en GridFS.
app.use("/api/uploads", uploadRateLimiter, uploadRoutes);

// Les images publiées peuvent être mises en cache pendant 60 secondes.
// Les aperçus privés sont authentifiés et ne sont jamais mis en cache.
app.use("/api/media", mediaRoutes);

// Rate limiting cible sur les tentatives sensibles d'authentification
// (anti brute-force, 30/15min). GET /me et les actions deja authentifiees
// sont ignorees par le limiteur pour ne pas casser une navigation normale.
app.use("/api/auth", authRateLimiter);
// Compter aussi les corps JSON malformés : ils ne contournent pas le quota.
app.use("/api/contact", publicFormRateLimiter);
app.use("/api/newsletter", publicFormRateLimiter);

app.use(express.json({ limit: "100kb" }));

// Rate limiting general sur les routes API metier (anti-scraping, 300/15min).
// /api/health et "/" restent libres (sondes infra).
app.use("/api/sellers", generalApiRateLimiter);
app.use("/api/categories", generalApiRateLimiter);
app.use("/api/products", generalApiRateLimiter);
app.use("/api/orders", generalApiRateLimiter);
app.use("/api/favorites", generalApiRateLimiter);
app.use("/api/notifications", generalApiRateLimiter);
app.use("/api/admin", generalApiRateLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Routes publiques de formulaires (anti-spam plus strict que generalApi).
// publicFormRateLimiter (10/15min/IP) protege contact + newsletter d'un
// flood par un bot. Le compteur est PARTAGE entre les deux routes car
// c'est la meme instance de limiter (cf. middlewares/rateLimiters.js).
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Marche Fooly operationnel",
  });
});

// Les erreurs du parseur et de MongoDB peuvent contenir une saisie privée.
// Ne jamais renvoyer ou journaliser leur message, leur corps ou leur pile.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.type === "entity.too.large" ? 413
    : error.type === "entity.parse.failed" ? 400
      : error.type === "charset.unsupported" ? 415 : 500;
  if (status === 500) console.error("[api] Erreur interne du serveur");
  return res.status(status).json({
    success: false,
    message: status === 413 ? "Requête trop volumineuse"
      : status === 400 || status === 415 ? "Requête invalide"
        : "Service momentanément indisponible. Réessayez plus tard.",
    data: null,
  });
});

module.exports = app;
