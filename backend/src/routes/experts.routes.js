const express = require("express");

const {
  getMySubmittedApplication,
  postSubmitExpertApplication,
  postOptimizeExpertProfile,
  uploadMiddleware,
  postUploadDocument,
  getExpertDashboardData,
  patchUpdateExpertProfile,
  patchOpportunityStatus,
} = require("../controllers/experts.controller");
const { ADMIN_PERMISSIONS } = require("../constants/admin-rbac");
const { requireAdminAuth, requirePermission } = require("../middleware/admin-jwt-auth");
const { asyncHandler } = require("../utils/async-handler");

const expertsRouter = express.Router();

expertsRouter.get("/dashboard", asyncHandler(getExpertDashboardData));
expertsRouter.patch("/me", asyncHandler(patchUpdateExpertProfile));
expertsRouter.patch("/opportunities/:id/status", asyncHandler(patchOpportunityStatus));
expertsRouter.post("/applications/submit", asyncHandler(postSubmitExpertApplication));
expertsRouter.get("/applications/me", asyncHandler(getMySubmittedApplication));

expertsRouter.post(
  "/:id/optimize-profile",
  requireAdminAuth,
  requirePermission(ADMIN_PERMISSIONS.EXPERT_OPTIMIZE_PROFILE),
  asyncHandler(postOptimizeExpertProfile),
);

const { getMeFromAccessToken } = require("../services/auth.service");

async function resolveUserForUpload(req, res, next) {
  try {
    const header = req.header("authorization") || req.header("Authorization");
    if (!header) return next(new Error("Missing bearer token."));
    const [scheme, token] = header.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return next(new Error("Missing bearer token."));
    const me = await getMeFromAccessToken(token.trim());
    req.user = me;
    next();
  } catch (error) {
    next(error);
  }
}

expertsRouter.post(
  "/documents/upload",
  resolveUserForUpload,
  uploadMiddleware,
  asyncHandler(postUploadDocument)
);

module.exports = {
  expertsRouter,
};
