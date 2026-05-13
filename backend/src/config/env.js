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

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds,
};
