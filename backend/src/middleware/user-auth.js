const { AppError } = require("../utils/app-error");
const { getMeFromAccessToken } = require("../services/auth.service");

function getBearerToken(req) {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

async function requireUserAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
    }
    const me = await getMeFromAccessToken(token);
    req.user = me;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requireUserAuth,
};
