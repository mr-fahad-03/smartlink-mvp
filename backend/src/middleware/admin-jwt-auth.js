const { AppError } = require("../utils/app-error");
const { appendAdminAuditLog } = require("../services/admin-audit.service");
const { resolveAdminActorFromToken, assertPermission } = require("../services/admin-rbac.service");

function getBearerToken(req) {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

async function requireAdminAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      throw new AppError("Missing admin bearer token.", 401);
    }
    const actor = await resolveAdminActorFromToken(token);
    req.adminActor = actor;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requirePermission(permission, options = {}) {
  return async function permissionGuard(req, res, next) {
    try {
      if (!req.adminActor) {
        throw new AppError("Missing admin actor context.", 401);
      }
      assertPermission(req.adminActor, permission, options.errorMessage || "Insufficient permission.");
      return next();
    } catch (error) {
      if (options.auditDenied !== false && req.adminActor) {
        try {
          await appendAdminAuditLog({
            req,
            actor: req.adminActor,
            actionType: "permission_denied",
            targetType: options.targetType || "system",
            targetId: options.targetId || permission,
            previousValue: null,
            newValue: null,
            notes: `Denied permission: ${permission}`,
          });
        } catch (_) {
          // ignore audit logging failures for denied attempts
        }
      }
      return next(error);
    }
  };
}

module.exports = {
  requireAdminAuth,
  requirePermission,
};
