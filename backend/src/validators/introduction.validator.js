const { z } = require("zod");

const introductionItemSchema = z.object({
  expertId: z.string().trim().min(2),
  expertName: z.string().trim().min(2),
  serviceIds: z.array(z.string().trim()).default([]),
  serviceNames: z.array(z.string().trim()).default([]),
  category: z.string().trim().optional(),
  urgencyLevel: z.string().trim().optional(),
  budgetPreference: z.string().trim().optional(),
  billable: z.boolean().optional(),
  leadTier: z.string().trim().optional(),
  expertTier: z.string().trim().optional(),
});

const createIntroductionRequestsSchema = z.object({
  leadId: z.string().uuid().optional(),
  assessmentId: z.string().trim().optional(),
  leadName: z.string().trim().min(2),
  leadEmail: z.string().trim().email(),
  leadPhone: z.string().trim().optional(),
  requests: z.array(introductionItemSchema).min(1),
});

module.exports = {
  createIntroductionRequestsSchema,
};

