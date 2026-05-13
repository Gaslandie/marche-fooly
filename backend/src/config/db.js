const mongoose = require("mongoose");

const { mongoUri } = require("./env");

const connectDatabase = async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connexion MongoDB etablie");
  } catch (error) {
    console.error("Echec de connexion MongoDB:", error.message);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  mongoose,
};
