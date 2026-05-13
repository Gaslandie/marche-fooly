const bcrypt = require("bcryptjs");

const { bcryptSaltRounds } = require("../config/env");

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, bcryptSaltRounds);
};

const comparePassword = async (plainPassword, passwordHash) => {
  if (!plainPassword || !passwordHash) {
    return false;
  }
  return bcrypt.compare(plainPassword, passwordHash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
