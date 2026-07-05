const { ZodError } = require("zod");

const { AppError } = require("../utils/app-error");
const { ADMIN_PERMISSIONS } = require("../constants/admin-rbac");
const {
  assignRoleSchema,
  revokeRoleSchema,
  createAdminUserSchema,
  expertApplicationActionSchema,
  reviewModerationActionSchema,
  reviewRecommendationSchema,
  leadAssignmentSchema,
  pricingSettingsPatchSchema,
  fairnessSettingsPatchSchema,
  matchOverrideCreateSchema,
  matchOverridePatchSchema,
  expertStatePatchSchema,
  expertBoostPatchSchema,
  suspiciousReviewFlagSchema,
} = require("../validators/admin-rbac.validator");
const { rankingConfigPatchSchema } = require("../validators/admin.validator");
const { updateActiveRankingConfig, getActiveRankingConfig } = require("../services/ranking-config.service");
const { moderateReview } = require("../services/review.service");
const { requireSupabase } = require("../utils/supabase-guard");
const {
  getAdminMe,
  listAdminRoles,
  createAdminUser,
  assignAdminRole,
  revokeAdminRole,
  listExpertApplications,
  mutateExpertApplication,
  updateExpertState,
  boostExpertPriority,
  assignLeadManually,
  listLeadAssignments,
  listLeadEscalations,
  listExpertPerformanceDashboard,
  getPlatformSettings,
  updatePlatformSettings,
  getReviewsFeedbackSummary,
  flagReviewSuspicious,
  listMatchOverrides,
  createMatchOverride,
  patchMatchOverride,
  listModerationReviews,
  createReviewRecommendation,
  listReviewRecommendations,
  resolvePendingReviewRecommendations,
  getAdminReportsSummary,
  listAuditLogs,
  searchAdminUsers,
  searchExperts,
  searchLeads,
} = require("../services/admin-management.service");
const { appendAdminAuditLog } = require("../services/admin-audit.service");

const FAIRNESS_STRENGTH_MAP = {
  low: 10,
  medium: 15,
  high: 20,
};

const ROTATION_THRESHOLD_MAP = {
  aggressive: 3,
  balanced: 5,
  minimal: 8,
};

function parseWithSchema(schema, payload, message) {
  try {
    return schema.parse(payload || {});
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(message, 400, error.flatten());
    }
    throw error;
  }
}

async function getMe(req, res) {
  const data = await getAdminMe(req.adminActor);
  return res.json({ success: true, data });
}

async function getRoles(req, res) {
  const roles = await listAdminRoles();
  return res.json({ success: true, data: roles });
}

async function postAssignRole(req, res) {
  const payload = parseWithSchema(assignRoleSchema, req.body, "Invalid role assignment payload.");
  const result = await assignAdminRole(req, req.adminActor, payload);
  return res.status(201).json({ success: true, message: "Role assigned.", data: result });
}

async function postCreateAdminUser(req, res) {
  const payload = parseWithSchema(createAdminUserSchema, req.body, "Invalid admin user payload.");
  const result = await createAdminUser(req, req.adminActor, payload);
  return res.status(201).json({ success: true, message: "Admin user created.", data: result });
}

async function postRevokeRole(req, res) {
  const payload = parseWithSchema(revokeRoleSchema, req.body, "Invalid role revoke payload.");
  const result = await revokeAdminRole(req, req.adminActor, payload);
  return res.json({ success: true, message: "Role revoked.", data: result });
}

async function getExpertApplications(req, res) {
  const applications = await listExpertApplications();
  return res.json({ success: true, data: applications });
}

async function postExpertApplicationAction(req, res) {
  const payload = parseWithSchema(expertApplicationActionSchema, req.body, "Invalid expert application action payload.");
  const { action } = req.params;

  const permissionByAction = {
    request_info: ADMIN_PERMISSIONS.EXPERT_REQUEST_INFO,
    recommend: ADMIN_PERMISSIONS.EXPERT_RECOMMEND,
    approve: ADMIN_PERMISSIONS.EXPERT_APPROVE,
    reject: ADMIN_PERMISSIONS.EXPERT_REJECT,
    flag: ADMIN_PERMISSIONS.EXPERT_RECOMMEND,
  };

  const requiredPermission = permissionByAction[action];
  if (!requiredPermission) {
    throw new AppError("Unsupported expert application action.", 400);
  }

  if (!req.adminActor.permissions.includes(requiredPermission)) {
    throw new AppError("Insufficient permission for this application action.", 403);
  }

  if (["approve", "reject"].includes(action) && req.adminActor.role === "moderator") {
    throw new AppError("Moderators cannot finalize approvals/rejections.", 403);
  }

  const updated = await mutateExpertApplication(req, req.adminActor, req.params.id, action, payload.notes);
  return res.json({ success: true, message: `Application ${action} completed.`, data: updated });
}

async function patchExpertState(req, res) {
  const payload = parseWithSchema(expertStatePatchSchema, req.body, "Invalid expert state payload.");
  const updated = await updateExpertState(req, req.adminActor, req.params.id, payload.state, payload.notes);
  return res.json({ success: true, message: "Expert state updated.", data: updated });
}

async function patchExpertBoost(req, res) {
  const payload = parseWithSchema(expertBoostPatchSchema, req.body, "Invalid expert boost payload.");
  const data = await boostExpertPriority(req, req.adminActor, req.params.id, payload);
  return res.json({ success: true, message: "Expert boost updated.", data });
}

async function getRankingConfig(req, res) {
  const config = await getActiveRankingConfig();
  return res.json({ success: true, data: config });
}

async function patchRankingConfig(req, res) {
  const updates = parseWithSchema(rankingConfigPatchSchema, req.body, "Invalid ranking config payload.");
  const current = await getActiveRankingConfig();
  const updated = await updateActiveRankingConfig(updates);

  await appendAdminAuditLog({
    req,
    actor: req.adminActor,
    actionType: "ranking_settings_update",
    targetType: "ranking_config",
    targetId: current.id,
    previousValue: current,
    newValue: updated,
    notes: null,
  });

  return res.json({ success: true, message: "Ranking config updated.", data: updated });
}

async function getFairnessSettings(req, res) {
  const config = await getActiveRankingConfig();
  const exposureStrength = String(config.exposure_boost_strength || "").toLowerCase();
  const rotationFrequency = String(config.rotation_frequency || "").toLowerCase();
  return res.json({
    success: true,
    data: {
      id: config.id,
      fairness_boost_max: config.fairness_boost_max,
      new_expert_boost_days: config.new_expert_boost_days,
      new_expert_boost_value: config.new_expert_boost_value,
      cooldown_threshold: config.cooldown_threshold,
      new_expert_boost_enabled: config.new_expert_boost_enabled !== false,
      exposure_boost_strength: FAIRNESS_STRENGTH_MAP[exposureStrength] ? exposureStrength : "high",
      rotation_frequency: ROTATION_THRESHOLD_MAP[rotationFrequency] ? rotationFrequency : "balanced",
    },
  });
}

async function patchFairnessSettings(req, res) {
  const payload = parseWithSchema(fairnessSettingsPatchSchema, req.body, "Invalid fairness settings payload.");
  const updates = { ...payload };
  if (payload.exposure_boost_strength && FAIRNESS_STRENGTH_MAP[payload.exposure_boost_strength]) {
    updates.fairness_boost_max = FAIRNESS_STRENGTH_MAP[payload.exposure_boost_strength];
  }
  if (payload.rotation_frequency && ROTATION_THRESHOLD_MAP[payload.rotation_frequency]) {
    updates.cooldown_threshold = ROTATION_THRESHOLD_MAP[payload.rotation_frequency];
  }
  const current = await getActiveRankingConfig();
  const updated = await updateActiveRankingConfig(updates);

  await appendAdminAuditLog({
    req,
    actor: req.adminActor,
    actionType: "fairness_settings_update",
    targetType: "ranking_config",
    targetId: current.id,
    previousValue: {
      fairness_boost_max: current.fairness_boost_max,
      new_expert_boost_days: current.new_expert_boost_days,
      new_expert_boost_value: current.new_expert_boost_value,
      cooldown_threshold: current.cooldown_threshold,
      new_expert_boost_enabled: current.new_expert_boost_enabled,
      exposure_boost_strength: current.exposure_boost_strength,
      rotation_frequency: current.rotation_frequency,
    },
    newValue: {
      fairness_boost_max: updated.fairness_boost_max,
      new_expert_boost_days: updated.new_expert_boost_days,
      new_expert_boost_value: updated.new_expert_boost_value,
      cooldown_threshold: updated.cooldown_threshold,
      new_expert_boost_enabled: updated.new_expert_boost_enabled,
      exposure_boost_strength: updated.exposure_boost_strength,
      rotation_frequency: updated.rotation_frequency,
    },
    notes: null,
  });

  return res.json({ success: true, message: "Fairness settings updated.", data: updated });
}

async function getPricingSettings(req, res) {
  const settings = await getPlatformSettings();
  return res.json({ success: true, data: settings });
}

async function patchPricingSettings(req, res) {
  const updates = parseWithSchema(pricingSettingsPatchSchema, req.body, "Invalid pricing settings payload.");
  const updated = await updatePlatformSettings(req, req.adminActor, updates);
  return res.json({ success: true, message: "Pricing settings updated.", data: updated });
}

async function postLeadAssignment(req, res) {
  const payload = parseWithSchema(leadAssignmentSchema, req.body, "Invalid manual lead assignment payload.");
  const created = await assignLeadManually(req, req.adminActor, payload);
  return res.status(201).json({ success: true, message: "Lead manually assigned.", data: created });
}

async function getLeadAssignments(req, res) {
  const list = await listLeadAssignments(req.query.limit);
  return res.json({ success: true, data: list });
}

async function getLeadEscalations(req, res) {
  const rows = await listLeadEscalations(req.query.limit);
  return res.json({ success: true, data: rows });
}

async function getExpertPerformance(req, res) {
  const rows = await listExpertPerformanceDashboard(req.query.limit);
  return res.json({ success: true, data: rows });
}

async function getModerationReviews(req, res) {
  const rows = await listModerationReviews(req.query.limit);
  return res.json({ success: true, data: rows });
}

async function getReviewsFeedbackSummaryPanel(req, res) {
  const summary = await getReviewsFeedbackSummary(req.query.limit);
  return res.json({ success: true, data: summary });
}

async function patchReviewSuspiciousFlag(req, res) {
  const payload = parseWithSchema(suspiciousReviewFlagSchema, req.body, "Invalid suspicious review payload.");
  const data = await flagReviewSuspicious(req, req.adminActor, req.params.id, payload);
  return res.json({ success: true, message: "Suspicious flag updated.", data });
}

async function postReviewRecommendation(req, res) {
  if (req.adminActor.role !== "moderator") {
    throw new AppError("Only moderators can submit recommendation-only review actions.", 403);
  }
  const payload = parseWithSchema(reviewRecommendationSchema, req.body, "Invalid review recommendation payload.");
  const data = await createReviewRecommendation(req, req.adminActor, req.params.id, payload);
  return res.status(201).json({ success: true, message: "Review recommendation submitted.", data });
}

async function getReviewRecommendations(req, res) {
  const rows = await listReviewRecommendations(req.query.limit);
  return res.json({ success: true, data: rows });
}

async function patchReviewModerationByAdmin(req, res) {
  const payload = parseWithSchema(reviewModerationActionSchema, req.body, "Invalid review moderation payload.");
  if (req.adminActor.role === "moderator") {
    throw new AppError("Moderators cannot perform final review moderation.", 403);
  }
  const supabase = requireSupabase();
  const { data: before } = await supabase
    .from("expert_reviews")
    .select("feedback_id, review_status")
    .eq("feedback_id", req.params.id)
    .maybeSingle();
  const updated = await moderateReview(req.params.id, payload.reviewStatus);

  await appendAdminAuditLog({
    req,
    actor: req.adminActor,
    actionType: "review_moderation_update",
    targetType: "expert_review",
    targetId: req.params.id,
    previousValue: { review_status: before?.review_status || null },
    newValue: { review_status: payload.reviewStatus },
    notes: payload.notes || null,
  });

  await resolvePendingReviewRecommendations(req, req.adminActor, req.params.id, payload.reviewStatus);

  return res.json({ success: true, message: "Review moderation updated.", data: updated });
}

async function postMatchOverride(req, res) {
  const payload = parseWithSchema(matchOverrideCreateSchema, req.body, "Invalid match override payload.");
  const created = await createMatchOverride(req, req.adminActor, payload);
  return res.status(201).json({ success: true, message: "Match override created.", data: created });
}

async function getMatchOverrides(req, res) {
  const rows = await listMatchOverrides(req.query.limit);
  return res.json({ success: true, data: rows });
}

async function patchMatchOverrideById(req, res) {
  const payload = parseWithSchema(matchOverridePatchSchema, req.body, "Invalid match override payload.");
  const updated = await patchMatchOverride(req, req.adminActor, req.params.id, payload);
  return res.json({ success: true, message: "Match override updated.", data: updated });
}

async function getReportsSummary(req, res) {
  const data = await getAdminReportsSummary();
  return res.json({ success: true, data });
}

async function getAuditLogs(req, res) {
  const logs = await listAuditLogs(req.query.limit);
  return res.json({ success: true, data: logs });
}

async function getUserSearch(req, res) {
  const data = await searchAdminUsers(req.query.q, req.query.limit);
  return res.json({ success: true, data });
}

async function getExpertSearch(req, res) {
  const data = await searchExperts(req.query.q, req.query.limit);
  return res.json({ success: true, data });
}

async function getLeadSearch(req, res) {
  const data = await searchLeads(req.query.q, req.query.limit);
  return res.json({ success: true, data });
}

module.exports = {
  getMe,
  getRoles,
  postCreateAdminUser,
  postAssignRole,
  postRevokeRole,
  getExpertApplications,
  postExpertApplicationAction,
  patchExpertState,
  patchExpertBoost,
  getRankingConfig,
  patchRankingConfig,
  getFairnessSettings,
  patchFairnessSettings,
  getPricingSettings,
  patchPricingSettings,
  postMatchOverride,
  getMatchOverrides,
  patchMatchOverrideById,
  postLeadAssignment,
  getLeadAssignments,
  getLeadEscalations,
  getExpertPerformance,
  getModerationReviews,
  getReviewsFeedbackSummaryPanel,
  patchReviewSuspiciousFlag,
  postReviewRecommendation,
  getReviewRecommendations,
  patchReviewModerationByAdmin,
  getReportsSummary,
  getAuditLogs,
  getUserSearch,
  getExpertSearch,
  getLeadSearch,
};
