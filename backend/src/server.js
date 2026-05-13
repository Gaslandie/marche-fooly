const app = require("./app");
const { connectDatabase, mongoose } = require("./config/db");
const { port } = require("./config/env");

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`Backend Marche Fooly demarre sur le port ${port}`);
    });
  } catch (error) {
    console.error("Arret du serveur: MongoDB indisponible");
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
