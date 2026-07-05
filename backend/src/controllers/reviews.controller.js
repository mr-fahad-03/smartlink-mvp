const { ZodError } = require("zod");

const { AppError } = require("../utils/app-error");
const { appendAdminAuditLog } = require("../services/admin-audit.service");
const { createPublicReview, moderateReview, respondToReview } = require("../services/review.service");
const { moderateReviewSchema, publicReviewSchema, respondReviewSchema } = require("../validators/reviews.validator");

async function submitPublicReview(req, res) {
  try {
    const payload = publicReviewSchema.parse(req.body || {});
    const review = await createPublicReview(payload);
    return res.status(201).json({
      success: true,
      message: "Review submitted and pending moderation.",
      data: review,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid public review payload.", 400, error.flatten());
    }
    throw error;
  }
}

async function patchReviewModeration(req, res) {
  try {
    const payload = moderateReviewSchema.parse(req.body || {});
    const review = await moderateReview(req.params.id, payload.reviewStatus);
    return res.json({
      success: true,
      message: "Review moderation updated.",
      data: review,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid review moderation payload.", 400, error.flatten());
    }
    throw error;
  }
}

async function postReviewResponse(req, res) {
  try {
    const payload = respondReviewSchema.parse(req.body || {});
    const beforeComment = req.body?.previousComment || null;
    const review = await respondToReview(req.params.id, payload.expertResponseComment);
    await appendAdminAuditLog({
      req,
      actor: req.adminActor,
      actionType: "review_response_update",
      targetType: "expert_review",
      targetId: req.params.id,
      previousValue: { expert_response_comment: beforeComment },
      newValue: { expert_response_comment: payload.expertResponseComment },
      notes: null,
    });
    return res.json({
      success: true,
      message: "Expert response saved.",
      data: review,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid expert response payload.", 400, error.flatten());
    }
    throw error;
  }
}

module.exports = {
  submitPublicReview,
  patchReviewModeration,
  postReviewResponse,
};
