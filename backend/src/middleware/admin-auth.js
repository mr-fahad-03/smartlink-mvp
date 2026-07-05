const { env } = require("../config/env");

function requireAdminApiKey(req, res, next) {
  const apiKey = req.header("x-admin-key");
  if (!env.ADMIN_API_KEY || apiKey !== env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized admin request.",
    });
  }
  return next();
}

module.exports = {
  requireAdminApiKey,
};

