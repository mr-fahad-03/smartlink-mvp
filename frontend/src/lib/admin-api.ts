import type {
  AdminAuditLogRecord,
  AdminFairnessSettings,
  AdminMatchOverrideRecord,
  AdminMe,
  AdminModerationReviewRecord,
  AdminLeadEscalationRecord,
  AdminExpertPerformanceRecord,
  AdminReviewsFeedbackSummary,
  AdminReportsSummary,
  ReviewModerationRecommendationRecord,
  AdminUserOption,
  AdminUserRoleRecord,
  AdminLeadOption,
  AdminExpertOption,
  ExpertApplicationRecord,
  LeadAssignmentRecord,
  PlatformPricingSettings,
} from "@/types";

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

async function requestJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${DEFAULT_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || `Admin API request failed (${response.status})`);
  }

  return payload as T;
}

export async function getAdminMe(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminMe }>("/admin/me", token);
  return response.data;
}

export async function getAdminRoles(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminUserRoleRecord[] }>("/admin/roles", token);
  return response.data;
}

export async function searchAdminUsers(token: string, query: string) {
  const response = await requestJson<{ success: boolean; data: AdminUserOption[] }>(
    `/admin/users/search?q=${encodeURIComponent(query || "")}`,
    token,
  );
  return response.data;
}

export async function createAdminUser(
  token: string,
  payload: { email: string; password: string; fullName?: string; role: string; notes?: string },
) {
  const response = await requestJson<{ success: boolean; data: { id: string; email: string; role: string; is_active: boolean } }>(
    "/admin/users",
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return response.data;
}

export async function assignAdminRole(token: string, payload: { userId: string; role: string; notes?: string }) {
  const response = await requestJson<{ success: boolean; data: AdminUserRoleRecord }>("/admin/roles/assign", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function revokeAdminRole(token: string, payload: { userId: string; role: string; notes?: string }) {
  const response = await requestJson<{ success: boolean; data: AdminUserRoleRecord }>("/admin/roles/revoke", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function getExpertApplications(token: string) {
  const response = await requestJson<{ success: boolean; data: ExpertApplicationRecord[] }>("/admin/expert-applications", token);
  return response.data;
}

export async function searchExperts(token: string, query: string) {
  const response = await requestJson<{ success: boolean; data: AdminExpertOption[] }>(
    `/admin/experts/search?q=${encodeURIComponent(query || "")}`,
    token,
  );
  return response.data;
}

export async function updateExpertApplication(token: string, applicationId: string, action: string, notes?: string) {
  const response = await requestJson<{ success: boolean; data: ExpertApplicationRecord }>(
    `/admin/expert-applications/${applicationId}/${action}`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ notes: notes || "" }),
    },
  );
  return response.data;
}

export async function updateExpertState(token: string, expertId: string, state: "pause" | "suspend" | "resume", notes?: string) {
  const response = await requestJson<{ success: boolean; data: unknown }>(`/admin/experts/${expertId}/state`, token, {
    method: "PATCH",
    body: JSON.stringify({ state, notes: notes || "" }),
  });
  return response.data;
}

export async function updateExpertBoost(token: string, expertId: string, payload: { boostPoints: 0 | 5 | 10 | 15; notes?: string }) {
  const response = await requestJson<{ success: boolean; data: unknown }>(`/admin/experts/${expertId}/boost`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function getReportsSummary(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminReportsSummary }>("/admin/reports/summary", token);
  return response.data;
}

export async function getAuditLogs(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminAuditLogRecord[] }>("/admin/audit-logs", token);
  return response.data;
}

export async function getPricingSettings(token: string) {
  const response = await requestJson<{ success: boolean; data: PlatformPricingSettings }>("/admin/pricing-settings", token);
  return response.data;
}

export async function patchPricingSettings(token: string, updates: Partial<PlatformPricingSettings>) {
  const response = await requestJson<{ success: boolean; data: PlatformPricingSettings }>("/admin/pricing-settings", token, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return response.data;
}

export async function getRankingConfig(token: string) {
  const response = await requestJson<{ success: boolean; data: Record<string, unknown> }>("/admin/ranking-config", token);
  return response.data;
}

export async function patchRankingConfig(token: string, updates: Record<string, unknown>) {
  const response = await requestJson<{ success: boolean; data: Record<string, unknown> }>("/admin/ranking-config", token, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return response.data;
}

export async function getFairnessSettings(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminFairnessSettings }>("/admin/fairness-settings", token);
  return response.data;
}

export async function patchFairnessSettings(token: string, updates: Partial<AdminFairnessSettings>) {
  const response = await requestJson<{ success: boolean; data: Record<string, unknown> }>("/admin/fairness-settings", token, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return response.data;
}

export async function createMatchOverride(
  token: string,
  payload: {
    leadId?: string;
    assessmentId?: string;
    orderedExpertIds: string[];
    allowHiddenExperts?: boolean;
    notes?: string;
  },
) {
  const response = await requestJson<{ success: boolean; data: AdminMatchOverrideRecord }>("/admin/match-overrides", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function getMatchOverrides(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminMatchOverrideRecord[] }>("/admin/match-overrides", token);
  return response.data;
}

export async function patchMatchOverride(
  token: string,
  overrideId: string,
  payload: {
    orderedExpertIds?: string[];
    allowHiddenExperts?: boolean;
    isActive?: boolean;
    notes?: string;
  },
) {
  const response = await requestJson<{ success: boolean; data: AdminMatchOverrideRecord }>(`/admin/match-overrides/${overrideId}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function postLeadAssignment(token: string, payload: { leadId: string; expertId: string; assignmentReason: string; notes?: string }) {
  const response = await requestJson<{ success: boolean; data: LeadAssignmentRecord }>("/admin/lead-assignments", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function getLeadAssignments(token: string) {
  const response = await requestJson<{ success: boolean; data: LeadAssignmentRecord[] }>("/admin/lead-assignments", token);
  return response.data;
}

export async function getLeadEscalations(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminLeadEscalationRecord[] }>("/admin/lead-escalations", token);
  return response.data;
}

export async function searchLeads(token: string, query: string) {
  const response = await requestJson<{ success: boolean; data: AdminLeadOption[] }>(
    `/admin/leads/search?q=${encodeURIComponent(query || "")}`,
    token,
  );
  return response.data;
}

export async function getModerationReviews(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminModerationReviewRecord[] }>("/admin/reviews", token);
  return response.data;
}

export async function getExpertPerformance(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminExpertPerformanceRecord[] }>("/admin/expert-performance", token);
  return response.data;
}

export async function getReviewsFeedbackSummary(token: string) {
  const response = await requestJson<{ success: boolean; data: AdminReviewsFeedbackSummary }>("/admin/reviews-feedback-summary", token);
  return response.data;
}

export async function patchReviewSuspicious(token: string, reviewId: string, payload: { isSuspicious: boolean; notes?: string }) {
  const response = await requestJson<{ success: boolean; data: unknown }>(`/admin/reviews/${reviewId}/suspicious`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function postReviewRecommendation(
  token: string,
  reviewId: string,
  payload: { recommendation: "approve" | "reject"; notes?: string },
) {
  const response = await requestJson<{ success: boolean; data: unknown }>(`/admin/reviews/${reviewId}/recommend`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function patchReviewModeration(token: string, reviewId: string, payload: { reviewStatus: "approved" | "rejected" | "pending"; notes?: string }) {
  const response = await requestJson<{ success: boolean; data: unknown }>(`/admin/reviews/${reviewId}/moderate`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function getReviewRecommendations(token: string) {
  const response = await requestJson<{ success: boolean; data: ReviewModerationRecommendationRecord[] }>("/admin/review-recommendations", token);
  return response.data;
}
