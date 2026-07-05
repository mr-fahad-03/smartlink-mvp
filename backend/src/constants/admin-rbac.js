const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  AUDITOR: "auditor",
};

const ADMIN_PERMISSIONS = {
  EXPERT_APPROVE: "expert.approve",
  EXPERT_REJECT: "expert.reject",
  EXPERT_REQUEST_INFO: "expert.request_info",
  EXPERT_RECOMMEND: "expert.recommend",
  EXPERT_VIEW: "expert.view",
  EXPERT_SUSPEND: "expert.suspend",
  EXPERT_OPTIMIZE_PROFILE: "expert.optimize_profile",
  MATCHING_SETTINGS_MANAGE: "settings.matching.manage",
  FAIRNESS_SETTINGS_MANAGE: "settings.fairness.manage",
  PRICING_SETTINGS_MANAGE: "settings.pricing.manage",
  MATCH_OVERRIDE_MANAGE: "match.override.manage",
  LEAD_ASSIGN: "lead.assign",
  REVIEW_MODERATE_FINAL: "review.moderate_final",
  REVIEW_MODERATE_RECOMMEND: "review.moderate_recommend",
  USER_ROLE_MANAGE: "user.role.manage",
  REPORT_VIEW: "report.view",
  AUDIT_VIEW: "audit.view",
};

const ROLE_PERMISSION_MAP = {
  [ADMIN_ROLES.SUPER_ADMIN]: Object.values(ADMIN_PERMISSIONS),
  [ADMIN_ROLES.ADMIN]: [
    ADMIN_PERMISSIONS.EXPERT_APPROVE,
    ADMIN_PERMISSIONS.EXPERT_REJECT,
    ADMIN_PERMISSIONS.EXPERT_REQUEST_INFO,
    ADMIN_PERMISSIONS.EXPERT_VIEW,
    ADMIN_PERMISSIONS.EXPERT_SUSPEND,
    ADMIN_PERMISSIONS.EXPERT_OPTIMIZE_PROFILE,
    ADMIN_PERMISSIONS.LEAD_ASSIGN,
    ADMIN_PERMISSIONS.REVIEW_MODERATE_FINAL,
    ADMIN_PERMISSIONS.REPORT_VIEW,
    ADMIN_PERMISSIONS.AUDIT_VIEW,
  ],
  [ADMIN_ROLES.MODERATOR]: [
    ADMIN_PERMISSIONS.EXPERT_REQUEST_INFO,
    ADMIN_PERMISSIONS.EXPERT_RECOMMEND,
    ADMIN_PERMISSIONS.EXPERT_VIEW,
    ADMIN_PERMISSIONS.LEAD_ASSIGN,
    ADMIN_PERMISSIONS.REVIEW_MODERATE_RECOMMEND,
    ADMIN_PERMISSIONS.REPORT_VIEW,
  ],
  [ADMIN_ROLES.AUDITOR]: [
    ADMIN_PERMISSIONS.EXPERT_VIEW,
    ADMIN_PERMISSIONS.REPORT_VIEW,
    ADMIN_PERMISSIONS.AUDIT_VIEW,
  ],
};

const ALL_ADMIN_ROLES = Object.values(ADMIN_ROLES);

function getPermissionsForRole(role) {
  return ROLE_PERMISSION_MAP[role] || [];
}

function hasPermission(role, permission) {
  return getPermissionsForRole(role).includes(permission);
}

module.exports = {
  ADMIN_ROLES,
  ADMIN_PERMISSIONS,
  ALL_ADMIN_ROLES,
  ROLE_PERMISSION_MAP,
  getPermissionsForRole,
  hasPermission,
};
