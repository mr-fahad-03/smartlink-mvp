const { AppError } = require("../utils/app-error");
const { requireSupabase } = require("../utils/supabase-guard");
const { findLeadByAssessmentId } = require("./lead.service");

async function createPrivateFeedback(payload) {
  const supabase = requireSupabase();
  let leadId = payload.leadId;

  if (!leadId && payload.assessmentId) {
    const lead = await findLeadByAssessmentId(payload.assessmentId);
    leadId = lead?.id;
  }

  if (!leadId) {
    throw new AppError("leadId or resolvable assessmentId is required.", 400);
  }

  const row = {
    lead_id: leadId,
    assessment_id: payload.assessmentId || null,
    expert_id: payload.expertId || null,
    match_helpful_rating: payload.matchHelpfulRating,
    feedback_reason: payload.feedbackReason || [],
    feedback_text: payload.feedbackText || null,
  };

  const { data, error } = await supabase
    .from("private_match_feedback")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to save private match feedback.", 500, error.message);
  }

  return data;
}

module.exports = {
  createPrivateFeedback,
};
