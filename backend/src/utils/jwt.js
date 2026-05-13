const jwt = require("jsonwebtoken");

const { jwtSecret, jwtExpiresIn } = require("../config/env");

const signAuthToken = (user) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};

const verifyAuthToken = (token) => {
  return jwt.verify(token, jwtSecret);
};

module.exports = {
  signAuthToken,
  verifyAuthToken,
};
