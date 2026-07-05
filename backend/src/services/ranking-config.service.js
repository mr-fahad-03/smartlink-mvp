const { AppError } = require("../utils/app-error");
const { requireSupabase } = require("../utils/supabase-guard");

const DEFAULT_RANKING_CONFIG = {
  minimum_base_match_score: 70,
  featured_boost_value: 5,
  new_expert_boost_days: 14,
  new_expert_boost_value: 15,
  fairness_boost_max: 20,
  cooldown_threshold: 5,
  new_expert_boost_enabled: true,
  exposure_boost_strength: "high",
  rotation_frequency: "balanced",
  number_of_experts_displayed: 5,
  weight_category: 30,
  weight_urgency: 20,
  weight_budget: 20,
  weight_reputation: 15,
  weight_location: 10,
};

async function getActiveRankingConfig() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("ranking_config")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load ranking configuration.", 500, error.message);
  }

  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("ranking_config")
    .insert({ is_active: true, ...DEFAULT_RANKING_CONFIG })
    .select("*")
    .single();

  if (createError) {
    throw new AppError("Failed to initialize ranking configuration.", 500, createError.message);
  }

  return created;
}

async function updateActiveRankingConfig(updates) {
  const supabase = requireSupabase();
  const current = await getActiveRankingConfig();
  const { data, error } = await supabase
    .from("ranking_config")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", current.id)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to update ranking configuration.", 500, error.message);
  }

  return data;
}

module.exports = {
  DEFAULT_RANKING_CONFIG,
  getActiveRankingConfig,
  updateActiveRankingConfig,
};
