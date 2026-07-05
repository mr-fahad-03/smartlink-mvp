const { AppError } = require("../utils/app-error");
const { createRawToken, hashReviewToken } = require("../utils/review-token");
const { requireSupabase } = require("../utils/supabase-guard");
const { findLeadByAssessmentId } = require("./lead.service");
const { trackMetricEvent } = require("./metrics.service");

async function createIntroductionRequests(payload) {
  const supabase = requireSupabase();
  let leadId = payload.leadId;
  if (!leadId && payload.assessmentId) {
    const lead = await findLeadByAssessmentId(payload.assessmentId);
    leadId = lead?.id;
  }
  if (!leadId) {
    throw new AppError("leadId or resolvable assessmentId is required to create introduction requests.", 400);
  }

  const requestedExpertIds = Array.from(
    new Set((payload.requests || []).map((request) => request.expertId).filter(Boolean)),
  );
  if (requestedExpertIds.length === 0) {
    throw new AppError("At least one expertId is required to create introduction requests.", 400);
  }

  const { data: existingExperts, error: expertsError } = await supabase
    .from("experts")
    .select("expert_id")
    .in("expert_id", requestedExpertIds);
  if (expertsError) {
    throw new AppError("Failed to validate experts for introduction requests.", 500, expertsError.message);
  }
  const existingExpertIds = new Set((existingExperts || []).map((item) => item.expert_id));
  const missingExpertIds = requestedExpertIds.filter((id) => !existingExpertIds.has(id));
  if (missingExpertIds.length > 0) {
    throw new AppError(
      `Unknown expertId(s): ${missingExpertIds.join(", ")}. Seed experts table before requesting introductions.`,
      400,
    );
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString();

  const rows = payload.requests.map((request) => ({
    lead_id: leadId,
    assessment_id: payload.assessmentId || null,
    expert_id: request.expertId,
    expert_name: request.expertName,
    lead_name: payload.leadName,
    lead_email: payload.leadEmail,
    lead_phone: payload.leadPhone || null,
    service_ids: request.serviceIds || [],
    service_names: request.serviceNames || [],
    category: request.category || null,
    urgency_level: request.urgencyLevel || null,
    budget_preference: request.budgetPreference || null,
    billable: Boolean(request.billable),
    lead_tier: request.leadTier || null,
    expert_tier: request.expertTier || null,
    status: "submitted",
    created_at: nowIso,
  }));

  const { data, error } = await supabase
    .from("introduction_requests")
    .insert(rows)
    .select("*");

  if (error) {
    throw new AppError("Failed to create introduction requests.", 500, error.message);
  }

  const tokenOutputs = [];
  for (const row of data || []) {
    const rawToken = createRawToken();
    const tokenHash = hashReviewToken(rawToken);
    const { error: tokenError } = await supabase
      .from("review_tokens")
      .insert({
        lead_id: leadId,
        expert_id: row.expert_id,
        introduction_request_id: row.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });
    if (tokenError) {
      throw new AppError("Failed to create review token.", 500, tokenError.message);
    }
    tokenOutputs.push({
      expertId: row.expert_id,
      reviewToken: rawToken,
      expiresAt,
    });
  }

  await trackMetricEvent("request_intro_click_rate", {
    lead_id: leadId,
    request_count: (data || []).length,
  });
  await trackMetricEvent("featured_expert_conversion_rate", {
    lead_id: leadId,
    featured_request_count: (data || []).filter((row) => row.expert_tier === "featured").length,
    total_request_count: (data || []).length,
  });

  return {
    leadId,
    requests: data || [],
    reviewTokens: tokenOutputs,
  };
}

module.exports = {
  createIntroductionRequests,
};
