"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  MessageSquareQuote,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { InnerNav } from "@/components/navigation/inner-nav";
import { ExpertMatchCard } from "@/components/results/expert-match-card";
import { RiskGauge } from "@/components/results/risk-gauge";
import { VerificationModal } from "@/components/results/verification-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockQuizEnginePayload } from "@/data";
import { getSessionMe } from "@/lib/admin-session";
import { loadAssessmentSubmission, saveAssessmentSubmission } from "@/lib/assessment-storage";
import {
  createLeadInBackend,
  recommendMatchesFromBackend,
  submitPrivateFeedbackToBackend,
} from "@/lib/backend-api";
import { rankExpertsForSubmission } from "@/lib/expert-matching";
import type {
  AssessmentSubmission,
  BackendMatchRecommendation,
  ConnectionStatus,
  Expert,
  MissingFeedbackReason,
  ResultsFeedbackAnswer,
} from "@/types";

function toDisplayRiskLevel(riskLevel: AssessmentSubmission["riskLevel"]) {
  if (riskLevel === "critical") return "Critical";
  if (riskLevel === "high") return "High";
  if (riskLevel === "moderate") return "Moderate";
  return "Low";
}

function getSuggestedTimeframe(urgencyPreference?: string) {
  if (urgencyPreference === "Right now (urgent)") return "Immediately, ideally in the next 24 hours";
  if (urgencyPreference === "24-48 hours") return "Within the next 24-48 hours";
  if (urgencyPreference === "This week") return "Within the next 7 days";
  if (urgencyPreference === "Within a week") return "Within the next 7 days";
  if (urgencyPreference === "Just exploring") return "This week, before making the next decision";
  return "As soon as practical";
}

function getPersonalizedMatchMessage(submission: AssessmentSubmission, highestRiskCategory: string) {
  const timeline = getSuggestedTimeframe(submission.lead.urgencyPreference).toLowerCase();
  return `We found experts who match your timeline (${timeline}) and are within your preferred budget for ${highestRiskCategory.toLowerCase()} support.`;
}

function getRecommendedExpertType(category: AssessmentSubmission["highestRiskCategory"]) {
  if (category === "Operations") return "Operations Consultant";
  if (category === "Cybersecurity") return "Cybersecurity Specialist";
  if (category === "Systems") return "Systems / IT Specialist";
  if (category === "Growth") return "Growth & Marketing Advisor";
  if (category === "Career Help") return "Career Coach";
  if (category === "Financial Advice") return "Financial Advisor / Accountant";
  if (category === "Legal Help") return "Legal Advisor";
  if (category === "Personal Tech Support") return "Personal IT Support Specialist";
  return "Guidance Specialist";
}

function getGuidedFeelingLabel(submission: AssessmentSubmission) {
  const situationResponse = submission.responses.find((response) => response.questionId === "situation_now");
  const urgencyResponse = submission.responses.find((response) => response.questionId === "urgency");
  const situationId = situationResponse?.selectedOptionId ?? "";
  const urgencyId = urgencyResponse?.selectedOptionId ?? "";

  if (urgencyId === "urgency_now" || urgencyId === "urgency_48h" || situationId === "situation_urgent") {
    return "urgent";
  }

  if (
    situationId === "situation_not_working" ||
    situationId === "situation_failed" ||
    situationId === "situation_start_or_fix"
  ) {
    return "stuck";
  }

  return "confused";
}

function simplifyPriorityAction(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("identify the workflow") || lower.includes("pinpoint")) return "Find what's slowing you down.";
  if (lower.includes("reduce friction") || lower.includes("simplify")) return "Fix what's broken before adding anything new.";
  if (lower.includes("connect with")) return "Get expert help to move faster.";
  if (lower.includes("clarify")) return "Get clear on the blocker first.";
  return action;
}

const missingReasonOptions: { value: MissingFeedbackReason; label: string }[] = [
  { value: "not_relevant", label: "Expert was not relevant" },
  { value: "no_response", label: "Expert did not respond" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "wrong_location", label: "Wrong location" },
  { value: "different_help_needed", label: "I needed a different type of help" },
  { value: "other", label: "Other" },
];

export default function ResultsPage() {
  const router = useRouter();
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [backendMatches, setBackendMatches] = useState<BackendMatchRecommendation[] | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [modalActionIntent, setModalActionIntent] = useState("see all results and connect with experts");

  useEffect(() => {
    const stored = loadAssessmentSubmission();
    setSubmission(stored);
    setIsLoaded(true);

    const checkAuthStatus = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("smartlink_access_token") : null;
      if (!token) {
        setIsVerified(false);
        return;
      }
      try {
        const me = await getSessionMe();
        if (me && me.email) {
          setIsVerified(true);
        }
      } catch (_) {
        setIsVerified(false);
      }
    };

    checkAuthStatus();
  }, []);

  const requireVerification = (intent: string) => {
    setModalActionIntent(intent);
    setIsVerificationModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsVerified(true);
  };

  const handleRequestIntro = (expert: Expert) => {
    if (!isVerified) {
      requireVerification(`hire ${expert.fullName}`);
    } else {
      router.push(`/expert-match?expertId=${encodeURIComponent(expert.id)}`);
    }
  };

  const handleGetMatched = () => {
    if (!isVerified) {
      requireVerification("get matched with the right expert");
    } else {
      router.push("/expert-match");
    }
  };

  const handleTalkToExpert = () => {
    if (!isVerified) {
      requireVerification("chat directly with an expert advisor");
    } else {
      router.push("/expert-match?action=chat");
    }
  };

  const updateFeedbackLoop = (updater: (current: AssessmentSubmission) => AssessmentSubmission) => {
    setSubmission((current) => {
      if (!current) return current;
      const updated = updater(current);
      saveAssessmentSubmission(updated);
      return updated;
    });
  };

  const highestRisk = useMemo(() => {
    if (!submission) return null;
    return (
      submission.categoryBreakdown.find((item) => item.category === submission.highestRiskCategory) ??
      submission.categoryBreakdown[0]
    );
  }, [submission]);

  const rankedExperts = useMemo(() => {
    if (!submission || !highestRisk) return [];
    if (backendMatches && backendMatches.length > 0) {
      return backendMatches.map((backendMatch) => ({
        expert: {
          id: backendMatch.expert.id,
          fullName: backendMatch.expert.fullName || "Expert Advisor",
          role: backendMatch.expert.role || "Specialist Advisor",
          organization: backendMatch.expert.organization || "SmartLink Network",
          yearsExperience: backendMatch.expert.yearsExperience || 5,
          specialties: backendMatch.expert.specialties || [highestRisk.category],
          certifications: [],
          languages: ["English"],
          timezone: "EST",
          bio: backendMatch.expert.bio || "",
          rating: backendMatch.expert.rating || 4.8,
          hourlyRateUsd: backendMatch.expert.hourlyRateUsd || 100,
          nextAvailableAt: backendMatch.expert.nextAvailableAt || new Date().toISOString(),
          visibilityLevel: backendMatch.expert.visibilityLevel || "basic",
          matchingVisibility: backendMatch.expert.matchingVisibility || "visible",
          rankingWeightBoost: 0,
          subscriptionTier: backendMatch.expert.subscriptionTier || "basic",
        },
        totalScore: backendMatch.matchScore,
        matchTier: backendMatch.matchBand,
        matchReason: backendMatch.explanation,
        availableWithin48Hours: backendMatch.availableNow,
        availabilityLabel: backendMatch.availableNow ? "Available now" : "Available within 48 hours",
        breakdown: {
          category: backendMatch.breakdown.category,
          location: backendMatch.breakdown.location,
          budget: backendMatch.breakdown.budget,
          urgency: backendMatch.breakdown.urgency,
          experience: backendMatch.breakdown.reputation,
          marketplaceBoost:
            backendMatch.breakdown.fairnessBoost +
            backendMatch.breakdown.performanceScore +
            backendMatch.breakdown.priorityBoost +
            backendMatch.breakdown.cooldownAdjustment,
        },
        backendBadges: backendMatch.badges,
        backendSlotLabel: backendMatch.slotLabel,
        backendRank: backendMatch.rank,
      }));
    }
    return [];
  }, [backendMatches, highestRisk, submission]);

  const rankingFingerprint = submission
    ? `${submission.assessmentId}|${submission.highestRiskCategory}|${submission.lead.location}|${submission.lead.urgencyPreference || ""}|${submission.lead.budgetPreference || ""}`
    : "";

  useEffect(() => {
    if (!submission || !highestRisk) return;
    let cancelled = false;

    const syncAndRank = async () => {
      try {
        await createLeadInBackend(submission);
      } catch {
        // Non-blocking: continue ranking even if lead insert fails.
      }
      try {
        const recommendations = await recommendMatchesFromBackend(submission);
        if (!cancelled) setBackendMatches(recommendations);
      } catch {
        if (!cancelled) setBackendMatches(null);
      }
    };

    syncAndRank();
    return () => {
      cancelled = true;
    };
  }, [highestRisk, rankingFingerprint, submission]);

  const leadTier = submission?.leadTier ?? "standard";

  if (!isLoaded) {
    return (
      <main className="sl-page min-h-screen px-6 py-8">
        <div className="mx-auto w-full max-w-6xl">
          <InnerNav breadcrumb="Your Results" stepLabel="Step 3 of 4" />
          <div className="sl-card mt-6 w-full max-w-lg rounded-[28px] px-8 py-10 text-center">
            <p className="text-sm text-[#5D6B85]">Loading your assessment results...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!submission || !highestRisk) {
    return (
      <main className="sl-page min-h-screen px-6 py-8">
        <div className="mx-auto w-full max-w-6xl">
          <InnerNav breadcrumb="Your Results" stepLabel="Step 3 of 4" />
          <div className="sl-card mt-6 w-full max-w-xl rounded-[30px] p-8 text-center">
            <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">
              No Uploaded Results
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#111827]">
              Complete the assessment first
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#5D6B85]">
              We could not find a saved assessment in this browser session.
            </p>
            <Button asChild size="lg" className="mt-6 h-11 rounded-xl bg-[#356AF6] px-5 text-white hover:bg-[#2C59D8]">
              <Link href="/quiz">
                Start Assessment
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const submittedLabel = new Date(submission.submittedAt).toLocaleString();
  const isBusinessAudience = submission.lead.audienceSegment === "business-owner";
  const useIndividualLanguage = !isBusinessAudience;
  const audienceLabel =
    submission.lead.audienceSegment === "personal-help"
      ? "Personal support"
      : submission.lead.audienceSegment === "not-sure"
        ? "Guided support"
        : "Business support";
  const experienceLabel = [submission.lead.role, submission.lead.businessType].filter(Boolean).join(" | ");
  const scoreLabel = isBusinessAudience ? "Risk Score" : "Situation Summary";
  const attentionLabel = isBusinessAudience ? "High Risk" : "What Needs Attention";
  const personalizedMatchMessage = getPersonalizedMatchMessage(submission, highestRisk.category);
  const recommendedExpertType = getRecommendedExpertType(highestRisk.category);
  const primaryIssueLabel = highestRisk.category;
  const urgencyLabel = submission.lead.urgencyPreference || "Within a week";
  const statusSummary = `You’re dealing with ${primaryIssueLabel.toLowerCase()} and need support ${urgencyLabel.toLowerCase()}.`;
  const guidedNeedResponse = submission.responses.find((response) => response.questionId === "problem_need");
  const hasGuidedSignal = Boolean(submission.diagnosticProfile?.needsGuidedExperienceSignal);
  const shouldShowGuidedSupportStatement = submission.lead.audienceSegment === "not-sure" || hasGuidedSignal;
  const guidedSupportStatement = shouldShowGuidedSupportStatement
    ? `Based on your answers, it looks like you’re feeling ${getGuidedFeelingLabel(submission)} and need help with ${guidedNeedResponse?.selectedOptionText?.toLowerCase() ?? "your current challenge"}. We recommend starting with ${recommendedExpertType}.`
    : null;
  const personaCards = [
    {
      label: "Your Profile",
      profile: {
        title: "You're an Urgent Fixer",
        description: "You're under pressure right now. The faster you act, the faster this gets fixed.",
        nextAction: "Best move: Start with the biggest issue and connect with someone who can act quickly.",
        tone: "border-rose-200 bg-rose-50 text-rose-700",
      },
    },
  ];
  const sectionCardClass = "rounded-[28px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]";
  const feedbackAnswer = submission.feedbackLoop?.userFeedback;
  const missingReasons = submission.feedbackLoop?.missingReasons ?? [];
  const topMatchExpertId = rankedExperts[0]?.expert?.id;
  const connectionStatus = submission.feedbackLoop?.connectionStatus ?? "pending";
  const viewedEvents = submission.userActionEvents?.filter((event) => event.actionType === "expert_match_viewed").length ?? 0;
  const expertsViewedCount = viewedEvents > 0 ? viewedEvents : rankedExperts.length;
  const introductionRequestedEvents = submission.userActionEvents?.filter((event) => event.actionType === "introduction_requested").length ?? 0;
  const introductionsRequestedCount = introductionRequestedEvents > 0 ? introductionRequestedEvents : submission.introductionRequests?.length ?? 0;
  const connectionsMadeCount = connectionStatus === "connected" ? 1 : 0;
  const hoursSinceSubmission = Math.floor((Date.now() - new Date(submission.submittedAt).getTime()) / (1000 * 60 * 60));
  const shouldShowFollowUp = hoursSinceSubmission >= 24;

  const setFeedbackAnswer = (value: ResultsFeedbackAnswer) => {
    updateFeedbackLoop((current) => ({
      ...current,
      feedbackLoop: {
        ...current.feedbackLoop,
        userFeedback: value,
        userFeedbackSubmittedAt: new Date().toISOString(),
        missingReasons: value === "no" ? current.feedbackLoop?.missingReasons ?? [] : [],
      },
    }));
    if (submission) {
      void submitPrivateFeedbackToBackend({
        submission,
        expertId: topMatchExpertId,
        matchHelpfulRating: value,
        feedbackReason: value === "no" ? submission.feedbackLoop?.missingReasons ?? [] : [],
      }).catch(() => undefined);
    }
  };

  const toggleMissingReason = (reason: MissingFeedbackReason) => {
    updateFeedbackLoop((current) => {
      const currentReasons = current.feedbackLoop?.missingReasons ?? [];
      const nextReasons = currentReasons.includes(reason)
        ? currentReasons.filter((item) => item !== reason)
        : [...currentReasons, reason];

      return {
        ...current,
        feedbackLoop: {
          ...current.feedbackLoop,
          userFeedback: "no",
          userFeedbackSubmittedAt: new Date().toISOString(),
          missingReasons: nextReasons,
        },
      };
    });
    if (submission) {
      const nextReasons = missingReasons.includes(reason)
        ? missingReasons.filter((item) => item !== reason)
        : [...missingReasons, reason];
      void submitPrivateFeedbackToBackend({
        submission,
        expertId: topMatchExpertId,
        matchHelpfulRating: "no",
        feedbackReason: nextReasons,
      }).catch(() => undefined);
    }
  };

  const setConnectionStatus = (value: ConnectionStatus) => {
    updateFeedbackLoop((current) => ({
      ...current,
      feedbackLoop: {
        ...current.feedbackLoop,
        connectionStatus: value,
        connectionCheckedAt: new Date().toISOString(),
      },
    }));
  };

  return (
    <main className="sl-page relative min-h-screen overflow-hidden text-[#111827]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="sl-grid absolute inset-0 opacity-65" />
        <div className="absolute left-[-8rem] top-24 h-[22rem] w-[22rem] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-[-10rem] top-60 h-[24rem] w-[24rem] rounded-full bg-[#DCE8FF]/80 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <InnerNav breadcrumb="Your Results" stepLabel="Step 3 of 4" />

        <p className="mt-4 text-right text-sm text-[#7B89A2]">Submitted: {submittedLabel}</p>

        <section className="mt-6 rounded-[30px] border border-[#CFE0FF] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_18px_42px_rgba(56,75,107,0.10)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">
                Your Next Step
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#111827]">Here’s what’s going on—and the fastest way to fix it.</h2>
              <p className="mt-3 text-sm leading-7 text-[#111827]">
                Based on your answers, your biggest blocker is <strong>{primaryIssueLabel}</strong>, and it’s already slowing your progress.
              </p>
              <p className="mt-2 text-sm leading-7 text-[#5D6B85]">We made this simple so you know what to do next.</p>
              {guidedSupportStatement ? (
                <p className="mt-3 rounded-xl border border-[#D9E3F3] bg-white px-4 py-3 text-sm leading-7 text-[#111827]">
                  {guidedSupportStatement}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleGetMatched}
                size="lg"
                className="h-11 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]"
              >
                Get Matched with the Right Expert
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button
                type="button"
                onClick={handleTalkToExpert}
                variant="outline"
                size="lg"
                className="h-11 rounded-xl border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
              >
                Talk to an Expert Now
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#D9E3F3] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Primary Issue</p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">{highestRisk.category}</p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">This is the area creating the strongest pressure right now.</p>
            </div>
            <div className="rounded-2xl border border-[#D9E3F3] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Recommended Expert Type</p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">{recommendedExpertType}</p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">This is the best-fit support profile based on your answers.</p>
            </div>
            <div className="rounded-2xl border border-[#D9E3F3] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Recommended Action</p>
              <p className="mt-2 text-base font-semibold leading-7 text-[#111827]">{simplifyPriorityAction(submission.priorityActions[0])}</p>
            </div>
            <div className="rounded-2xl border border-[#D9E3F3] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Suggested Timeframe</p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">{getSuggestedTimeframe(submission.lead.urgencyPreference)}</p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">This matches how soon you want help.</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#D9E3F3] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">What this means</p>
            <p className="mt-2 text-sm leading-7 text-[#111827]">
              Something in your current process is slowing you down. Fixing this first will help everything else move faster.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <article className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-[#111827]">User Status</h2>
            <p className="mt-2 text-sm text-[#5D6B85]">{statusSummary}</p>
            <div className="mt-4 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">What to do next</p>
              <div className="mt-3 space-y-2 text-sm text-[#111827]">
                <p>1. Identify the blocker.</p>
                <p>2. Simplify the process.</p>
                <p>3. Connect with an expert.</p>
              </div>
            </div>
            <div className="mt-5">
              <RiskGauge
                score={submission.normalizedScore}
                label={scoreLabel}
                toneLabelOverride={useIndividualLanguage ? "What Needs Attention" : undefined}
              />
            </div>
          </article>

          <article className={sectionCardClass}>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#356AF6]" />
              <h2 className="text-xl font-semibold text-[#111827]">{attentionLabel}</h2>
            </div>
            <Badge className="mt-4 h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">
              {highestRisk.category}
            </Badge>
            <p className="mt-4 text-sm leading-6 text-[#5D6B85]">
              {isBusinessAudience ? "Your main issue right now is" : "The main area that needs attention is"} <strong>{highestRisk.category}</strong>. This is where the biggest blocker is showing up.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">{scoreLabel}</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">{toDisplayRiskLevel(submission.riskLevel)}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Location</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">{submission.lead.location}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Lead Tier</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">{leadTier === "premium" ? "Premium" : "Standard"}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {submission.priorityActions.map((action) => (
                <div key={action} className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3 text-sm leading-6 text-[#111827]">
                  {simplifyPriorityAction(action)}
                </div>
              ))}
            </div>
          </article>
        </section>

        {personaCards.some((item) => item.profile) ? (
          <section className={`${sectionCardClass} mt-6`}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#356AF6]" />
              <h2 className="text-xl font-semibold text-[#111827]">Persona</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5D6B85]">
              You’re under pressure right now. Acting quickly gives you the fastest path to progress.
            </p>

            <div className={`mt-6 grid gap-5 ${personaCards.length > 1 ? "lg:grid-cols-2" : ""}`}>
              {personaCards.map((item) =>
                item.profile ? (
                  <article key={item.label} className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${item.profile.tone}`}>
                      {item.label}
                    </span>
                    <h3 className="mt-4 text-2xl font-semibold text-[#111827]">{item.profile.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{item.profile.description}</p>
                    <div className="mt-4 rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Recommended Next Action</p>
                      <p className="mt-2 text-sm leading-6 text-[#111827]">{item.profile.nextAction}</p>
                    </div>
                  </article>
                ) : null,
              )}
            </div>
          </section>
        ) : null}

        <section className={`${sectionCardClass} mt-6`}>
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#356AF6]" />
            <h2 className="text-xl font-semibold text-[#111827]">Matched Experts</h2>
          </div>
          <p className="mt-3 text-sm font-medium text-[#111827]">The right expert can help you fix this fast.</p>

          <div className="mt-5 rounded-[22px] border border-[#B7EDC8] bg-[#F2FBF5] p-5">
            <p className="flex items-center gap-2 text-lg font-semibold text-[#15803D]">
              <CheckCircle2 className="h-5 w-5" />
              Experts ready to help you now
            </p>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#166534]">
              {personalizedMatchMessage}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {[
              "Verified experts only",
              "Most users connect within 24-48 hours",
              "Within your preferred budget",
            ].map((item) => (
              <div key={item} className="rounded-full border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-2 text-sm font-medium text-[#111827]">
                {item}
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#5D6B85]">
            We made this simple so you know what to do next.
          </p>

          <p className="mt-3 text-sm text-[#8A99B4]">
            You are not locked in — you can explore options before contacting anyone.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleGetMatched}
              size="lg"
              className="h-11 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]"
            >
              Get Matched with the Right Expert
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
            <Button
              type="button"
              onClick={handleTalkToExpert}
              variant="outline"
              size="lg"
              className="h-11 rounded-xl border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
            >
              Talk to an Expert Now
            </Button>
          </div>

          {!isVerified && (
            <div className="mt-6 rounded-[24px] border border-[#BFDBFE] bg-[linear-gradient(135deg,#EFF6FF_0%,#F8FAFC_100%)] p-6 shadow-sm sm:p-7">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                    <Lock className="h-3.5 w-3.5" />
                    Account Verification Required to Hire
                  </div>
                  <h3 className="text-lg font-bold text-[#111827]">Verify your account to see all results & hire advisors</h3>
                  <p className="text-xs sm:text-sm text-[#475569] max-w-2xl leading-6">
                    Review your personalized diagnostics below. To request an introduction, message advisors, or see all provider contact details, please verify your account.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => requireVerification("see all results and connect with experts")}
                  size="lg"
                  className="h-11 shrink-0 rounded-xl bg-[#356AF6] px-5 text-sm font-semibold text-white shadow hover:bg-[#2C59D8]"
                >
                  Verify Account to See All
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rankedExperts.map((match) => (
              <ExpertMatchCard
                key={match.expert.id}
                expert={match.expert}
                highestRiskCategory={highestRisk.category}
                matchReason={match.matchReason}
                availableWithin48Hours={match.availableWithin48Hours}
                availabilityLabel={match.availabilityLabel}
                matchTier={match.matchTier}
                matchScore={match.totalScore}
                locationFitStrong={match.breakdown.location >= 90}
                isFirstTimeUser={submission.lead.priorConsultingExperience === "First time hiring outside expertise"}
                badges={(match as { backendBadges?: string[] }).backendBadges}
                slotLabel={(match as { backendSlotLabel?: string | null }).backendSlotLabel}
                rank={(match as { backendRank?: number }).backendRank}
                matchReasonTitle="Why this match works"
                onRequestIntro={handleRequestIntro}
              />
            ))}
          </div>
        </section>

        <section className={`${sectionCardClass} mt-6`}>
          <h2 className="text-xl font-semibold text-[#111827]">Progress Tracking</h2>
          <p className="mt-2 text-sm text-[#5D6B85]">Track movement from first match to expert connection.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Experts viewed</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">{expertsViewedCount}</p>
            </div>
            <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Introductions requested</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">{introductionsRequestedCount}</p>
            </div>
            <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Connections made</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">{connectionsMadeCount}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Messaging & Follow-Up</p>
            <div className="mt-3 space-y-2 text-sm text-[#111827]">
              <p>Chat with experts: available after selecting your preferred match.</p>
              <p>Notifications: we alert you when an expert responds or your request status changes.</p>
              <p>Follow-up reminders: we check back within 24-48 hours if no connection is confirmed.</p>
            </div>
          </div>
        </section>

        <section className={`${sectionCardClass} mt-6`}>
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-[#356AF6]" />
            <h2 className="text-xl font-semibold text-[#111827]">Was this helpful?</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
            We store your feedback and connection status to improve matching quality and future ranking logic over time.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFeedbackAnswer("yes")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${feedbackAnswer === "yes" ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]" : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"}`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setFeedbackAnswer("somewhat")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${feedbackAnswer === "somewhat" ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]" : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"}`}
            >
              Somewhat
            </button>
            <button
              type="button"
              onClick={() => setFeedbackAnswer("no")}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${feedbackAnswer === "no" ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]" : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"}`}
            >
              No
            </button>
          </div>

          {feedbackAnswer === "no" ? (
            <div className="mt-5 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
              <p className="text-sm font-semibold text-[#111827]">What could be improved?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {missingReasonOptions.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => toggleMissingReason(reason.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      missingReasons.includes(reason.value)
                        ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                        : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {feedbackAnswer ? (
            <p className="mt-4 text-sm text-[#5D6B85]">
              {feedbackAnswer === "yes"
                ? "Great. We have saved that these results felt aligned."
                : feedbackAnswer === "somewhat"
                  ? "Thanks. We have saved that the results were partially aligned."
                  : "Thanks. Your missing signals are now stored for future matching improvements."}
            </p>
          ) : null}

          {shouldShowFollowUp ? (
            <div className="mt-6 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
              <p className="text-sm font-semibold text-[#111827]">Follow-up Check</p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                It has been at least 24 hours since this result was created. Did you connect with an expert yet?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: "connected", label: "Yes, connected" },
                  { value: "not-yet", label: "Not yet" },
                  { value: "not-connected", label: "No, not connected" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setConnectionStatus(option.value as ConnectionStatus)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      connectionStatus === option.value
                        ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                        : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
              <p className="text-sm font-semibold text-[#111827]">Follow-up Trigger</p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                We’ll check in within 24-48 hours to see if you connected with an expert.
              </p>
            </div>
          )}
        </section>

        <section className={`${sectionCardClass} mt-6`}>
          <h2 className="text-xl font-semibold text-[#111827]">Detailed Breakdown</h2>
          <p className="mt-2 text-sm text-[#5D6B85]">Review the underlying data only after the action path above feels clear.</p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
              <h3 className="text-lg font-semibold text-[#111827]">Lead Details</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><UserRound className="h-4 w-4" />Full Name</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.fullName}</p>
                </div>
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><Mail className="h-4 w-4" />{isBusinessAudience ? "Primary Contact Email" : "Email"}</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.workEmail}</p>
                </div>
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><Phone className="h-4 w-4" />{isBusinessAudience ? "Primary Contact Phone" : "Phone"}</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.phoneNumber || "Not provided"}</p>
                </div>
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><MapPin className="h-4 w-4" />Location</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.location}</p>
                </div>
                {isBusinessAudience ? (
                  <>
                    <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><Building2 className="h-4 w-4" />Company</p>
                      <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.companyName || "Not provided"}</p>
                    </div>
                    <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><Briefcase className="h-4 w-4" />Primary Role / Business Type</p>
                      <p className="mt-2 text-sm font-semibold text-[#111827]">{experienceLabel || "Not provided"}</p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><Users className="h-4 w-4" />Audience</p>
                    <p className="mt-2 text-sm font-semibold text-[#111827]">{audienceLabel}</p>
                  </div>
                )}
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><Briefcase className="h-4 w-4" />Budget Preference</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.budgetPreference || "Not provided"}</p>
                </div>
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]"><Sparkles className="h-4 w-4" />Urgency</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.urgencyPreference || "Not provided"}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
              <h3 className="text-lg font-semibold text-[#111827]">Category Breakdown</h3>
              <div className="mt-4 space-y-4">
                {submission.categoryBreakdown.map((item) => {
                  const percentage = item.maxRiskPoints === 0 ? 0 : Math.round((item.riskPoints / item.maxRiskPoints) * 100);
                  return (
                    <div key={item.category} className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#111827]">{item.category}</p>
                        <p className="text-xs text-[#7B89A2]">{percentage}%</p>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5EDFB]">
                        <div className="h-full rounded-full bg-[#356AF6]" style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-[#5D6B85]">{item.riskPoints}/{item.maxRiskPoints} points</p>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          <article className="mt-6 rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
            <h3 className="text-lg font-semibold text-[#111827]">Uploaded Answers</h3>
            <div className="mt-4 space-y-3">
              {submission.responses.map((response, index) => (
                <article key={response.questionId} className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Q{index + 1} | {response.category}</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{response.questionText}</p>
                  <p className="mt-2 text-sm leading-6 text-[#111827]"><span className="font-medium">Selected:</span> {response.selectedOptionLabel}. {response.selectedOptionText}</p>
                  <p className="mt-1 text-xs text-[#5D6B85]">Risk points: {response.selectedOptionRiskPoints}</p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </div>

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        leadEmail={submission.lead.workEmail || ""}
        leadName={submission.lead.fullName || "Client"}
        onSuccess={handleAuthSuccess}
        actionIntent={modalActionIntent}
      />
    </main>
  );
}
