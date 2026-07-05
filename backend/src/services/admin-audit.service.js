const { requireSupabase } = require("../utils/supabase-guard");
const { AppError } = require("../utils/app-error");

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || null;
}

async function appendAdminAuditLog(params) {
  const supabase = requireSupabase();
  const {
    req,
    actor,
    actionType,
    targetType,
    targetId,
    previousValue,
    newValue,
    notes,
  } = params;

  const row = {
    user_id: actor?.userId || null,
    role: actor?.role || null,
    action_type: actionType,
    target_type: targetType || null,
    target_id: targetId || null,
    previous_value: previousValue || null,
    new_value: newValue || null,
    timestamp: new Date().toISOString(),
    ip_address: getClientIp(req),
    notes: notes || null,
  };

  const { error } = await supabase.from("admin_audit_logs").insert(row);
  if (error) {
    throw new AppError("Failed to write admin audit log.", 500, error.message);
  }
}

async function listAuditLogs(limit = 200) {
  const supabase = requireSupabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const [auditQuery, loginAttemptQuery] = await Promise.all([
    supabase
      .from("admin_audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(safeLimit),
    supabase
      .from("auth_login_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(safeLimit),
  ]);

  if (auditQuery.error) {
    throw new AppError("Failed to load audit logs.", 500, auditQuery.error.message);
  }
  if (loginAttemptQuery.error) {
    throw new AppError("Failed to load login attempts.", 500, loginAttemptQuery.error.message);
  }

  const adminRows = auditQuery.data || [];
  const loginRows = loginAttemptQuery.data || [];

  const userIds = new Set();
  adminRows.forEach((row) => {
    if (row.user_id) userIds.add(row.user_id);
  });
  loginRows.forEach((row) => {
    if (row.user_id) userIds.add(row.user_id);
  });

  let usersById = {};
  if (userIds.size > 0) {
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (usersError) {
      throw new AppError("Failed to resolve audit users.", 500, usersError.message);
    }
    usersById = (authUsers?.users || []).reduce((acc, user) => {
      acc[user.id] = user.email || null;
      return acc;
    }, {});
  }

  const normalizedAdmin = adminRows.map((row) => ({
    ...row,
    user_email: row.user_id ? usersById[row.user_id] || null : null,
    _sort_timestamp: row.timestamp,
  }));

  const normalizedAttempts = loginRows.map((row) => ({
    audit_id: `auth-login-${row.id}`,
    user_id: row.user_id || null,
    user_email: row.email || (row.user_id ? usersById[row.user_id] || null : null),
    role: row.role || null,
    action_type: row.success ? "auth_login_success" : "auth_login_failure",
    target_type: "auth_login",
    target_id: row.id,
    previous_value: null,
    new_value: {
      reason: row.reason || null,
      ip_address: row.ip_address || null,
      user_agent: row.user_agent || null,
    },
    timestamp: row.created_at,
    ip_address: row.ip_address || null,
    notes: row.success ? "User login attempt succeeded." : "User login attempt failed.",
    _sort_timestamp: row.created_at,
  }));

  return [...normalizedAdmin, ...normalizedAttempts]
    .sort((a, b) => new Date(b._sort_timestamp).getTime() - new Date(a._sort_timestamp).getTime())
    .slice(0, safeLimit)
    .map(({ _sort_timestamp, ...row }) => row);
}

module.exports = {
  appendAdminAuditLog,
  listAuditLogs,
};
