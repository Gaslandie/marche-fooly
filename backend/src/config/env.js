const dotenv = require("dotenv");

dotenv.config({ quiet: true });

const requiredVariables = ["MONGODB_URI", "JWT_SECRET"];

for (const variableName of requiredVariables) {
  if (!process.env[variableName]) {
    throw new Error(`Variable d'environnement manquante: ${variableName}`);
  }
}

const parsedSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
const bcryptSaltRounds =
  Number.isInteger(parsedSaltRounds) && parsedSaltRounds >= 10
    ? parsedSaltRounds
    : 12;

const canonicalFrontendOrigin = "https://www.marchefooly.com";
const isHosted = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
// HS256 demande une clé d'au moins 256 bits. Ne jamais afficher sa valeur.
if (isHosted && Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
  throw new Error("JWT_SECRET doit contenir au moins 32 octets en production");
}
const corsOriginRaw = process.env.CORS_ORIGIN ||
  (isHosted ? canonicalFrontendOrigin : "http://localhost:3000");
const configuredCorsOrigins = corsOriginRaw
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
// Le domaine public canonique inclut www. Les deux origines sont distinctes
// pour le navigateur : une ancienne CORS_ORIGIN sans www ne suffit pas.
// En local, on conserve uniquement les origines explicitement configurées.
const corsOrigins = [...new Set([
  ...configuredCorsOrigins,
  ...(isHosted ? [canonicalFrontendOrigin] : []),
])];

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds,
  corsOrigins,
};
