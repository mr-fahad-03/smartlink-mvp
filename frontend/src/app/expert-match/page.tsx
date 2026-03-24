"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockQuizEnginePayload } from "@/data";
import { loadAssessmentSubmission } from "@/lib/assessment-storage";
import { cn } from "@/lib/utils";
import type { AssessmentSubmission, Expert, QuizCategory } from "@/types";

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  deliveryWindow: string;
  categories: QuizCategory[];
}

interface SelectedServiceItem {
  id: string;
  expertId: string;
  expertName: string;
  serviceId: string;
  serviceName: string;
  priceUsd: number;
  deliveryWindow: string;
}

const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: "svc-security-baseline",
    name: "Security Baseline Hardening",
    description: "Close urgent control gaps and implement immediate safeguards.",
    priceUsd: 1400,
    deliveryWindow: "5-7 days",
    categories: ["Network Security", "Endpoint Security", "Cloud Security"],
  },
  {
    id: "svc-iam-remediation",
    name: "IAM Remediation Sprint",
    description: "Fix privilege, account lifecycle, and access governance weaknesses.",
    priceUsd: 1600,
    deliveryWindow: "7-10 days",
    categories: ["Identity & Access Management", "Cloud Security"],
  },
  {
    id: "svc-ir-readiness",
    name: "Incident Response Readiness",
    description: "Build response playbooks and escalation process for critical incidents.",
    priceUsd: 1200,
    deliveryWindow: "4-6 days",
    categories: ["Incident Response", "Network Security"],
  },
  {
    id: "svc-cloud-guardrails",
    name: "Cloud Guardrails Setup",
    description: "Implement policy checks and continuous misconfiguration monitoring.",
    priceUsd: 1750,
    deliveryWindow: "8-12 days",
    categories: ["Cloud Security", "Identity & Access Management"],
  },
];

function getMatchedExperts(highestRiskCategory: QuizCategory, recommendedExpertIds: string[]): Expert[] {
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
    return { availableWithin48Hours, label: "Available now (within 48h)" };
  }
  if (availableWithin48Hours) {
    return { availableWithin48Hours, label: "Available within 48h" };
  }
  return { availableWithin48Hours, label: `Available in ${diffInHours}h` };
}

function getServicesForExpert(expert: Expert, highestRiskCategory: QuizCategory): ServicePackage[] {
  const withSpecialty = SERVICE_PACKAGES.filter((service) =>
    service.categories.some((category) => expert.specialties.includes(category)),
  );

  return withSpecialty
    .sort((a, b) => {
      const aPriority = a.categories.includes(highestRiskCategory) ? 0 : 1;
      const bPriority = b.categories.includes(highestRiskCategory) ? 0 : 1;
      return aPriority - bPriority;
    })
    .slice(0, 3);
}

export default function ExpertMatchPage() {
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Record<string, SelectedServiceItem>>({});
  const [requestSent, setRequestSent] = useState(false);

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

  const selectedServiceItems = useMemo(() => Object.values(selectedServices), [selectedServices]);
  const totalEstimatedCost = useMemo(
    () => selectedServiceItems.reduce((sum, item) => sum + item.priceUsd, 0),
    [selectedServiceItems],
  );

  const toggleService = (expert: Expert, service: ServicePackage) => {
    setRequestSent(false);
    const key = `${expert.id}:${service.id}`;

    setSelectedServices((previous) => {
      if (previous[key]) {
        const clone = { ...previous };
        delete clone[key];
        return clone;
      }

      return {
        ...previous,
        [key]: {
          id: key,
          expertId: expert.id,
          expertName: expert.fullName,
          serviceId: service.id,
          serviceName: service.name,
          priceUsd: service.priceUsd,
          deliveryWindow: service.deliveryWindow,
        },
      };
    });
  };

  const removeSelectedService = (id: string) => {
    setSelectedServices((previous) => {
      const clone = { ...previous };
      delete clone[id];
      return clone;
    });
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,#f9fcff_0%,#eef3f8_42%,#edf2f6_100%)] px-6">
        <p className="text-sm text-[#6B7280]">Loading expert matching...</p>
      </main>
    );
  }

  if (!submission || !highestRisk) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,#f9fcff_0%,#eef3f8_42%,#edf2f6_100%)] px-6">
        <div className="max-w-xl rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-[0_22px_60px_rgba(17,24,39,0.18)]">
          <Badge className="bg-[#45B0A0]/12 text-[#2f8f90]">Missing Results</Badge>
          <h1 className="mt-4 text-2xl font-semibold text-[#111827] sm:text-3xl">
            Complete your assessment before expert matching
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            We could not find your latest result data in this browser session.
          </p>
          <Button asChild size="lg" className="mt-6 h-11 bg-[#45B0A0] text-white hover:bg-[#3ca293]">
            <Link href="/results">
              Back to Results
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,rgba(69,176,160,0.14),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(14,165,233,0.1),transparent_45%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white/88 p-6 shadow-[0_20px_50px_rgba(17,24,39,0.14)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="bg-[#45B0A0]/12 text-[#2f8f90]">Expert Match</Badge>
              <Button asChild variant="outline" className="border-[#45B0A0]/35 text-[#2f8f90]">
                <Link href="/results">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Results
                </Link>
              </Button>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
              Show Matching: Add Services With Trusted Experts
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#6B7280] sm:text-base">
              Pick one or more services from your matched experts. We will prepare a consolidated service request.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-rose-100 text-rose-700">
                Highest Risk: {highestRisk.category}
              </Badge>
              <Badge variant="outline">{submission.normalizedScore}/100 risk score</Badge>
            </div>
          </div>

          <div className="grid gap-4">
            {matchedExperts.map((expert) => {
              const availability = getAvailability(submission.submittedAt, expert.nextAvailableAt);
              const services = getServicesForExpert(expert, highestRisk.category);

              return (
                <article
                  key={expert.id}
                  className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-[0_18px_45px_rgba(17,24,39,0.12)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-[#111827]">{expert.fullName}</h2>
                      <p className="text-sm text-[#6B7280]">
                        {expert.role} at {expert.organization}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {expert.specialties.map((specialty) => (
                      <Badge key={`${expert.id}-${specialty}`} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-[#111827]">
                      <Star className="h-4 w-4 text-amber-500" />
                      {expert.rating.toFixed(1)} rating
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#6B7280]">
                      <ShieldCheck className="h-4 w-4 text-[#2f8f90]" />
                      {expert.yearsExperience}+ years
                    </span>
                    <span
                      className={
                        availability.availableWithin48Hours
                          ? "inline-flex items-center gap-1 text-emerald-600"
                          : "inline-flex items-center gap-1 text-rose-600"
                      }
                    >
                      <Clock3 className="h-4 w-4" />
                      {availability.label}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
                      <Sparkles className="h-4 w-4 text-[#2f8f90]" />
                      Add Service
                    </p>
                    {services.map((service) => {
                      const selectionKey = `${expert.id}:${service.id}`;
                      const isSelected = Boolean(selectedServices[selectionKey]);

                      return (
                        <div
                          key={service.id}
                          className={cn(
                            "rounded-2xl border p-4 transition",
                            isSelected
                              ? "border-[#45B0A0]/50 bg-[#45B0A0]/10"
                              : "border-slate-200 bg-white",
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#111827]">{service.name}</p>
                              <p className="mt-1 text-sm text-[#6B7280]">{service.description}</p>
                              <p className="mt-2 text-xs text-[#6B7280]">
                                Delivery: {service.deliveryWindow}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#111827]">
                                ${service.priceUsd.toLocaleString()}
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => toggleService(expert, service)}
                                className={
                                  isSelected
                                    ? "mt-2 border border-[#45B0A0]/35 bg-white text-[#2f8f90] hover:bg-[#45B0A0]/10"
                                    : "mt-2 bg-[#45B0A0] text-white hover:bg-[#3ca293]"
                                }
                              >
                                {isSelected ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4" />
                                    Add Service
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="xl:sticky xl:top-6 xl:h-fit">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(17,24,39,0.14)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              Service Request Summary
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#111827]">
              {submission.lead.companyName}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Contact: {submission.lead.fullName} ({submission.lead.workEmail})
            </p>

            <div className="mt-5 space-y-2">
              {selectedServiceItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-[#6B7280]">
                  No services added yet. Add services from matched experts.
                </div>
              ) : (
                selectedServiceItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-[#111827]">{item.serviceName}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{item.expertName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-[#6B7280]">{item.deliveryWindow}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#111827]">
                          ${item.priceUsd.toLocaleString()}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeSelectedService(item.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                          aria-label={`Remove ${item.serviceName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Services selected</span>
                <span className="font-semibold text-[#111827]">{selectedServiceItems.length}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Estimated total</span>
                <span className="font-semibold text-[#111827]">
                  ${totalEstimatedCost.toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={() => setRequestSent(true)}
              disabled={selectedServiceItems.length === 0}
              className="mt-5 h-11 w-full bg-[#45B0A0] text-white hover:bg-[#3ca293] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Briefcase className="h-4 w-4" />
              Submit Service Request
            </Button>

            {requestSent ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                Service request submitted. Our team will contact {submission.lead.fullName} shortly.
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

