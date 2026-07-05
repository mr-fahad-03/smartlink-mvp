const { z } = require("zod");

const leadSubmissionSchema = z.object({
  fullName: z.string().trim().min(2, "fullName must be at least 2 characters."),
  workEmail: z.string().trim().email("workEmail must be a valid email address."),
  phoneNumber: z.string().trim().optional().or(z.literal("")),
  audienceSegment: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  role: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  location: z.string().trim().min(2, "location is required."),
  locationScope: z.enum(["bahamas", "outside-bahamas"]).optional(),
  island: z.string().trim().optional(),
  website: z.string().trim().optional(),
  teamSize: z.string().trim().optional(),
  budgetPreference: z.string().trim().optional(),
  urgencyPreference: z.string().trim().optional(),
  priorConsultingExperience: z.string().trim().optional(),
  leadTier: z.enum(["standard", "premium"]).optional(),
  assessmentId: z.string().trim().optional(),
  normalizedScore: z.number().int().min(0).max(100).optional(),
  highestRiskCategory: z.string().trim().optional(),
  selectedCategory: z.string().trim().optional(),
  primaryIssue: z.string().trim().optional(),
  preferredSupportType: z.string().trim().optional(),
  source: z.string().trim().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

function parseLeadSubmission(input) {
  return leadSubmissionSchema.parse(input);
}

module.exports = {
  leadSubmissionSchema,
  parseLeadSubmission,
};
