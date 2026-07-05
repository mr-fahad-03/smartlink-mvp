const { z } = require("zod");

const rankingConfigPatchSchema = z.object({
  minimum_base_match_score: z.number().int().min(40).max(95).optional(),
  featured_boost_value: z.number().int().min(0).max(15).optional(),
  new_expert_boost_days: z.number().int().min(0).max(60).optional(),
  new_expert_boost_value: z.number().int().min(0).max(30).optional(),
  fairness_boost_max: z.number().int().min(0).max(40).optional(),
  cooldown_threshold: z.number().int().min(1).max(20).optional(),
  new_expert_boost_enabled: z.boolean().optional(),
  exposure_boost_strength: z.enum(["low", "medium", "high"]).optional(),
  rotation_frequency: z.enum(["aggressive", "balanced", "minimal"]).optional(),
  number_of_experts_displayed: z.number().int().min(3).max(5).optional(),
  weight_category: z.number().int().min(0).max(30).optional(),
  weight_urgency: z.number().int().min(0).max(20).optional(),
  weight_budget: z.number().int().min(0).max(20).optional(),
  weight_reputation: z.number().int().min(0).max(15).optional(),
  weight_location: z.number().int().min(0).max(10).optional(),
});

module.exports = {
  rankingConfigPatchSchema,
};
