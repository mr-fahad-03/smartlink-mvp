/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Users,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { getClientDashboardData, createIntroductionRequestsInBackend } from "@/lib/backend-api";
import { getAdminAccessToken } from "@/lib/admin-session";

export default function ClientDashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const token = getAdminAccessToken();
        if (!token) {
          setErrorMsg("Session expired. Please log in again.");
          setLoading(false);
          return;
        }

        // Auto-submit any pending introduction requests queued while unauthenticated
        const pendingStr = localStorage.getItem("smartlink_pending_intro_request");
        if (pendingStr) {
          try {
            const pending = JSON.parse(pendingStr);
            if (pending && pending.requests && pending.requests.length > 0) {
              await createIntroductionRequestsInBackend({
                submission: pending.submission,
                requests: pending.requests,
              });

              // Also sync with assessment-storage local copy
              try {
                const { updateAssessmentSubmission } = await import("@/lib/assessment-storage");
                updateAssessmentSubmission((current) => {
                  const currentRequests = current.introductionRequests ?? [];
                  const merged = [...currentRequests];
                  pending.requests.forEach((req: any) => {
                    if (!merged.some((r: any) => r.expertId === req.expertId)) {
                      merged.push({
                        id: `intro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        assessmentId: pending.submission.assessmentId,
                        leadName: pending.submission.lead?.fullName || "Client",
                        leadEmail: pending.submission.lead?.workEmail || "",
                        expertId: req.expertId,
                        expertName: req.expertName,
                        requestedAt: new Date().toISOString(),
                        serviceIds: req.serviceIds,
                        serviceNames: req.serviceNames,
                        category: req.category,
                        urgencyLevel: req.urgencyLevel,
                        budgetPreference: req.budgetPreference,
                        billable: req.billable,
                        leadTier: req.leadTier,
                        expertTier: req.expertTier,
                        status: "submitted",
                      });
                    }
                  });
                  return {
                    ...current,
                    introductionRequests: merged,
                  };
                });
              } catch (storageErr) {
                console.error("Failed to update local assessment storage:", storageErr);
              }
            }
          } catch (pendingErr) {
            console.error("Failed to auto-submit pending introduction requests:", pendingErr);
          } finally {
            localStorage.removeItem("smartlink_pending_intro_request");
          }
        }

        const response = await getClientDashboardData(token);
        if (!active) return;
        setData(response);
      } catch (error: any) {
        console.error("Failed to load dashboard data:", error);
        setErrorMsg(error.message || String(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-2xl border border-red-200">
        Error loading dashboard: {errorMsg}
      </div>
    );
  }

  const { leads = [], connections = [], reviews = [], metrics = {} } = data || {};

  // Build client action items
  const actionItems: any[] = [];
  
  // Suggest reviewing accepted experts that haven't been reviewed yet
  connections.forEach((conn: any) => {
    if (conn.status === "accepted") {
      const alreadyReviewed = reviews.some((rev: any) => rev.expert_id === conn.expert_id && rev.lead_id === conn.lead_id);
      if (!alreadyReviewed) {
        actionItems.push({
          id: `review-${conn.id}`,
          type: "review",
          title: `Share feedback on ${conn.expert.name}`,
          description: `You connected with ${conn.expert.name || "your expert"} recently. Let others know how it went.`,
          href: "/dashboard/reviews",
          actionText: "Write review",
          urgency: "medium",
        });
      }
    }
  });

  // Suggest completing quiz if no projects exist
  if (leads.length === 0) {
    actionItems.push({
      id: "no-assessments",
      type: "quiz",
      title: "Find your first expert match",
      description: "Answer a few questions and get matched instantly in 60 seconds.",
      href: "/quiz",
      actionText: "Start Assessment",
      urgency: "high"
    });
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            Client Portal
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Welcome to SmartLink
          </h1>
          <p className="mt-2 text-blue-100 text-[0.98rem] leading-6">
            Track your matches, manage connections, and read expert suggestions. Use the sidebar to explore your spaces.
          </p>
        </div>
        {/* Decorative Blur Spheres */}
        <div className="absolute right-0 top-0 -z-0 h-48 w-48 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-8 -right-8 -z-0 h-48 w-48 rounded-full bg-blue-400/40 blur-3xl" />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Assessments"
          value={metrics.totalSubmissions || 0}
          icon={ClipboardList}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-950/20"
        />
        <MetricCard
          title="Active Connections"
          value={metrics.activeConnections || 0}
          icon={CheckCircle2}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-950/20"
        />
        <MetricCard
          title="Pending Requests"
          value={metrics.pendingConnections || 0}
          icon={Clock}
          color="text-orange-600"
          bg="bg-orange-50 dark:bg-orange-950/20"
        />
        <MetricCard
          title="Reviews Submitted"
          value={metrics.reviewsWritten || 0}
          icon={Star}
          color="text-yellow-600"
          bg="bg-yellow-50 dark:bg-yellow-950/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Action Required Column */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-500" />
            Action Required
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
            {actionItems.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">You're all caught up!</p>
              </div>
            ) : (
              actionItems.map((item) => (
                <div key={item.id} className="space-y-2 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2.5">
                    <span className={`inline-flex rounded-full p-1.5 mt-0.5 ${
                      item.urgency === "high"
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-950/30"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-950/30"
                    }`}>
                      {item.type === "quiz" ? <ClipboardList className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-4">{item.description}</p>
                    </div>
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline mt-1 ml-9"
                  >
                    {item.actionText} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Assessments Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Recent Assessments
            </h2>
            {leads.length > 3 && (
              <Link href="/dashboard/projects" className="text-xs font-semibold text-blue-600 hover:underline flex items-center">
                View all <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            )}
          </div>

          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-2xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">You haven't completed any match assessments yet.</p>
                <Link
                  href="/quiz"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline mt-2"
                >
                  Start your first matching quiz <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              leads.slice(0, 3).map((lead: any) => (
                <div
                  key={lead.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {lead.selected_category || "General Expert Match"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                          {lead.lead_tier || "Standard"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {lead.normalized_score !== null && (
                      <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-xl">
                        Risk Score: {lead.normalized_score}/100
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">
                    {lead.primary_issue || "No description provided."}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Location: <strong className="text-gray-700 dark:text-gray-200">{lead.island || lead.location}</strong>
                    </span>
                    <Link
                      href="/dashboard/projects"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 hover:underline"
                    >
                      View match details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</h3>
      </div>
      <span className={`rounded-2xl p-3 ${bg} ${color}`}>
        <Icon className="w-5 h-5" />
      </span>
    </div>
  );
}
