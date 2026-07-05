const { z } = require("zod");

const FEEDBACK_REASON_OPTIONS = [
  "not_relevant",
  "no_response",
  "too_expensive",
  "wrong_location",
  "different_help_needed",
  "other",
];

const privateFeedbackSchema = z.object({
  leadId: z.string().uuid().optional(),
  assessmentId: z.string().trim().optional(),
  expertId: z.string().trim().optional(),
  matchHelpfulRating: z.enum(["yes", "somewhat", "no"]),
  feedbackReason: z.array(z.enum(FEEDBACK_REASON_OPTIONS)).default([]),
  feedbackText: z.string().trim().optional(),
});

module.exports = {
  FEEDBACK_REASON_OPTIONS,
  privateFeedbackSchema,
};
