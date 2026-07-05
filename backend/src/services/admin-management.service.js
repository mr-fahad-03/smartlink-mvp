const { AppError } = require("../utils/app-error");
const { requireSupabase } = require("../utils/supabase-guard");
const { appendAdminAuditLog, listAuditLogs } = require("./admin-audit.service");
const { isHighValueLead } = require("./admin-rbac.service");
const { normalizeEmail, passwordPolicyCheck, throwWeakPassword } = require("../utils/security");
const { savePasswordHistory, deleteOldPasswordHistory } = require("./auth.service");

const DEFAULT_PLATFORM_SETTINGS = {
  lead_price_low: 8,
  lead_price_medium: 20,
  lead_price_high: 45,
  pricing_band_low: "$5-$10",
  pricing_band_medium: "$15-$25",
  pricing_band_high: "$30-$75",
  high_value_criteria: {
    requireUrgent: true,
    requireBudget: true,
    requireIntent: true,
    budgetLevels: ["medium", "high"],
    intentTypes: ["do_it_for_me"],
  },
};

const FAIRNESS_STRENGTH_MAP = {
  low: 10,
  medium: 15,
  high: 20,
};

const ROTATION_THRESHOLD_MAP = {
  aggressive: 3,
  balanced: 5,
  minimal: 8,
};

function toSafeLimit(value, fallback = 20, min = 1, max = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(Math.floor(parsed), max));
}

function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sanitizeSearchTerm(value) {
  return String(value || "").replace(/[,()]/g, " ").trim();
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function mapBudgetPreferenceToLevel(value) {
  const normalized = normalizeText(value);
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium")) return "medium";
  if (normalized.includes("low")) return "low";
  if (normalized.includes("free") || normalized.includes("exploring")) return "exploring";
  return "unknown";
}

function isUrgencyHigh(value) {
  const normalized = normalizeText(value);
  return normalized.includes("right now") || normalized.includes("urgent");
}

function resolveHighValueCriteria(settings) {
  const criteria = settings?.high_value_criteria || {};
  return {
    requireUrgent: criteria.requireUrgent !== false,
    requireBudget: criteria.requireBudget !== false,
    requireIntent: criteria.requireIntent !== false,
    budgetLevels: Array.isArray(criteria.budgetLevels) && criteria.budgetLevels.length > 0 ? criteria.budgetLevels : ["medium", "high"],
    intentTypes: Array.isArray(criteria.intentTypes) && criteria.intentTypes.length > 0 ? criteria.intentTypes : ["do_it_for_me"],
  };
}

function evaluateHighValueLeadFromCriteria(leadRow, criteria) {
  const urgentMatch = isUrgencyHigh(leadRow?.urgency_preference);
  const budgetLevel = mapBudgetPreferenceToLevel(leadRow?.budget_preference);
  const budgetMatch = criteria.budgetLevels.includes(budgetLevel);
  const intentMatch = criteria.intentTypes.includes(normalizeText(leadRow?.intent_type));

  return (
    (!criteria.requireUrgent || urgentMatch) &&
    (!criteria.requireBudget || budgetMatch) &&
    (!criteria.requireIntent || intentMatch)
  );
}

function getFairnessStrengthFromConfig(config) {
  const strength = normalizeText(config?.exposure_boost_strength);
  if (strength in FAIRNESS_STRENGTH_MAP) return strength;
  const maxBoost = Number(config?.fairness_boost_max || 20);
  if (maxBoost <= 11) return "low";
  if (maxBoost <= 16) return "medium";
  return "high";
}

function getRotationFromConfig(config) {
  const rotation = normalizeText(config?.rotation_frequency);
  if (rotation in ROTATION_THRESHOLD_MAP) return rotation;
  const threshold = Number(config?.cooldown_threshold || 5);
  if (threshold <= 3) return "aggressive";
  if (threshold >= 8) return "minimal";
  return "balanced";
}

async function getAdminMe(actor) {
  return {
    userId: actor.userId,
    email: actor.email,
    role: actor.role,
    roles: actor.roles,
    permissions: actor.permissions,
  };
}

async function listAdminRoles() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("admin_user_roles")
    .select("id, user_id, role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) {
    throw new AppError("Failed to load admin roles.", 500, error.message);
  }
  const rows = data || [];
  if (rows.length === 0) return rows;

  const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 500 });
  if (authUsersError) {
    throw new AppError("Failed to resolve admin role users.", 500, authUsersError.message);
  }

  const usersById = (authUsers?.users || []).reduce((acc, user) => {
    acc[user.id] = {
      email: user.email || null,
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    };
    return acc;
  }, {});

  return rows.map((row) => ({
    ...row,
    user_email: usersById[row.user_id]?.email || null,
    user_name: usersById[row.user_id]?.name || null,
  }));
}

async function assignAdminRole(req, actor, payload) {
  const supabase = requireSupabase();
  const { data: existing, error: existingError } = await supabase
    .from("admin_user_roles")
    .select("*")
    .eq("user_id", payload.userId)
    .eq("role", payload.role)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new AppError("Failed to check existing role assignment.", 500, existingError.message);
  }

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("admin_user_roles")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) {
      throw new AppError("Failed to reactivate admin role.", 500, error.message);
    }
    result = data;
  } else {
    const { data, error } = await supabase
      .from("admin_user_roles")
      .insert({ user_id: payload.userId, role: payload.role, is_active: true })
      .select("*")
      .single();
    if (error) {
      throw new AppError("Failed to assign admin role.", 500, error.message);
    }
    result = data;
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "role_assign",
    targetType: "admin_user_role",
    targetId: `${payload.userId}:${payload.role}`,
    previousValue: existing || null,
    newValue: result,
    notes: payload.notes || null,
  });

  return result;
}

async function createAdminUser(req, actor, payload) {
  const supabase = requireSupabase();
  const policy = passwordPolicyCheck(payload.password);
  if (!policy.valid) {
    throwWeakPassword(policy);
  }

  const normalizedEmail = normalizeEmail(payload.email);
  const createPayload = {
    email: normalizedEmail,
    password: payload.password,
    email_confirm: true,
    user_metadata: payload.fullName ? { full_name: payload.fullName } : undefined,
  };

  const { data: created, error: createError } = await supabase.auth.admin.createUser(createPayload);
  if (createError || !created?.user?.id) {
    const rawMessage = createError?.message || "No user id returned.";
    const lowerMessage = String(rawMessage).toLowerCase();
    const statusCode = lowerMessage.includes("already") || lowerMessage.includes("exists") ? 409 : 500;
    throw new AppError("Failed to create admin user.", statusCode, rawMessage);
  }

  const rolePayload = {
    userId: created.user.id,
    role: payload.role || "admin",
    notes: payload.notes || "Assigned during user creation.",
  };
  const roleRow = await assignAdminRole(req, actor, rolePayload);

  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: created.user.id,
        email: normalizedEmail,
        role: payload.role || "admin",
        status: "active",
        email_verified: true,
        full_name: payload.fullName || null,
        last_login_at: null,
      },
      { onConflict: "user_id" },
    );

  if (profileError) {
    throw new AppError("Failed to create admin profile.", 500, profileError.message);
  }

  await savePasswordHistory(created.user.id, payload.password);
  await deleteOldPasswordHistory(created.user.id);

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "admin_user_create",
    targetType: "admin_user",
    targetId: created.user.id,
    previousValue: null,
    newValue: {
      id: created.user.id,
      email: created.user.email || payload.email,
      role: roleRow.role,
      is_active: roleRow.is_active,
    },
    notes: payload.notes || null,
  });

  return {
    id: created.user.id,
    email: created.user.email || normalizedEmail,
    role: roleRow.role,
    is_active: roleRow.is_active,
  };
}

async function revokeAdminRole(req, actor, payload) {
  const supabase = requireSupabase();
  const { data: existing, error: existingError } = await supabase
    .from("admin_user_roles")
    .select("*")
    .eq("user_id", payload.userId)
    .eq("role", payload.role)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new AppError("Failed to check existing role assignment.", 500, existingError.message);
  }

  if (!existing) {
    throw new AppError("Role assignment was not active.", 404);
  }

  const { data, error } = await supabase
    .from("admin_user_roles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to revoke admin role.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "role_revoke",
    targetType: "admin_user_role",
    targetId: `${payload.userId}:${payload.role}`,
    previousValue: existing,
    newValue: data,
    notes: payload.notes || null,
  });

  return data;
}

async function listExpertApplications() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expert_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Failed to load expert applications.", 500, error.message);
  }

  const rows = data || [];
  if (rows.length === 0) return rows;

  const expertIds = rows.map((row) => row.expert_id);
  const { data: experts, error: expertError } = await supabase
    .from("experts")
    .select("expert_id, name, role, organization, location, availability_status, hourly_rate_usd, category_tags, service_tags, metadata")
    .in("expert_id", expertIds);

  if (expertError) {
    throw new AppError("Failed to load expert names for applications.", 500, expertError.message);
  }

  const expertMap = (experts || []).reduce((acc, row) => {
    acc[row.expert_id] = row;
    return acc;
  }, {});

  return rows.map((row) => ({
    ...row,
    expert_name: expertMap[row.expert_id]?.name || null,
    expert_role: expertMap[row.expert_id]?.role || null,
    expert_organization: expertMap[row.expert_id]?.organization || null,
    expert_location: expertMap[row.expert_id]?.location || null,
    expert_availability_status: expertMap[row.expert_id]?.availability_status || null,
    expert_hourly_rate_usd: expertMap[row.expert_id]?.hourly_rate_usd || null,
    expert_category_tags: expertMap[row.expert_id]?.category_tags || [],
    expert_service_tags: expertMap[row.expert_id]?.service_tags || [],
    expert_profile_metadata: expertMap[row.expert_id]?.metadata || {},
  }));
}

async function mutateExpertApplication(req, actor, applicationId, action, notes) {
  const supabase = requireSupabase();
  const { data: existing, error: existingError } = await supabase
    .from("expert_applications")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existingError) {
    throw new AppError("Failed to load expert application.", 500, existingError.message);
  }
  if (!existing) {
    throw new AppError("Expert application not found.", 404);
  }

  const nowIso = new Date().toISOString();
  const update = {
    updated_at: nowIso,
    review_notes: notes || existing.review_notes || null,
  };

  if (action === "request_info") {
    update.status = "needs_info";
    update.requested_info_notes = notes || existing.requested_info_notes || null;
    update.reviewed_by_user_id = actor.userId;
  } else if (action === "recommend") {
    update.status = "flagged";
    update.recommendation = notes || "recommended_for_admin_review";
    update.reviewed_by_user_id = actor.userId;
  } else if (action === "approve") {
    update.status = "approved";
    update.approved_by_user_id = actor.userId;
    update.approved_at = nowIso;

    await supabase
      .from("experts")
      .update({ matching_visibility: "visible" })
      .eq("expert_id", existing.expert_id);
  } else if (action === "reject") {
    update.status = "rejected";
    update.rejected_by_user_id = actor.userId;
    update.rejected_at = nowIso;
  } else if (action === "flag") {
    update.status = "flagged";
    update.reviewed_by_user_id = actor.userId;
  } else {
    throw new AppError("Unsupported expert application action.", 400);
  }

  const { data, error } = await supabase
    .from("expert_applications")
    .update(update)
    .eq("application_id", applicationId)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to update expert application.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: `expert_application_${action}`,
    targetType: "expert_application",
    targetId: applicationId,
    previousValue: existing,
    newValue: data,
    notes: notes || null,
  });

  return data;
}

async function updateExpertState(req, actor, expertId, state, notes) {
  const supabase = requireSupabase();
  const { data: existing, error: existingError } = await supabase
    .from("experts")
    .select("expert_id, matching_visibility, metadata")
    .eq("expert_id", expertId)
    .maybeSingle();

  if (existingError) {
    throw new AppError("Failed to load expert.", 500, existingError.message);
  }
  if (!existing) {
    throw new AppError("Expert not found.", 404);
  }

  const nextVisibility = state === "resume" ? "visible" : "hidden";
  const metadata = {
    ...(existing.metadata || {}),
    admin_state: state,
    admin_state_notes: notes || null,
    admin_state_updated_at: new Date().toISOString(),
    admin_state_updated_by: actor.userId,
  };

  const { data, error } = await supabase
    .from("experts")
    .update({ matching_visibility: nextVisibility, metadata })
    .eq("expert_id", expertId)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to update expert state.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: `expert_state_${state}`,
    targetType: "expert",
    targetId: expertId,
    previousValue: existing,
    newValue: { matching_visibility: data.matching_visibility, metadata: data.metadata },
    notes: notes || null,
  });

  return data;
}

async function assignLeadManually(req, actor, payload) {
  const supabase = requireSupabase();
  const { data: lead, error: leadError } = await supabase
    .from("lead_submissions")
    .select("id, lead_quality_tag, lead_tier, urgency_preference, budget_preference, intent_type")
    .eq("id", payload.leadId)
    .maybeSingle();

  if (leadError) {
    throw new AppError("Failed to load lead.", 500, leadError.message);
  }
  if (!lead) {
    throw new AppError("Lead not found.", 404);
  }

  const { data: expert, error: expertError } = await supabase
    .from("experts")
    .select("expert_id, name, tier")
    .eq("expert_id", payload.expertId)
    .maybeSingle();

  if (expertError) {
    throw new AppError("Failed to load expert.", 500, expertError.message);
  }
  if (!expert) {
    throw new AppError("Expert not found.", 404);
  }

  const platformSettings = await getPlatformSettings();
  const highValue = evaluateHighValueLeadFromCriteria(lead, platformSettings.high_value_criteria) || isHighValueLead(lead);
  if (highValue && actor.role === "moderator") {
    throw new AppError("Moderators cannot assign high-value leads.", 403);
  }

  const row = {
    lead_id: payload.leadId,
    expert_id: payload.expertId,
    assigned_by_user_id: actor.userId,
    assigned_by_role: actor.role,
    assignment_reason: payload.assignmentReason,
    is_high_value_lead: highValue,
    notes: payload.notes || null,
  };

  const { data, error } = await supabase
    .from("lead_assignments")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to create lead assignment.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "lead_manual_assign",
    targetType: "lead",
    targetId: payload.leadId,
    previousValue: null,
    newValue: data,
    notes: payload.notes || payload.assignmentReason || null,
  });

  return data;
}

async function listLeadAssignments(limit = 200) {
  const supabase = requireSupabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const { data, error } = await supabase
    .from("lead_assignments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new AppError("Failed to load lead assignments.", 500, error.message);
  }

  const rows = data || [];
  if (rows.length === 0) return rows;

  const leadIds = [...new Set(rows.map((row) => row.lead_id).filter(Boolean))];
  const expertIds = [...new Set(rows.map((row) => row.expert_id).filter(Boolean))];

  const [leadQuery, expertQuery] = await Promise.all([
    leadIds.length
      ? supabase.from("lead_submissions").select("id, full_name, work_email").in("id", leadIds)
      : Promise.resolve({ data: [], error: null }),
    expertIds.length
      ? supabase.from("experts").select("expert_id, name").in("expert_id", expertIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (leadQuery.error) {
    throw new AppError("Failed to load lead labels.", 500, leadQuery.error.message);
  }
  if (expertQuery.error) {
    throw new AppError("Failed to load expert labels.", 500, expertQuery.error.message);
  }

  const leadMap = (leadQuery.data || []).reduce((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});
  const expertMap = (expertQuery.data || []).reduce((acc, row) => {
    acc[row.expert_id] = row;
    return acc;
  }, {});

  return rows.map((row) => ({
    ...row,
    lead_label: leadMap[row.lead_id]?.full_name || leadMap[row.lead_id]?.work_email || null,
    expert_label: expertMap[row.expert_id]?.name || null,
  }));
}

async function listLeadEscalations(limit = 40) {
  const supabase = requireSupabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 200));
  const platformSettings = await getPlatformSettings();
  const criteria = platformSettings.high_value_criteria;

  const { data, error } = await supabase
    .from("lead_submissions")
    .select(
      "id, full_name, work_email, selected_category, primary_issue, urgency_preference, budget_preference, intent_type, lead_quality_tag, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    throw new AppError("Failed to load leads for escalation panel.", 500, error.message);
  }

  const leads = data || [];
  if (leads.length === 0) return [];

  const leadIds = leads.map((row) => row.id);
  const { data: assignments, error: assignError } = await supabase
    .from("lead_assignments")
    .select("lead_id")
    .in("lead_id", leadIds);

  if (assignError) {
    throw new AppError("Failed to load lead assignments for escalation panel.", 500, assignError.message);
  }

  const assignedLeadIds = new Set((assignments || []).map((row) => row.lead_id));
  return leads
    .filter((lead) => !assignedLeadIds.has(lead.id))
    .map((lead) => {
      const highValueByCriteria = evaluateHighValueLeadFromCriteria(lead, criteria);
      const highValue = highValueByCriteria || isHighValueLead(lead);
      return {
        id: lead.id,
        label: lead.full_name ? `Lead: ${lead.full_name}` : lead.work_email || lead.id,
        work_email: lead.work_email || null,
        subtitle: [
          lead.work_email || null,
          lead.selected_category || null,
          lead.urgency_preference || null,
          formatDateLabel(lead.created_at),
        ]
          .filter(Boolean)
          .join(" • "),
        is_high_value: highValue,
        urgency_preference: lead.urgency_preference || null,
        budget_preference: lead.budget_preference || null,
        intent_type: lead.intent_type || null,
        primary_issue: lead.primary_issue || null,
      };
    })
    .sort((a, b) => Number(b.is_high_value) - Number(a.is_high_value))
    .slice(0, safeLimit);
}

async function listExpertPerformanceDashboard(limit = 80) {
  const supabase = requireSupabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 40, 300));
  const { data, error } = await supabase
    .from("experts")
    .select(
      "expert_id, name, profile_views_7d, impressions_7d, clicks_7d, average_response_time, lead_acceptance_rate, successful_connection_rate, rating, review_count, approved_at",
    )
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new AppError("Failed to load expert performance dashboard.", 500, error.message);
  }

  return (data || []).map((expert) => {
    const impressions = Number(expert.impressions_7d || 0);
    const clicks = Number(expert.clicks_7d || 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = Number(expert.successful_connection_rate || 0) * 100;
    const responseHours = Number(expert.average_response_time || 999);
    const approvedAt = expert.approved_at ? new Date(expert.approved_at) : null;
    const daysSinceApproval = approvedAt ? Math.floor((Date.now() - approvedAt.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    let statusLabel = "Needs Improvement";
    if (daysSinceApproval <= 30) {
      statusLabel = "New Expert";
    } else if (
      Number(expert.rating || 0) >= 4.7 &&
      responseHours <= 24 &&
      conversionRate >= 30 &&
      Number(expert.lead_acceptance_rate || 0) >= 0.55
    ) {
      statusLabel = "High Performer";
    }

    return {
      expert_id: expert.expert_id,
      expert_name: expert.name || expert.expert_id,
      profile_views: Number(expert.profile_views_7d || 0),
      impressions,
      click_through_rate: Number(ctr.toFixed(2)),
      response_time_hours: responseHours,
      conversion_rate: Number(conversionRate.toFixed(2)),
      rating: Number(expert.rating || 0),
      status_label: statusLabel,
    };
  });
}

async function getReviewsFeedbackSummary(limit = 200) {
  const supabase = requireSupabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 120, 500));
  const [reviewsQuery, feedbackQuery, expertsQuery] = await Promise.all([
    supabase
      .from("expert_reviews")
      .select(
        "feedback_id, expert_id, public_star_rating, review_status, would_recommend, is_suspicious, created_at, suspicious_notes",
      )
      .order("created_at", { ascending: false })
      .limit(safeLimit),
    supabase
      .from("private_match_feedback")
      .select("feedback_id, expert_id, match_helpful_rating, feedback_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(safeLimit),
    supabase
      .from("experts")
      .select("expert_id, name, average_response_time"),
  ]);

  if (reviewsQuery.error) {
    throw new AppError("Failed to load public reviews summary.", 500, reviewsQuery.error.message);
  }
  if (feedbackQuery.error) {
    throw new AppError("Failed to load private feedback summary.", 500, feedbackQuery.error.message);
  }
  if (expertsQuery.error) {
    throw new AppError("Failed to load expert response summary.", 500, expertsQuery.error.message);
  }

  const approvedReviews = (reviewsQuery.data || []).filter((row) => row.review_status === "approved");
  const ratingBuckets = { "1-2": 0, "3": 0, "4": 0, "5": 0 };
  let lowRatingCount = 0;
  let suspiciousCount = 0;
  for (const review of approvedReviews) {
    const rating = Number(review.public_star_rating || 0);
    if (rating <= 2.5) ratingBuckets["1-2"] += 1;
    else if (rating < 3.5) ratingBuckets["3"] += 1;
    else if (rating < 4.5) ratingBuckets["4"] += 1;
    else ratingBuckets["5"] += 1;
    if (rating > 0 && rating <= 3) lowRatingCount += 1;
  }
  for (const review of reviewsQuery.data || []) {
    if (review.is_suspicious) suspiciousCount += 1;
  }

  const complaintRows = (feedbackQuery.data || []).filter((row) => {
    const ratingNo = normalizeText(row.match_helpful_rating) === "no";
    const reasons = Array.isArray(row.feedback_reason) ? row.feedback_reason.map((item) => normalizeText(item)) : [];
    const hasComplaintReason = reasons.some((reason) =>
      ["not_relevant", "no_response", "too_expensive", "wrong_location", "different_help_needed"].includes(reason),
    );
    return ratingNo || hasComplaintReason;
  });

  const complaintsByExpert = complaintRows.reduce((acc, row) => {
    const expertId = row.expert_id || "unknown";
    acc[expertId] = (acc[expertId] || 0) + 1;
    return acc;
  }, {});

  const experts = expertsQuery.data || [];
  const expertNameMap = experts.reduce((acc, row) => {
    acc[row.expert_id] = row.name || row.expert_id;
    return acc;
  }, {});

  const responseAlerts = experts
    .filter((expert) => Number(expert.average_response_time || 0) > 48)
    .map((expert) => ({
      expert_id: expert.expert_id,
      expert_name: expert.name || expert.expert_id,
      response_time_hours: Number(expert.average_response_time || 0),
    }));

  const lowRatingAlerts = Object.entries(complaintsByExpert)
    .filter(([, count]) => Number(count) >= 3)
    .map(([expertId, count]) => ({
      expert_id: expertId,
      expert_name: expertNameMap[expertId] || expertId,
      low_feedback_count: Number(count),
    }));

  return {
    trends: {
      approved_review_count: approvedReviews.length,
      low_rating_count: lowRatingCount,
      suspicious_count: suspiciousCount,
      rating_buckets: ratingBuckets,
    },
    complaints: lowRatingAlerts,
    alerts: {
      multiple_low_ratings: lowRatingAlerts,
      not_responding_experts: responseAlerts,
    },
  };
}

async function flagReviewSuspicious(req, actor, reviewId, payload) {
  const supabase = requireSupabase();
  const { data: current, error: currentError } = await supabase
    .from("expert_reviews")
    .select("feedback_id, is_suspicious, suspicious_notes")
    .eq("feedback_id", reviewId)
    .maybeSingle();

  if (currentError) {
    throw new AppError("Failed to load review for suspicious flag.", 500, currentError.message);
  }
  if (!current) {
    throw new AppError("Review not found.", 404);
  }

  const { data, error } = await supabase
    .from("expert_reviews")
    .update({
      is_suspicious: payload.isSuspicious,
      suspicious_notes: payload.notes || null,
      suspicious_flagged_by_user_id: actor.userId,
    })
    .eq("feedback_id", reviewId)
    .select("feedback_id, is_suspicious, suspicious_notes, suspicious_flagged_by_user_id")
    .single();

  if (error) {
    throw new AppError("Failed to update suspicious review flag.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: payload.isSuspicious ? "review_suspicious_flagged" : "review_suspicious_unflagged",
    targetType: "expert_review",
    targetId: reviewId,
    previousValue: current,
    newValue: data,
    notes: payload.notes || null,
  });

  return data;
}

async function boostExpertPriority(req, actor, expertId, payload) {
  const supabase = requireSupabase();
  const { data: existing, error: existingError } = await supabase
    .from("experts")
    .select("expert_id, metadata")
    .eq("expert_id", expertId)
    .maybeSingle();

  if (existingError) {
    throw new AppError("Failed to load expert for boost.", 500, existingError.message);
  }
  if (!existing) {
    throw new AppError("Expert not found.", 404);
  }

  const metadata = {
    ...(existing.metadata || {}),
    admin_boost_points: payload.boostPoints,
    admin_boost_updated_at: new Date().toISOString(),
    admin_boost_updated_by: actor.userId,
    admin_boost_notes: payload.notes || null,
  };

  const { data, error } = await supabase
    .from("experts")
    .update({ metadata })
    .eq("expert_id", expertId)
    .select("expert_id, metadata")
    .single();

  if (error) {
    throw new AppError("Failed to boost expert priority.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "expert_priority_boost_update",
    targetType: "expert",
    targetId: expertId,
    previousValue: existing,
    newValue: data,
    notes: payload.notes || null,
  });

  return data;
}

async function getPlatformSettings() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load pricing settings.", 500, error.message);
  }

  if (data) {
    return {
      ...data,
      high_value_criteria: resolveHighValueCriteria(data),
    };
  }

  const { data: created, error: createError } = await supabase
    .from("platform_settings")
    .insert({ is_active: true, ...DEFAULT_PLATFORM_SETTINGS })
    .select("*")
    .single();

  if (createError) {
    throw new AppError("Failed to initialize pricing settings.", 500, createError.message);
  }

  return {
    ...created,
    high_value_criteria: resolveHighValueCriteria(created),
  };
}

async function updatePlatformSettings(req, actor, updates) {
  const supabase = requireSupabase();
  const current = await getPlatformSettings();
  const mergedCriteria = resolveHighValueCriteria({
    high_value_criteria: {
      ...resolveHighValueCriteria(current),
      ...(updates.high_value_criteria || {}),
    },
  });
  const { data, error } = await supabase
    .from("platform_settings")
    .update({
      ...updates,
      high_value_criteria: mergedCriteria,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to update pricing settings.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "pricing_settings_update",
    targetType: "platform_settings",
    targetId: current.id,
    previousValue: current,
    newValue: data,
    notes: null,
  });

  return {
    ...data,
    high_value_criteria: resolveHighValueCriteria(data),
  };
}

async function listMatchOverrides(limit = 100) {
  const supabase = requireSupabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 300));
  const { data, error } = await supabase
    .from("admin_match_overrides")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new AppError("Failed to load match overrides.", 500, error.message);
  }

  const rows = data || [];
  if (rows.length === 0) return rows;

  const leadIds = [...new Set(rows.map((row) => row.lead_id).filter(Boolean))];
  const expertIds = [...new Set(rows.flatMap((row) => row.ordered_expert_ids || []).filter(Boolean))];

  const [leadQuery, expertQuery] = await Promise.all([
    leadIds.length
      ? supabase.from("lead_submissions").select("id, full_name, work_email").in("id", leadIds)
      : Promise.resolve({ data: [], error: null }),
    expertIds.length
      ? supabase.from("experts").select("expert_id, name").in("expert_id", expertIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (leadQuery.error) {
    throw new AppError("Failed to load lead labels for overrides.", 500, leadQuery.error.message);
  }
  if (expertQuery.error) {
    throw new AppError("Failed to load expert labels for overrides.", 500, expertQuery.error.message);
  }

  const leadMap = (leadQuery.data || []).reduce((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});
  const expertMap = (expertQuery.data || []).reduce((acc, row) => {
    acc[row.expert_id] = row.name || row.expert_id;
    return acc;
  }, {});

  return rows.map((row) => ({
    ...row,
    lead_label: row.lead_id
      ? leadMap[row.lead_id]?.full_name || leadMap[row.lead_id]?.work_email || row.lead_id
      : null,
    ordered_expert_labels: (row.ordered_expert_ids || []).map((id) => expertMap[id] || id),
  }));
}

async function ensureExpertsExist(expertIds) {
  const supabase = requireSupabase();
  const uniqueIds = [...new Set((expertIds || []).filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new AppError("At least one expert is required for override.", 400);
  }

  const { data, error } = await supabase
    .from("experts")
    .select("expert_id")
    .in("expert_id", uniqueIds);

  if (error) {
    throw new AppError("Failed to validate experts for override.", 500, error.message);
  }

  const found = new Set((data || []).map((row) => row.expert_id));
  const missing = uniqueIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new AppError(`Unknown expert(s): ${missing.join(", ")}`, 400);
  }

  return uniqueIds;
}

async function createMatchOverride(req, actor, payload) {
  const supabase = requireSupabase();
  const orderedExpertIds = await ensureExpertsExist(payload.orderedExpertIds);
  const nowIso = new Date().toISOString();

  if (payload.leadId) {
    const { data: lead, error: leadError } = await supabase
      .from("lead_submissions")
      .select("id")
      .eq("id", payload.leadId)
      .maybeSingle();
    if (leadError) {
      throw new AppError("Failed to validate lead for override.", 500, leadError.message);
    }
    if (!lead) {
      throw new AppError("Lead not found for override.", 404);
    }
  }

  if (payload.leadId) {
    await supabase
      .from("admin_match_overrides")
      .update({ is_active: false, updated_at: nowIso, updated_by_user_id: actor.userId })
      .eq("lead_id", payload.leadId)
      .eq("is_active", true);
  }
  if (payload.assessmentId) {
    await supabase
      .from("admin_match_overrides")
      .update({ is_active: false, updated_at: nowIso, updated_by_user_id: actor.userId })
      .eq("assessment_id", payload.assessmentId)
      .eq("is_active", true);
  }

  const row = {
    lead_id: payload.leadId || null,
    assessment_id: payload.assessmentId || null,
    ordered_expert_ids: orderedExpertIds,
    allow_hidden_experts: Boolean(payload.allowHiddenExperts),
    is_active: true,
    created_by_user_id: actor.userId,
    updated_by_user_id: actor.userId,
    notes: payload.notes || null,
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("admin_match_overrides")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to create match override.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "match_override_create",
    targetType: "admin_match_override",
    targetId: data.id,
    previousValue: null,
    newValue: data,
    notes: payload.notes || null,
  });

  return data;
}

async function patchMatchOverride(req, actor, overrideId, payload) {
  const supabase = requireSupabase();
  const { data: current, error: currentError } = await supabase
    .from("admin_match_overrides")
    .select("*")
    .eq("id", overrideId)
    .maybeSingle();

  if (currentError) {
    throw new AppError("Failed to load match override.", 500, currentError.message);
  }
  if (!current) {
    throw new AppError("Match override not found.", 404);
  }

  const update = { updated_at: new Date().toISOString(), updated_by_user_id: actor.userId };
  if (Array.isArray(payload.orderedExpertIds)) {
    update.ordered_expert_ids = await ensureExpertsExist(payload.orderedExpertIds);
  }
  if (typeof payload.allowHiddenExperts === "boolean") {
    update.allow_hidden_experts = payload.allowHiddenExperts;
  }
  if (typeof payload.isActive === "boolean") {
    update.is_active = payload.isActive;
  }
  if (payload.notes !== undefined) {
    update.notes = payload.notes || null;
  }

  const { data, error } = await supabase
    .from("admin_match_overrides")
    .update(update)
    .eq("id", overrideId)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to update match override.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: data.is_active ? "match_override_update" : "match_override_disable",
    targetType: "admin_match_override",
    targetId: overrideId,
    previousValue: current,
    newValue: data,
    notes: payload.notes || null,
  });

  return data;
}

async function findActiveMatchOverride(leadId, assessmentId) {
  if (!leadId && !assessmentId) return null;

  const supabase = requireSupabase();
  let query = supabase
    .from("admin_match_overrides")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (leadId && assessmentId) {
    const escapedAssessmentId = String(assessmentId).replaceAll(",", " ").trim();
    query = query.or(`lead_id.eq.${leadId},assessment_id.eq.${escapedAssessmentId}`);
  } else if (leadId) {
    query = query.eq("lead_id", leadId);
  } else {
    query = query.eq("assessment_id", assessmentId);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError("Failed to load active match override.", 500, error.message);
  }

  const rows = data || [];
  if (rows.length === 0) return null;
  if (leadId) {
    const exactLead = rows.find((row) => row.lead_id === leadId);
    if (exactLead) return exactLead;
  }
  if (assessmentId) {
    const exactAssessment = rows.find((row) => row.assessment_id === assessmentId);
    if (exactAssessment) return exactAssessment;
  }
  return rows[0];
}

async function listModerationReviews(limit = 80) {
  const supabase = requireSupabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 40, 300));
  const { data, error } = await supabase
    .from("expert_reviews")
    .select(
      "feedback_id, expert_id, lead_id, public_star_rating, public_review_comment, review_status, is_suspicious, suspicious_notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new AppError("Failed to load reviews for moderation.", 500, error.message);
  }

  const rows = data || [];
  if (rows.length === 0) return rows;

  const expertIds = [...new Set(rows.map((row) => row.expert_id).filter(Boolean))];
  const leadIds = [...new Set(rows.map((row) => row.lead_id).filter(Boolean))];
  const reviewIds = [...new Set(rows.map((row) => row.feedback_id).filter(Boolean))];

  const [expertsQuery, leadsQuery, recsQuery] = await Promise.all([
    expertIds.length
      ? supabase.from("experts").select("expert_id, name").in("expert_id", expertIds)
      : Promise.resolve({ data: [], error: null }),
    leadIds.length
      ? supabase.from("lead_submissions").select("id, full_name, work_email").in("id", leadIds)
      : Promise.resolve({ data: [], error: null }),
    reviewIds.length
      ? supabase
          .from("review_moderation_recommendations")
          .select("id, review_id, recommendation, status, created_at")
          .in("review_id", reviewIds)
          .eq("status", "pending")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (expertsQuery.error) throw new AppError("Failed to resolve expert labels for reviews.", 500, expertsQuery.error.message);
  if (leadsQuery.error) throw new AppError("Failed to resolve lead labels for reviews.", 500, leadsQuery.error.message);
  if (recsQuery.error) throw new AppError("Failed to resolve review recommendations.", 500, recsQuery.error.message);

  const expertMap = (expertsQuery.data || []).reduce((acc, row) => {
    acc[row.expert_id] = row.name || row.expert_id;
    return acc;
  }, {});
  const leadMap = (leadsQuery.data || []).reduce((acc, row) => {
    acc[row.id] = row.full_name || row.work_email || row.id;
    return acc;
  }, {});
  const pendingByReview = (recsQuery.data || []).reduce((acc, row) => {
    const key = row.review_id;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return rows.map((row) => ({
    ...row,
    expert_label: expertMap[row.expert_id] || row.expert_id,
    lead_label: leadMap[row.lead_id] || row.lead_id || null,
    pending_recommendations_count: Number(pendingByReview[row.feedback_id] || 0),
  }));
}

async function createReviewRecommendation(req, actor, reviewId, payload) {
  const supabase = requireSupabase();
  const { data: review, error: reviewError } = await supabase
    .from("expert_reviews")
    .select("feedback_id, review_status")
    .eq("feedback_id", reviewId)
    .maybeSingle();

  if (reviewError) {
    throw new AppError("Failed to load review.", 500, reviewError.message);
  }
  if (!review) {
    throw new AppError("Review not found.", 404);
  }

  const row = {
    review_id: reviewId,
    moderator_user_id: actor.userId,
    recommendation: payload.recommendation,
    notes: payload.notes || null,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("review_moderation_recommendations")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to create review recommendation.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "review_moderation_recommendation_create",
    targetType: "expert_review",
    targetId: reviewId,
    previousValue: { review_status: review.review_status },
    newValue: data,
    notes: payload.notes || null,
  });

  return data;
}

async function listReviewRecommendations(limit = 100) {
  const supabase = requireSupabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 300));

  const { data, error } = await supabase
    .from("review_moderation_recommendations")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new AppError("Failed to load review recommendations.", 500, error.message);
  }

  const rows = data || [];
  if (rows.length === 0) return rows;

  const reviewIds = [...new Set(rows.map((row) => row.review_id).filter(Boolean))];
  const moderatorIds = [...new Set(rows.map((row) => row.moderator_user_id).filter(Boolean))];

  const [reviewsQuery, usersQuery] = await Promise.all([
    reviewIds.length
      ? supabase
          .from("expert_reviews")
          .select("feedback_id, expert_id, lead_id, public_star_rating, public_review_comment, review_status")
          .in("feedback_id", reviewIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);

  if (reviewsQuery.error) {
    throw new AppError("Failed to resolve reviews for recommendations.", 500, reviewsQuery.error.message);
  }
  if (usersQuery.error) {
    throw new AppError("Failed to resolve recommendation users.", 500, usersQuery.error.message);
  }

  const reviewMap = (reviewsQuery.data || []).reduce((acc, row) => {
    acc[row.feedback_id] = row;
    return acc;
  }, {});
  const userMap = (usersQuery.data?.users || []).reduce((acc, row) => {
    acc[row.id] = row.email || row.id;
    return acc;
  }, {});

  return rows.map((row) => ({
    ...row,
    moderator_email: moderatorIds.includes(row.moderator_user_id) ? userMap[row.moderator_user_id] || null : null,
    review: reviewMap[row.review_id] || null,
  }));
}

async function resolvePendingReviewRecommendations(req, actor, reviewId, resolvedStatus) {
  const supabase = requireSupabase();
  const { data: pendingRows, error: pendingError } = await supabase
    .from("review_moderation_recommendations")
    .select("*")
    .eq("review_id", reviewId)
    .eq("status", "pending");

  if (pendingError) {
    throw new AppError("Failed to load pending recommendations.", 500, pendingError.message);
  }
  if (!pendingRows || pendingRows.length === 0) return [];

  const { data, error } = await supabase
    .from("review_moderation_recommendations")
    .update({
      status: "resolved",
      resolved_by_user_id: actor.userId,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("review_id", reviewId)
    .eq("status", "pending")
    .select("*");

  if (error) {
    throw new AppError("Failed to resolve review recommendations.", 500, error.message);
  }

  await appendAdminAuditLog({
    req,
    actor,
    actionType: "review_recommendations_resolved",
    targetType: "expert_review",
    targetId: reviewId,
    previousValue: pendingRows,
    newValue: data || [],
    notes: `Final decision: ${resolvedStatus}`,
  });

  return data || [];
}

async function getAdminReportsSummary() {
  const supabase = requireSupabase();

  const [applications, leads, reviews, experts, assignments, introductions] = await Promise.all([
    supabase.from("expert_applications").select("status", { count: "exact", head: false }),
    supabase.from("lead_submissions").select("id, selected_category, lead_quality_tag, urgency_preference, budget_preference, intent_type, created_at"),
    supabase.from("expert_reviews").select("feedback_id, review_status, is_suspicious"),
    supabase.from("experts").select("expert_id, matching_visibility, tier, average_response_time"),
    supabase.from("lead_assignments").select("lead_id"),
    supabase.from("introduction_requests").select("id, status, created_at"),
  ]);

  if (applications.error) throw new AppError("Failed to build reports summary (applications).", 500, applications.error.message);
  if (leads.error) throw new AppError("Failed to build reports summary (leads).", 500, leads.error.message);
  if (reviews.error) throw new AppError("Failed to build reports summary (reviews).", 500, reviews.error.message);
  if (experts.error) throw new AppError("Failed to build reports summary (experts).", 500, experts.error.message);
  if (assignments.error) throw new AppError("Failed to build reports summary (assignments).", 500, assignments.error.message);
  if (introductions.error) throw new AppError("Failed to build reports summary (introductions).", 500, introductions.error.message);

  const leadRows = leads.data || [];
  const introductionRows = introductions.data || [];
  const now = new Date();
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth();
  const nowDay = now.getUTCDate();

  const leadsToday = leadRows.filter((row) => {
    if (!row.created_at) return false;
    const created = new Date(row.created_at);
    return (
      created.getUTCFullYear() === nowYear &&
      created.getUTCMonth() === nowMonth &&
      created.getUTCDate() === nowDay
    );
  }).length;

  const leadsMonthToDate = leadRows.filter((row) => {
    if (!row.created_at) return false;
    const created = new Date(row.created_at);
    return created.getUTCFullYear() === nowYear && created.getUTCMonth() === nowMonth;
  }).length;

  const connectedIntroductions = introductionRows.filter((row) => row.status === "accepted").length;
  const conversionRate = leadRows.length > 0 ? (connectedIntroductions / leadRows.length) * 100 : 0;

  const expertRows = experts.data || [];
  const averageResponseTimeHours =
    expertRows.length > 0
      ? expertRows.reduce((sum, row) => sum + Number(row.average_response_time || 0), 0) / expertRows.length
      : 0;

  const leadsByCategory = leadRows.reduce((acc, row) => {
    const key = row.selected_category || "Uncategorized";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const highValueLeadCount = leadRows.filter((row) => String(row.lead_quality_tag || "").toLowerCase() === "high").length;
  const assignedLeadIds = new Set((assignments.data || []).map((row) => row.lead_id));
  const noMatchLeadCount = leadRows.filter((row) => !assignedLeadIds.has(row.id)).length;
  const suspiciousReviewCount = (reviews.data || []).filter((row) => row.is_suspicious).length;
  const notRespondingExpertCount = (experts.data || []).filter((row) => Number(row.average_response_time || 0) > 48).length;

  return {
    totalApplications: Number(applications.count || 0),
    totalLeads: leadRows.length,
    totalLeadsToday: leadsToday,
    totalLeadsMonthToDate: leadsMonthToDate,
    highValueLeads: highValueLeadCount,
    totalReviews: (reviews.data || []).length,
    approvedReviews: (reviews.data || []).filter((row) => row.review_status === "approved").length,
    totalExperts: expertRows.length,
    activeExperts: expertRows.filter((row) => row.matching_visibility !== "hidden").length,
    featuredExperts: expertRows.filter((row) => row.tier === "featured").length,
    conversionRate: Number(conversionRate.toFixed(2)),
    averageResponseTimeHours: Number(averageResponseTimeHours.toFixed(2)),
    introductionsCount: introductionRows.length,
    connectedIntroductionsCount: connectedIntroductions,
    leadsByCategory,
    noMatchLeads: noMatchLeadCount,
    suspiciousReviews: suspiciousReviewCount,
    notRespondingExperts: notRespondingExpertCount,
  };
}

async function searchAdminUsers(query = "", limit = 12) {
  const supabase = requireSupabase();
  const q = String(query || "").trim().toLowerCase();
  const safeLimit = toSafeLimit(limit, 12, 1, 40);

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    throw new AppError("Failed to search users.", 500, error.message);
  }

  const users = data?.users || [];
  const filtered = users.filter((user) => {
    if (!q) return true;
    const email = String(user.email || "").toLowerCase();
    const fullName = String(user.user_metadata?.full_name || user.user_metadata?.name || "").toLowerCase();
    return email.includes(q) || fullName.includes(q);
  });

  const ids = filtered.map((item) => item.id);
  let roleRows = [];
  if (ids.length > 0) {
    const { data: rolesData, error: rolesError } = await supabase
      .from("admin_user_roles")
      .select("user_id, role")
      .in("user_id", ids)
      .eq("is_active", true);
    if (rolesError) {
      throw new AppError("Failed to load user roles.", 500, rolesError.message);
    }
    roleRows = rolesData || [];
  }

  const rolesByUser = roleRows.reduce((acc, row) => {
    const key = row.user_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row.role);
    return acc;
  }, {});

  return filtered.slice(0, safeLimit).map((user) => {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
    const roles = rolesByUser[user.id] || [];
    const roleLabel = roles.length > 0 ? roles.join(", ") : "No role assigned";
    const subtitleParts = [fullName || null, roleLabel].filter(Boolean);
    return {
      id: user.id,
      label: user.email || fullName || "User account",
      subtitle: subtitleParts.join(" • "),
    };
  });
}

async function searchExperts(query = "", limit = 12) {
  const supabase = requireSupabase();
  const q = sanitizeSearchTerm(query);
  const safeLimit = toSafeLimit(limit, 12, 1, 40);

  let builder = supabase
    .from("experts")
    .select("expert_id, name, role, location, matching_visibility")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (q) {
    builder = builder.or(`name.ilike.%${q}%,expert_id.ilike.%${q}%,organization.ilike.%${q}%`);
  }

  const { data, error } = await builder;
  if (error) {
    throw new AppError("Failed to search experts.", 500, error.message);
  }

  return (data || []).map((row) => ({
    id: row.expert_id,
    label: row.name || row.expert_id,
    matching_visibility: row.matching_visibility || "visible",
    is_paused: row.matching_visibility === "hidden",
    subtitle: [row.role || "Expert", row.location || "Location not set", row.matching_visibility || "visible"]
      .filter(Boolean)
      .join(" • "),
  }));
}

async function searchLeads(query = "", limit = 12) {
  const supabase = requireSupabase();
  const q = sanitizeSearchTerm(query);
  const safeLimit = toSafeLimit(limit, 12, 1, 40);

  let builder = supabase
    .from("lead_submissions")
    .select("id, full_name, work_email, selected_category, urgency_preference, created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (q) {
    builder = builder.or(`full_name.ilike.%${q}%,work_email.ilike.%${q}%,assessment_id.ilike.%${q}%`);
  }

  const { data, error } = await builder;
  if (error) {
    throw new AppError("Failed to search leads.", 500, error.message);
  }

  return (data || []).map((row) => ({
    id: row.id,
    label: row.full_name ? `Lead: ${row.full_name}` : row.work_email || "Lead submission",
    subtitle: [
      row.work_email || null,
      row.selected_category || "General",
      row.urgency_preference || "No urgency",
      formatDateLabel(row.created_at),
    ]
      .filter(Boolean)
      .join(" • "),
  }));
}

module.exports = {
  getAdminMe,
  listAdminRoles,
  createAdminUser,
  assignAdminRole,
  revokeAdminRole,
  listExpertApplications,
  mutateExpertApplication,
  updateExpertState,
  boostExpertPriority,
  assignLeadManually,
  listLeadAssignments,
  listLeadEscalations,
  listExpertPerformanceDashboard,
  getPlatformSettings,
  updatePlatformSettings,
  getReviewsFeedbackSummary,
  flagReviewSuspicious,
  getAdminReportsSummary,
  listAuditLogs,
  searchAdminUsers,
  searchExperts,
  searchLeads,
  listMatchOverrides,
  createMatchOverride,
  patchMatchOverride,
  findActiveMatchOverride,
  listModerationReviews,
  createReviewRecommendation,
  listReviewRecommendations,
  resolvePendingReviewRecommendations,
};
