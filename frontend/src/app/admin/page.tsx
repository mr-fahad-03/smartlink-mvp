/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { InnerNav } from "@/components/navigation/inner-nav";
import { Button } from "@/components/ui/button";
import {
  assignAdminRole,
  createMatchOverride,
  createAdminUser,
  getAdminMe,
  getAdminRoles,
  getAuditLogs,
  getExpertPerformance,
  getExpertApplications,
  getFairnessSettings,
  getLeadAssignments,
  getLeadEscalations,
  getMatchOverrides,
  getModerationReviews,
  getPricingSettings,
  getRankingConfig,
  getReviewsFeedbackSummary,
  getReviewRecommendations,
  getReportsSummary,
  patchFairnessSettings,
  patchMatchOverride,
  patchPricingSettings,
  patchRankingConfig,
  patchReviewModeration,
  patchReviewSuspicious,
  postLeadAssignment,
  postReviewRecommendation,
  revokeAdminRole,
  searchAdminUsers,
  searchExperts,
  searchLeads,
  updateExpertBoost,
  updateExpertApplication,
  updateExpertState,
} from "@/lib/admin-api";
import { clearAdminSession, getAdminAccessToken, logoutCurrentSession } from "@/lib/admin-session";
import { canAccessAdminArea } from "@/lib/role-guard";
import type {
  AdminAuditLogRecord,
  AdminFairnessSettings,
  AdminMatchOverrideRecord,
  AdminExpertOption,
  AdminExpertPerformanceRecord,
  AdminLeadEscalationRecord,
  AdminLeadOption,
  AdminMe,
  AdminModerationReviewRecord,
  AdminReportsSummary,
  AdminRole,
  AdminReviewsFeedbackSummary,
  AdminUserOption,
  AdminUserRoleRecord,
  ExpertApplicationRecord,
  LeadAssignmentRecord,
  PlatformPricingSettings,
  ReviewModerationRecommendationRecord,
} from "@/types";

function can(me: AdminMe | null, permission: string) {
  return Boolean(me?.permissions?.includes(permission));
}

function roleLabel(role?: string | null) {
  if (!role) return "Unknown role";
  return role.replace("_", " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

function statusChipClass(status: string) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-rose-100 text-rose-800";
  if (status === "needs_info") return "bg-amber-100 text-amber-800";
  if (status === "flagged") return "bg-indigo-100 text-indigo-800";
  return "bg-slate-100 text-slate-700";
}

function prettyExpertName(expertId: string) {
  if (!expertId) return "Expert";
  if (!expertId.includes("_")) return expertId;
  return expertId
    .replace(/^exp_/, "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function mapAuditAction(action: string) {
  const map: Record<string, string> = {
    role_assign: "Assigned a role",
    role_revoke: "Revoked a role",
    expert_application_approve: "Approved expert application",
    expert_application_reject: "Rejected expert application",
    expert_application_recommend: "Recommended expert for review",
    expert_application_request_info: "Requested more info",
    expert_state_pause: "Paused expert",
    expert_state_resume: "Resumed expert",
    lead_manual_assign: "Assigned lead manually",
    pricing_settings_update: "Updated pricing settings",
    ranking_settings_update: "Updated matching settings",
    review_moderation_update: "Moderated review",
    review_moderation_recommendation_create: "Moderator recommendation created",
    review_recommendations_resolved: "Resolved moderator recommendations",
    fairness_settings_update: "Updated fairness settings",
    match_override_create: "Created match override",
    match_override_update: "Updated match override",
    match_override_disable: "Disabled match override",
    review_suspicious_flagged: "Flagged suspicious review activity",
    review_suspicious_unflagged: "Removed suspicious review flag",
    expert_priority_boost_update: "Updated expert boost",
    permission_denied: "Blocked action (permission denied)",
    admin_login_success: "Admin login successful",
    admin_login_mfa_required: "Admin login requires MFA",
    admin_mfa_email_verified: "Admin email OTP verified",
    admin_mfa_totp_verified: "Admin authenticator verified",
    admin_session_revoke_all: "Admin revoked all sessions",
    auth_login_success: "Login successful",
    auth_login_failure: "Login failed",
  };
  return map[action] || action.replaceAll("_", " ");
}

type TabKey = "overview" | "experts" | "leads" | "team" | "settings" | "activity";
type ExpertsSubTabKey = "directory" | "applications" | "reviews" | "performance";
type LeadsSubTabKey = "assignment" | "escalation" | "overrides";
type SettingsSubTabKey = "matching" | "pricing" | "fairness";
const ROLE_OPTIONS: AdminRole[] = ["super_admin", "admin", "moderator", "auditor"];
const FAIRNESS_MAX_BY_STRENGTH = {
  low: 10,
  medium: 15,
  high: 20,
} as const;

export default function AdminPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [activeExpertsTab, setActiveExpertsTab] = useState<ExpertsSubTabKey>("directory");
  const [activeLeadsTab, setActiveLeadsTab] = useState<LeadsSubTabKey>("assignment");
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsSubTabKey>("matching");
  const [expandedNav, setExpandedNav] = useState<Partial<Record<TabKey, boolean>>>({
    experts: true,
    leads: true,
    settings: true,
  });

  const [me, setMe] = useState<AdminMe | null>(null);
  const [roles, setRoles] = useState<AdminUserRoleRecord[]>([]);
  const [applications, setApplications] = useState<ExpertApplicationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRecord[]>([]);
  const [reports, setReports] = useState<AdminReportsSummary | null>(null);
  const [pricingSettings, setPricingSettings] = useState<PlatformPricingSettings | null>(null);
  const [fairnessSettings, setFairnessSettings] = useState<AdminFairnessSettings | null>(null);
  const [rankingConfig, setRankingConfig] = useState<Record<string, unknown> | null>(null);
  const [leadAssignments, setLeadAssignments] = useState<LeadAssignmentRecord[]>([]);
  const [leadEscalations, setLeadEscalations] = useState<AdminLeadEscalationRecord[]>([]);
  const [matchOverrides, setMatchOverrides] = useState<AdminMatchOverrideRecord[]>([]);
  const [expertPerformance, setExpertPerformance] = useState<AdminExpertPerformanceRecord[]>([]);
  const [moderationReviews, setModerationReviews] = useState<AdminModerationReviewRecord[]>([]);
  const [reviewsFeedbackSummary, setReviewsFeedbackSummary] = useState<AdminReviewsFeedbackSummary | null>(null);
  const [reviewRecommendations, setReviewRecommendations] = useState<ReviewModerationRecommendationRecord[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [requestInfoModal, setRequestInfoModal] = useState<{ isOpen: boolean; appId: string; reason: string }>({ isOpen: false, appId: "", reason: "" });

  const [roleQuery, setRoleQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("admin");
  const [roleNotes, setRoleNotes] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("admin");
  const [newAdminNotes, setNewAdminNotes] = useState("");

  const [leadQuery, setLeadQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<AdminLeadOption | null>(null);
  const [expertQuery, setExpertQuery] = useState("");
  const [selectedExpert, setSelectedExpert] = useState<AdminExpertOption | null>(null);
  const [assignmentReason, setAssignmentReason] = useState("");
  const [quickBoostPoints, setQuickBoostPoints] = useState<0 | 5 | 10 | 15>(5);
  const [overrideLead, setOverrideLead] = useState<AdminLeadOption | null>(null);
  const [overrideExpertOrder, setOverrideExpertOrder] = useState<string[]>([]);
  const [overrideNotes, setOverrideNotes] = useState("");

  const [userOptions, setUserOptions] = useState<AdminUserOption[]>([]);
  const [leadOptions, setLeadOptions] = useState<AdminLeadOption[]>([]);
  const [expertOptions, setExpertOptions] = useState<AdminExpertOption[]>([]);

  const [priceLow, setPriceLow] = useState("8");
  const [priceMedium, setPriceMedium] = useState("20");
  const [priceHigh, setPriceHigh] = useState("45");

  const [rankingMinBase, setRankingMinBase] = useState("70");
  const [rankingFeaturedBoost, setRankingFeaturedBoost] = useState("5");
  const [rankingExpertsShown, setRankingExpertsShown] = useState("5");
  const [weightCategory, setWeightCategory] = useState("30");
  const [weightUrgency, setWeightUrgency] = useState("20");
  const [weightBudget, setWeightBudget] = useState("20");
  const [weightReputation, setWeightReputation] = useState("15");
  const [weightLocation, setWeightLocation] = useState("10");
  const [fairnessBoostMax, setFairnessBoostMax] = useState("20");
  const [newExpertBoostDays, setNewExpertBoostDays] = useState("14");
  const [newExpertBoostValue, setNewExpertBoostValue] = useState("15");
  const [cooldownThreshold, setCooldownThreshold] = useState("5");
  const [newExpertBoostEnabled, setNewExpertBoostEnabled] = useState(true);
  const [exposureBoostStrength, setExposureBoostStrength] = useState<"low" | "medium" | "high">("high");
  const [rotationFrequency, setRotationFrequency] = useState<"aggressive" | "balanced" | "minimal">("balanced");
  const [requireUrgent, setRequireUrgent] = useState(true);
  const [requireBudget, setRequireBudget] = useState(true);
  const [requireIntent, setRequireIntent] = useState(true);

  const tabs = useMemo(
    () => [
      { key: "overview" as const, label: "Overview", helper: "Quick health and next actions.", enabled: true },
      { key: "experts" as const, label: "Experts", helper: "Review and manage expert availability.", enabled: can(me, "expert.view") },
      { key: "leads" as const, label: "Leads", helper: "Route leads to the right expert.", enabled: can(me, "lead.assign") || can(me, "report.view") },
      { key: "team" as const, label: "Team", helper: "Manage admin roles by email.", enabled: can(me, "user.role.manage") },
      {
        key: "settings" as const,
        label: "Settings",
        helper: "Control pricing and match strategy.",
        enabled: can(me, "settings.pricing.manage") || can(me, "settings.matching.manage") || can(me, "settings.fairness.manage"),
      },
      { key: "activity" as const, label: "Activity", helper: "See important actions and security events.", enabled: can(me, "audit.view") },
    ],
    [me],
  );

  const expertsSubTabs = useMemo(
    () => [
      {
        key: "directory" as const,
        label: "Directory",
        helper: "Find experts and update live status.",
        enabled: can(me, "expert.view"),
      },
      {
        key: "applications" as const,
        label: "Applications",
        helper: "Approve, reject, request info, or flag.",
        enabled: can(me, "expert.view"),
      },
      {
        key: "reviews" as const,
        label: "Reviews",
        helper: "Moderate feedback and monitor alerts.",
        enabled: can(me, "review.moderate_recommend") || can(me, "review.moderate_final"),
      },
      {
        key: "performance" as const,
        label: "Performance",
        helper: "Track expert health and outcomes.",
        enabled: can(me, "report.view"),
      },
    ],
    [me],
  );

  const leadsSubTabs = useMemo(
    () => [
      { key: "assignment" as const, label: "Manual Assignment", enabled: can(me, "lead.assign") },
      { key: "escalation" as const, label: "No Match Escalation", enabled: can(me, "report.view") || can(me, "lead.assign") },
      { key: "overrides" as const, label: "Match Overrides", enabled: can(me, "match.override.manage") },
    ],
    [me],
  );

  const settingsSubTabs = useMemo(
    () => [
      { key: "matching" as const, label: "Matching Engine", enabled: can(me, "settings.matching.manage") },
      { key: "pricing" as const, label: "Pricing & Lead Value", enabled: can(me, "settings.pricing.manage") },
      { key: "fairness" as const, label: "Fairness & Exposure", enabled: can(me, "settings.fairness.manage") },
    ],
    [me],
  );

  useEffect(() => {
    const current = tabs.find((tab) => tab.key === activeTab);
    if (!current?.enabled) {
      const firstEnabled = tabs.find((tab) => tab.enabled);
      if (firstEnabled) setActiveTab(firstEnabled.key);
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    const current = expertsSubTabs.find((tab) => tab.key === activeExpertsTab);
    if (!current?.enabled) {
      const firstEnabled = expertsSubTabs.find((tab) => tab.enabled);
      if (firstEnabled) setActiveExpertsTab(firstEnabled.key);
    }
  }, [activeExpertsTab, expertsSubTabs]);

  useEffect(() => {
    const current = leadsSubTabs.find((tab) => tab.key === activeLeadsTab);
    if (!current?.enabled) {
      const firstEnabled = leadsSubTabs.find((tab) => tab.enabled);
      if (firstEnabled) setActiveLeadsTab(firstEnabled.key);
    }
  }, [activeLeadsTab, leadsSubTabs]);

  useEffect(() => {
    const current = settingsSubTabs.find((tab) => tab.key === activeSettingsTab);
    if (!current?.enabled) {
      const firstEnabled = settingsSubTabs.find((tab) => tab.enabled);
      if (firstEnabled) setActiveSettingsTab(firstEnabled.key);
    }
  }, [activeSettingsTab, settingsSubTabs]);

  const loadAll = async (accessToken: string, mePayload?: AdminMe) => {
    const meData = mePayload || (await getAdminMe(accessToken));
    if (!canAccessAdminArea(meData.role)) {
      clearAdminSession();
      router.replace("/login");
      return;
    }
    setMe(meData);

    const jobs: Promise<void>[] = [];

    if (can(meData, "report.view")) {
      jobs.push(
        getReportsSummary(accessToken).then(setReports).catch(() => undefined),
        getLeadAssignments(accessToken).then(setLeadAssignments).catch(() => undefined),
        getLeadEscalations(accessToken).then(setLeadEscalations).catch(() => undefined),
        getExpertPerformance(accessToken).then(setExpertPerformance).catch(() => undefined),
        searchLeads(accessToken, "").then(setLeadOptions).catch(() => undefined),
        getModerationReviews(accessToken).then(setModerationReviews).catch(() => undefined),
        getReviewsFeedbackSummary(accessToken).then(setReviewsFeedbackSummary).catch(() => undefined),
      );
    }

    if (can(meData, "expert.view")) {
      jobs.push(
        getExpertApplications(accessToken).then(setApplications).catch(() => undefined),
        searchExperts(accessToken, "").then(setExpertOptions).catch(() => undefined),
      );
    }

    if (can(meData, "audit.view")) {
      jobs.push(getAuditLogs(accessToken).then(setAuditLogs).catch(() => undefined));
    }

    if (can(meData, "settings.pricing.manage")) {
      jobs.push(
        getPricingSettings(accessToken).then((settings) => {
          setPricingSettings(settings);
          setPriceLow(String(settings.lead_price_low));
          setPriceMedium(String(settings.lead_price_medium));
          setPriceHigh(String(settings.lead_price_high));
          setRequireUrgent(settings.high_value_criteria?.requireUrgent !== false);
          setRequireBudget(settings.high_value_criteria?.requireBudget !== false);
          setRequireIntent(settings.high_value_criteria?.requireIntent !== false);
        }),
      );
    }

    if (can(meData, "settings.matching.manage")) {
      jobs.push(
        getRankingConfig(accessToken).then((config) => {
          setRankingConfig(config);
          setRankingMinBase(String(config.minimum_base_match_score ?? 70));
          setRankingFeaturedBoost(String(config.featured_boost_value ?? 5));
          setRankingExpertsShown(String(config.number_of_experts_displayed ?? 5));
          setWeightCategory(String(config.weight_category ?? 30));
          setWeightUrgency(String(config.weight_urgency ?? 20));
          setWeightBudget(String(config.weight_budget ?? 20));
          setWeightReputation(String(config.weight_reputation ?? 15));
          setWeightLocation(String(config.weight_location ?? 10));
        }),
      );
    }

    if (can(meData, "settings.fairness.manage")) {
      jobs.push(
        getFairnessSettings(accessToken).then((settings) => {
          setFairnessSettings(settings);
          setFairnessBoostMax(String(settings.fairness_boost_max));
          setNewExpertBoostDays(String(settings.new_expert_boost_days));
          setNewExpertBoostValue(String(settings.new_expert_boost_value));
          setCooldownThreshold(String(settings.cooldown_threshold));
          setNewExpertBoostEnabled(settings.new_expert_boost_enabled !== false);
          setExposureBoostStrength(settings.exposure_boost_strength || "high");
          setRotationFrequency(settings.rotation_frequency || "balanced");
        }),
      );
    }

    if (can(meData, "match.override.manage")) {
      jobs.push(getMatchOverrides(accessToken).then(setMatchOverrides).catch(() => undefined));
    }

    if (can(meData, "review.moderate_final")) {
      jobs.push(getReviewRecommendations(accessToken).then(setReviewRecommendations).catch(() => undefined));
    }

    if (can(meData, "user.role.manage")) {
      jobs.push(
        getAdminRoles(accessToken).then(setRoles).catch(() => undefined),
        searchAdminUsers(accessToken, "").then(setUserOptions).catch(() => undefined),
      );
    }

    await Promise.allSettled(jobs);
  };

  useEffect(() => {
    const accessToken = getAdminAccessToken();
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setToken(accessToken);
    setLoading(true);
    setError("");

    getAdminMe(accessToken)
      .then(async (mePayload) => {
        await loadAll(accessToken, mePayload);
      })
      .catch((loadError) => {
        clearAdminSession();
        setError(loadError instanceof Error ? loadError.message : "Unauthorized");
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!token || !can(me, "user.role.manage")) return;
    const timeout = setTimeout(() => {
      searchAdminUsers(token, roleQuery)
        .then(setUserOptions)
        .catch(() => undefined);
    }, 220);
    return () => clearTimeout(timeout);
  }, [token, roleQuery, me]);

  useEffect(() => {
    if (!token || !can(me, "report.view")) return;
    const timeout = setTimeout(() => {
      searchLeads(token, leadQuery)
        .then(setLeadOptions)
        .catch(() => undefined);
    }, 220);
    return () => clearTimeout(timeout);
  }, [token, leadQuery, me]);

  useEffect(() => {
    if (!token || !can(me, "expert.view")) return;
    const timeout = setTimeout(() => {
      searchExperts(token, expertQuery)
        .then(setExpertOptions)
        .catch(() => undefined);
    }, 220);
    return () => clearTimeout(timeout);
  }, [token, expertQuery, me]);

  useEffect(() => {
    if (!selectedExpert) return;
    const refreshed = expertOptions.find((option) => option.id === selectedExpert.id);
    if (refreshed && refreshed !== selectedExpert) {
      setSelectedExpert(refreshed);
    }
  }, [expertOptions, selectedExpert]);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      setError("");
      setMessage("");
      await action();
      setMessage(successMessage);
      await loadAll(token, me || undefined);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    }
  };

  if (loading) {
    return (
      <main className="sl-page min-h-screen px-6 py-10">
        <div className="mx-auto w-full max-w-6xl">
          <InnerNav breadcrumb="Admin" />
          <p className="mt-6 text-sm text-[#5D6B85]">Preparing your workspace...</p>
        </div>
      </main>
    );
  }

  const enabledTabCount = tabs.filter((tab) => tab.enabled).length;
  const visibleTabs = tabs.filter((tab) => tab.enabled);
  const selectedExpertIsPaused = Boolean(selectedExpert?.is_paused || selectedExpert?.matching_visibility === "hidden");
  const leadCategoryData = Object.entries(reports?.leadsByCategory || {})
    .map(([category, count]) => ({ category, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxLeadCategoryCount = Math.max(1, ...leadCategoryData.map((item) => item.count));
  const totalExperts = Math.max(1, reports?.totalExperts || 0);
  const activeExperts = Math.max(0, reports?.activeExperts || 0);
  const activeRatio = Math.min(100, Math.round((activeExperts / totalExperts) * 100));
  const chartStroke = `conic-gradient(#2E67E8 ${activeRatio}%, #DCE7F6 ${activeRatio}% 100%)`;
  const recentActions = auditLogs.slice(0, 6);
  const expertOptionMap = new Map(expertOptions.map((option) => [option.id, option]));
  const overrideExpertLabels = overrideExpertOrder.map((expertId) => expertOptionMap.get(expertId)?.label || prettyExpertName(expertId));
  const highValueEscalationCount = leadEscalations.filter((lead) => lead.is_high_value).length;
  const totalLeads = Math.max(0, reports?.totalLeads ?? 0);
  const totalLeadsToday = Math.max(0, reports?.totalLeadsToday ?? 0);
  const totalLeadsMonthToDate = Math.max(0, reports?.totalLeadsMonthToDate ?? totalLeads);
  const highValueLeads = Math.max(0, reports?.highValueLeads ?? 0);
  const noMatchLeads = Math.max(0, reports?.noMatchLeads ?? leadEscalations.length);
  const conversionRate = Number(reports?.conversionRate ?? 0);
  const averageResponseTimeHours = Number(reports?.averageResponseTimeHours ?? 0);
  const connectedIntroductions = Math.max(0, reports?.connectedIntroductionsCount ?? 0);
  const introductionsCount = Math.max(0, reports?.introductionsCount ?? 0);
  const pendingApplications = applications.filter((item) => item.status === "under_review" || item.status === "flagged").length;
  const notRespondingExperts = Math.max(0, reports?.notRespondingExperts ?? 0);
  const highValueRatio = totalLeads > 0 ? Math.round((highValueLeads / totalLeads) * 100) : 0;
  const featuredExperts = Math.max(0, reports?.featuredExperts ?? 0);
  const topLeadCategory = leadCategoryData[0];
  const overviewDateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#F4F7FB] px-3 py-4 text-[#122033] sm:px-6">
      <div className="mx-auto w-full max-w-[1480px] space-y-4">
        <InnerNav breadcrumb="Admin Workspace" />

        <section className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="sticky top-4 self-start rounded-[24px] border border-[#D7E4F6] bg-white p-4 shadow-[0_18px_38px_rgba(36,57,92,0.08)]">
            <div className="rounded-2xl bg-gradient-to-r from-[#1F7AA8] to-[#2E67E8] px-4 py-3 text-white">
              <p className="text-sm font-semibold">SmartLink Admin</p>
              <p className="mt-1 text-xs text-white/90">{me?.email || "Admin"}</p>
              <p className="text-xs text-white/85">{roleLabel(me?.role)}</p>
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#2E67E8]">Navigation</p>
            <div className="mt-2 space-y-2">
              {visibleTabs.map((tab) => {
                const active = activeTab === tab.key;
                const children =
                  tab.key === "experts"
                    ? expertsSubTabs.filter((item) => item.enabled)
                    : tab.key === "leads"
                      ? leadsSubTabs.filter((item) => item.enabled)
                      : tab.key === "settings"
                        ? settingsSubTabs.filter((item) => item.enabled)
                        : [];
                const isExpanded = Boolean(expandedNav[tab.key]);
                const hasChildren = children.length > 0;

                return (
                  <div key={tab.key} className="rounded-xl border border-[#E1E9F8] bg-[#FCFDFF]">
                    <div className="flex items-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.key);
                          if (hasChildren) {
                            setExpandedNav((current) => ({ ...current, [tab.key]: true }));
                          }
                        }}
                        className={`flex-1 rounded-lg px-3 py-2 text-left transition ${
                          active ? "bg-[#EAF1FF] text-[#1B4FC8]" : "hover:bg-[#F3F7FF]"
                        }`}
                      >
                        <p className="text-sm font-semibold">{tab.label}</p>
                        <p className="text-xs text-[#5A6C89]">{tab.helper}</p>
                      </button>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => setExpandedNav((current) => ({ ...current, [tab.key]: !isExpanded }))}
                          className="rounded-lg px-2 py-2 text-[#4F617F] hover:bg-[#EDF3FF]"
                          aria-label={isExpanded ? `Collapse ${tab.label}` : `Expand ${tab.label}`}
                        >
                          {isExpanded ? "▾" : "▸"}
                        </button>
                      ) : null}
                    </div>

                    {hasChildren && isExpanded ? (
                      <div className="space-y-1 px-3 pb-3">
                        {children.map((child) => {
                          const childActive =
                            (tab.key === "experts" && activeExpertsTab === child.key) ||
                            (tab.key === "leads" && activeLeadsTab === child.key) ||
                            (tab.key === "settings" && activeSettingsTab === child.key);

                          return (
                            <button
                              key={`${tab.key}-${child.key}`}
                              type="button"
                              onClick={() => {
                                setActiveTab(tab.key);
                                if (tab.key === "experts") setActiveExpertsTab(child.key as ExpertsSubTabKey);
                                if (tab.key === "leads") setActiveLeadsTab(child.key as LeadsSubTabKey);
                                if (tab.key === "settings") setActiveSettingsTab(child.key as SettingsSubTabKey);
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                childActive ? "bg-[#2E67E8] text-white" : "bg-white text-[#334763] hover:bg-[#EEF4FF]"
                              }`}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 rounded-xl bg-[#F5F8FF] px-3 py-2 text-xs text-[#5D6F8A]">
              Access: {enabledTabCount} sections
            </p>
            <Button
              type="button"
              className="mt-3 w-full rounded-xl bg-[#14223A] text-white hover:bg-[#1D2F4F]"
              onClick={async () => {
                try {
                  await logoutCurrentSession();
                } catch {
                  clearAdminSession();
                }
                router.replace("/login");
              }}
            >
              Sign Out
            </Button>
            <Link
              href="/security"
              className="mt-2 block rounded-xl border border-[#DCE7F6] bg-white px-3 py-2 text-center text-sm font-semibold text-[#1F4CB6] hover:bg-[#EEF4FF]"
            >
              Open Security Settings
            </Link>
          </aside>

          <div className="space-y-4">
            <section className="rounded-[20px] border border-[#DCE7F6] bg-white p-4 shadow-[0_10px_24px_rgba(36,57,92,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2E67E8]">
                  {tabs.find((item) => item.key === activeTab)?.label || "Workspace"}
                </p>
                <p className="rounded-full bg-[#EDF3FF] px-3 py-1 text-xs font-medium text-[#2759C9]">
                  Signed in as {me?.email || "Admin"} ({roleLabel(me?.role)})
                </p>
              </div>
              <p className="mt-2 text-sm text-[#4F617F]">Select a section from the left. Open parent item, then choose a child page.</p>
              {error ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
              {message ? <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
            </section>

            {activeTab === "overview" ? (
              <section className="space-y-4">
                <article className="overflow-hidden rounded-[22px] border border-[#DCE7F6] bg-gradient-to-r from-[#0F1F3A] via-[#1E3A70] to-[#2E67E8] p-5 text-white shadow-[0_15px_36px_rgba(19,39,75,0.25)]">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Dashboard Snapshot</p>
                      <h2 className="mt-2 text-2xl font-semibold">Marketplace Health Overview</h2>
                      <p className="mt-2 text-sm text-white/85">Live operational signal from leads, experts, quality, and escalations.</p>
                      <p className="mt-3 text-xs text-white/75">{overviewDateLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.12em] text-white/80">Top Demand</p>
                      <p className="mt-1 text-xl font-semibold">{topLeadCategory?.category || "No category yet"}</p>
                      <p className="text-sm text-white/85">{topLeadCategory ? `${topLeadCategory.count} active leads` : "Waiting for data"}</p>
                    </div>
                  </div>
                </article>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    {
                      label: "Total Leads (Today / MTD)",
                      value: `${totalLeadsToday} / ${totalLeadsMonthToDate}`,
                      helper: `${totalLeads} total leads tracked`,
                      bar: totalLeadsMonthToDate > 0 ? Math.round((totalLeadsToday / totalLeadsMonthToDate) * 100) : 0,
                      color: "from-[#4F87FF] to-[#70B3FF]",
                    },
                    {
                      label: "Active Experts",
                      value: activeExperts,
                      helper: `${featuredExperts} featured experts`,
                      bar: activeRatio,
                      color: "from-[#2E67E8] to-[#49D2D6]",
                    },
                    {
                      label: "Conversion Rate",
                      value: `${conversionRate}%`,
                      helper: `${connectedIntroductions}/${introductionsCount || 0} connections`,
                      bar: Math.min(100, Math.max(0, Math.round(conversionRate))),
                      color: "from-[#00A97F] to-[#5BD4A8]",
                    },
                    {
                      label: "Average Response Time",
                      value: `${averageResponseTimeHours}h`,
                      helper: "Across active expert pool",
                      bar: Math.max(8, Math.min(100, 100 - Math.round(Math.min(96, averageResponseTimeHours) / 96 * 100))),
                      color: "from-[#8A6BFF] to-[#B6A2FF]",
                    },
                    {
                      label: "High-Value Leads (Flagged)",
                      value: highValueLeads,
                      helper: `${highValueRatio}% of total lead volume`,
                      bar: highValueRatio,
                      color: "from-[#F07B4B] to-[#F6AE65]",
                    },
                  ].map((item) => (
                    <article key={item.label} className="rounded-[20px] border border-[#DCE7F6] bg-white p-4 shadow-[0_8px_20px_rgba(36,57,92,0.08)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7283A0]">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-[#152540]">{item.value}</p>
                      <p className="mt-1 text-xs text-[#5F708C]">{item.helper}</p>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EAF0FC]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${Math.max(8, Math.min(100, item.bar))}%` }}
                        />
                      </div>
                    </article>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                  <article className="rounded-[22px] border border-[#DCE7F6] bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">Lead Category Demand Graph</h2>
                        <p className="mt-1 text-sm text-[#516482]">Visual demand by category based on current lead volume.</p>
                      </div>
                      <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2759C9]">
                        {leadCategoryData.length} categories tracked
                      </span>
                    </div>
                    {leadCategoryData.length > 0 ? (
                      <div className="mt-5">
                        <div className="flex h-44 items-end gap-2 rounded-2xl bg-[#F7FAFF] px-3 pb-3 pt-6">
                          {leadCategoryData.map((item) => {
                            const height = Math.max(16, Math.round((item.count / maxLeadCategoryCount) * 100));
                            return (
                              <div key={`bar-${item.category}`} className="flex flex-1 flex-col items-center gap-2">
                                <span className="text-[11px] font-semibold text-[#2D4771]">{item.count}</span>
                                <div className="w-full rounded-md bg-[#E6EEFF]">
                                  <div
                                    className="w-full rounded-md bg-gradient-to-t from-[#2E67E8] to-[#72A7FF]"
                                    style={{ height: `${height}px` }}
                                  />
                                </div>
                                <span className="line-clamp-2 text-center text-[10px] text-[#556784]">{item.category}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[#6A7C98]">No lead category data yet.</p>
                    )}
                  </article>

                  <article className="rounded-[22px] border border-[#DCE7F6] bg-white p-5">
                    <h2 className="text-xl font-semibold">Expert Capacity Gauge</h2>
                    <p className="mt-1 text-sm text-[#516482]">Active, paused, and featured expert readiness.</p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="relative h-28 w-28 rounded-full" style={{ background: chartStroke }}>
                        <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-white text-center">
                          <div>
                            <p className="text-xl font-semibold text-[#1D2C47]">{activeRatio}%</p>
                            <p className="text-[11px] text-[#5F708C]">active</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-[#324660]">
                        <p><span className="font-semibold">{activeExperts}</span> active experts</p>
                        <p><span className="font-semibold">{Math.max(0, totalExperts - activeExperts)}</span> paused experts</p>
                        <p><span className="font-semibold">{featuredExperts}</span> featured experts</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-[#5F708C]">
                          <span>Active Coverage</span>
                          <span>{activeRatio}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#EAF0FC]">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#2E67E8] to-[#68D4D9]" style={{ width: `${Math.max(8, activeRatio)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-[#5F708C]">
                          <span>High Value Lead Ratio</span>
                          <span>{highValueRatio}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#EAF0FC]">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#00A97F] to-[#5BD4A8]" style={{ width: `${Math.max(8, highValueRatio)}%` }} />
                        </div>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <article className="rounded-[22px] border border-[#DCE7F6] bg-white p-5">
                    <h2 className="text-xl font-semibold">Priority Actions</h2>
                    <p className="mt-1 text-sm text-[#516482]">Focus on the items that need immediate admin action.</p>
                    <div className="mt-4 space-y-2">
                      <div className="rounded-xl border border-[#E6ECF8] bg-[#FBFDFF] px-3 py-3">
                        <p className="text-sm font-semibold text-[#1D2C47]">Leads with no match</p>
                        <p className="text-xs text-[#60728E]">{noMatchLeads} leads currently need manual routing.</p>
                        <button
                          type="button"
                          className="mt-2 rounded-lg bg-[#2E67E8] px-3 py-1.5 text-sm font-semibold text-white"
                          onClick={() => {
                            setActiveTab("leads");
                            setActiveLeadsTab("assignment");
                            setExpandedNav((current) => ({ ...current, leads: true }));
                          }}
                        >
                          Assign Expert
                        </button>
                      </div>
                      <div className="rounded-xl border border-[#E6ECF8] bg-[#FBFDFF] px-3 py-3">
                        <p className="text-sm font-semibold text-[#1D2C47]">Experts not responding</p>
                        <p className="text-xs text-[#60728E]">{notRespondingExperts} experts are above response-time target.</p>
                        <button
                          type="button"
                          className="mt-2 rounded-lg bg-[#E8F9EF] px-3 py-1.5 text-sm font-semibold text-[#12733E]"
                          onClick={() => {
                            setActiveTab("leads");
                            setActiveLeadsTab("escalation");
                            setExpandedNav((current) => ({ ...current, leads: true }));
                          }}
                        >
                          Contact Lead
                        </button>
                      </div>
                      <div className="rounded-xl border border-[#E6ECF8] bg-[#FBFDFF] px-3 py-3">
                        <p className="text-sm font-semibold text-[#1D2C47]">Applications pending approval</p>
                        <p className="text-xs text-[#60728E]">{pendingApplications} applications waiting for final review.</p>
                        <button
                          type="button"
                          className="mt-2 rounded-lg bg-[#13233D] px-3 py-1.5 text-sm font-semibold text-white"
                          onClick={() => {
                            setActiveTab("experts");
                            setActiveExpertsTab("applications");
                            setExpandedNav((current) => ({ ...current, experts: true }));
                          }}
                        >
                          Approve Now
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-[#1D2C47]">Quick Actions</h3>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className="rounded-xl border border-[#D8E4FF] bg-[#F3F7FF] px-3 py-3 text-left text-sm font-semibold text-[#2759C9] transition hover:bg-[#E8F0FF]"
                        onClick={() => {
                          setActiveTab("experts");
                          setActiveExpertsTab("directory");
                          setExpandedNav((current) => ({ ...current, experts: true }));
                        }}
                      >
                        Boost Expert
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-[#DCE7F6] bg-[#13233D] px-3 py-3 text-left text-sm font-semibold text-white transition hover:bg-[#1B3050]"
                        onClick={() => {
                          setActiveTab("experts");
                          setActiveExpertsTab("directory");
                          setExpandedNav((current) => ({ ...current, experts: true }));
                        }}
                      >
                        Pause Expert
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-[#FFD9DE] bg-[#FFF3F5] px-3 py-3 text-left text-sm font-semibold text-[#C8234C] transition hover:bg-[#FFE8ED]"
                        onClick={() => {
                          setActiveTab("experts");
                          setActiveExpertsTab("applications");
                          setExpandedNav((current) => ({ ...current, experts: true }));
                        }}
                      >
                        Flag Expert
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-[#CDEEDB] bg-[#EAF9F1] px-3 py-3 text-left text-sm font-semibold text-[#12733E] transition hover:bg-[#DFF5E8]"
                        onClick={() => {
                          setActiveTab("leads");
                          setActiveLeadsTab("assignment");
                          setExpandedNav((current) => ({ ...current, leads: true }));
                        }}
                      >
                        Assign Lead
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#E6ECF8] bg-[#FBFDFF] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7283A0]">Escalation Snapshot</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-white px-2.5 py-2 text-center">
                          <p className="text-xs text-[#60728E]">No Match</p>
                          <p className="text-lg font-semibold text-[#1D2C47]">{noMatchLeads}</p>
                        </div>
                        <div className="rounded-lg bg-white px-2.5 py-2 text-center">
                          <p className="text-xs text-[#60728E]">High Value</p>
                          <p className="text-lg font-semibold text-[#8A6718]">{highValueEscalationCount}</p>
                        </div>
                        <div className="rounded-lg bg-white px-2.5 py-2 text-center">
                          <p className="text-xs text-[#60728E]">No Response</p>
                          <p className="text-lg font-semibold text-[#1D2C47]">{reports?.notRespondingExperts ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-[22px] border border-[#DCE7F6] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Latest Admin Activity</h2>
                      <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2759C9]">{recentActions.length} events</span>
                    </div>
                    <p className="mt-1 text-sm text-[#516482]">Recent actions with live timestamps.</p>
                    <div className="mt-3 space-y-2">
                      {recentActions.length > 0 ? (
                        recentActions.map((entry) => (
                          <div key={entry.audit_id} className="flex items-center justify-between rounded-lg bg-[#F8FAFF] px-3 py-2 text-sm">
                            <p className="font-medium text-[#263853]">{mapAuditAction(entry.action_type)}</p>
                            <p className="text-xs text-[#60728E]">{formatDateTime(entry.timestamp)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#6A7C98]">No activity yet.</p>
                      )}
                    </div>
                    <div className="mt-4 rounded-xl border border-[#E6ECF8] bg-[#FBFDFF] p-3">
                      <h3 className="text-sm font-semibold text-[#1D2C47]">Operator Notes</h3>
                      <p className="mt-1 text-xs text-[#516482]">Use sidebar dropdowns to enter each module. Technical IDs stay hidden by default.</p>
                    </div>
                  </article>
                </div>
              </section>
            ) : null}

            {activeTab === "experts" ? (
              <section className="rounded-[24px] border border-[#DCE7F6] bg-white p-6">
                {can(me, "expert.view") ? (
                  <>
                    <h2 className="text-2xl font-semibold">Experts</h2>
                    <p className="mt-1 text-sm text-[#5C6F8D]">Use tabs below to open one experts area at a time.</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {expertsSubTabs
                        .filter((tab) => tab.enabled)
                        .map((tab) => {
                          const isActive = activeExpertsTab === tab.key;
                          return (
                            <button
                              key={tab.key}
                              type="button"
                              onClick={() => setActiveExpertsTab(tab.key)}
                              className={`rounded-xl border px-3 py-3 text-left transition ${
                                isActive
                                  ? "border-[#356AF6] bg-[#EEF4FF]"
                                  : "border-[#DCE6F6] bg-white hover:border-[#AFC4EB]"
                              }`}
                            >
                              <p className="text-sm font-semibold text-[#1D2C47]">{tab.label}</p>
                              <p className="mt-1 text-xs text-[#5A6C89]">{tab.helper}</p>
                            </button>
                          );
                        })}
                    </div>

                    {activeExpertsTab === "directory" ? (
                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-[#E2EAF8] bg-[#FBFDFF] p-4">
                          <p className="text-sm font-semibold">Find expert by name</p>
                          <input
                            value={expertQuery}
                            onChange={(event) => setExpertQuery(event.target.value)}
                            placeholder="Search expert name"
                            className="mt-2 h-11 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm"
                          />
                          <div className="mt-2 flex items-center justify-between text-xs text-[#5E6F8A]">
                            <p>Showing {expertOptions.length} result(s)</p>
                            {expertOptions.length > 3 ? <p>Scroll to see more</p> : null}
                          </div>
                          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                            {expertOptions.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setSelectedExpert(option)}
                                className={`w-full rounded-xl border px-3 py-2 text-left ${
                                  selectedExpert?.id === option.id ? "border-[#356AF6] bg-[#EEF4FF]" : "border-[#E1E9F8] bg-white"
                                }`}
                              >
                                <p className="text-sm font-semibold">{option.label}</p>
                                <p className="text-xs text-[#62728C]">{option.subtitle}</p>
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-[#6E7E97]">Tip: type more letters to narrow results.</p>
                        </div>

                        <div className="rounded-2xl border border-[#E2EAF8] bg-[#FFFDF8] p-4">
                          <p className="text-sm font-semibold">Quick status update</p>
                          <p className="mt-1 text-xs text-[#62728C]">Select an expert. We show only the correct next action.</p>
                          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-[#22314C]">
                            {selectedExpert ? `Expert: ${selectedExpert.label}` : "No expert selected"}
                          </p>
                          {selectedExpert ? (
                            <p className="mt-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  selectedExpertIsPaused ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {selectedExpertIsPaused ? "Status: Paused" : "Status: Active"}
                              </span>
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedExpertIsPaused ? (
                              <Button
                                type="button"
                                disabled={!selectedExpert || !can(me, "expert.suspend")}
                                className="rounded-xl bg-[#2E67E8] text-white hover:bg-[#2759C9] disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() =>
                                  selectedExpert &&
                                  runAction(
                                    () => updateExpertState(token, selectedExpert.id, "resume", "Resumed from Super Admin workspace."),
                                    "Expert is active again.",
                                  )
                                }
                              >
                                Resume Expert
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                disabled={!selectedExpert || !can(me, "expert.suspend")}
                                className="rounded-xl bg-[#14223A] text-white hover:bg-[#1D2F4F] disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() =>
                                  selectedExpert &&
                                  runAction(
                                    () => updateExpertState(token, selectedExpert.id, "pause", "Paused from Super Admin workspace."),
                                    "Expert paused from marketplace.",
                                  )
                                }
                              >
                                Pause Expert
                              </Button>
                            )}
                          </div>
                          <div className="mt-3 rounded-lg border border-[#E1E9F8] bg-white p-3">
                            <p className="text-xs font-semibold text-[#5C6F8D]">Quick Boost</p>
                            <div className="mt-2 flex items-center gap-2">
                              <select
                                value={quickBoostPoints}
                                onChange={(event) => setQuickBoostPoints(Number(event.target.value) as 0 | 5 | 10 | 15)}
                                className="h-10 rounded-lg border border-[#D6E1F4] px-2 text-sm"
                              >
                                <option value={0}>No boost</option>
                                <option value={5}>+5</option>
                                <option value={10}>+10</option>
                                <option value={15}>+15</option>
                              </select>
                              <Button
                                type="button"
                                disabled={!selectedExpert || !can(me, "expert.suspend")}
                                className="rounded-lg bg-[#2759C9] text-white hover:bg-[#224eb0] disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() =>
                                  selectedExpert &&
                                  runAction(
                                    () =>
                                      updateExpertBoost(token, selectedExpert.id, {
                                        boostPoints: quickBoostPoints,
                                        notes: "Boost updated from quick actions.",
                                      }),
                                    "Expert boost updated.",
                                  )
                                }
                              >
                                Boost Expert
                              </Button>
                            </div>
                          </div>
                          {!can(me, "expert.suspend") ? (
                            <p className="mt-2 text-xs text-amber-700">Only Admin and Super Admin can pause or resume experts.</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {activeExpertsTab === "applications" ? (
                      <div className="mt-5 space-y-3">
                        {selectedApplicationId ? (
                          (() => {
                            const application = applications.find(a => a.application_id === selectedApplicationId);
                            if (!application) {
                              setSelectedApplicationId(null);
                              return null;
                            }
                            return (
                              <div className="rounded-2xl border border-[#E2EAF8] bg-[#FCFDFF] p-6 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => setSelectedApplicationId(null)}
                                  className="mb-6 text-sm font-semibold text-[#2759C9] hover:underline"
                                >
                                  &larr; Back to Application Queue
                                </button>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                  <h3 className="text-xl font-bold">Expert: {application.expert_name || prettyExpertName(application.expert_id)}</h3>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusChipClass(application.status)}`}>
                                    {application.status.replaceAll("_", " ")}
                                  </span>
                                </div>
                                {application.expert_role && <p className="mb-6 text-base text-[#637590]">{application.expert_role}</p>}

                                <h4 className="text-lg font-semibold text-gray-800 mb-3">Application Details</h4>
                                <div className="bg-[#F8FAFF] rounded-xl p-5 mb-8">
                                  <p className="text-xs text-[#60728E] mb-3">Application ID: {application.application_id}</p>
                                  {application.expert_profile_metadata?.application_snapshot ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                      {Object.entries(application.expert_profile_metadata.application_snapshot as Record<string, any>).map(([key, value]) => {
                                        if (typeof value === "boolean") {
                                          return (
                                            <div key={key}>
                                              <span className="text-[#60728E] block text-xs mb-1 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                              <span className="font-medium text-[#111827]">{value ? "Yes" : "No"}</span>
                                            </div>
                                          );
                                        }
                                        if (typeof value === "string" && value.startsWith("/uploads/")) {
                                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(value);
                                          return (
                                            <div key={key}>
                                              <span className="text-[#60728E] block text-xs mb-1 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                              {isImage ? (
                                                <a href={`http://localhost:5000${value}`} target="_blank" rel="noreferrer" className="block mt-2">
                                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                                  <img src={`http://localhost:5000${value}`} alt={key} className="max-w-full h-auto max-h-32 object-contain rounded-md border border-[#E2EAF8] shadow-sm bg-white" />
                                                </a>
                                              ) : (
                                                <a href={`http://localhost:5000${value}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 transition">
                                                  View Document <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                </a>
                                              )}
                                            </div>
                                          );
                                        }
                                        return (
                                          <div key={key} className={value && String(value).length > 60 ? "md:col-span-2" : ""}>
                                            <span className="text-[#60728E] block text-xs mb-1 uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="font-medium text-[#111827]">{value ? String(value) : "—"}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      {application.expert_organization && <div><span className="text-[#60728E] block text-xs mb-1">Organization</span><span className="font-medium text-[#111827]">{application.expert_organization}</span></div>}
                                      {application.expert_location && <div><span className="text-[#60728E] block text-xs mb-1">Location</span><span className="font-medium text-[#111827]">{application.expert_location}</span></div>}
                                      {application.expert_availability_status && <div><span className="text-[#60728E] block text-xs mb-1">Availability</span><span className="font-medium text-[#111827]">{application.expert_availability_status}</span></div>}
                                      {application.expert_hourly_rate_usd && <div><span className="text-[#60728E] block text-xs mb-1">Hourly Rate</span><span className="font-medium text-[#111827]">${application.expert_hourly_rate_usd}</span></div>}
                                      {application.expert_category_tags && application.expert_category_tags.length > 0 && <div><span className="text-[#60728E] block text-xs mb-1">Categories</span><span className="font-medium text-[#111827]">{application.expert_category_tags.join(", ")}</span></div>}
                                      {application.expert_service_tags && application.expert_service_tags.length > 0 && <div><span className="text-[#60728E] block text-xs mb-1">Services</span><span className="font-medium text-[#111827]">{application.expert_service_tags.join(", ")}</span></div>}
                                    </div>
                                  )}
                                </div>

                                <h4 className="text-lg font-semibold text-gray-800 mb-3">Admin Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                  {can(me, "expert.approve") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        runAction(() => updateExpertApplication(token, application.application_id, "approve", "Approved from admin workspace."), "Application approved.");
                                        setSelectedApplicationId(null);
                                      }}
                                      className="rounded-lg bg-[#E8F9EF] px-4 py-2 text-sm font-semibold text-[#12733E] hover:bg-[#D1F3DF] transition"
                                    >
                                      Approve Application
                                    </button>
                                  )}
                                  {can(me, "expert.request_info") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRequestInfoModal({ isOpen: true, appId: application.application_id, reason: "" });
                                      }}
                                      className="rounded-lg bg-[#FFF4D8] px-4 py-2 text-sm font-semibold text-[#A56A08] hover:bg-[#FFEAB0] transition"
                                    >
                                      Request Info
                                    </button>
                                  )}
                                  {can(me, "expert.recommend") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        runAction(() => updateExpertApplication(token, application.application_id, "recommend", "Recommended for admin review."), "Recommendation sent.");
                                      }}
                                      className="rounded-lg bg-[#EEF3FF] px-4 py-2 text-sm font-semibold text-[#2759C9] hover:bg-[#D6E3FF] transition"
                                    >
                                      Recommend
                                    </button>
                                  )}
                                  {can(me, "expert.recommend") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        runAction(() => updateExpertApplication(token, application.application_id, "flag", "Flagged for admin escalation."), "Expert flagged for review.");
                                      }}
                                      className="rounded-lg bg-[#FFF0F2] px-4 py-2 text-sm font-semibold text-[#C8234C] hover:bg-[#FFE0E6] transition"
                                    >
                                      Flag Expert
                                    </button>
                                  )}
                                  {can(me, "expert.reject") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        runAction(() => updateExpertApplication(token, application.application_id, "reject", "Rejected from admin workspace."), "Application rejected.");
                                        setSelectedApplicationId(null);
                                      }}
                                      className="rounded-lg bg-[#FFF0F2] px-4 py-2 text-sm font-semibold text-[#C8234C] hover:bg-[#FFE0E6] transition"
                                    >
                                      Reject Application
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold">Application Queue</h3>
                            {applications.map((application) => (
                              <article key={application.application_id} className="rounded-2xl border border-[#E2EAF8] bg-[#FCFDFF] p-4 hover:shadow-md transition">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-base font-semibold cursor-pointer text-[#2759C9] hover:underline" onClick={() => setSelectedApplicationId(application.application_id)}>
                                Expert: {application.expert_name || prettyExpertName(application.expert_id)}
                              </p>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusChipClass(application.status)}`}>
                                {application.status.replaceAll("_", " ")}
                              </span>
                            </div>
                            {application.expert_role ? <p className="mt-1 text-sm text-[#637590]">Specialty: {application.expert_role}</p> : null}

                            <div className="mt-4">
                              <button 
                                type="button" 
                                onClick={() => setSelectedApplicationId(application.application_id)}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                              >
                                View Full Application Details
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                              </button>
                            </div>
                          </article>
                        ))}
                        {applications.length === 0 ? <p className="text-sm text-[#6A7C98]">No expert applications yet.</p> : null}
                          </>
                        )}
                      </div>
                    ) : null}

                    {activeExpertsTab === "reviews" && (can(me, "review.moderate_recommend") || can(me, "review.moderate_final")) ? (
                      <div className="mt-5 space-y-3">
                        <h3 className="text-lg font-semibold">Reviews & Feedback</h3>
                        <p className="text-sm text-[#60728E]">
                          Moderators can recommend only. Admin and Super Admin make the final decision.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl bg-[#F8FAFF] px-3 py-2">
                            <p className="text-xs text-[#60728E]">Approved Reviews</p>
                            <p className="text-xl font-semibold text-[#1D2C47]">{reviewsFeedbackSummary?.trends.approved_review_count ?? 0}</p>
                          </div>
                          <div className="rounded-xl bg-[#FFF8E8] px-3 py-2">
                            <p className="text-xs text-[#8A6718]">Low Ratings Alert</p>
                            <p className="text-xl font-semibold text-[#8A6718]">{reviewsFeedbackSummary?.trends.low_rating_count ?? 0}</p>
                          </div>
                          <div className="rounded-xl bg-[#FFF0F2] px-3 py-2">
                            <p className="text-xs text-[#C8234C]">Suspicious Flags</p>
                            <p className="text-xl font-semibold text-[#C8234C]">{reviewsFeedbackSummary?.trends.suspicious_count ?? 0}</p>
                          </div>
                        </div>
                        {moderationReviews.slice(0, 12).map((review) => (
                          <article key={review.feedback_id} className="rounded-2xl border border-[#E2EAF8] bg-[#FCFDFF] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-base font-semibold">
                                {review.expert_label || "Expert"} {review.lead_label ? `• Lead: ${review.lead_label}` : ""}
                              </p>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusChipClass(review.review_status)}`}>
                                {review.review_status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[#62728C]">
                              Rating: {review.public_star_rating ?? "n/a"} • Pending recommendations:{" "}
                              {review.pending_recommendations_count ?? 0}
                            </p>
                            {review.public_review_comment ? (
                              <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm text-[#22314C]">{review.public_review_comment}</p>
                            ) : null}
                            {review.is_suspicious ? (
                              <p className="mt-2 rounded-lg bg-[#FFF0F2] px-3 py-2 text-xs text-[#C8234C]">
                                Suspicious flag: {review.suspicious_notes || "Marked for investigation"}
                              </p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {can(me, "review.moderate_recommend") && me?.role === "moderator" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      runAction(
                                        () =>
                                          postReviewRecommendation(token, review.feedback_id, {
                                            recommendation: "approve",
                                            notes: "Moderator recommends approve.",
                                          }),
                                        "Recommendation (approve) submitted.",
                                      )
                                    }
                                    className="rounded-lg bg-[#EEF3FF] px-3 py-1.5 text-sm font-semibold text-[#2759C9]"
                                  >
                                    Recommend Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      runAction(
                                        () =>
                                          postReviewRecommendation(token, review.feedback_id, {
                                            recommendation: "reject",
                                            notes: "Moderator recommends reject.",
                                          }),
                                        "Recommendation (reject) submitted.",
                                      )
                                    }
                                    className="rounded-lg bg-[#FFF0F2] px-3 py-1.5 text-sm font-semibold text-[#C8234C]"
                                  >
                                    Recommend Reject
                                  </button>
                                </>
                              ) : null}

                              {can(me, "review.moderate_final") ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      runAction(
                                        () =>
                                          patchReviewModeration(token, review.feedback_id, {
                                            reviewStatus: "approved",
                                            notes: "Final approval from admin workspace.",
                                          }),
                                        "Review approved.",
                                      )
                                    }
                                    className="rounded-lg bg-[#E8F9EF] px-3 py-1.5 text-sm font-semibold text-[#12733E]"
                                  >
                                    Final Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      runAction(
                                        () =>
                                          patchReviewModeration(token, review.feedback_id, {
                                            reviewStatus: "rejected",
                                            notes: "Final rejection from admin workspace.",
                                          }),
                                        "Review rejected.",
                                      )
                                    }
                                    className="rounded-lg bg-[#FFF0F2] px-3 py-1.5 text-sm font-semibold text-[#C8234C]"
                                  >
                                    Final Reject
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      runAction(
                                        () =>
                                          patchReviewSuspicious(token, review.feedback_id, {
                                            isSuspicious: !review.is_suspicious,
                                            notes: review.is_suspicious ? "Suspicious flag removed." : "Flagged as suspicious by admin.",
                                          }),
                                        review.is_suspicious ? "Suspicious flag removed." : "Suspicious flag added.",
                                      )
                                    }
                                    className="rounded-lg bg-[#FFF8E8] px-3 py-1.5 text-sm font-semibold text-[#8A6718]"
                                  >
                                    {review.is_suspicious ? "Unflag Suspicious" : "Flag Suspicious"}
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </article>
                        ))}
                        {moderationReviews.length === 0 ? <p className="text-sm text-[#6A7C98]">No review items to moderate.</p> : null}

                        <div className="rounded-2xl border border-[#E2EAF8] bg-[#FFFDF8] p-4">
                          <h4 className="text-base font-semibold">Feedback Alerts</h4>
                          <div className="mt-2 space-y-2 text-sm">
                            <p className="font-medium text-[#1D2C47]">Multiple low ratings:</p>
                            {(reviewsFeedbackSummary?.alerts.multiple_low_ratings || []).slice(0, 5).map((alert) => (
                              <p key={`low-${alert.expert_id}`} className="text-[#C8234C]">
                                {alert.expert_name}: {alert.low_feedback_count} low-feedback reports
                              </p>
                            ))}
                            {(reviewsFeedbackSummary?.alerts.multiple_low_ratings || []).length === 0 ? (
                              <p className="text-[#6A7C98]">No low-rating clusters detected.</p>
                            ) : null}

                            <p className="mt-3 font-medium text-[#1D2C47]">Experts not responding:</p>
                            {(reviewsFeedbackSummary?.alerts.not_responding_experts || []).slice(0, 5).map((alert) => (
                              <p key={`slow-${alert.expert_id}`} className="text-[#8A6718]">
                                {alert.expert_name}: {alert.response_time_hours}h average response
                              </p>
                            ))}
                            {(reviewsFeedbackSummary?.alerts.not_responding_experts || []).length === 0 ? (
                              <p className="text-[#6A7C98]">No response-time alerts.</p>
                            ) : null}
                          </div>
                        </div>

                        {can(me, "review.moderate_final") ? (
                          <div className="space-y-3">
                            <h4 className="text-base font-semibold">Pending Moderator Recommendations</h4>
                            {reviewRecommendations.slice(0, 12).map((item) => (
                              <article key={item.id} className="rounded-2xl border border-[#E2EAF8] bg-[#FCFDFF] p-4">
                                <p className="text-sm font-semibold">
                                  {item.recommendation === "approve" ? "Recommend Approve" : "Recommend Reject"} • {item.moderator_email || "Moderator"}
                                </p>
                                <p className="mt-1 text-xs text-[#62728C]">
                                  Review ID: {item.review_id} • Status: {item.review?.review_status || "pending"}
                                </p>
                                {item.notes ? <p className="mt-2 text-sm text-[#22314C]">{item.notes}</p> : null}
                              </article>
                            ))}
                            {reviewRecommendations.length === 0 ? (
                              <p className="text-sm text-[#6A7C98]">No pending moderator recommendations.</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {activeExpertsTab === "performance" ? (
                      <div className="mt-5 space-y-3">
                        <h3 className="text-lg font-semibold">Expert Performance Dashboard</h3>
                        <div className="grid gap-3">
                          {expertPerformance.slice(0, 12).map((row) => (
                            <article key={row.expert_id} className="rounded-2xl border border-[#E2EAF8] bg-[#FCFDFF] p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-base font-semibold">{row.expert_name}</p>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    row.status_label === "High Performer"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : row.status_label === "New Expert"
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {row.status_label}
                                </span>
                              </div>
                              <div className="mt-3 grid gap-2 text-sm text-[#4F617F] sm:grid-cols-3">
                                <p>Profile views: <span className="font-semibold text-[#1D2C47]">{row.profile_views}</span></p>
                                <p>Impressions: <span className="font-semibold text-[#1D2C47]">{row.impressions}</span></p>
                                <p>CTR: <span className="font-semibold text-[#1D2C47]">{row.click_through_rate}%</span></p>
                                <p>Response time: <span className="font-semibold text-[#1D2C47]">{row.response_time_hours}h</span></p>
                                <p>Conversion: <span className="font-semibold text-[#1D2C47]">{row.conversion_rate}%</span></p>
                                <p>Rating: <span className="font-semibold text-[#1D2C47]">{row.rating.toFixed(1)}</span></p>
                              </div>
                            </article>
                          ))}
                          {expertPerformance.length === 0 ? <p className="text-sm text-[#6A7C98]">No expert performance data yet.</p> : null}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-[#6A7C98]">Only roles with expert access can open this section.</p>
                )}
              </section>
            ) : null}

            {activeTab === "leads" ? (
              <section className="rounded-[24px] border border-[#DCE7F6] bg-white p-6">
            {can(me, "lead.assign") || can(me, "report.view") ? (
              <>
                <h2 className="text-2xl font-semibold">Leads</h2>
                <p className="mt-1 text-sm text-[#5C6F8D]">Assign leads without technical IDs. Search and select records by name/email.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {leadsSubTabs
                    .filter((tab) => tab.enabled)
                    .map((tab) => (
                      <button
                        key={`lead-sub-${tab.key}`}
                        type="button"
                        onClick={() => setActiveLeadsTab(tab.key)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          activeLeadsTab === tab.key ? "bg-[#2E67E8] text-white" : "bg-[#EEF3FF] text-[#2759C9] hover:bg-[#DFE9FF]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                </div>

                {activeLeadsTab === "assignment" && can(me, "lead.assign") ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#E2EAF8] bg-[#FBFDFF] p-4">
                      <p className="text-sm font-semibold">Step 1: Find lead</p>
                      <input
                        value={leadQuery}
                        onChange={(event) => setLeadQuery(event.target.value)}
                        placeholder="Search lead name or email"
                        className="mt-2 h-11 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-[#5E6F8A]">
                        <p>Showing {leadOptions.length} lead(s)</p>
                        {leadOptions.length > 3 ? <p>Scroll to see more</p> : null}
                      </div>
                      <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                        {leadOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedLead(option)}
                            className={`w-full rounded-xl border px-3 py-2 text-left ${
                              selectedLead?.id === option.id ? "border-[#356AF6] bg-[#EEF4FF]" : "border-[#E1E9F8] bg-white"
                            }`}
                          >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="text-xs text-[#62728C]">{option.subtitle}</p>
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[#6E7E97]">Tip: search by name or email to find faster.</p>
                    </div>

                    <div className="rounded-2xl border border-[#E2EAF8] bg-[#FBFDFF] p-4">
                      <p className="text-sm font-semibold">Step 2: Find expert</p>
                      <input
                        value={expertQuery}
                        onChange={(event) => setExpertQuery(event.target.value)}
                        placeholder="Search expert name"
                        className="mt-2 h-11 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-[#5E6F8A]">
                        <p>Showing {expertOptions.length} expert(s)</p>
                        {expertOptions.length > 3 ? <p>Scroll to see more</p> : null}
                      </div>
                      <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                        {expertOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedExpert(option)}
                            className={`w-full rounded-xl border px-3 py-2 text-left ${
                              selectedExpert?.id === option.id ? "border-[#356AF6] bg-[#EEF4FF]" : "border-[#E1E9F8] bg-white"
                            }`}
                          >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="text-xs text-[#62728C]">{option.subtitle}</p>
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[#6E7E97]">Tip: select one expert to continue assignment.</p>
                    </div>

                    <div className="rounded-2xl border border-[#E2EAF8] bg-[#FFFDF8] p-4">
                      <p className="text-sm font-semibold">Step 3: Confirm assignment</p>
                      <textarea
                        value={assignmentReason}
                        onChange={(event) => setAssignmentReason(event.target.value)}
                        placeholder="Reason for assignment"
                        className="mt-2 h-24 w-full rounded-xl border border-[#D6E1F4] px-3 py-2 text-sm"
                      />
                      <Button
                        type="button"
                        disabled={!selectedLead || !selectedExpert || !assignmentReason.trim()}
                        className="mt-3 w-full rounded-xl bg-[#2E67E8] text-white hover:bg-[#2759C9] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                          selectedLead &&
                          selectedExpert &&
                          runAction(
                            () =>
                              postLeadAssignment(token, {
                                leadId: selectedLead.id,
                                expertId: selectedExpert.id,
                                assignmentReason: assignmentReason.trim(),
                              }),
                            "Lead assigned successfully.",
                          )
                        }
                      >
                        Assign Lead
                      </Button>
                      <p className="mt-2 text-xs text-[#62728C]">System IDs are internal tracking codes. You do not need them for normal actions.</p>
                    </div>
                  </div>
                ) : activeLeadsTab === "assignment" ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Only Admin and Super Admin can manually assign leads.</p>
                ) : null}

                {activeLeadsTab === "assignment" ? (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-lg font-semibold">Recent assignments</h3>
                    {leadAssignments.slice(0, 8).map((assignment) => (
                      <article key={assignment.assignment_id} className="rounded-xl border border-[#E1E9F8] bg-[#FCFDFF] p-3">
                        <p className="text-sm font-semibold">
                          {assignment.lead_label || "Lead"} → {assignment.expert_label || "Expert"}
                        </p>
                        <p className="mt-1 text-xs text-[#62728C]">
                          By {roleLabel(assignment.assigned_by_role)} • {assignment.is_high_value_lead ? "High value" : "Standard"} • {formatDateTime(assignment.created_at)}
                        </p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-[#60728E]">Technical details</summary>
                          <p className="mt-1 text-xs text-[#60728E]">Lead ID: {assignment.lead_id}</p>
                          <p className="text-xs text-[#60728E]">Expert ID: {assignment.expert_id}</p>
                        </details>
                      </article>
                    ))}
                    {leadAssignments.length === 0 ? <p className="text-sm text-[#6A7C98]">No lead assignments yet.</p> : null}
                  </div>
                ) : null}

                {activeLeadsTab === "escalation" ? (
                <div className="mt-6 rounded-2xl border border-[#E2EAF8] bg-[#FBFDFF] p-4">
                  <h3 className="text-lg font-semibold">No Match Fallback (Lead Escalation)</h3>
                  <p className="mt-1 text-sm text-[#62728C]">
                    Protect high-value opportunities by escalating unmatched leads for manual routing.
                  </p>
                  <div className="mt-3 space-y-2">
                    {leadEscalations.slice(0, 12).map((lead) => (
                      <article key={lead.id} className="rounded-xl border border-[#E1E9F8] bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{lead.label}</p>
                          {lead.is_high_value ? (
                            <span className="rounded-full bg-[#FFF0F2] px-2.5 py-1 text-xs font-semibold text-[#C8234C]">
                              High-value lead
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-xs font-semibold text-[#2759C9]">
                              Standard lead
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#62728C]">{lead.subtitle}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-[#2E67E8] px-3 py-1.5 text-sm font-semibold text-white"
                            onClick={() => {
                              setSelectedLead({ id: lead.id, label: lead.label, subtitle: lead.subtitle });
                              setActiveTab("leads");
                            }}
                          >
                            Assign Manually
                          </button>
                          {lead.work_email ? (
                            <a
                              className="rounded-lg bg-[#E8F9EF] px-3 py-1.5 text-sm font-semibold text-[#12733E]"
                              href={`mailto:${lead.work_email}?subject=SmartLink Follow-up&body=Hi,%20we%20are%20helping%20route%20your%20request%20to%20the%20right%20expert.`}
                            >
                              Contact Client
                            </a>
                          ) : (
                            <span className="rounded-lg bg-[#F0F3F8] px-3 py-1.5 text-sm font-semibold text-[#6A7C98]">No email available</span>
                          )}
                        </div>
                      </article>
                    ))}
                    {leadEscalations.length === 0 ? <p className="text-sm text-[#6A7C98]">No unmatched leads in escalation queue.</p> : null}
                  </div>
                </div>
                ) : null}

                {activeLeadsTab === "overrides" && can(me, "match.override.manage") ? (
                  <div className="mt-6 rounded-2xl border border-[#E2EAF8] bg-[#FFFDF8] p-4">
                    <h3 className="text-lg font-semibold">Match Overrides (Super Admin)</h3>
                    <p className="mt-1 text-sm text-[#62728C]">
                      Lock expert order for one lead. This override applies only to that lead/request.
                    </p>
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold">1) Choose lead</p>
                        <input
                          value={leadQuery}
                          onChange={(event) => setLeadQuery(event.target.value)}
                          placeholder="Search lead name or email"
                          className="mt-2 h-11 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm"
                        />
                        <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                          {leadOptions.map((option) => (
                            <button
                              key={`override-lead-${option.id}`}
                              type="button"
                              onClick={() => setOverrideLead(option)}
                              className={`w-full rounded-xl border px-3 py-2 text-left ${
                                overrideLead?.id === option.id ? "border-[#356AF6] bg-[#EEF4FF]" : "border-[#E1E9F8] bg-white"
                              }`}
                            >
                              <p className="text-sm font-semibold">{option.label}</p>
                              <p className="text-xs text-[#62728C]">{option.subtitle}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold">2) Build expert order</p>
                        <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                          {expertOptions.map((option) => (
                            <button
                              key={`override-expert-${option.id}`}
                              type="button"
                              onClick={() => {
                                setOverrideExpertOrder((current) => (current.includes(option.id) ? current : [...current, option.id]));
                              }}
                              className="w-full rounded-xl border border-[#E1E9F8] bg-white px-3 py-2 text-left"
                            >
                              <p className="text-sm font-semibold">{option.label}</p>
                              <p className="text-xs text-[#62728C]">{option.subtitle}</p>
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-[#60728E]">Tap experts to add them in order.</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold">3) Confirm and save</p>
                      <div className="mt-2 space-y-2">
                        {overrideExpertLabels.length > 0 ? (
                          overrideExpertLabels.map((label, index) => (
                            <div key={`${label}-${index}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                              <span>
                                {index + 1}. {label}
                              </span>
                              <button
                                type="button"
                                className="text-xs font-semibold text-rose-600"
                                onClick={() =>
                                  setOverrideExpertOrder((current) => current.filter((_, i) => i !== index))
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#6A7C98]">No experts selected yet.</p>
                        )}
                      </div>
                      <textarea
                        value={overrideNotes}
                        onChange={(event) => setOverrideNotes(event.target.value)}
                        placeholder="Reason for override (optional)"
                        className="mt-3 h-20 w-full rounded-xl border border-[#D6E1F4] px-3 py-2 text-sm"
                      />
                      <Button
                        type="button"
                        disabled={!overrideLead || overrideExpertOrder.length === 0}
                        className="mt-3 rounded-xl bg-[#2E67E8] text-white hover:bg-[#2759C9] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                          overrideLead &&
                          runAction(
                            async () => {
                              await createMatchOverride(token, {
                                leadId: overrideLead.id,
                                orderedExpertIds: overrideExpertOrder,
                                allowHiddenExperts: false,
                                notes: overrideNotes.trim() || undefined,
                              });
                              setOverrideExpertOrder([]);
                              setOverrideNotes("");
                            },
                            "Match override saved.",
                          )
                        }
                      >
                        Save Match Override
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold">Active overrides</p>
                      {matchOverrides
                        .filter((item) => item.is_active)
                        .slice(0, 10)
                        .map((item) => (
                          <article key={item.id} className="rounded-xl border border-[#E1E9F8] bg-[#FCFDFF] p-3">
                            <p className="text-sm font-semibold">{item.lead_label ? `Lead: ${item.lead_label}` : `Assessment: ${item.assessment_id}`}</p>
                            <p className="mt-1 text-xs text-[#62728C]">
                              Order: {(item.ordered_expert_labels || item.ordered_expert_ids).join(" → ")}
                            </p>
                            <Button
                              type="button"
                              className="mt-2 rounded-lg bg-[#162742] text-white hover:bg-[#20365A]"
                              onClick={() =>
                                runAction(
                                  () => patchMatchOverride(token, item.id, { isActive: false, notes: "Disabled from admin workspace." }),
                                  "Match override disabled.",
                                )
                              }
                            >
                              Disable Override
                            </Button>
                          </article>
                        ))}
                      {matchOverrides.filter((item) => item.is_active).length === 0 ? (
                        <p className="text-sm text-[#6A7C98]">No active overrides.</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-[#6A7C98]">You do not have permission for leads in this role.</p>
            )}
              </section>
            ) : null}

            {activeTab === "team" ? (
              <section className="rounded-[24px] border border-[#DCE7F6] bg-white p-6">
            {can(me, "user.role.manage") ? (
              <>
                <h2 className="text-2xl font-semibold">Team Roles</h2>
                <p className="mt-1 text-sm text-[#5C6F8D]">Search by email or name. Select a person and assign a role.</p>

                <article className="mt-4 rounded-2xl border border-[#E2EAF8] bg-[#FFFDF8] p-4">
                  <h3 className="text-lg font-semibold">Create Admin User</h3>
                  <p className="mt-1 text-xs text-[#62728C]">Create login account and assign role in one step.</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      value={newAdminEmail}
                      onChange={(event) => setNewAdminEmail(event.target.value)}
                      placeholder="Email address"
                      className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm"
                    />
                    <input
                      value={newAdminName}
                      onChange={(event) => setNewAdminName(event.target.value)}
                      placeholder="Full name (optional)"
                      className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm"
                    />
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(event) => setNewAdminPassword(event.target.value)}
                      placeholder="Temporary password (min 8 chars)"
                      className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm"
                    />
                    <select
                      value={newAdminRole}
                      onChange={(event) => setNewAdminRole(event.target.value as AdminRole)}
                      className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={newAdminNotes}
                    onChange={(event) => setNewAdminNotes(event.target.value)}
                    placeholder="Note (optional)"
                    className="mt-3 h-11 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      disabled={!newAdminEmail.trim() || newAdminPassword.length < 8}
                      className="rounded-xl bg-[#2E67E8] text-white hover:bg-[#2759C9] disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() =>
                        runAction(
                          async () => {
                            await createAdminUser(token, {
                              email: newAdminEmail.trim(),
                              password: newAdminPassword,
                              fullName: newAdminName.trim() || undefined,
                              role: newAdminRole,
                              notes: newAdminNotes.trim() || undefined,
                            });
                            setNewAdminEmail("");
                            setNewAdminPassword("");
                            setNewAdminName("");
                            setNewAdminRole("admin");
                            setNewAdminNotes("");
                            setRoleQuery("");
                          },
                          "Admin user created and role assigned.",
                        )
                      }
                    >
                      Create Admin User
                    </Button>
                    <p className="text-xs text-[#62728C]">Share this password securely and ask user to change it after first login.</p>
                  </div>
                </article>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-[#E2EAF8] bg-[#FBFDFF] p-4 lg:col-span-2">
                    <p className="text-sm font-semibold">Find user by email or name</p>
                    <input
                      value={roleQuery}
                      onChange={(event) => setRoleQuery(event.target.value)}
                      placeholder="Search email or name"
                      className="mt-2 h-11 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-[#5E6F8A]">
                      <p>Showing {userOptions.length} user(s)</p>
                      {userOptions.length > 3 ? <p>Scroll to see more</p> : null}
                    </div>
                    <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                      {userOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedUser(option)}
                          className={`w-full rounded-xl border px-3 py-2 text-left ${
                            selectedUser?.id === option.id ? "border-[#356AF6] bg-[#EEF4FF]" : "border-[#E1E9F8] bg-white"
                          }`}
                        >
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="text-xs text-[#62728C]">{option.subtitle}</p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[#6E7E97]">Tip: choose a user first, then assign or revoke role.</p>
                  </div>

                  <div className="rounded-2xl border border-[#E2EAF8] bg-[#FFFDF8] p-4">
                    <p className="text-sm font-semibold">Assign role</p>
                    <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as AdminRole)} className="mt-2 h-11 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm">
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                    <input
                      value={roleNotes}
                      onChange={(event) => setRoleNotes(event.target.value)}
                      placeholder="Short note (optional)"
                      className="mt-2 h-11 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm"
                    />
                    <div className="mt-3 grid gap-2">
                      <Button
                        type="button"
                        disabled={!selectedUser}
                        className="rounded-xl bg-[#2E67E8] text-white hover:bg-[#2759C9] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                          selectedUser &&
                          runAction(
                            () => assignAdminRole(token, { userId: selectedUser.id, role: selectedRole, notes: roleNotes || undefined }),
                            "Role assigned.",
                          )
                        }
                      >
                        Assign Role
                      </Button>
                      <Button
                        type="button"
                        disabled={!selectedUser}
                        className="rounded-xl bg-[#162742] text-white hover:bg-[#20365A] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                          selectedUser &&
                          runAction(
                            () => revokeAdminRole(token, { userId: selectedUser.id, role: selectedRole, notes: roleNotes || undefined }),
                            "Role revoked.",
                          )
                        }
                      >
                        Revoke Role
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-semibold">Current role assignments</h3>
                  {roles.slice(0, 20).map((item) => (
                    <article key={item.id} className="rounded-xl border border-[#E1E9F8] bg-[#FCFDFF] p-3">
                      <p className="text-sm font-semibold">{item.user_email || item.user_name || "User account"}</p>
                      <p className="mt-1 text-xs text-[#62728C]">
                        {roleLabel(item.role)} • {item.is_active ? "Active" : "Inactive"}
                      </p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-[#60728E]">Technical details</summary>
                        <p className="mt-1 text-xs text-[#60728E]">User ID: {item.user_id}</p>
                      </details>
                    </article>
                  ))}
                  {roles.length === 0 ? <p className="text-sm text-[#6A7C98]">No role assignments yet.</p> : null}
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Only Super Admin can change user roles.</p>
            )}
              </section>
            ) : null}

            {activeTab === "settings" ? (
          <section className="rounded-[24px] border border-[#DCE7F6] bg-white p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Settings</h2>
            <p className="text-sm text-[#5C6F8D]">Use simple values and click save. Changes apply immediately to new matches and lead operations.</p>
            <div className="flex flex-wrap gap-2">
              {settingsSubTabs
                .filter((tab) => tab.enabled)
                .map((tab) => (
                  <button
                    key={`settings-sub-${tab.key}`}
                    type="button"
                    onClick={() => setActiveSettingsTab(tab.key)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      activeSettingsTab === tab.key ? "bg-[#2E67E8] text-white" : "bg-[#EEF3FF] text-[#2759C9] hover:bg-[#DFE9FF]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>

            {activeSettingsTab === "matching" && can(me, "settings.matching.manage") ? (
              <article className="rounded-2xl border border-[#E2EAF8] bg-[#FBFDFF] p-4">
                <h3 className="text-lg font-semibold">Matching Engine Settings</h3>
                <p className="mt-1 text-xs text-[#62728C]">Tune relevance weights and output size without code changes.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#D6E1F4] bg-white p-3">
                    <p className="text-xs text-[#60728E]">Minimum Match Score</p>
                    <p className="mt-1 text-sm font-semibold text-[#1D2C47]">{rankingMinBase}</p>
                    <input
                      type="range"
                      min={50}
                      max={95}
                      step={1}
                      value={rankingMinBase}
                      onChange={(event) => setRankingMinBase(event.target.value)}
                      className="mt-2 w-full"
                    />
                  </div>
                  <div className="rounded-xl border border-[#D6E1F4] bg-white p-3">
                    <p className="text-xs text-[#60728E]">Number of experts shown (3-5)</p>
                    <p className="mt-1 text-sm font-semibold text-[#1D2C47]">{rankingExpertsShown}</p>
                    <input
                      type="range"
                      min={3}
                      max={5}
                      step={1}
                      value={rankingExpertsShown}
                      onChange={(event) => setRankingExpertsShown(event.target.value)}
                      className="mt-2 w-full"
                    />
                  </div>
                  <label className="text-xs text-[#60728E]">
                    Featured boost (+5/+10/+15)
                    <select value={rankingFeaturedBoost} onChange={(event) => setRankingFeaturedBoost(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#D6E1F4] px-2 text-sm">
                      <option value="5">+5</option>
                      <option value="10">+10</option>
                      <option value="15">+15</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Category Match", value: weightCategory, setter: setWeightCategory, max: 30 },
                    { label: "Urgency", value: weightUrgency, setter: setWeightUrgency, max: 20 },
                    { label: "Budget", value: weightBudget, setter: setWeightBudget, max: 20 },
                    { label: "Reputation", value: weightReputation, setter: setWeightReputation, max: 15 },
                    { label: "Location", value: weightLocation, setter: setWeightLocation, max: 10 },
                  ].map((item) => (
                    <label key={item.label} className="text-xs text-[#60728E]">
                      {item.label}: <span className="font-semibold text-[#1D2C47]">{item.value}</span>
                      <input
                        type="range"
                        min={0}
                        max={item.max}
                        step={1}
                        value={item.value}
                        onChange={(event) => item.setter(event.target.value)}
                        className="mt-1 w-full"
                      />
                    </label>
                  ))}
                </div>

                <Button
                  type="button"
                  className="mt-3 rounded-xl bg-[#2E67E8] text-white hover:bg-[#2759C9]"
                  onClick={() =>
                    runAction(
                      () =>
                        patchRankingConfig(token, {
                          minimum_base_match_score: Number(rankingMinBase),
                          number_of_experts_displayed: Number(rankingExpertsShown),
                          featured_boost_value: Number(rankingFeaturedBoost),
                          weight_category: Number(weightCategory),
                          weight_urgency: Number(weightUrgency),
                          weight_budget: Number(weightBudget),
                          weight_reputation: Number(weightReputation),
                          weight_location: Number(weightLocation),
                        }),
                      "Matching Engine Settings updated.",
                    )
                  }
                >
                  Save Matching Engine Settings
                </Button>
                {rankingConfig ? <p className="mt-2 text-xs text-[#62728C]">Latest matching settings loaded.</p> : null}
              </article>
            ) : activeSettingsTab === "matching" ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Only Super Admin can change matching settings.</p>
            ) : null}

            {activeSettingsTab === "pricing" && can(me, "settings.pricing.manage") ? (
              <article className="rounded-2xl border border-[#E2EAF8] bg-[#FFFDF8] p-4">
                <h3 className="text-lg font-semibold">Pricing & Lead Value Settings</h3>
                <p className="mt-1 text-xs text-[#62728C]">Configure monetization tiers and high-value lead criteria.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <input value={priceLow} onChange={(event) => setPriceLow(event.target.value)} placeholder="Low lead price" className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm" />
                  <input value={priceMedium} onChange={(event) => setPriceMedium(event.target.value)} placeholder="Medium lead price" className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm" />
                  <input value={priceHigh} onChange={(event) => setPriceHigh(event.target.value)} placeholder="High lead price" className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm" />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[#4F617F]">
                    <input type="checkbox" checked={requireUrgent} onChange={(event) => setRequireUrgent(event.target.checked)} />
                    Require Urgent
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-[#4F617F]">
                    <input type="checkbox" checked={requireBudget} onChange={(event) => setRequireBudget(event.target.checked)} />
                    Require Budget
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-[#4F617F]">
                    <input type="checkbox" checked={requireIntent} onChange={(event) => setRequireIntent(event.target.checked)} />
                    Require Intent
                  </label>
                </div>
                <label className="mt-3 block text-xs text-[#60728E]">
                  Featured expert boost setting
                  <select
                    value={rankingFeaturedBoost}
                    onChange={(event) => setRankingFeaturedBoost(event.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-[#D6E1F4] px-3 text-sm"
                  >
                    <option value="5">+5</option>
                    <option value="10">+10</option>
                    <option value="15">+15</option>
                  </select>
                </label>
                <Button
                  type="button"
                  className="mt-3 rounded-xl bg-[#2E67E8] text-white hover:bg-[#2759C9]"
                  onClick={() =>
                    runAction(
                      async () => {
                        await patchPricingSettings(token, {
                          lead_price_low: Number(priceLow),
                          lead_price_medium: Number(priceMedium),
                          lead_price_high: Number(priceHigh),
                          high_value_criteria: {
                            requireUrgent,
                            requireBudget,
                            requireIntent,
                            budgetLevels: ["medium", "high"],
                            intentTypes: ["do_it_for_me"],
                          },
                        });
                        await patchRankingConfig(token, {
                          featured_boost_value: Number(rankingFeaturedBoost),
                        });
                      },
                      "Pricing & lead value settings updated.",
                    )
                  }
                >
                  Save Pricing & Lead Value
                </Button>
                {pricingSettings ? <p className="mt-2 text-xs text-[#62728C]">Current pricing is active.</p> : null}
              </article>
            ) : activeSettingsTab === "pricing" ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Only Super Admin can change pricing settings.</p>
            ) : null}

            {activeSettingsTab === "fairness" && can(me, "settings.fairness.manage") ? (
              <article className="rounded-2xl border border-[#E2EAF8] bg-[#FBFDFF] p-4">
                <h3 className="text-lg font-semibold">Fairness & Exposure Settings</h3>
                <p className="mt-1 text-xs text-[#62728C]">Control visibility fairness, exposure boosts, and rotation behavior.</p>
                <p className="mt-1 text-xs text-[#62728C]">Current exposure max boost: {fairnessBoostMax}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="inline-flex items-center gap-2 text-sm text-[#4F617F]">
                    <input type="checkbox" checked={newExpertBoostEnabled} onChange={(event) => setNewExpertBoostEnabled(event.target.checked)} />
                    New expert boost enabled
                  </label>
                  <select value={exposureBoostStrength} onChange={(event) => setExposureBoostStrength(event.target.value as "low" | "medium" | "high")} className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm">
                    <option value="low">Exposure boost: Low</option>
                    <option value="medium">Exposure boost: Medium</option>
                    <option value="high">Exposure boost: High</option>
                  </select>
                  <select value={rotationFrequency} onChange={(event) => setRotationFrequency(event.target.value as "aggressive" | "balanced" | "minimal")} className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm">
                    <option value="aggressive">Rotation: Aggressive</option>
                    <option value="balanced">Rotation: Balanced</option>
                    <option value="minimal">Rotation: Minimal</option>
                  </select>
                  <input value={newExpertBoostDays} onChange={(event) => setNewExpertBoostDays(event.target.value)} placeholder="New expert boost duration (days)" className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm" />
                  <input value={newExpertBoostValue} onChange={(event) => setNewExpertBoostValue(event.target.value)} placeholder="New expert boost value" className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm" />
                  <input value={cooldownThreshold} onChange={(event) => setCooldownThreshold(event.target.value)} placeholder="Cooldown threshold (max appearances/24h)" className="h-11 rounded-xl border border-[#D6E1F4] px-3 text-sm" />
                </div>
                <Button
                  type="button"
                  className="mt-3 rounded-xl bg-[#2E67E8] text-white hover:bg-[#2759C9]"
                  onClick={() =>
                    runAction(
                      () =>
                        patchFairnessSettings(token, {
                          fairness_boost_max: FAIRNESS_MAX_BY_STRENGTH[exposureBoostStrength],
                          new_expert_boost_days: Number(newExpertBoostDays),
                          new_expert_boost_value: Number(newExpertBoostValue),
                          cooldown_threshold: Number(cooldownThreshold),
                          new_expert_boost_enabled: newExpertBoostEnabled,
                          exposure_boost_strength: exposureBoostStrength,
                          rotation_frequency: rotationFrequency,
                        }),
                      "Fairness & exposure settings updated.",
                    )
                  }
                >
                  Save Fairness & Exposure
                </Button>
                {fairnessSettings ? <p className="mt-2 text-xs text-[#62728C]">Current fairness settings are loaded.</p> : null}
              </article>
            ) : activeSettingsTab === "fairness" ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Only Super Admin can change fairness settings.</p>
            ) : null}
              </section>
            ) : null}

            {activeTab === "activity" ? (
              <section className="rounded-[24px] border border-[#DCE7F6] bg-white p-6">
            {can(me, "audit.view") ? (
              <>
                <h2 className="text-2xl font-semibold">Activity Log</h2>
                <p className="mt-1 text-sm text-[#5C6F8D]">Immutable history of important actions and security events.</p>
                <div className="mt-4 space-y-2">
                  {auditLogs.slice(0, 40).map((entry) => (
                    <article key={entry.audit_id} className="rounded-xl border border-[#E1E9F8] bg-[#FCFDFF] p-3">
                      <p className="text-sm font-semibold">{mapAuditAction(entry.action_type)}</p>
                      <p className="mt-1 text-xs text-[#62728C]">
                        {entry.user_email || "System"} • {roleLabel(entry.role)} • {formatDateTime(entry.timestamp)}
                      </p>
                      <p className="mt-1 text-xs text-[#62728C]">Target: {entry.target_type || "system"}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-[#60728E]">Technical details</summary>
                        <p className="mt-1 text-xs text-[#60728E]">Audit ID: {entry.audit_id}</p>
                        <p className="text-xs text-[#60728E]">Target ID: {entry.target_id || "n/a"}</p>
                        <p className="text-xs text-[#60728E]">User ID: {entry.user_id || "n/a"}</p>
                      </details>
                    </article>
                  ))}
                  {auditLogs.length === 0 ? <p className="text-sm text-[#6A7C98]">No audit logs found.</p> : null}
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Only roles with audit access can open Activity.</p>
            )}
              </section>
            ) : null}
          </div>
        </section>
      </div>

      {/* Request Info Modal */}
      {requestInfoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Additional Information</h3>
              <p className="text-sm text-gray-500 mb-5">
                Please specify what additional details or documents the expert needs to provide before their application can be approved.
              </p>
              
              <textarea
                autoFocus
                value={requestInfoModal.reason}
                onChange={(e) => setRequestInfoModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Please upload a clearer copy of your business license..."
                className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#356AF6] focus:border-[#356AF6] outline-none transition-all resize-none text-sm"
              />
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRequestInfoModal({ isOpen: false, appId: "", reason: "" })}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!requestInfoModal.reason.trim()}
                onClick={() => {
                  const { appId, reason } = requestInfoModal;
                  if (reason.trim()) {
                    runAction(() => updateExpertApplication(token, appId, "request_info", reason.trim()), "Requested additional info.");
                    setRequestInfoModal({ isOpen: false, appId: "", reason: "" });
                  }
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#A56A08] rounded-lg hover:bg-[#8B5A06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
