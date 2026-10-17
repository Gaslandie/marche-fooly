const jwt = require("jsonwebtoken");

const { jwtSecret, jwtExpiresIn } = require("../config/env");

const signAuthToken = (user) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };
  return jwt.sign(payload, jwtSecret, { algorithm: "HS256", expiresIn: jwtExpiresIn });
};

const verifyAuthToken = (token) => {
  return jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
};

module.exports = {
  signAuthToken,
  verifyAuthToken,
};
