const express = require("express");

const { postReviewResponse, submitPublicReview } = require("../controllers/reviews.controller");
const { patchReviewModerationByAdmin } = require("../controllers/admin.controller");
const { ADMIN_PERMISSIONS } = require("../constants/admin-rbac");
const { requireAdminAuth, requirePermission } = require("../middleware/admin-jwt-auth");
const { asyncHandler } = require("../utils/async-handler");

const reviewsRouter = express.Router();

reviewsRouter.post("/public", asyncHandler(submitPublicReview));
reviewsRouter.patch(
  "/:id/moderate",
  requireAdminAuth,
  requirePermission(ADMIN_PERMISSIONS.REVIEW_MODERATE_FINAL),
  asyncHandler(patchReviewModerationByAdmin),
);
reviewsRouter.post(
  "/:id/respond",
  requireAdminAuth,
  requirePermission(ADMIN_PERMISSIONS.REVIEW_MODERATE_FINAL),
  asyncHandler(postReviewResponse),
);

module.exports = {
  reviewsRouter,
};
