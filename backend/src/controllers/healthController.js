const { mongoose } = require("../config/db");

const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Service backend disponible",
    timestamp: new Date().toISOString(),
    database: {
      status:
        mongoose.connection.readyState === 1 ? "connectee" : "deconnectee",
    },
  });
};

module.exports = {
  getHealth,
};
