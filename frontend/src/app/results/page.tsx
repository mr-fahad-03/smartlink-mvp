"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { ExpertMatchCard } from "@/components/results/expert-match-card";
import { RiskGauge } from "@/components/results/risk-gauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockQuizEnginePayload } from "@/data";
import { loadAssessmentSubmission } from "@/lib/assessment-storage";
import type { AssessmentSubmission, Expert, QuizCategory } from "@/types";

function getMatchedExperts(
  highestRiskCategory: QuizCategory,
  recommendedExpertIds: string[],
): Expert[] {
  const recommended = recommendedExpertIds
    .map((id) => mockQuizEnginePayload.experts.find((expert) => expert.id === id))
    .filter((expert): expert is Expert => Boolean(expert));

  const categorySpecialists = mockQuizEnginePayload.experts.filter((expert) =>
    expert.specialties.includes(highestRiskCategory),
  );

  return [...recommended, ...categorySpecialists].filter(
    (expert, index, array) => array.findIndex((item) => item.id === expert.id) === index,
  );
}

function getAvailability(submittedAtIso: string, availableAtIso: string) {
  const submittedAt = new Date(submittedAtIso).getTime();
  const availableAt = new Date(availableAtIso).getTime();
  const diffInHours = Math.ceil((availableAt - submittedAt) / (1000 * 60 * 60));
  const availableWithin48Hours = diffInHours <= 48;

  if (diffInHours <= 0) {
    return {
      availableWithin48Hours,
      label: "Available now (within 48h)",
    };
  }

  if (availableWithin48Hours) {
    return {
      availableWithin48Hours,
      label: "Available within 48h",
    };
  }

  return {
    availableWithin48Hours,
    label: `Available in ${diffInHours}h`,
  };
}

function buildMatchReason(
  expert: Expert,
  highestRiskCategory: QuizCategory,
  highestRiskPoints: number,
  highestRiskMaxPoints: number,
) {
  const primaryMatch = expert.specialties.includes(highestRiskCategory);
  const secondarySpecialty = expert.specialties.find(
    (specialty) => specialty !== highestRiskCategory,
  );

  if (primaryMatch && secondarySpecialty) {
    return `Your highest risk is ${highestRiskCategory} (${highestRiskPoints}/${highestRiskMaxPoints}). ${expert.fullName} directly specializes in this area, with additional strength in ${secondarySpecialty}.`;
  }

  if (primaryMatch) {
    return `Your highest risk is ${highestRiskCategory} (${highestRiskPoints}/${highestRiskMaxPoints}), and ${expert.fullName} has direct specialization in that domain.`;
  }

  return `${expert.fullName} was recommended due to overlap with your risk profile and proven execution in adjacent high-impact categories.`;
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

  const matchedExperts = useMemo(() => {
    if (!submission || !highestRisk) {
      return [];
    }

    return getMatchedExperts(highestRisk.category, submission.recommendedExpertIds);
  }, [highestRisk, submission]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,#f9fcff_0%,#eef3f8_42%,#edf2f6_100%)] px-6">
        <div className="rounded-2xl border border-white/70 bg-white/90 px-8 py-10 text-center shadow-[0_20px_50px_rgba(17,24,39,0.2)]">
          <p className="text-sm text-[#6B7280]">Loading your assessment results...</p>
        </div>
      </main>
    );
  }

  if (!submission || !highestRisk) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,#f9fcff_0%,#eef3f8_42%,#edf2f6_100%)] px-6">
        <div className="max-w-xl rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-[0_22px_60px_rgba(17,24,39,0.18)]">
          <Badge className="bg-[#45B0A0]/12 text-[#2f8f90]">No Uploaded Results</Badge>
          <h1 className="mt-4 text-2xl font-semibold text-[#111827] sm:text-3xl">
            Complete the quiz first to generate your report
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            We could not find a saved assessment in this browser session.
          </p>
          <Button asChild size="lg" className="mt-6 h-11 bg-[#45B0A0] text-white hover:bg-[#3ca293]">
            <Link href="/quiz">
              Start Assessment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const submittedLabel = new Date(submission.submittedAt).toLocaleString();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_20%,rgba(69,176,160,0.14),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(14,165,233,0.1),transparent_45%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:py-16">
        <section className="rounded-3xl border border-white/70 bg-white/88 p-6 shadow-[0_20px_50px_rgba(17,24,39,0.14)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge className="bg-[#45B0A0]/12 text-[#2f8f90]">Results Dashboard</Badge>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              Submitted: {submittedLabel}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                Your Full Assessment Results
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7280] sm:text-base">
                This dashboard contains the uploaded lead details, risk scoring,
                category analysis, and every answer you submitted.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full border border-[#45B0A0]/40 bg-white text-[#2f8f90] hover:bg-[#45B0A0]/10 sm:w-auto"
              >
                <Link href="/expert-match">
                  Show Matching
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="w-full bg-[#45B0A0] text-white hover:bg-[#3ca293] sm:w-auto">
                <Link href="/quiz">
                  Retake Assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <Card className="border-white/70 bg-white/85 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Overall Risk Gauge</CardTitle>
            </CardHeader>
            <CardContent>
              <RiskGauge score={submission.normalizedScore} label="Overall Risk Score" />
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/85 backdrop-blur-md">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <CardTitle>Highest-Risk Category</CardTitle>
              </div>
              <Badge className="w-fit bg-rose-100 text-rose-700">{highestRisk.category}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#6B7280]">
                Your top exposure is <strong>{highestRisk.category}</strong> at{" "}
                {highestRisk.riskPoints}/{highestRisk.maxRiskPoints} points (
                {toDisplayRiskLevel(submission.riskLevel)} risk overall).
              </p>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">Priority Actions</p>
                <ul className="space-y-2 text-sm text-[#111827]">
                  {submission.priorityActions.map((action) => (
                    <li key={action} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-white/70 bg-white/85 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Lead Capture Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#6B7280]">
                  <UserRound className="h-4 w-4" /> Full Name
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{submission.lead.fullName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#6B7280]">
                  <Mail className="h-4 w-4" /> Work Email
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{submission.lead.workEmail}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#6B7280]">
                  <Phone className="h-4 w-4" /> Phone
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{submission.lead.phoneNumber}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#6B7280]">
                  <Building2 className="h-4 w-4" /> Company
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{submission.lead.companyName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#6B7280]">
                  <Briefcase className="h-4 w-4" /> Role / Business Type
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">
                  {submission.lead.role} | {submission.lead.businessType}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#6B7280]">
                  <MapPin className="h-4 w-4" /> Location
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{submission.lead.location}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#6B7280]">
                  <Users className="h-4 w-4" /> Team Size
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{submission.lead.teamSize}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#6B7280]">
                  <Globe className="h-4 w-4" /> Website
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">
                  {submission.lead.website || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/85 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {submission.categoryBreakdown.map((item) => {
                const percentage =
                  item.maxRiskPoints === 0
                    ? 0
                    : Math.round((item.riskPoints / item.maxRiskPoints) * 100);

                return (
                  <div key={item.category} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#111827]">{item.category}</p>
                      <p className="text-xs text-[#6B7280]">{percentage}% risk</p>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#45B0A0]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#6B7280]">
                      {item.riskPoints}/{item.maxRiskPoints} points
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-[#45B0A0]/30 bg-[#45B0A0]/10 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
              <Sparkles className="h-4 w-4 text-[#2f8f90]" />
              Why you matched with these experts
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Expert recommendations are based on your highest-risk domain, score intensity,
              and overlapping implementation specialties.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matchedExperts.map((expert) => {
              const availability = getAvailability(submission.submittedAt, expert.nextAvailableAt);

              return (
                <ExpertMatchCard
                  key={expert.id}
                  expert={expert}
                  highestRiskCategory={highestRisk.category}
                  matchReason={buildMatchReason(
                    expert,
                    highestRisk.category,
                    highestRisk.riskPoints,
                    highestRisk.maxRiskPoints,
                  )}
                  availableWithin48Hours={availability.availableWithin48Hours}
                  availabilityLabel={availability.label}
                />
              );
            })}
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-white/70 bg-white/85 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-[#111827]">Uploaded Answers</h2>
          <p className="text-sm text-[#6B7280]">
            Every submitted answer and its mapped risk points.
          </p>
          <div className="space-y-2">
            {submission.responses.map((response, index) => (
              <article key={response.questionId} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">
                  Q{index + 1} | {response.category}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{response.questionText}</p>
                <p className="mt-2 text-sm text-[#111827]">
                  <span className="font-medium">Selected:</span> {response.selectedOptionLabel}.{" "}
                  {response.selectedOptionText}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
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
