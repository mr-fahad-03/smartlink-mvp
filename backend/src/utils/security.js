const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { AppError } = require("./app-error");

function normalizeEmail(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^['"“”‘’]+|['"“”‘’]+$/g, "")
    .toLowerCase();
}

function passwordPolicyCheck(password) {
  const value = String(password || "");
  const minLen = Number(env.PASSWORD_MIN_LENGTH || 8);
  const maxLen = Number(env.PASSWORD_MAX_LENGTH || 12);
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);

  const valid = value.length >= minLen && value.length <= maxLen && hasUpper && hasLower && hasNumber;

  return {
    valid,
    minLen,
    maxLen,
    hasUpper,
    hasLower,
    hasNumber,
  };
}

function throwWeakPassword(policy = {}) {
  throw new AppError("Password does not meet policy.", 400, {
    code: "weak_password",
    rule: "must_have_length_upper_lower_number",
    minLength: policy.minLen || Number(env.PASSWORD_MIN_LENGTH || 8),
    maxLength: policy.maxLen || Number(env.PASSWORD_MAX_LENGTH || 12),
  });
}

function randomNumericCode(length = 6) {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(Math.floor(Math.random() * (max - min) + min));
}

function randomToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

function hashText(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function encryptJson(payload) {
  const key = crypto.createHash("sha256").update(String(env.APP_ENCRYPTION_SECRET || env.APP_JWT_SECRET || "")).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decryptJson(value) {
  const key = crypto.createHash("sha256").update(String(env.APP_ENCRYPTION_SECRET || env.APP_JWT_SECRET || "")).digest();
  const raw = Buffer.from(String(value || ""), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

function signAppAccessToken(payload) {
  const secret = env.APP_JWT_SECRET;
  if (!secret) {
    throw new AppError("APP_JWT_SECRET is required for auth sessions.", 500, { code: "server_auth_config_missing" });
  }

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: `${Number(env.ACCESS_TOKEN_TTL_MINUTES || 30)}m`,
  });
}

function verifyAppAccessToken(token) {
  try {
    return jwt.verify(String(token || ""), env.APP_JWT_SECRET || "");
  } catch (_) {
    throw new AppError("Invalid or expired session token.", 401, { code: "invalid_session" });
  }
}

module.exports = {
  normalizeEmail,
  passwordPolicyCheck,
  throwWeakPassword,
  randomNumericCode,
  randomToken,
  hashText,
  encryptJson,
  decryptJson,
  signAppAccessToken,
  verifyAppAccessToken,
};
