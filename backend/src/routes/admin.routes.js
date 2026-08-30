const express = require("express");

const {
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
  patchReviewExpertPackage,
  patchReviewExpertIntro,
} = require("../controllers/admin.controller");
const { ADMIN_PERMISSIONS } = require("../constants/admin-rbac");
const { requireAdminAuth, requirePermission } = require("../middleware/admin-jwt-auth");
const { asyncHandler } = require("../utils/async-handler");

const adminRouter = express.Router();

adminRouter.use(requireAdminAuth);

adminRouter.get("/me", asyncHandler(getMe));

adminRouter.get("/roles", requirePermission(ADMIN_PERMISSIONS.USER_ROLE_MANAGE), asyncHandler(getRoles));
adminRouter.post("/users", requirePermission(ADMIN_PERMISSIONS.USER_ROLE_MANAGE), asyncHandler(postCreateAdminUser));
adminRouter.post("/roles/assign", requirePermission(ADMIN_PERMISSIONS.USER_ROLE_MANAGE), asyncHandler(postAssignRole));
adminRouter.post("/roles/revoke", requirePermission(ADMIN_PERMISSIONS.USER_ROLE_MANAGE), asyncHandler(postRevokeRole));
adminRouter.get("/users/search", requirePermission(ADMIN_PERMISSIONS.USER_ROLE_MANAGE), asyncHandler(getUserSearch));

adminRouter.get("/expert-applications", requirePermission(ADMIN_PERMISSIONS.EXPERT_VIEW), asyncHandler(getExpertApplications));
adminRouter.post("/expert-applications/:id/:action", requirePermission(ADMIN_PERMISSIONS.EXPERT_VIEW), asyncHandler(postExpertApplicationAction));
adminRouter.get("/experts/search", requirePermission(ADMIN_PERMISSIONS.EXPERT_VIEW), asyncHandler(getExpertSearch));

adminRouter.patch("/experts/:id/state", requirePermission(ADMIN_PERMISSIONS.EXPERT_SUSPEND), asyncHandler(patchExpertState));
adminRouter.patch("/experts/:id/boost", requirePermission(ADMIN_PERMISSIONS.EXPERT_SUSPEND), asyncHandler(patchExpertBoost));
adminRouter.patch("/expert-packages/:expertId/:packageId", requirePermission(ADMIN_PERMISSIONS.EXPERT_VIEW), asyncHandler(patchReviewExpertPackage));
adminRouter.patch("/expert-intro/:expertId", requirePermission(ADMIN_PERMISSIONS.EXPERT_VIEW), asyncHandler(patchReviewExpertIntro));

adminRouter.get("/ranking-config", requirePermission(ADMIN_PERMISSIONS.MATCHING_SETTINGS_MANAGE), asyncHandler(getRankingConfig));
adminRouter.patch("/ranking-config", requirePermission(ADMIN_PERMISSIONS.MATCHING_SETTINGS_MANAGE), asyncHandler(patchRankingConfig));
adminRouter.get("/fairness-settings", requirePermission(ADMIN_PERMISSIONS.FAIRNESS_SETTINGS_MANAGE), asyncHandler(getFairnessSettings));
adminRouter.patch("/fairness-settings", requirePermission(ADMIN_PERMISSIONS.FAIRNESS_SETTINGS_MANAGE), asyncHandler(patchFairnessSettings));

adminRouter.get("/pricing-settings", requirePermission(ADMIN_PERMISSIONS.PRICING_SETTINGS_MANAGE), asyncHandler(getPricingSettings));
adminRouter.patch("/pricing-settings", requirePermission(ADMIN_PERMISSIONS.PRICING_SETTINGS_MANAGE), asyncHandler(patchPricingSettings));

adminRouter.post("/match-overrides", requirePermission(ADMIN_PERMISSIONS.MATCH_OVERRIDE_MANAGE), asyncHandler(postMatchOverride));
adminRouter.get("/match-overrides", requirePermission(ADMIN_PERMISSIONS.MATCH_OVERRIDE_MANAGE), asyncHandler(getMatchOverrides));
adminRouter.patch("/match-overrides/:id", requirePermission(ADMIN_PERMISSIONS.MATCH_OVERRIDE_MANAGE), asyncHandler(patchMatchOverrideById));

adminRouter.post("/lead-assignments", requirePermission(ADMIN_PERMISSIONS.LEAD_ASSIGN), asyncHandler(postLeadAssignment));
adminRouter.get("/lead-assignments", requirePermission(ADMIN_PERMISSIONS.REPORT_VIEW), asyncHandler(getLeadAssignments));
adminRouter.get("/lead-escalations", requirePermission(ADMIN_PERMISSIONS.REPORT_VIEW), asyncHandler(getLeadEscalations));
adminRouter.get("/leads/search", requirePermission(ADMIN_PERMISSIONS.REPORT_VIEW), asyncHandler(getLeadSearch));
adminRouter.get("/expert-performance", requirePermission(ADMIN_PERMISSIONS.REPORT_VIEW), asyncHandler(getExpertPerformance));

adminRouter.get("/reviews", requirePermission(ADMIN_PERMISSIONS.REPORT_VIEW), asyncHandler(getModerationReviews));
adminRouter.get("/reviews-feedback-summary", requirePermission(ADMIN_PERMISSIONS.REPORT_VIEW), asyncHandler(getReviewsFeedbackSummaryPanel));
adminRouter.patch("/reviews/:id/suspicious", requirePermission(ADMIN_PERMISSIONS.REVIEW_MODERATE_FINAL), asyncHandler(patchReviewSuspiciousFlag));
adminRouter.post("/reviews/:id/recommend", requirePermission(ADMIN_PERMISSIONS.REVIEW_MODERATE_RECOMMEND), asyncHandler(postReviewRecommendation));
adminRouter.get("/review-recommendations", requirePermission(ADMIN_PERMISSIONS.REVIEW_MODERATE_FINAL), asyncHandler(getReviewRecommendations));
adminRouter.patch("/reviews/:id/moderate", requirePermission(ADMIN_PERMISSIONS.REVIEW_MODERATE_FINAL), asyncHandler(patchReviewModerationByAdmin));

adminRouter.get("/reports/summary", requirePermission(ADMIN_PERMISSIONS.REPORT_VIEW), asyncHandler(getReportsSummary));
adminRouter.get("/audit-logs", requirePermission(ADMIN_PERMISSIONS.AUDIT_VIEW), asyncHandler(getAuditLogs));

module.exports = {
  adminRouter,
};
