const crypto = require("crypto");

module.exports = () => {
  return crypto.randomInt(100000, 999999).toString();
};
