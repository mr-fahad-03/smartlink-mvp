const APP_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  AUDITOR: "auditor",
  EXPERT: "expert",
  CLIENT: "client",
};

const ALL_APP_ROLES = Object.values(APP_ROLES);

const MFA_METHODS = {
  TOTP: "totp",
  EMAIL_OTP: "email_otp",
};

const MFA_REQUIRED_ROLES = new Set([APP_ROLES.SUPER_ADMIN, APP_ROLES.ADMIN]);

const SENSITIVE_ADMIN_ACTIONS = new Set([
  "pricing_settings_update",
  "ranking_settings_update",
  "fairness_settings_update",
  "match_override_create",
  "match_override_update",
  "match_override_disable",
  "role_assign",
  "role_revoke",
]);

module.exports = {
  APP_ROLES,
  ALL_APP_ROLES,
  MFA_METHODS,
  MFA_REQUIRED_ROLES,
  SENSITIVE_ADMIN_ACTIONS,
};
