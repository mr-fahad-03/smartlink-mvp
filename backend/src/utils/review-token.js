const crypto = require("crypto");

const { env } = require("../config/env");

function createRawToken() {
  return crypto.randomBytes(24).toString("hex");
}

function hashReviewToken(rawToken) {
  const secret = env.REVIEW_TOKEN_SECRET || "smartlink-default-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(rawToken)
    .digest("hex");
}

module.exports = {
  createRawToken,
  hashReviewToken,
};

