const { AppError } = require("../utils/app-error");
const { requireSupabase } = require("../utils/supabase-guard");
const { getActiveRankingConfig } = require("./ranking-config.service");
const { trackMetricEvent } = require("./metrics.service");
const { findActiveMatchOverride } = require("./admin-management.service");

const RELATED_CATEGORY_MAP = {
  Operations: ["Systems", "Growth", "Financial Advice"],
  Systems: ["Operations", "Cybersecurity", "Personal Tech Support"],
  Cybersecurity: ["Systems", "Personal Tech Support"],
  Growth: ["Operations", "Career Help"],
  "Career Help": ["Growth", "General Support"],
  "Financial Advice": ["Operations", "General Support"],
  "Legal Help": ["Operations", "General Support"],
  "Personal Tech Support": ["Systems", "Cybersecurity"],
  "General Support": ["Career Help", "Financial Advice", "Legal Help"],
};

const DEFAULT_WEIGHTS = {
  category: 30,
  urgency: 20,
  budget: 20,
  reputation: 15,
  location: 10,
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readWeight(config, key, fallback) {
  const value = Number(config[key]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeLocation(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "unknown";
  if (normalized.includes("nassau") || normalized.includes("new providence")) return "nassau";
  if (normalized.includes("grand bahama") || normalized.includes("freeport")) return "grand-bahama";
  if (
    normalized.includes("abaco") ||
    normalized.includes("exuma") ||
    normalized.includes("eleuthera") ||
    normalized.includes("andros") ||
    normalized.includes("long island") ||
    normalized.includes("bimini") ||
    normalized.includes("cat island") ||
    normalized.includes("family islands")
  ) {
    return "family-islands";
  }
  if (normalized.includes("outside")) return "outside-bahamas";
  if (normalized.includes("bahamas")) return "bahamas";
  return "unknown";
}

function getCategoryScore(expert, selectedCategory, config) {
  const tags = expert.category_tags || [];
  const weight = readWeight(config, "weight_category", DEFAULT_WEIGHTS.category);

  if (tags.includes(selectedCategory)) return { score: Math.round(weight), label: "exact" };

  const relatedCategories = RELATED_CATEGORY_MAP[selectedCategory] || [];
  if (tags.some((tag) => relatedCategories.includes(tag))) {
    return { score: Math.round(weight * (20 / 30)), label: "related" };
  }

  return { score: Math.round(weight * (10 / 30)), label: "weak" };
}

function getUrgencyScore(expert, urgencyPreference, config) {
  const responseHours = Number(expert.average_response_time || 72);
  const availabilityStatus = normalizeText(expert.availability_status);
  const weight = readWeight(config, "weight_urgency", DEFAULT_WEIGHTS.urgency);
  const isFast =
    availabilityStatus.includes("available_now") ||
    availabilityStatus.includes("immediate") ||
    responseHours <= 12;
  const within48h =
    availabilityStatus.includes("within_48h") ||
    availabilityStatus.includes("fast") ||
    responseHours <= 48;

  if (isFast) return { score: Math.round(weight), label: "immediate" };
  if (within48h) return { score: Math.round(weight * (15 / 20)), label: "48h" };
  return { score: Math.round(weight * (5 / 20)), label: "slower" };
}

function mapBudgetToRange(budgetPreference) {
  const normalized = normalizeText(budgetPreference);
  if (normalized.includes("free")) return { min: 0, max: 50 };
  if (normalized.includes("low ($0-$150)")) return { min: 0, max: 150 };
  if (normalized.includes("medium ($150-$500)")) return { min: 150, max: 500 };
  if (normalized.includes("high ($500+)")) return { min: 500, max: 1000000 };
  return { min: 0, max: 1000000 };
}

function getBudgetScore(expert, budgetPreference, config) {
  const userRange = mapBudgetToRange(budgetPreference);
  const expertRange = expert.budget_range || { min: 0, max: 1000000 };
  const expertMin = Number(expertRange.min ?? expert.hourly_rate_usd ?? 0);
  const expertMax = Number(expertRange.max ?? expert.hourly_rate_usd ?? expertMin);
  const weight = readWeight(config, "weight_budget", DEFAULT_WEIGHTS.budget);
  const overlap = expertMin <= userRange.max && expertMax >= userRange.min;

  if (overlap) return { score: Math.round(weight), label: "within_budget" };
  if (expertMin <= userRange.max * 1.2) {
    return { score: Math.round(weight * (10 / 20)), label: "slightly_above_budget" };
  }

  return { score: 0, label: "outside_budget" };
}

function getReputationScore(expert, config) {
  const rating = Number(expert.rating || 0);
  const weight = readWeight(config, "weight_reputation", DEFAULT_WEIGHTS.reputation);

  if (rating >= 4.8) return { score: Math.round(weight), label: "excellent" };
  if (rating >= 4.5) return { score: Math.round(weight * (10 / 15)), label: "strong" };
  if (rating >= 4.0) return { score: Math.round(weight * (5 / 15)), label: "fair" };
  return { score: Math.round(weight * (5 / 15)), label: "basic" };
}

function getLocationScore(expert, leadLocation, config) {
  const userRegion = normalizeLocation(leadLocation);
  const expertRegion = normalizeLocation(expert.location);
  const remoteFriendly = Boolean(expert.remote_available);
  const weight = readWeight(config, "weight_location", DEFAULT_WEIGHTS.location);

  if (userRegion !== "unknown" && expertRegion === userRegion) {
    return { score: Math.round(weight), label: "same_region" };
  }

  if (remoteFriendly) return { score: Math.round(weight * (7 / 10)), label: "remote_friendly" };
  return { score: Math.round(weight * (3 / 10)), label: "mismatch" };
}

function getFairnessBoost(expert, avgImpressions, config) {
  const impressions = Number(expert.impressions_7d || 0);
  const fairnessBoostMax = Number(config.fairness_boost_max || 20);
  const newExpertBoostDays = Number(config.new_expert_boost_days || 14);
  const newExpertBoostValue = Number(config.new_expert_boost_value || 15);
  const newExpertBoostEnabled = config.new_expert_boost_enabled !== false;

  let boost = 0;
  if (impressions <= Math.max(1, avgImpressions * 0.5)) {
    boost = clamp(Math.round(fairnessBoostMax * 0.75), 10, fairnessBoostMax);
  } else if (impressions <= avgImpressions) {
    boost = 5;
  }

  const approvedAt = expert.approved_at ? new Date(expert.approved_at) : null;
  if (approvedAt && newExpertBoostEnabled) {
    const daysSinceApproval = Math.floor((Date.now() - approvedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceApproval <= newExpertBoostDays) {
      boost += newExpertBoostValue;
    } else if (daysSinceApproval <= 30) {
      boost += 5;
    }
  }

  return clamp(boost, 0, fairnessBoostMax + newExpertBoostValue);
}

function getReviewAdjustment(expert, feedbackStats) {
  const rating = Number(expert.rating || 0);
  const completedReviews = Number(feedbackStats.completedReviewCount || expert.review_count || 0);
  const recommendationRate = Number(feedbackStats.recommendationRate || 1);

  if (completedReviews < 5) {
    return 0;
  }

  let adjustment = 0;
  if (rating >= 4.8) adjustment += 2;
  else if (rating >= 4.5) adjustment += 1;
  else if (rating >= 4.0) adjustment += 0;
  else adjustment -= 4;

  if (recommendationRate < 0.4) adjustment -= 2;
  else if (recommendationRate >= 0.75) adjustment += 1;

  return adjustment;
}

function getPrivateFeedbackPenalty(feedbackStats) {
  const negativeCount = Number(feedbackStats.negativeFeedbackCount || 0);
  if (negativeCount >= 6) return -5;
  if (negativeCount >= 3) return -3;
  return 0;
}

function getPerformanceScore(expert, feedbackStats) {
  const responseHours = Number(expert.average_response_time || 999);
  const acceptanceRate = Number(expert.lead_acceptance_rate || 0);
  const connectionRate = Number(expert.successful_connection_rate || 0);
  const profileViews = Number(expert.profile_views_7d || 0);
  const clicks = Number(expert.clicks_7d || 0);
  const clickRate = profileViews > 0 ? clicks / profileViews : 0;

  const strong =
    responseHours <= 24 &&
    acceptanceRate >= 0.6 &&
    connectionRate >= 0.35 &&
    clickRate >= 0.1;

  let kpiScore = 0;
  if (strong) {
    kpiScore = 15;
  } else {
    const moderateSignalCount = [
      responseHours <= 48,
      acceptanceRate >= 0.4,
      connectionRate >= 0.2,
      clickRate >= 0.05,
    ].filter(Boolean).length;

    if (moderateSignalCount >= 3) {
      kpiScore = 8;
    }
  }

  const reviewAdjustment = getReviewAdjustment(expert, feedbackStats);
  const privatePenalty = getPrivateFeedbackPenalty(feedbackStats);
  return clamp(kpiScore + reviewAdjustment + privatePenalty, -8, 15);
}

function getPriorityBoost(expert, config) {
  const adminBoostPoints = Number(expert?.metadata?.admin_boost_points || 0);
  if (expert.is_featured || expert.tier === "featured") return Number(config.featured_boost_value || 5) + adminBoostPoints;
  if (adminBoostPoints > 0) return adminBoostPoints;
  return 0;
}

function getCooldownAdjustment(expert, avgImpressions, config) {
  const impressions = Number(expert.impressions_7d || 0);
  const top3ShownCount = Number(expert.top3_shown_24h_count || 0);
  if (top3ShownCount >= Number(config.cooldown_threshold || 5)) {
    return -10;
  }
  if (impressions > avgImpressions * 1.7) {
    return -5;
  }
  return 0;
}

function toMatchBand(score) {
  if (score >= 90) return "Best Match";
  if (score >= 80) return "Strong Match";
  return "Good Match";
}

function buildMatchExplanation(selectedCategory, lead, breakdown) {
  const timelinePhrase =
    breakdown.urgency.label === "immediate"
      ? "Strong fit for your urgent timeline"
      : breakdown.urgency.label === "48h" || breakdown.urgency.label === "fast"
        ? "Can respond quickly for your timeline"
        : "Reasonable timing for your current pace";

  const budgetPhrase =
    breakdown.budget.label === "within_budget"
      ? "and aligns with your budget"
      : breakdown.budget.label === "slightly_above_budget"
        ? "with a slightly higher budget range"
        : "though budget alignment may need adjustment";

  const categoryPhrase =
    breakdown.category.label === "exact"
      ? `Exact expertise in ${selectedCategory.toLowerCase()}`
      : breakdown.category.label === "related"
        ? `Relevant expertise connected to ${selectedCategory.toLowerCase()}`
        : "General expertise that can still support your case";

  const locationPhrase =
    breakdown.location.label === "same_region"
      ? "local fit for your location"
      : breakdown.location.label === "remote_friendly"
        ? "remote-friendly for your location"
        : "location is workable with some constraints";

  const leadPhrase = normalizeText(lead.primaryIssue || lead.selectedCategory).replace(/\.$/, "") || "your issue";
  return `${timelinePhrase} ${budgetPhrase}. ${categoryPhrase}, ${locationPhrase}, and can help with ${leadPhrase} effectively.`;
}

function badgesForCandidate(candidate) {
  const badges = [];
  if (candidate.expert.is_featured || candidate.expert.tier === "featured") badges.push("Featured");
  if (candidate.expert.is_verified || candidate.expert.tier === "verified") badges.push("Verified");
  if (candidate.breakdown.urgency.score >= 20) badges.push("Available Now");
  if (candidate.breakdown.budget.score >= 20) badges.push("Matches Your Budget");
  if (candidate.breakdown.location.score >= 7) badges.push("Remote Friendly");
  return badges;
}

function ensureRecommendationSlots(candidates) {
  if (candidates.length === 0) return [];
  const slotted = [...candidates];
  slotted[0].slotLabel = "Top Match";
  slotted[0].badges = [...new Set(["Top Match", ...slotted[0].badges])];

  if (slotted[1]) {
    slotted[1].slotLabel = "Strong Match";
    slotted[1].badges = [...new Set(["Strong Match", ...slotted[1].badges])];
  }

  if (slotted.length > 2) {
    let bestFairnessIndex = 2;
    let bestFairnessValue = slotted[2].fairnessBoost;

    for (let index = 3; index < slotted.length; index += 1) {
      if (slotted[index].fairnessBoost > bestFairnessValue) {
        bestFairnessValue = slotted[index].fairnessBoost;
        bestFairnessIndex = index;
      }
    }

    slotted[bestFairnessIndex].slotLabel = "Rising Expert";
    slotted[bestFairnessIndex].badges = [...new Set(["Rising Expert", ...slotted[bestFairnessIndex].badges])];
  }

  return slotted;
}

function buildFinalSortComparator(urgencyPreference) {
  const isUrgentLead = normalizeText(urgencyPreference).includes("right now") || normalizeText(urgencyPreference).includes("urgent");

  return (a, b) => {
    if (isUrgentLead && b.breakdown.urgency.score !== a.breakdown.urgency.score) {
      return b.breakdown.urgency.score - a.breakdown.urgency.score;
    }

    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;

    const responseA = Number(a.expert.average_response_time || 999);
    const responseB = Number(b.expert.average_response_time || 999);
    if (responseA !== responseB) return responseA - responseB;

    return Number(b.expert.rating || 0) - Number(a.expert.rating || 0);
  };
}

function applyTopThreeCooldown(candidates, cooldownThreshold) {
  if (candidates.length <= 3) return candidates;

  const cooled = [];
  const regular = [];

  for (const candidate of candidates) {
    const count = Number(candidate.expert.top3_shown_24h_count || 0);
    if (count >= cooldownThreshold) cooled.push(candidate);
    else regular.push(candidate);
  }

  if (regular.length >= 3 || cooled.length === 0) {
    return [...regular, ...cooled];
  }

  const firstThree = [...regular, ...cooled.slice(0, 3 - regular.length)];
  const remainder = [...cooled.slice(3 - regular.length)];
  return [...firstThree, ...remainder];
}

async function fetchExpertFeedbackStats(expertIds) {
  if (!expertIds.length) return new Map();

  const supabase = requireSupabase();
  const statsMap = new Map();

  const [reviewsResult, privateFeedbackResult] = await Promise.all([
    supabase
      .from("expert_reviews")
      .select("expert_id, public_star_rating, would_recommend, review_status")
      .in("expert_id", expertIds),
    supabase
      .from("private_match_feedback")
      .select("expert_id, match_helpful_rating, feedback_reason")
      .in("expert_id", expertIds),
  ]);

  if (reviewsResult.error) {
    throw new AppError("Failed to load expert review stats.", 500, reviewsResult.error.message);
  }

  if (privateFeedbackResult.error) {
    throw new AppError("Failed to load private feedback stats.", 500, privateFeedbackResult.error.message);
  }

  for (const expertId of expertIds) {
    statsMap.set(expertId, {
      completedReviewCount: 0,
      recommendationRate: 1,
      negativeFeedbackCount: 0,
    });
  }

  const reviewAccumulator = new Map();
  for (const row of reviewsResult.data || []) {
    const expertId = row.expert_id;
    if (!expertId) continue;

    const existing = reviewAccumulator.get(expertId) || {
      completedReviewCount: 0,
      recommendYes: 0,
      recommendTotal: 0,
    };

    if (row.review_status === "approved") {
      existing.completedReviewCount += 1;
      if (typeof row.would_recommend === "boolean") {
        existing.recommendTotal += 1;
        if (row.would_recommend) existing.recommendYes += 1;
      }
    }

    reviewAccumulator.set(expertId, existing);
  }

  const feedbackAccumulator = new Map();
  for (const row of privateFeedbackResult.data || []) {
    const expertId = row.expert_id;
    if (!expertId) continue;

    const existing = feedbackAccumulator.get(expertId) || { negativeFeedbackCount: 0 };
    const reasons = Array.isArray(row.feedback_reason) ? row.feedback_reason.map((item) => normalizeText(item)) : [];
    const markedNo = normalizeText(row.match_helpful_rating) === "no";
    const negativeReason = reasons.some((reason) =>
      ["not_relevant", "no_response", "too_expensive", "wrong_location", "different_help_needed"].includes(reason),
    );

    if (markedNo || negativeReason) {
      existing.negativeFeedbackCount += 1;
    }

    feedbackAccumulator.set(expertId, existing);
  }

  for (const expertId of expertIds) {
    const review = reviewAccumulator.get(expertId);
    const feedback = feedbackAccumulator.get(expertId);
    const completedReviewCount = Number(review?.completedReviewCount || 0);
    const recommendationRate =
      Number(review?.recommendTotal || 0) > 0
        ? Number(review.recommendYes || 0) / Number(review.recommendTotal || 1)
        : 1;

    statsMap.set(expertId, {
      completedReviewCount,
      recommendationRate,
      negativeFeedbackCount: Number(feedback?.negativeFeedbackCount || 0),
    });
  }

  return statsMap;
}

async function updateExposureMetrics(recommendations, leadId, requestId) {
  if (!recommendations.length) return;
  const supabase = requireSupabase();
  const nowIso = new Date().toISOString();

  const eventRows = recommendations.map((item) => ({
    expert_id: item.expert.expert_id,
    lead_id: leadId || null,
    match_request_id: requestId,
    slot_label: item.slotLabel || null,
    shown_at: nowIso,
  }));

  await supabase.from("expert_impression_events").insert(eventRows);

  for (const [index, item] of recommendations.entries()) {
    const top3Increment = index < 3 ? 1 : 0;
    const currentImpressions = Number(item.expert.impressions_7d || 0);
    const currentTop3 = Number(item.expert.top3_shown_24h_count || 0);
    await supabase
      .from("experts")
      .update({
        impressions_7d: currentImpressions + 1,
        top3_shown_24h_count: currentTop3 + top3Increment,
        last_shown_timestamp: nowIso,
      })
      .eq("expert_id", item.expert.expert_id);
  }

  await trackMetricEvent("expert_exposure_distribution", {
    lead_id: leadId || null,
    request_id: requestId,
    expert_ids: recommendations.map((item) => item.expert.expert_id),
    top_match_expert_id: recommendations[0]?.expert?.expert_id || null,
  });
}

async function fetchExpertsForRanking(includeHidden = false) {
  const supabase = requireSupabase();
  let query = supabase.from("experts").select("*");
  if (!includeHidden) {
    query = query.neq("matching_visibility", "hidden");
  }
  const { data, error } = await query;

  if (error) {
    throw new AppError("Failed to load experts for ranking.", 500, error.message);
  }

  return data || [];
}

function mapCandidatesForResponse(candidates, config) {
  return candidates.map((candidate, rankIndex) => ({
    rank: rankIndex + 1,
    expertId: candidate.expert.expert_id,
    expert: mapExpertForFrontend(candidate.expert),
    matchScore: candidate.finalScore,
    matchBand: candidate.matchBand,
    slotLabel: candidate.slotLabel,
    badges: candidate.badges,
    availableNow: candidate.breakdown.urgency.score >= readWeight(config, "weight_urgency", DEFAULT_WEIGHTS.urgency) * 0.9,
    explanation: candidate.explanation,
    breakdown: {
      baseScore: candidate.baseScore,
      fairnessBoost: candidate.fairnessBoost,
      performanceScore: candidate.performanceScore,
      priorityBoost: candidate.priorityBoost,
      cooldownAdjustment: candidate.cooldownAdjustment,
      category: candidate.breakdown.category.score,
      urgency: candidate.breakdown.urgency.score,
      budget: candidate.breakdown.budget.score,
      reputation: candidate.breakdown.reputation.score,
      location: candidate.breakdown.location.score,
      budgetFitLabel: candidate.breakdown.budget.label,
      urgencyFitLabel: candidate.breakdown.urgency.label,
      categoryFitLabel: candidate.breakdown.category.label,
      locationFitLabel: candidate.breakdown.location.label,
    },
  }));
}

function mapExpertForFrontend(expert) {
  const tier = normalizeText(expert.tier || (expert.is_featured ? "featured" : expert.is_verified ? "verified" : "registered"));

  return {
    id: expert.expert_id,
    fullName: expert.name,
    role: expert.role || "Expert Advisor",
    organization: expert.organization || "SmartLink Expert Network",
    yearsExperience: Number(expert.years_experience || 5),
    specialties: expert.category_tags || [],
    rating: Number(expert.rating || 4.5),
    hourlyRateUsd: Number(expert.hourly_rate_usd || 150),
    nextAvailableAt: expert.next_available_at || new Date().toISOString(),
    visibilityLevel: tier === "featured" ? "priority" : tier === "verified" ? "featured" : "basic",
    matchingVisibility: expert.matching_visibility === "priority-only" ? "priority-only" : "visible",
    rankingWeightBoost: 0,
    subscriptionTier: tier === "featured" ? "featured" : tier === "verified" ? "premium" : "basic",
  };
}

async function recommendExperts(input) {
  const config = await getActiveRankingConfig();
  const activeOverride = await findActiveMatchOverride(input.leadId, input.assessmentId);
  const includeHiddenExperts = Boolean(activeOverride?.allow_hidden_experts);
  const experts = await fetchExpertsForRanking(includeHiddenExperts);
  const selectedCategory = input.selectedCategory || input.highestRiskCategory || input.primaryIssue;

  if (!selectedCategory) {
    throw new AppError("selectedCategory (or highestRiskCategory) is required for ranking.", 400);
  }

  if (!input.location) {
    throw new AppError("location is required for ranking.", 400);
  }

  const avgImpressions =
    experts.length > 0
      ? experts.reduce((sum, expert) => sum + Number(expert.impressions_7d || 0), 0) / experts.length
      : 0;

  const feedbackStatsMap = await fetchExpertFeedbackStats(experts.map((expert) => expert.expert_id).filter(Boolean));

  const sortComparator = buildFinalSortComparator(input.urgencyPreference);
  const cooldownThreshold = Number(config.cooldown_threshold || 5);

  const candidates = experts
    .map((expert) => {
      const expertId = expert.expert_id;
      const isLockedInOverride = Boolean(activeOverride?.ordered_expert_ids?.includes(expertId));
      if (expert.matching_visibility === "hidden" && !(activeOverride?.allow_hidden_experts && isLockedInOverride)) {
        return null;
      }

      const category = getCategoryScore(expert, selectedCategory, config);
      const urgency = getUrgencyScore(expert, input.urgencyPreference, config);
      const budget = getBudgetScore(expert, input.budgetPreference, config);
      const reputation = getReputationScore(expert, config);
      const location = getLocationScore(expert, input.location, config);
      const baseScore = category.score + urgency.score + budget.score + reputation.score + location.score;

      const minimumBaseScore = Number(config.minimum_base_match_score || 70);
      if (baseScore < minimumBaseScore && !isLockedInOverride) {
        return null;
      }

      const fairnessBoost = getFairnessBoost(expert, avgImpressions, config);
      const feedbackStats = feedbackStatsMap.get(expert.expert_id) || {};
      const performanceScore = getPerformanceScore(expert, feedbackStats);
      const priorityBoost = getPriorityBoost(expert, config);
      const cooldownAdjustment = getCooldownAdjustment(expert, avgImpressions, config);
      const finalScore = clamp(baseScore + fairnessBoost + performanceScore + priorityBoost + cooldownAdjustment, 0, 100);

      const breakdown = { category, urgency, budget, reputation, location };
      return {
        expert,
        baseScore,
        fairnessBoost,
        performanceScore,
        priorityBoost,
        cooldownAdjustment,
        finalScore,
        matchBand: toMatchBand(finalScore),
        slotLabel: null,
        badges: [],
        breakdown,
        explanation: buildMatchExplanation(selectedCategory, input, breakdown),
      };
    })
    .filter(Boolean)
    .sort(sortComparator);

  if (activeOverride && Array.isArray(activeOverride.ordered_expert_ids) && activeOverride.ordered_expert_ids.length > 0) {
    const candidateById = new Map(candidates.map((candidate) => [candidate.expert.expert_id, candidate]));
    const orderedCandidates = activeOverride.ordered_expert_ids.map((expertId) => candidateById.get(expertId)).filter(Boolean);
    if (orderedCandidates.length > 0) {
      const limit = Number(config.number_of_experts_displayed || 5);
      const withBadges = orderedCandidates.slice(0, limit).map((candidate) => ({
        ...candidate,
        badges: badgesForCandidate(candidate),
      }));
      const slotted = ensureRecommendationSlots(withBadges);
      await updateExposureMetrics(slotted, input.leadId, input.matchRequestId || `req_${Date.now()}`);
      return mapCandidatesForResponse(slotted, config);
    }
  }

  const rotated = applyTopThreeCooldown(candidates, cooldownThreshold);
  const limited = rotated.slice(0, Number(config.number_of_experts_displayed || 5));

  const withBadges = limited.map((candidate) => ({
    ...candidate,
    badges: badgesForCandidate(candidate),
  }));

  const slotted = ensureRecommendationSlots(withBadges);
  await updateExposureMetrics(slotted, input.leadId, input.matchRequestId || `req_${Date.now()}`);

  return mapCandidatesForResponse(slotted, config);
}

module.exports = {
  recommendExperts,
};
