const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend Marche Fooly demarre sur le port ${PORT}`);
});
