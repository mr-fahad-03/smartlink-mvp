"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
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
import { loadAssessmentSubmission } from "@/lib/assessment-storage";
import { rankExpertsForSubmission } from "@/lib/expert-matching";
import type { AssessmentSubmission } from "@/types";

interface PersonaProfile {
  title: string;
  description: string;
  nextAction: string;
  tone: string;
}

function toDisplayRiskLevel(riskLevel: AssessmentSubmission["riskLevel"]) {
  if (riskLevel === "critical") {
    return "Critical";
  }
  if (riskLevel === "high") {
    return "High";
  }
  if (riskLevel === "moderate") {
    return "Moderate";
  }
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
        "Your answers show immediate exposure in a few critical areas that need fast action.",
      nextAction:
        "Start with the highest-risk category and engage an expert who can move in the next 48 hours.",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (
    responseText.includes("manual") ||
    responseText.includes("weekly") ||
    responseText.includes("quarterly") ||
    responseText.includes("basic") ||
    responseText.includes("ad-hoc")
  ) {
    return {
      title: "Second Attempt",
      description:
        "You already have some controls in place, but they are not yet consistent or strong enough.",
      nextAction:
        "Tighten what already exists and prioritize the areas where manual work is leaving gaps behind.",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (submission.normalizedScore <= 20) {
    return {
      title: "Starter",
      description:
        "You are early in the journey, with a cleaner foundation and fewer urgent weaknesses than most.",
      nextAction:
        "Keep momentum by strengthening the top category before risk compounds as your business grows.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    title: "Stuck Operator",
    description:
      "Your business is functioning, but a few unresolved weak spots are creating drag and uncertainty.",
    nextAction:
      "Use the priority actions below to remove the blockers that are slowing secure, reliable execution.",
    tone: "border-[#BFD0F8] bg-[#EEF3FF] text-[#356AF6]",
  };
}

function deriveCyberPersona(submission: AssessmentSubmission): PersonaProfile {
  if (submission.normalizedScore >= 60) {
    return {
      title: "At Risk",
      description:
        "Your cybersecurity posture has meaningful gaps that could lead to operational or financial impact.",
      nextAction:
        "Address the highest-risk controls first and move quickly on monitoring, protection, and response readiness.",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (submission.normalizedScore >= 25) {
    return {
      title: "Partially Protected",
      description:
        "Some good foundations are in place, but important areas still need tightening and follow-through.",
      nextAction:
        "Focus on the weak categories showing medium-to-high risk to move toward a more resilient baseline.",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    title: "Well Protected",
    description:
      "Your answers suggest a healthier security baseline with fewer immediate risks than average.",
    nextAction:
      "Maintain momentum by reviewing your strongest controls regularly and closing any remaining smaller gaps.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export default function ResultsPage() {
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = loadAssessmentSubmission();
    setSubmission(stored);
    setIsLoaded(true);
  }, []);

  const highestRisk = useMemo(() => {
    if (!submission) {
      return null;
    }

    return (
      submission.categoryBreakdown.find(
        (item) => item.category === submission.highestRiskCategory,
      ) ?? submission.categoryBreakdown[0]
    );
  }, [submission]);

  const rankedExperts = useMemo(() => {
    if (!submission || !highestRisk) {
      return [];
    }

    return rankExpertsForSubmission(
      submission,
      highestRisk.category,
      mockQuizEnginePayload.experts,
    ).slice(0, 3);
  }, [highestRisk, submission]);
  const generalPersona = useMemo(
    () => (submission ? deriveGeneralPersona(submission) : null),
    [submission],
  );
  const cyberPersona = useMemo(
    () => (submission ? deriveCyberPersona(submission) : null),
    [submission],
  );
  const assessmentMode =
    submission?.assessmentMode ??
    (submission?.highestRiskCategory === "IT & Cybersecurity"
      ? "cybersecurity-risk"
      : "business-services");
  const leadTier = submission?.leadTier ?? "standard";

  if (!isLoaded) {
    return (
      <main className="sl-page min-h-screen px-6 py-8">
        <div className="mx-auto w-full max-w-6xl">
          <PageOrientation
            fallbackHref="/quiz"
            eyebrow="Results Dashboard"
            title={
              assessmentMode === "cybersecurity-risk"
                ? "Your Cybersecurity Risk Results"
                : "Your Smart Risk Results"
            }
            description="We are loading your completed assessment so you can review your score, your gaps, and the next recommended move."
            currentView="Results Loading"
            stepLabel="Step 3 of 4"
            nextLabel="Review your score and continue to matched providers."
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
            description="We could not find a saved result in this browser session, so the dashboard cannot be generated yet."
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
            <Button
              asChild
              size="lg"
              className="mt-6 h-11 rounded-xl bg-[#356AF6] px-5 text-white hover:bg-[#2C59D8]"
            >
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
  const sectionCardClass =
    "rounded-[28px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]";

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
          title={
            assessmentMode === "cybersecurity-risk"
              ? "Your Cybersecurity Risk Results"
              : "Your Smart Risk Results"
          }
          description={`Hello ${submission.lead.fullName}. Your assessment has been organized into a clear ${assessmentMode === "cybersecurity-risk" ? "cybersecurity" : "business"} snapshot so you can understand the risk, priority, and next move.`}
          currentView={highestRisk.category}
          stepLabel="Step 3 of 4"
          nextLabel="Review your score below, then continue to matched providers."
        />

        <p className="mt-4 text-right text-sm text-[#7B89A2]">Submitted: {submittedLabel}</p>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className={sectionCardClass}>
            <h2 className="text-2xl font-semibold text-[#111827]">Assessment Summary</h2>
            <p className="mt-3 text-sm leading-6 text-[#5D6B85]">
              A concise snapshot of your current risk posture and the business context behind it.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Overall Risk</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">
                  {toDisplayRiskLevel(submission.riskLevel)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Top Category</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">{highestRisk.category}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Location</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">{submission.lead.location}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Team Size</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">{submission.lead.teamSize}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Assessment Mode</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">
                  {assessmentMode === "cybersecurity-risk" ? "Cybersecurity Risk" : "Business Services"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Lead Tier</p>
                <p className="mt-2 text-lg font-semibold text-[#111827]">
                  {leadTier === "premium" ? "Premium Lead" : "Standard Lead"}
                </p>
              </div>
            </div>
          </article>

          <article className={sectionCardClass}>
            <h2 className="text-2xl font-semibold text-[#111827]">Your Priorities</h2>
            <ul className="mt-5 space-y-3">
              <li className="flex items-start gap-3 text-sm text-[#111827]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                Highest-risk exposure is <strong>{highestRisk.category}</strong>.
              </li>
              <li className="flex items-start gap-3 text-sm text-[#111827]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                Recommended action path is based on {submission.answeredQuestions} answered assessment questions.
              </li>
              <li className="flex items-start gap-3 text-sm text-[#111827]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                Expert matching is tuned for {submission.lead.companyName} in {submission.lead.location}.
              </li>
            </ul>
          </article>
        </section>

        <section className={`${sectionCardClass} mt-6`}>
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#356AF6]" />
            <h2 className="text-2xl font-semibold text-[#111827]">Matched Expert Overview</h2>
          </div>

          <div className="mt-5 rounded-[22px] border border-[#B7EDC8] bg-[#F2FBF5] p-5">
            <p className="flex items-center gap-2 text-lg font-semibold text-[#15803D]">
              <CheckCircle2 className="h-5 w-5" />
              Experts ready to help you now
            </p>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#166534]">
              Based on your category risk, location, budget, urgency, and experience preferences, we&apos;ve identified expert providers who align with your highest-priority needs and can move quickly on the issues that matter most.
            </p>
          </div>

          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#5D6B85]">
            Your smart matching results are designed to move you from awareness to action. Review your report below, then continue to the provider screen to explore services and request support.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]"
            >
              <Link href="/expert-match">
                View Your Matched Providers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 rounded-xl border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
            >
              <Link href="/quiz">Retake Assessment</Link>
            </Button>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <article className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-[#111827]">Overall Risk Gauge</h2>
            <div className="mt-6">
              <RiskGauge score={submission.normalizedScore} label="Overall Risk Score" />
            </div>
          </article>

          <article className={sectionCardClass}>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#356AF6]" />
              <h2 className="text-xl font-semibold text-[#111827]">Highest-Risk Category</h2>
            </div>
            <Badge className="mt-4 h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">
              {highestRisk.category}
            </Badge>
            <p className="mt-4 text-sm leading-6 text-[#5D6B85]">
              Your top exposure is <strong>{highestRisk.category}</strong> at {highestRisk.riskPoints}/{highestRisk.maxRiskPoints} points.
            </p>

            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                Priority Actions
              </p>
              {submission.priorityActions.map((action) => (
                <div
                  key={action}
                  className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3 text-sm leading-6 text-[#111827]"
                >
                  {action}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-[#111827]">Lead Capture Details</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <UserRound className="h-4 w-4" />
                  Full Name
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.fullName}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Mail className="h-4 w-4" />
                  Work Email
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.workEmail}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Phone className="h-4 w-4" />
                  Phone
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {submission.lead.phoneNumber || "Not provided"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Building2 className="h-4 w-4" />
                  Company
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.companyName}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Briefcase className="h-4 w-4" />
                  Role / Business Type
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {submission.lead.role} | {submission.lead.businessType}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <MapPin className="h-4 w-4" />
                  Location
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.location}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Users className="h-4 w-4" />
                  Team Size
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">{submission.lead.teamSize}</p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Briefcase className="h-4 w-4" />
                  Budget Preference
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {submission.lead.budgetPreference || "Not provided"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Sparkles className="h-4 w-4" />
                  Urgency
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {submission.lead.urgencyPreference || "Not provided"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <ShieldCheck className="h-4 w-4" />
                  Prior Experience
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {submission.lead.priorConsultingExperience || "Not provided"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Globe className="h-4 w-4" />
                  Website
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {submission.lead.website || "Not provided"}
                </p>
              </div>
            </div>
          </article>

          <article className={sectionCardClass}>
            <h2 className="text-xl font-semibold text-[#111827]">Category Breakdown</h2>
            <div className="mt-5 space-y-4">
              {submission.categoryBreakdown.map((item) => {
                const percentage =
                  item.maxRiskPoints === 0
                    ? 0
                    : Math.round((item.riskPoints / item.maxRiskPoints) * 100);

                return (
                  <div
                    key={item.category}
                    className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#111827]">{item.category}</p>
                      <p className="text-xs text-[#7B89A2]">{percentage}% risk</p>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5EDFB]">
                      <div
                        className="h-full rounded-full bg-[#356AF6]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#5D6B85]">
                      {item.riskPoints}/{item.maxRiskPoints} points
                    </p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        {generalPersona && cyberPersona ? (
          <section className={`${sectionCardClass} mt-6`}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#356AF6]" />
              <h2 className="text-xl font-semibold text-[#111827]">Your Personas</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5D6B85]">
              We translated your assessment into two simple profiles so the results are easier to understand and act on.
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${generalPersona.tone}`}>
                    General Flow Persona
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-[#111827]">{generalPersona.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{generalPersona.description}</p>
                <div className="mt-4 rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                    Recommended Next Action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#111827]">{generalPersona.nextAction}</p>
                </div>
              </article>

              <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${cyberPersona.tone}`}>
                    Cybersecurity Persona
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-[#111827]">{cyberPersona.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{cyberPersona.description}</p>
                <div className="mt-4 rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                    Recommended Next Action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#111827]">{cyberPersona.nextAction}</p>
                </div>
              </article>
            </div>
          </section>
        ) : null}

        <section className={`${sectionCardClass} mt-6`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#356AF6]" />
            <h2 className="text-xl font-semibold text-[#111827]">Why these experts were selected</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#5D6B85]">
            These recommendations are ranked with a simple weighted model across category fit, location, budget, urgency, and prior experience. Each card shows availability, match strength, and why the expert rose to the top.
          </p>
          <div className="mt-4 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3 text-sm text-[#111827]">
            <span className="font-semibold">Marketplace readiness:</span> This result has been tagged as a{" "}
            <span className="text-[#356AF6]">{leadTier === "premium" ? "Premium Lead" : "Standard Lead"}</span>
            {" "}and includes ranking-control snapshots for the matched experts.
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rankedExperts.map((match) => {
              return (
                <ExpertMatchCard
                  key={match.expert.id}
                  expert={match.expert}
                  highestRiskCategory={highestRisk.category}
                  matchReason={match.matchReason}
                  availableWithin48Hours={match.availableWithin48Hours}
                  availabilityLabel={match.availabilityLabel}
                  matchTier={match.matchTier}
                  matchScore={match.totalScore}
                />
              );
            })}
          </div>
        </section>

        <section className={`${sectionCardClass} mt-6`}>
          <h2 className="text-xl font-semibold text-[#111827]">Uploaded Answers</h2>
          <p className="mt-2 text-sm text-[#5D6B85]">
            Every submitted answer and its mapped risk points.
          </p>
          <div className="mt-5 space-y-3">
            {submission.responses.map((response, index) => (
              <article
                key={response.questionId}
                className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                  Q{index + 1} | {response.category}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">{response.questionText}</p>
                <p className="mt-2 text-sm leading-6 text-[#111827]">
                  <span className="font-medium">Selected:</span> {response.selectedOptionLabel}.{" "}
                  {response.selectedOptionText}
                </p>
                <p className="mt-1 text-xs text-[#5D6B85]">
                  Risk points: {response.selectedOptionRiskPoints}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
