const { z } = require("zod");

const FEEDBACK_REASON_OPTIONS = [
  "not_relevant",
  "no_response",
  "too_expensive",
  "wrong_location",
  "different_help_needed",
  "other",
];

const publicReviewSchema = z.object({
  token: z.string().trim().min(10),
  matchHelpfulRating: z.enum(["yes", "somewhat", "no"]).optional(),
  feedbackReason: z.array(z.enum(FEEDBACK_REASON_OPTIONS)).default([]),
  publicStarRating: z.number().min(1).max(5),
  publicReviewComment: z.string().trim().optional(),
  wouldRecommend: z.boolean().optional(),
  expertResponseRating: z.string().trim().optional(),
  userId: z.string().trim().optional(),
});

const moderateReviewSchema = z.object({
  reviewStatus: z.enum(["pending", "approved", "rejected"]),
});

const respondReviewSchema = z.object({
  expertResponseComment: z.string().trim().min(2),
});

module.exports = {
  publicReviewSchema,
  moderateReviewSchema,
  respondReviewSchema,
};
