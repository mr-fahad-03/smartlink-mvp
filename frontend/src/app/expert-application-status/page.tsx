/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle, XCircle, FileText, ShieldAlert, ChevronRight, UserCircle, MapPin, Award } from "lucide-react";

import { InnerNav } from "@/components/navigation/inner-nav";
import { Button } from "@/components/ui/button";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { getMyExpertApplicationStatus } from "@/lib/backend-api";
import { canUseExpertSection } from "@/lib/role-guard";
import type { ExpertApplicationStatusView, ExpertApplicationRecord } from "@/types";

import { Suspense } from "react";

function ExpertApplicationStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ExpertApplicationStatusView | null>(null);

  const submittedNow = searchParams.get("submitted") === "1";

  useEffect(() => {
    let active = true;

    const boot = async () => {
      try {
        const session = await getSessionMe();
        if (!active) return;

        if (!canUseExpertSection(session.role)) {
          router.replace("/login");
          return;
        }

        const token = getAdminAccessToken();
        if (!token) {
          router.replace("/login");
          return;
        }

        const statusView = await getMyExpertApplicationStatus(token);
        if (!active) return;

        setData(statusView);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load application status.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void boot();

    return () => {
      active = false;
    };
  }, [router]);

  const application = data?.application || null;
  const reasonText = useMemo(() => {
    if (!application) return "";
    if (application.status === "rejected") {
      return application.review_notes || "No rejection note provided yet.";
    }
    if (application.status === "needs_info") {
      return application.requested_info_notes || application.review_notes || "Admin requested additional details.";
    }
    return application.review_notes || "";
  }, [application]);

  useEffect(() => {
    if (application?.status === "approved") {
      const timer = setTimeout(() => {
        router.push("/expert-dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [application?.status, router]);

  if (loading) {
    return (
      <main className="sl-page min-h-screen px-6 py-10 bg-slate-50">
        <div className="mx-auto w-full max-w-4xl">
          <InnerNav breadcrumb="Expert Application Status" />
          <div className="mt-10 flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-slate-500">Loading your application status...</p>
          </div>
        </div>
      </main>
    );
  }

  // Determine stepper states
  const isSubmitted = true;
  const isReviewing = application?.status === "under_review" || application?.status === "flagged";
  const isDecisionMade = application?.status && !isReviewing;

  const renderDecisionStep = () => {
    if (application?.status === "approved") {
      return { icon: CheckCircle2, title: "Approved", desc: "Welcome to the expert network!", color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-500" };
    }
    if (application?.status === "needs_info") {
      return { icon: AlertCircle, title: "Action Required", desc: "Additional info needed.", color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-500" };
    }
    if (application?.status === "rejected") {
      return { icon: XCircle, title: "Rejected", desc: "Application declined.", color: "text-rose-600", bg: "bg-rose-100", border: "border-rose-500" };
    }
    return { icon: Clock, title: "Final Decision", desc: "Pending", color: "text-slate-400", bg: "bg-slate-100", border: "border-slate-300" };
  };

  const decisionStep = renderDecisionStep();



  return (
    <main className="sl-page min-h-screen bg-[#F8FAFC] px-4 md:px-6 py-10 text-slate-900 font-sans">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <InnerNav breadcrumb="Application Status" />

        {submittedNow ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium">Application submitted successfully. Track your review progress here.</p>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-5 py-4 text-rose-800 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : null}

        {!application ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">No Application Found</h1>
            <p className="mt-2 text-slate-500 max-w-md mx-auto">It looks like you haven't submitted an expert application yet, or you are logged into a different account.</p>
            <Button asChild className="mt-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all px-6 py-5">
              <Link href="/expert-apply">Start Expert Application</Link>
            </Button>
          </section>
        ) : (
          <>
            {/* Progress Stepper */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-8">Application Progress</h2>
              <div className="flex items-start md:items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-6 left-10 right-10 h-1 bg-slate-100 -z-10 rounded-full hidden md:block">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                    style={{ width: isDecisionMade ? '100%' : '50%' }}
                  />
                </div>

                {/* Step 1: Submitted */}
                <div className="flex flex-col items-center gap-3 z-10 w-1/3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isSubmitted ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border-slate-300 text-slate-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm text-slate-900">Submitted</p>
                    <p className="text-xs text-slate-500 mt-0.5">Application received</p>
                  </div>
                </div>

                {/* Step 2: Under Review */}
                <div className="flex flex-col items-center gap-3 z-10 w-1/3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDecisionMade 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                      : isReviewing 
                        ? 'bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-100 ring-4 ring-blue-50' 
                        : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {isDecisionMade ? <CheckCircle2 className="w-5 h-5" /> : application.status === "flagged" ? <ShieldAlert className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${isDecisionMade || isReviewing ? 'text-slate-900' : 'text-slate-400'}`}>Under Review</p>
                    <p className="text-xs text-slate-500 mt-0.5">{application.status === "flagged" ? "Escalated Review" : "Validating profile"}</p>
                  </div>
                </div>

                {/* Step 3: Decision */}
                <div className="flex flex-col items-center gap-3 z-10 w-1/3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDecisionMade ? `${decisionStep.bg} ${decisionStep.border} ${decisionStep.color} shadow-md` : 'bg-white border-slate-200 text-slate-300'
                  }`}>
                    <decisionStep.icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${isDecisionMade ? 'text-slate-900' : 'text-slate-400'}`}>{decisionStep.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{decisionStep.desc}</p>
                  </div>
                </div>
              </div>

              {reasonText && application.status !== "approved" && (
                <div className={`mt-10 rounded-xl p-5 border flex gap-4 ${application.status === 'rejected' ? 'bg-rose-50/50 border-rose-200' : 'bg-amber-50/50 border-amber-200'}`}>
                  {application.status === 'rejected' ? <XCircle className="w-6 h-6 text-rose-500 shrink-0" /> : <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />}
                  <div>
                    <h4 className={`text-sm font-bold mb-1 ${application.status === 'rejected' ? 'text-rose-900' : 'text-amber-900'}`}>
                      {application.status === 'rejected' ? 'Rejection Reason' : 'Admin Note: Action Required'}
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{reasonText}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Application Summary Card */}
            <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Application Details</h3>
                <span className="text-xs font-mono text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-md">ID: {application.application_id.split('-')[0]}</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expert Name</p>
                    <p className="text-sm font-medium text-slate-900">{application.expert_name || application.expert_id}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Specialty</p>
                    <p className="text-sm font-medium text-slate-900">{application.expert_role || "Not specified"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                    <p className="text-sm font-medium text-slate-900">{application.expert_location || "Not specified"}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-end">
                {application.status === "approved" ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 animate-pulse">Redirecting to dashboard...</span>
                    <Button asChild className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-5">
                      <Link href="/expert-dashboard">Go to Expert Dashboard</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {(application.status === "rejected" || application.status === "needs_info") && (
                      <Button asChild className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-5">
                        <Link href="/expert-apply?resubmit=1">Edit & Resubmit Application</Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
                      <Link href="/">Return to Home</Link>
                    </Button>
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function ExpertApplicationStatusPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExpertApplicationStatusContent />
    </Suspense>
  );
}
