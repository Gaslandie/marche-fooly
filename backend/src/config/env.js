const dotenv = require("dotenv");

dotenv.config({ quiet: true });

const requiredVariables = ["MONGODB_URI"];

for (const variableName of requiredVariables) {
  if (!process.env[variableName]) {
    throw new Error(`Variable d'environnement manquante: ${variableName}`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV || "development",
};
