const { AppError } = require("../utils/app-error");
const { env } = require("../config/env");

const attempts = new Map();

function keyFromReq(req) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const email = String(req.body?.email || "").trim().toLowerCase();
  return `${ip}::${email}`;
}

function getWindowMs() {
  return Number(env.AUTH_RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000;
}

function getMaxAttempts() {
  return Number(env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || 10);
}

function cleanExpired(now) {
  const windowMs = getWindowMs();
  for (const [key, value] of attempts.entries()) {
    if (now - value.windowStart > windowMs) {
      attempts.delete(key);
    }
  }
}

function authLoginRateLimit(req, res, next) {
  const now = Date.now();
  cleanExpired(now);

  const key = keyFromReq(req);
  const windowMs = getWindowMs();
  const maxAttempts = getMaxAttempts();

  const current = attempts.get(key);
  if (!current || now - current.windowStart > windowMs) {
    attempts.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (current.count >= maxAttempts) {
    return next(
      new AppError("Too many login attempts. Try again later.", 429, {
        code: "rate_limit_exceeded",
      }),
    );
  }

  current.count += 1;
  attempts.set(key, current);
  return next();
}

module.exports = {
  authLoginRateLimit,
};
