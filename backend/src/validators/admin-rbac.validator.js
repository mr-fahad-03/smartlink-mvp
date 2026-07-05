const { z } = require("zod");
const { ALL_ADMIN_ROLES } = require("../constants/admin-rbac");

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ALL_ADMIN_ROLES),
  notes: z.string().trim().max(500).optional(),
});

const revokeRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ALL_ADMIN_ROLES),
  notes: z.string().trim().max(500).optional(),
});

const createAdminUserSchema = z.object({
  email: z.string().trim().email(),
  password: z
    .string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
    .regex(/[a-z]/, "Password must include at least one lowercase letter.")
    .regex(/\d/, "Password must include at least one number."),
  fullName: z.string().trim().min(2).max(120).optional(),
  role: z.enum(ALL_ADMIN_ROLES).default("admin"),
  notes: z.string().trim().max(500).optional(),
});

const expertApplicationActionSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});

const reviewModerationActionSchema = z.object({
  reviewStatus: z.enum(["approved", "rejected", "pending"]),
  notes: z.string().trim().max(1000).optional(),
});

const reviewRecommendationSchema = z.object({
  recommendation: z.enum(["approve", "reject"]),
  notes: z.string().trim().max(1000).optional(),
});

const leadAssignmentSchema = z.object({
  leadId: z.string().uuid(),
  expertId: z.string().trim().min(2),
  assignmentReason: z.string().trim().min(2).max(1000),
  notes: z.string().trim().max(1000).optional(),
});

const pricingSettingsPatchSchema = z.object({
  lead_price_low: z.number().min(0).max(1000).optional(),
  lead_price_medium: z.number().min(0).max(2000).optional(),
  lead_price_high: z.number().min(0).max(5000).optional(),
  pricing_band_low: z.string().trim().max(50).optional(),
  pricing_band_medium: z.string().trim().max(50).optional(),
  pricing_band_high: z.string().trim().max(50).optional(),
  high_value_criteria: z
    .object({
      requireUrgent: z.boolean().optional(),
      requireBudget: z.boolean().optional(),
      requireIntent: z.boolean().optional(),
      budgetLevels: z.array(z.enum(["low", "medium", "high", "exploring"])).optional(),
      intentTypes: z.array(z.enum(["do_it_for_me", "advice", "guided"])).optional(),
    })
    .optional(),
});

const fairnessSettingsPatchSchema = z.object({
  fairness_boost_max: z.number().int().min(0).max(100).optional(),
  new_expert_boost_days: z.number().int().min(0).max(90).optional(),
  new_expert_boost_value: z.number().int().min(0).max(100).optional(),
  cooldown_threshold: z.number().int().min(1).max(50).optional(),
  new_expert_boost_enabled: z.boolean().optional(),
  exposure_boost_strength: z.enum(["low", "medium", "high"]).optional(),
  rotation_frequency: z.enum(["aggressive", "balanced", "minimal"]).optional(),
});

const matchOverrideCreateSchema = z
  .object({
    leadId: z.string().uuid().optional(),
    assessmentId: z.string().trim().max(255).optional(),
    orderedExpertIds: z.array(z.string().trim().min(2)).min(1).max(10),
    allowHiddenExperts: z.boolean().optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((payload) => Boolean(payload.leadId || payload.assessmentId), {
    message: "Either leadId or assessmentId is required.",
  });

const matchOverridePatchSchema = z.object({
  orderedExpertIds: z.array(z.string().trim().min(2)).min(1).max(10).optional(),
  allowHiddenExperts: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional(),
});

const expertStatePatchSchema = z.object({
  state: z.enum(["pause", "suspend", "resume"]),
  notes: z.string().trim().max(1000).optional(),
});

const expertBoostPatchSchema = z.object({
  boostPoints: z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(15)]),
  notes: z.string().trim().max(1000).optional(),
});

const suspiciousReviewFlagSchema = z.object({
  isSuspicious: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
});

module.exports = {
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
};
