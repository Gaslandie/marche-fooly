const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Service backend disponible",
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealth,
};
