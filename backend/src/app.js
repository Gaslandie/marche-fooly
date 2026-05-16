const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { corsOrigins } = require("./config/env");
const { authRateLimiter } = require("./middlewares/rateLimiters");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require("./routes/sellerRoutes");

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

// Rate limiting cible sur l'authentification (anti brute-force).
app.use("/api/auth", authRateLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sellers", sellerRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Marche Fooly operationnel",
  });
});

module.exports = app;
