const dotenv = require("dotenv");

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: toNumber(process.env.PORT, 5000),
  API_PREFIX: process.env.API_PREFIX || "/api",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || "",
  REVIEW_TOKEN_SECRET: process.env.REVIEW_TOKEN_SECRET || "",
  APP_JWT_SECRET: process.env.APP_JWT_SECRET || "",
  APP_ENCRYPTION_SECRET: process.env.APP_ENCRYPTION_SECRET || "",
  ACCESS_TOKEN_TTL_MINUTES: toNumber(process.env.ACCESS_TOKEN_TTL_MINUTES, 30),
  ADMIN_IDLE_TIMEOUT_MINUTES: toNumber(process.env.ADMIN_IDLE_TIMEOUT_MINUTES, 20),
  STANDARD_IDLE_TIMEOUT_MINUTES: toNumber(process.env.STANDARD_IDLE_TIMEOUT_MINUTES, 240),
  ADMIN_SESSION_TTL_HOURS: toNumber(process.env.ADMIN_SESSION_TTL_HOURS, 12),
  STANDARD_SESSION_TTL_DAYS: toNumber(process.env.STANDARD_SESSION_TTL_DAYS, 30),
  AUTH_RATE_LIMIT_WINDOW_MINUTES: toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES, 15),
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: toNumber(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 10),
  AUTH_LOCK_THRESHOLD: toNumber(process.env.AUTH_LOCK_THRESHOLD, 5),
  AUTH_LOCK_MINUTES: toNumber(process.env.AUTH_LOCK_MINUTES, 15),
  AUTH_SUSPICIOUS_THRESHOLD: toNumber(process.env.AUTH_SUSPICIOUS_THRESHOLD, 3),
  AUTH_CAPTCHA_REQUIRED_MINUTES: toNumber(process.env.AUTH_CAPTCHA_REQUIRED_MINUTES, 60),
  HCAPTCHA_SECRET: process.env.HCAPTCHA_SECRET || "",
  AUTH_REQUIRE_EMAIL_VERIFICATION: toBoolean(
    process.env.AUTH_REQUIRE_EMAIL_VERIFICATION,
    (process.env.NODE_ENV || "development") === "production",
  ),
  PASSWORD_MIN_LENGTH: toNumber(process.env.PASSWORD_MIN_LENGTH, 8),
  PASSWORD_MAX_LENGTH: toNumber(process.env.PASSWORD_MAX_LENGTH, 12),
  PASSWORD_HISTORY_DEPTH: toNumber(process.env.PASSWORD_HISTORY_DEPTH, 5),
  MFA_EMAIL_OTP_TTL_MINUTES: toNumber(process.env.MFA_EMAIL_OTP_TTL_MINUTES, 10),
  MFA_EMAIL_OTP_MAX_ATTEMPTS: toNumber(process.env.MFA_EMAIL_OTP_MAX_ATTEMPTS, 5),
  AUTH_DEFAULT_REDIRECT_URL: process.env.AUTH_DEFAULT_REDIRECT_URL || "",
  LEAD_PRICE_LOW: toNumber(process.env.LEAD_PRICE_LOW, 8),
  LEAD_PRICE_MEDIUM: toNumber(process.env.LEAD_PRICE_MEDIUM, 20),
  LEAD_PRICE_HIGH: toNumber(process.env.LEAD_PRICE_HIGH, 45),
};

function getSupabaseKey() {
  return env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
}

function getEnvSummary() {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    hasSupabaseUrl: Boolean(env.SUPABASE_URL),
    hasSupabaseKey: Boolean(getSupabaseKey()),
    usingServiceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    hasAdminApiKey: Boolean(env.ADMIN_API_KEY),
    hasReviewTokenSecret: Boolean(env.REVIEW_TOKEN_SECRET),
    hasAppJwtSecret: Boolean(env.APP_JWT_SECRET),
    hasAppEncryptionSecret: Boolean(env.APP_ENCRYPTION_SECRET),
  };
}

module.exports = {
  env,
  getSupabaseKey,
  getEnvSummary,
};
