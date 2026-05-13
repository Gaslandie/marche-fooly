const express = require("express");

const healthRoutes = require("./routes/healthRoutes");

const app = express();

app.use(express.json());

app.use("/api/health", healthRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Marche Fooly operationnel",
  });
});

module.exports = app;
