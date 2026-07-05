const { AppError } = require("../utils/app-error");
const { requireSupabase } = require("../utils/supabase-guard");

function pickTags(currentTags, approvedTags) {
  const normalizedApproved = new Set((approvedTags || []).map((tag) => String(tag).trim()));
  const filteredCurrent = (currentTags || []).map((tag) => String(tag).trim()).filter(Boolean);

  if (normalizedApproved.size === 0) {
    return filteredCurrent.slice(0, 6);
  }

  const selected = filteredCurrent.filter((tag) => normalizedApproved.has(tag));
  if (selected.length > 0) {
    return selected.slice(0, 6);
  }

  return Array.from(normalizedApproved).slice(0, 6);
}

function buildSuggestionText(expert, voice) {
  const firstCategory = (expert.category_tags || ["General Support"])[0];
  const toneLine =
    voice === "friendly"
      ? "Approachable and practical guidance with clear next steps."
      : voice === "direct"
        ? "Direct, execution-focused support to solve the issue quickly."
        : "Structured support with measurable outcomes and clear delivery.";

  return {
    headline: `${expert.name} | ${firstCategory} Specialist`,
    serviceDescription: `I help clients solve ${firstCategory.toLowerCase()} challenges with fast, practical implementation and clear communication.`,
    shortBio: `${expert.name} supports clients across The Bahamas with focused expertise and reliable follow-through.`,
    whyChooseMe: toneLine,
  };
}

async function optimizeExpertProfileDraft(expertId, options) {
  const supabase = requireSupabase();
  const { data: expert, error: expertError } = await supabase
    .from("experts")
    .select("*")
    .eq("expert_id", expertId)
    .single();

  if (expertError || !expert) {
    throw new AppError("Expert not found.", 404, expertError?.message);
  }

  const copy = buildSuggestionText(expert, options.voice);
  const suggestedCategoryTags = pickTags(expert.category_tags || [], options.approvedCategoryTags);
  const suggestedServiceTags = pickTags(expert.service_tags || [], options.approvedServiceTags);

  const suggestion = {
    expert_id: expertId,
    suggested_headline: copy.headline,
    suggested_service_description: copy.serviceDescription,
    suggested_category_tags: suggestedCategoryTags,
    suggested_service_tags: suggestedServiceTags,
    suggested_short_bio: copy.shortBio,
    suggested_why_choose_me: copy.whyChooseMe,
    status: "draft",
    generated_at: new Date().toISOString(),
  };

  const { data: draft, error: draftError } = await supabase
    .from("expert_profile_optimizer_drafts")
    .insert(suggestion)
    .select("*")
    .single();

  if (draftError) {
    throw new AppError(
      "Failed to save AI profile suggestions. Ensure expert_profile_optimizer_drafts exists in Supabase.",
      500,
      draftError.message,
    );
  }

  return {
    expertId,
    status: "draft",
    draft,
  };
}

module.exports = {
  optimizeExpertProfileDraft,
};
