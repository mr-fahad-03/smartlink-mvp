/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Calendar,
  MapPin,
  TrendingUp,
  ArrowRight,
  Shield,
  HelpCircle,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClientDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken } from "@/lib/admin-session";
import { saveAssessmentSubmission } from "@/lib/assessment-storage";
import type { AssessmentSubmission } from "@/types";

export default function ClientProjectsPage() {
  const router = useRouter();
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

  const handleViewMatches = (lead: any) => {
    // Reconstruct AssessmentSubmission structure for results flow page
    const submission: AssessmentSubmission = {
      assessmentId: lead.assessment_id || `rec-${lead.id}`,
      lead: {
        fullName: lead.full_name,
        workEmail: lead.work_email,
        phoneNumber: lead.phone_number || "",
        audienceSegment: lead.audience_segment || "business-owner",
        companyName: lead.company_name || "",
        role: lead.role || "",
        businessType: lead.business_type || "",
        location: lead.location,
        locationScope: lead.location_scope || "local",
        island: lead.island || "",
        website: lead.website || "",
        teamSize: lead.team_size || "",
        budgetPreference: lead.budget_preference || "",
        urgencyPreference: lead.urgency_preference || "",
        priorConsultingExperience: lead.prior_consulting_experience || "",
      },
      highestRiskCategory: lead.highest_risk_category || "Operations",
      normalizedScore: lead.normalized_score || 50,
      leadTier: lead.lead_tier || "standard",
      submittedAt: lead.created_at,
      categoryBreakdown: lead.metadata?.diagnosticProfile?.categoryBreakdown || [
        {
          category: lead.highest_risk_category || "Operations",
          score: lead.normalized_score || 50,
          riskLevel: lead.normalized_score > 75 ? "critical" : lead.normalized_score > 50 ? "high" : "moderate",
        }
      ],
      riskLevel: lead.normalized_score > 75 ? "critical" : lead.normalized_score > 50 ? "high" : "moderate",
      priorityActions: lead.metadata?.priorityActions || [],
      diagnosticProfile: lead.metadata?.diagnosticProfile || null,
      responses: lead.metadata?.responses || [],
    } as unknown as AssessmentSubmission;

    saveAssessmentSubmission(submission);
    router.push("/results");
  };

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
        Error loading assessments: {errorMsg}
      </div>
    );
  }

  const { leads = [] } = data || {};

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Assessments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review your matches and assessment risk breakdowns.</p>
        </div>
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition duration-200"
        >
          <Plus className="w-4 h-4" />
          New Assessment
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-blue-600">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Match Assessments Found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Submit a lead qualification assessment quiz to instantly calculate your risks and generate matching local Bahamian experts.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition duration-200"
          >
            Get Started Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leads.map((lead: any) => {
            const dateStr = new Date(lead.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
            const score = lead.normalized_score || 0;
            const riskLevel = score > 75 ? "Critical" : score > 50 ? "High" : "Moderate";
            const riskBg = score > 75 ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900" : score > 50 ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900";

            return (
              <div
                key={lead.id}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${riskBg}`}>
                      <Shield className="w-3.5 h-3.5" />
                      {riskLevel} Risk
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateStr}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {lead.selected_category || "General Matching Quiz"}
                  </h3>
                  
                  {score > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Score Index: <strong>{score}/100</strong>
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed line-clamp-3">
                    {lead.primary_issue || "No description provided."}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Location Scope</span>
                      <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        {lead.island || lead.location} ({lead.location_scope || "Local"})
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Budget Setting</span>
                      <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 mt-0.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        {lead.budget_preference || "Flexible"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => handleViewMatches(lead)}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-700/50 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm rounded-xl transition duration-200"
                  >
                    View Recommended Matches
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
