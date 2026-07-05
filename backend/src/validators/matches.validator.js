const { z } = require("zod");

const recommendMatchesSchema = z.object({
  leadId: z.string().uuid().optional(),
  assessmentId: z.string().trim().optional(),
  selectedCategory: z.string().trim().optional(),
  highestRiskCategory: z.string().trim().optional(),
  primaryIssue: z.string().trim().optional(),
  preferredSupportType: z.string().trim().optional(),
  location: z.string().trim().min(2),
  urgencyPreference: z.string().trim().optional(),
  budgetPreference: z.string().trim().optional(),
  matchRequestId: z.string().trim().optional(),
});

module.exports = {
  recommendMatchesSchema,
};

