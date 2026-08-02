const { AppError } = require("../utils/app-error");
const { requireSupabase } = require("../utils/supabase-guard");
const { deriveLeadQualityAndPrice } = require("./lead-qualification.service");
const { trackMetricEvent } = require("./metrics.service");

async function createLeadSubmission(leadData) {
  const supabase = requireSupabase();
  
  if (leadData.assessmentId) {
    const existing = await findLeadByAssessmentId(leadData.assessmentId);
    if (existing) {
      return existing;
    }
  }

  const qualification = deriveLeadQualityAndPrice(leadData);

  const payload = {
    full_name: leadData.fullName,
    work_email: leadData.workEmail,
    phone_number: leadData.phoneNumber || null,
    audience_segment: leadData.audienceSegment || null,
    company_name: leadData.companyName || null,
    role: leadData.role || null,
    business_type: leadData.businessType || null,
    location: leadData.location,
    location_scope: leadData.locationScope || null,
    island: leadData.island || null,
    website: leadData.website || null,
    team_size: leadData.teamSize || null,
    budget_preference: leadData.budgetPreference || null,
    urgency_preference: leadData.urgencyPreference || null,
    prior_consulting_experience: leadData.priorConsultingExperience || null,
    lead_tier: leadData.leadTier || "standard",
    assessment_id: leadData.assessmentId || null,
    normalized_score: leadData.normalizedScore ?? null,
    highest_risk_category: leadData.highestRiskCategory || null,
    selected_category: leadData.selectedCategory || leadData.highestRiskCategory || null,
    primary_issue: leadData.primaryIssue || leadData.highestRiskCategory || null,
    preferred_support_type: leadData.preferredSupportType || null,
    intent_type: qualification.intentType,
    lead_quality_tag: qualification.leadQualityTag,
    lead_price_usd: qualification.leadPriceUsd,
    pricing_band: qualification.pricingBand,
    source: leadData.source || "web",
    metadata: leadData.metadata || {},
  };

  const { data, error } = await supabase
    .from("lead_submissions")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to create lead submission.", 500, error.message);
  }

  await trackMetricEvent("quiz_completion_rate", {
    lead_id: data.id,
    selected_category: payload.selected_category,
    lead_quality_tag: payload.lead_quality_tag,
  });

  return {
    ...data,
    lead_quality_tag: data.lead_quality_tag ?? qualification.leadQualityTag,
    lead_price_usd: data.lead_price_usd ?? qualification.leadPriceUsd,
    intent_type: data.intent_type ?? qualification.intentType,
    pricing_band: data.pricing_band ?? qualification.pricingBand,
  };
}

async function findLeadByAssessmentId(assessmentId) {
  if (!assessmentId) return null;
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("lead_submissions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to query lead by assessment.", 500, error.message);
  }
  return data;
}

module.exports = {
  createLeadSubmission,
  findLeadByAssessmentId,
};
