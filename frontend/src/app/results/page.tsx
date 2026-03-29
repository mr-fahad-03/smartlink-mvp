"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
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

import { PageOrientation } from "@/components/navigation/page-orientation";
import { ExpertMatchCard } from "@/components/results/expert-match-card";
import { RiskGauge } from "@/components/results/risk-gauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockQuizEnginePayload } from "@/data";
import { loadAssessmentSubmission, saveAssessmentSubmission } from "@/lib/assessment-storage";
import { rankExpertsForSubmission } from "@/lib/expert-matching";
import type {
  AssessmentSubmission,
  ConnectionStatus,
  MissingFeedbackReason,
  ResultsFeedbackAnswer,
} from "@/types";

interface PersonaProfile {
  title: string;
  description: string;
  nextAction: string;
  tone: string;
}

function toDisplayRiskLevel(riskLevel: AssessmentSubmission["riskLevel"]) {
  if (riskLevel === "critical") return "Critical";
  if (riskLevel === "high") return "High";
  if (riskLevel === "moderate") return "Moderate";
  return "Low";
}

function deriveGeneralPersona(submission: AssessmentSubmission): PersonaProfile {
  const severeResponses = submission.responses.filter(
    (response) => response.selectedOptionRiskPoints >= 7,
  ).length;
  const responseText = submission.responses
    .map((response) => response.selectedOptionText.toLowerCase())
    .join(" ");

  if (submission.normalizedScore >= 65 || severeResponses >= 3) {
    return {
      title: "Urgent Fixer",
      description:
        "Your answers show immediate pressure in a few important areas, so speed matters now.",
      nextAction:
        "Start with the highest-priority issue and connect with an expert who can move within the next 48 hours.",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (
    responseText.includes("manual") ||
    responseText.includes("weekly") ||
    responseText.includes("quarterly") ||
    responseText.includes("basic") ||
    responseText.includes("ad-hoc") ||
    responseText.includes("didn't work")
  ) {
    return {
      title: "Second Attempt",
      description:
        "You already have some motion, but the current setup is not strong enough to carry you through cleanly.",
      nextAction:
        "Strengthen what already exists and fix the weak points that are still slowing progress.",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (submission.normalizedScore <= 20) {
    return {
      title: "Starter",
      description:
        "You are early in the process and need clearer direction more than heavy intervention.",
      nextAction:
        "Use the first recommended action to build momentum before the issue grows more complex.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    title: "Stuck Operator",
    description:
      "You are moving, but unresolved friction is still creating drag, uncertainty, and slower decisions.",
    nextAction:
      "Remove the main blocker first, then follow with the next most practical action from your list.",
    tone: "border-[#BFD0F8] bg-[#EEF3FF] text-[#356AF6]",
  };
}

function deriveCyberPersona(submission: AssessmentSubmission): PersonaProfile {
  if (submission.normalizedScore >= 60) {
    return {
      title: "At Risk",
      description:
        "Your cybersecurity answers suggest meaningful gaps that could affect operations, trust, or recovery.",
      nextAction:
        "Move first on protection, backup, and recovery readiness so the business is less exposed.",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (submission.normalizedScore >= 25) {
    return {
      title: "Partially Protected",
      description:
        "Some foundations are in place, but important protection areas still need tightening.",
      nextAction:
        "Prioritize the weak security areas showing medium-to-high risk and improve them one by one.",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    title: "Well Protected",
    description:
      "Your answers point to a healthier baseline with fewer urgent protection gaps than average.",
    nextAction:
      "Keep your strongest protections current and close the remaining smaller gaps before they grow.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getSuggestedTimeframe(urgencyPreference?: string) {
  if (urgencyPreference === "24-48 hours") return "Within the next 24-48 hours";
  if (urgencyPreference === "Within a week") return "Within the next 7 days";
  if (urgencyPreference === "Just exploring") return "This week, before making the next decision";
  return "As soon as practical";
}

function getPersonalizedMatchMessage(submission: AssessmentSubmission, highestRiskCategory: string) {
  const urgency = submission.lead.urgencyPreference?.toLowerCase() ?? "your timeline";
  const budget = submission.lead.budgetPreference?.toLowerCase() ?? "your budget";
  return `Based on your urgency (${urgency}) and budget (${budget}), we prioritized fast-response experts with strong alignment to ${highestRiskCategory}.`;
}

const missingReasonOptions: { value: MissingFeedbackReason; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "relevance", label: "Relevance" },
  { value: "location", label: "Location" },
  { value: "urgency", label: "Urgency" },
];

export default function ResultsPage() {
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = loadAssessmentSubmission();
    setSubmission(stored);
    setIsLoaded(true);
  }, []);

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
    return rankExpertsForSubmission(
      submission,
      highestRisk.category,
      mockQuizEnginePayload.experts,
    ).slice(0, 3);
  }, [highestRisk, submission]);

  const generalPersona = useMemo(() => (submission ? deriveGeneralPersona(submission) : null), [submission]);
  const cyberPersona = useMemo(() => (submission ? deriveCyberPersona(submission) : null), [submission]);

  const assessmentMode =
    submission?.assessmentMode ??
    (submission?.highestRiskCategory === "Cybersecurity" ? "cybersecurity-risk" : "business-services");
  const leadTier = submission?.leadTier ?? "standard";

  if (!isLoaded) {
    return (
      <main className="sl-page min-h-screen px-6 py-8">
        <div className="mx-auto w-full max-w-6xl">
          <PageOrientation
            fallbackHref="/quiz"
            eyebrow="Results Dashboard"
            title={assessmentMode === "cybersecurity-risk" ? "Your Cybersecurity Risk Results" : "Your Smart Results"}
            description="We are loading your completed assessment so you can review your next step and best matches."
            currentView="Results Loading"
            stepLabel="Step 3 of 4"
            nextLabel="Review your action plan and continue to matched experts."
          />
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
          <PageOrientation
            fallbackHref="/quiz"
            eyebrow="Results Dashboard"
            title="Complete the Assessment First"
            description="We could not find a saved result in this browser session yet."
            currentView="Missing Results"
            stepLabel="Step 3 of 4"
            nextLabel="Return to the quiz to finish your assessment."
          />
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
  const personaCards = assessmentMode === "cybersecurity-risk"
    ? [
        { label: "Cybersecurity Persona", profile: cyberPersona },
        { label: "General Flow Persona", profile: generalPersona },
      ]
    : [{ label: "Your Persona", profile: generalPersona }];
  const sectionCardClass = "rounded-[28px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]";
  const feedbackAnswer = submission.feedbackLoop?.userFeedback;
  const missingReasons = submission.feedbackLoop?.missingReasons ?? [];
  const connectionStatus = submission.feedbackLoop?.connectionStatus ?? "pending";
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
        <PageOrientation
          fallbackHref="/quiz"
          eyebrow="Results Dashboard"
          title={assessmentMode === "cybersecurity-risk" ? "Your Cybersecurity Results" : isBusinessAudience ? "Your Smart Results" : "Your Support Results"}
          description={`Hello ${submission.lead.fullName}. Your results are organized to help you act quickly, not just review information.`}
          currentView={highestRisk.category}
          stepLabel="Step 3 of 4"
          nextLabel="Review your next step first, then continue to the best matched experts."
        />

        <p className="mt-4 text-right text-sm text-[#7B89A2]">Submitted: {submittedLabel}</p>

        <section className="mt-6 rounded-[30px] border border-[#CFE0FF] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_18px_42px_rgba(56,75,107,0.10)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">
                Your Next Step
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#111827]">Start with the clearest move, then connect with the right expert.</h2>
              <p className="mt-3 text-sm leading-7 text-[#5D6B85]">We organized your result so the first action is obvious before you review the deeper detail.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]">
                <Link href="/expert-match">
                  Get Connected to the Right Expert
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#D9E3F3] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Primary Issue</p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">{highestRisk.category}</p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">This is the area creating the strongest pressure right now.</p>
            </div>
            <div className="rounded-2xl border border-[#D9E3F3] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Recommended Action</p>
              <p className="mt-2 text-base font-semibold leading-7 text-[#111827]">{submission.priorityActions[0]}</p>
            </div>
            <div className="rounded-2xl border border-[#D9E3F3] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Suggested Timeframe</p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">{getSuggestedTimeframe(submission.lead.urgencyPreference)}</p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">Aligned to the urgency you selected in the quiz.</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <article className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-[#111827]">Top Priority Area</h2>
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
              {isBusinessAudience ? "Your highest exposure right now is" : "The main area that needs attention right now is"} <strong>{highestRisk.category}</strong>. It scored {highestRisk.riskPoints}/{highestRisk.maxRiskPoints} points in this assessment.
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
                  {action}
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
              We translated your answers into a simple persona so the next move is easier to understand.
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
              "No obligation to hire",
            ].map((item) => (
              <div key={item} className="rounded-full border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-2 text-sm font-medium text-[#111827]">
                {item}
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#5D6B85]">
            Review the shortlist below, then move into the full expert-match screen when you are ready to compare options more closely.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]">
              <Link href="/expert-match">
                See Your Best Matches
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 rounded-xl border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]">
              <Link href="/expert-match">Talk to an Expert Now</Link>
            </Button>
          </div>

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
              />
            ))}
          </div>
        </section>

        <section className={`${sectionCardClass} mt-6`}>
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-[#356AF6]" />
            <h2 className="text-xl font-semibold text-[#111827]">Did these results meet your needs?</h2>
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
              <p className="text-sm font-semibold text-[#111827]">What was missing?</p>
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
                After 24-48 hours, we will prompt this session to confirm whether you connected with an expert.
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
    </main>
  );
}
