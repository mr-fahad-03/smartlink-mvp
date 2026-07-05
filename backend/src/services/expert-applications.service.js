const { AppError } = require("../utils/app-error");
const { requireSupabase } = require("../utils/supabase-guard");

function normalizeText(value) {
  return String(value || "").trim();
}

function toSlug(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function mapAvailabilityStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized.includes("available")) return "available_now";
  if (normalized.includes("week")) return "within_48h";
  return "limited";
}

function parseServiceTags(value) {
  return normalizeText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function buildExpertId(fullName, userId) {
  const slug = toSlug(fullName) || "applicant";
  return `exp_${slug}_${String(userId).slice(0, 8)}`;
}

async function resolveOrCreateExpertForUser(supabase, me, payload) {
  const { data: link, error: linkError } = await supabase
    .from("expert_user_links")
    .select("expert_id")
    .eq("user_id", me.userId)
    .maybeSingle();

  if (linkError) {
    throw new AppError("Failed to resolve expert profile link.", 500, linkError.message);
  }

  const expertId = link?.expert_id || buildExpertId(payload.fullName, me.userId);
  const nowIso = new Date().toISOString();

  const expertProfile = {
    expert_id: expertId,
    name: payload.fullName,
    role: payload.professionalTitle,
    organization: payload.businessName || null,
    category_tags: [payload.mainSpecialization].filter(Boolean),
    service_tags: parseServiceTags(payload.preferredWorkTypes),
    location: payload.primaryLocation,
    availability_status: mapAvailabilityStatus(payload.availabilityStatus),
    hourly_rate_usd: toPositiveNumber(payload.hourlyRate, 150),
    matching_visibility: "hidden",
    metadata: {
      ...(payload.metadata || {}),
      application_snapshot: payload,
      application_submitted_at: nowIso,
      application_submitted_by_user_id: me.userId,
    },
  };

  const { error: upsertExpertError } = await supabase
    .from("experts")
    .upsert(expertProfile, { onConflict: "expert_id" });

  if (upsertExpertError) {
    throw new AppError("Failed to save expert profile for application.", 500, upsertExpertError.message);
  }

  if (!link) {
    const { error: linkInsertError } = await supabase
      .from("expert_user_links")
      .insert({
        expert_id: expertId,
        user_id: me.userId,
        status: "linked",
      });

    if (linkInsertError) {
      throw new AppError("Failed to link expert profile to user.", 500, linkInsertError.message);
    }
  }

  return expertId;
}

async function submitExpertApplication(me, payload) {
  const supabase = requireSupabase();
  const expertId = await resolveOrCreateExpertForUser(supabase, me, payload);

  const nowIso = new Date().toISOString();
  const applicationRow = {
    expert_id: expertId,
    status: "under_review",
    submitted_by_user_id: me.userId,
    reviewed_by_user_id: null,
    approved_by_user_id: null,
    rejected_by_user_id: null,
    recommendation: null,
    requested_info_notes: null,
    review_notes: null,
    approved_at: null,
    rejected_at: null,
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("expert_applications")
    .upsert(applicationRow, { onConflict: "expert_id" })
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to submit expert application.", 500, error.message);
  }

  return data;
}

async function getMyExpertApplication(me) {
  const supabase = requireSupabase();

  const { data: link, error: linkError } = await supabase
    .from("expert_user_links")
    .select("expert_id")
    .eq("user_id", me.userId)
    .maybeSingle();

  if (linkError) {
    throw new AppError("Failed to resolve expert profile link.", 500, linkError.message);
  }

  if (!link?.expert_id) {
    return null;
  }

  const expertId = link.expert_id;

  const { data: application, error: applicationError } = await supabase
    .from("expert_applications")
    .select("*")
    .eq("expert_id", expertId)
    .maybeSingle();

  if (applicationError) {
    throw new AppError("Failed to load your expert application.", 500, applicationError.message);
  }

  const { data: expert, error: expertError } = await supabase
    .from("experts")
    .select("expert_id, name, role, organization, location, availability_status, hourly_rate_usd, category_tags, service_tags, metadata")
    .eq("expert_id", expertId)
    .maybeSingle();

  if (expertError) {
    throw new AppError("Failed to load your expert profile.", 500, expertError.message);
  }

  if (!application) {
    return {
      application: null,
      expert: expert || null,
    };
  }

  return {
    application: {
      ...application,
      expert_name: expert?.name || null,
      expert_role: expert?.role || null,
      expert_organization: expert?.organization || null,
      expert_location: expert?.location || null,
      expert_availability_status: expert?.availability_status || null,
      expert_hourly_rate_usd: expert?.hourly_rate_usd || null,
      expert_category_tags: expert?.category_tags || [],
      expert_service_tags: expert?.service_tags || [],
      expert_profile_metadata: expert?.metadata || {},
    },
    expert: expert || null,
  };
}

module.exports = {
  submitExpertApplication,
  getMyExpertApplication,
};
