const { AppError } = require("../utils/app-error");
const { hashReviewToken } = require("../utils/review-token");
const { requireSupabase } = require("../utils/supabase-guard");
const { trackMetricEvent } = require("./metrics.service");

async function createPublicReview(payload) {
  const supabase = requireSupabase();
  const tokenHash = hashReviewToken(payload.token);
  const { data: tokenRow, error: tokenError } = await supabase
    .from("review_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError) {
    throw new AppError("Failed to verify review token.", 500, tokenError.message);
  }
  if (!tokenRow) {
    throw new AppError("Invalid review token.", 400);
  }
  if (tokenRow.used_at) {
    throw new AppError("This review token has already been used.", 400);
  }
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    throw new AppError("This review token has expired.", 400);
  }

  const insertRow = {
    lead_id: tokenRow.lead_id,
    expert_id: tokenRow.expert_id,
    user_id: payload.userId || null,
    match_helpful_rating: payload.matchHelpfulRating || null,
    feedback_reason: payload.feedbackReason || [],
    public_star_rating: payload.publicStarRating,
    public_review_comment: payload.publicReviewComment || null,
    would_recommend: payload.wouldRecommend ?? null,
    expert_response_rating: payload.expertResponseRating || null,
    review_status: "pending",
  };

  const { data, error } = await supabase
    .from("expert_reviews")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to create review.", 500, error.message);
  }

  await supabase
    .from("review_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  await trackMetricEvent("lead_to_connection_rate", {
    lead_id: tokenRow.lead_id,
    expert_id: tokenRow.expert_id,
    review_submitted: true,
  });

  return data;
}

async function moderateReview(reviewId, reviewStatus) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expert_reviews")
    .update({ review_status: reviewStatus })
    .eq("feedback_id", reviewId)
    .select("*")
    .single();
  if (error) {
    throw new AppError("Failed to moderate review.", 500, error.message);
  }
  return data;
}

async function respondToReview(reviewId, expertResponseComment) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expert_reviews")
    .update({ expert_response_comment: expertResponseComment })
    .eq("feedback_id", reviewId)
    .select("*")
    .single();
  if (error) {
    throw new AppError("Failed to save expert response.", 500, error.message);
  }
  return data;
}

module.exports = {
  createPublicReview,
  moderateReview,
  respondToReview,
};
