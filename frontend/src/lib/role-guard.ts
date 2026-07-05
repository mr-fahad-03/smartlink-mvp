export type AppRole = "super_admin" | "admin" | "moderator" | "auditor" | "expert" | "client";

export function canAccessAdminArea(role?: string | null) {
  return ["super_admin", "admin", "moderator", "auditor"].includes(String(role || ""));
}

export function canAccessSecurity(role?: string | null) {
  return ["super_admin", "admin", "moderator", "expert", "client"].includes(String(role || ""));
}

export function canManageRoles(role?: string | null) {
  return String(role || "") === "super_admin";
}

export function canUseExpertSection(role?: string | null) {
  return ["expert", "super_admin", "admin", "moderator", "auditor"].includes(String(role || ""));
}

export function canUseClientFlows(role?: string | null) {
  return ["client", "super_admin", "admin", "moderator", "auditor"].includes(String(role || ""));
}
