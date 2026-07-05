const { AppError } = require("../utils/app-error");
const { requireSupabase } = require("../utils/supabase-guard");
const { ALL_ADMIN_ROLES, hasPermission, getPermissionsForRole } = require("../constants/admin-rbac");
const { verifyAndLoadSession, touchSession } = require("./auth.service");
const { APP_ROLES } = require("../constants/auth");

async function resolveAdminActorFromToken(token) {
  const supabase = requireSupabase();

  const { tokenPayload, session } = await verifyAndLoadSession(token);
  if (!tokenPayload?.sub) {
    throw new AppError("Invalid or expired admin session.", 401);
  }
  await touchSession(session.id);

  const userId = tokenPayload.sub;
  const { data: roles, error: roleError } = await supabase
    .from("admin_user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (roleError) {
    throw new AppError("Failed to resolve admin role.", 500, roleError.message);
  }

  const activeRoles = (roles || []).map((row) => row.role).filter((role) => ALL_ADMIN_ROLES.includes(role));
  if (activeRoles.length === 0) {
    throw new AppError("Admin role is not assigned for this user.", 403);
  }

  const rolePriority = ["super_admin", "admin", "moderator", "auditor"];
  const role = rolePriority.find((item) => activeRoles.includes(item)) || activeRoles[0];

  if ([APP_ROLES.SUPER_ADMIN, APP_ROLES.ADMIN].includes(role) && !session.mfa_verified) {
    throw new AppError("MFA verification is required for admin account.", 401, {
      code: "mfa_required",
    });
  }

  return {
    userId,
    email: tokenPayload.email || null,
    role,
    roles: activeRoles,
    sessionId: session.id,
    mfaVerified: Boolean(session.mfa_verified),
    permissions: rolePriority
      .filter((item) => activeRoles.includes(item))
      .flatMap((item) => getPermissionsForRole(item))
      .filter((value, index, self) => self.indexOf(value) === index),
  };
}

function assertPermission(actor, permission, errorMessage = "Forbidden") {
  const has = actor.permissions.includes(permission) || hasPermission(actor.role, permission);
  if (!has) {
    throw new AppError(errorMessage, 403);
  }
}

function isHighValueLead(leadRow) {
  if (!leadRow) return false;
  const quality = String(leadRow.lead_quality_tag || "").toLowerCase();
  const tier = String(leadRow.lead_tier || "").toLowerCase();
  return quality === "high" || tier === "premium";
}

module.exports = {
  resolveAdminActorFromToken,
  assertPermission,
  isHighValueLead,
};
