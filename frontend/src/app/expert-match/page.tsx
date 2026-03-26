"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";

import { PageOrientation } from "@/components/navigation/page-orientation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockQuizEnginePayload } from "@/data";
import { loadAssessmentSubmission } from "@/lib/assessment-storage";
import {
  getMatchTierTone,
  rankExpertsForSubmission,
} from "@/lib/expert-matching";
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
    id: "svc-business-launch",
    name: "Business Launch Roadmap",
    description: "Clarify setup steps, required documents, and the right starting sequence.",
    priceUsd: 1400,
    deliveryWindow: "5-7 days",
    categories: ["Business Setup", "General Business Support"],
  },
  {
    id: "svc-license-sprint",
    name: "License & Approval Sprint",
    description: "Review required approvals, fix blockers, and organize the right submission path.",
    priceUsd: 1600,
    deliveryWindow: "7-10 days",
    categories: ["Licenses & Approvals", "Business Setup"],
  },
  {
    id: "svc-cyber-baseline",
    name: "Cybersecurity Baseline Review",
    description: "Identify the biggest gaps in protection, backup, and recovery readiness.",
    priceUsd: 1200,
    deliveryWindow: "4-6 days",
    categories: ["IT & Cybersecurity", "General Business Support"],
  },
  {
    id: "svc-finance-reset",
    name: "Finance Workflow Reset",
    description: "Clean up accounting processes, reporting gaps, and operational financial confusion.",
    priceUsd: 1750,
    deliveryWindow: "8-12 days",
    categories: ["Accounting & Finance", "General Business Support"],
  },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

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
    );
  }, [highestRisk, submission]);

  const filteredExperts = useMemo(() => {
    return rankedExperts.filter((match) => {
      const expert = match.expert;
      const services = getServicesForExpert(expert, highestRisk?.category ?? expert.specialties[0]);
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        expert.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expert.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expert.organization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService =
        serviceFilter === "all" ||
        services.some((service) => service.name === serviceFilter);
      const matchesLocation =
        locationFilter === "all" || match.profile.locationLabel === locationFilter;

      return matchesSearch && matchesService && matchesLocation;
    });
  }, [highestRisk, locationFilter, rankedExperts, searchTerm, serviceFilter]);

  const selectedServiceItems = useMemo(() => Object.values(selectedServices), [selectedServices]);
  const totalEstimatedCost = useMemo(
    () => selectedServiceItems.reduce((sum, item) => sum + item.priceUsd, 0),
    [selectedServiceItems],
  );
  const assessmentMode =
    submission?.assessmentMode ??
    (submission?.highestRiskCategory === "IT & Cybersecurity"
      ? "cybersecurity-risk"
      : "business-services");
  const leadTier = submission?.leadTier ?? "standard";

  const serviceOptions = useMemo(
    () => Array.from(new Set(SERVICE_PACKAGES.map((service) => service.name))),
    [],
  );

  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rankedExperts
            .map((match) => match.profile.locationLabel)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [rankedExperts],
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
      <main className="sl-page min-h-screen px-6 py-8">
        <div className="mx-auto w-full max-w-7xl">
          <PageOrientation
            fallbackHref="/results"
            eyebrow="Expert Match"
            title="Loading Your Smart Matches"
            description="We are preparing the providers and services that best align with your latest assessment."
            currentView="Match Loading"
            stepLabel="Step 4 of 4"
            nextLabel="Review matched providers and choose the services you want."
          />
          <div className="mt-6 rounded-[28px] border border-[#D9E3F3] bg-white px-8 py-10 text-center shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <p className="text-sm text-[#5D6B85]">Loading expert matching...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!submission || !highestRisk) {
    return (
      <main className="sl-page min-h-screen px-6 py-8">
        <div className="mx-auto w-full max-w-7xl">
          <PageOrientation
            fallbackHref="/results"
            eyebrow="Expert Match"
            title="Complete Your Assessment Before Matching"
            description="We could not find the latest result data in this browser session, so provider matching is not available yet."
            currentView="Missing Results"
            stepLabel="Step 4 of 4"
            nextLabel="Return to your results, then continue to matched providers."
          />
          <div className="sl-card mt-6 w-full max-w-xl rounded-[30px] p-8 text-center">
            <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">
              Missing Results
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#111827]">
              Complete your assessment before expert matching
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#5D6B85]">
              We could not find your latest result data in this browser session.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 h-11 rounded-xl bg-[#356AF6] px-5 text-white hover:bg-[#2C59D8]"
            >
              <Link href="/results">
                Back to Results
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sl-page relative min-h-screen overflow-hidden text-[#111827]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="sl-grid absolute inset-0 opacity-65" />
        <div className="absolute left-[-9rem] top-28 h-[22rem] w-[22rem] rounded-full bg-white/75 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <PageOrientation
          fallbackHref="/results"
          eyebrow="Expert Match"
          title={
            assessmentMode === "cybersecurity-risk"
              ? "Your Cybersecurity Expert Matches"
              : "Your Smart Matches"
          }
          description={
            assessmentMode === "cybersecurity-risk"
              ? "Browse the providers ranked for your cybersecurity risk profile, urgency, budget, location, and experience preferences."
              : "Browse the providers ranked for your needs across category fit, location, budget, urgency, and prior experience."
          }
          currentView={highestRisk.category}
          stepLabel="Step 4 of 4"
          nextLabel="Choose services from matched providers and submit your request."
        />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]">
          <section className="space-y-5">
            <div className="rounded-[28px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <div className="grid gap-3 lg:grid-cols-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99B4]" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    type="text"
                    placeholder="Search experts or specialties..."
                    className="h-12 w-full rounded-xl border border-[#D9E3F3] bg-[#FCFDFF] pl-11 pr-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </label>

                <select
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value)}
                  className="h-12 rounded-xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                >
                  <option value="all">Select Service</option>
                  {serviceOptions.map((serviceName) => (
                    <option key={serviceName} value={serviceName}>
                      {serviceName}
                    </option>
                  ))}
                </select>

                <select
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                  className="h-12 rounded-xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                >
                  <option value="all">Select Location</option>
                  {locationOptions.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {filteredExperts.map((match) => {
                const expert = match.expert;
                const services = getServicesForExpert(expert, highestRisk.category);
                const isTopRated = expert.rating >= 4.8;
                const isBestMatch = match.matchTier === "Best Match";
                const initials = expert.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <article
                    key={expert.id}
                    className="overflow-hidden rounded-[30px] border border-[#D9E3F3] bg-white shadow-[0_18px_40px_rgba(56,75,107,0.1)]"
                  >
                    <div className="border-b border-[#EEF2FA] bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[#111827] text-base font-semibold text-white shadow-[0_12px_28px_rgba(17,24,39,0.14)]">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h2 className="text-[1.65rem] font-semibold leading-tight text-[#111827]">
                                {expert.fullName}
                              </h2>
                              <p className="mt-1 text-sm font-medium leading-6 text-[#111827]">
                                {expert.role}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                                {expert.organization}
                              </p>
                            </div>
                            <div className="rounded-[22px] border border-[#D9E3F3] bg-white px-4 py-3 text-right shadow-[0_8px_18px_rgba(56,75,107,0.06)]">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7B89A2]">
                                Match Score
                              </p>
                              <p className="mt-1 text-2xl font-semibold text-[#111827]">
                                {match.totalScore}
                                <span className="ml-1 text-sm font-medium text-[#7B89A2]">/100</span>
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2.5">
                            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getMatchTierTone(match.matchTier))}>
                              {match.matchTier}
                            </span>
                            <Badge className="h-auto rounded-full bg-[#EBF8EF] px-3 py-1 text-xs font-semibold text-[#15803D]">
                              Verified
                            </Badge>
                            {isTopRated ? (
                              <Badge className="h-auto rounded-full bg-[#FFF4D6] px-3 py-1 text-xs font-semibold text-[#B7791F]">
                                Top Rated
                              </Badge>
                            ) : null}
                            {match.availableWithin48Hours ? (
                              <Badge className="h-auto rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold text-[#356AF6]">
                                Fast Response
                              </Badge>
                            ) : null}
                            {isBestMatch ? (
                              <Badge className="h-auto rounded-full bg-[#F3EDFF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">
                                Best Match
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#111827]">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E6] px-3 py-1.5 font-semibold text-[#111827]">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-4 w-4 text-[#F59E0B]" />
                            {expert.rating.toFixed(1)}
                          </span>
                          <span className="text-[#5D6B85]">({Math.round(expert.rating * 10)} reviews)</span>
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#F7FAFF] px-3 py-1.5 text-[#5D6B85]">
                          <MapPin className="h-4 w-4 text-[#8A99B4]" />
                          {match.profile.locationLabel}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#F7FAFF] px-3 py-1.5 text-[#5D6B85]">
                          <Briefcase className="h-4 w-4 text-[#8A99B4]" />
                          {expert.yearsExperience} years experience
                        </span>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-[#5D6B85]">
                        {expert.bio}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {expert.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              specialty === highestRisk.category
                                ? "border-[#BFD0F8] bg-[#EEF3FF] text-[#356AF6]"
                                : "border-[#D9E3F3] bg-white text-[#5D6B85]"
                            }`}
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                              Response Time
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {match.availabilityLabel}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                              Specialization
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {match.primarySpecialization}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                              Match Strength
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#111827]">
                              {match.matchTier}
                            </p>
                          </div>
                        </div>

                      <div className="mt-4 rounded-[24px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#fcfdff_0%,#f7faff_100%)] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                            Why Matched
                          </p>
                          <p className="text-xs font-medium text-[#7B89A2]">
                            Estimated Cost: ${expert.hourlyRateUsd.toLocaleString()}/hour
                          </p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#111827]">
                          {match.matchReason}
                        </p>
                      </div>

                      <div className="mt-5 flex gap-3">
                          <button
                            type="button"
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#356AF6] px-4 text-sm font-medium text-white shadow-[0_10px_20px_rgba(53,106,246,0.2)] transition hover:bg-[#2C59D8]"
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D9E3F3] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#F7FAFF]"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </button>
                      </div>

                      <div className="mt-5 space-y-3 rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                            Add Services
                          </p>
                          {services.map((service) => {
                            const selectionKey = `${expert.id}:${service.id}`;
                            const isSelected = Boolean(selectedServices[selectionKey]);

                            return (
                              <div
                                key={service.id}
                                className={cn(
                                  "rounded-[20px] border px-4 py-4 transition",
                                  isSelected
                                    ? "border-[#BFD0F8] bg-[#EEF3FF]"
                                    : "border-[#D9E3F3] bg-white",
                                )}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="max-w-[15rem]">
                                    <p className="text-sm font-semibold text-[#111827]">{service.name}</p>
                                    <p className="mt-1 text-xs leading-5 text-[#5D6B85]">
                                      {service.description}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="rounded-full bg-[#F7FAFF] px-2.5 py-1 text-[11px] font-medium text-[#5D6B85]">
                                        {service.deliveryWindow}
                                      </span>
                                      <span className="rounded-full bg-[#F7FAFF] px-2.5 py-1 text-[11px] font-medium text-[#5D6B85]">
                                        ${service.priceUsd.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleService(expert, service)}
                                    className={cn(
                                      "inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                                      isSelected
                                        ? "border border-[#BFD0F8] bg-white text-[#356AF6]"
                                        : "bg-[#356AF6] text-white hover:bg-[#2C59D8]",
                                    )}
                                  >
                                    <Plus className="h-4 w-4" />
                                    {isSelected ? "Added" : "Add Service"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredExperts.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[#C8D6EE] bg-white/85 p-10 text-center shadow-[0_14px_34px_rgba(56,75,107,0.05)]">
                <p className="text-xl font-semibold text-[#111827]">No experts match the current filters</p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#5D6B85]">
                  Try widening the service or location filters, or clear your search to bring back the strongest-ranked providers.
                </p>
              </div>
            ) : null}
          </section>

          <aside className="xl:sticky xl:top-8 xl:h-fit">
            <div className="rounded-[28px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                Service Request Summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#111827]">
                {submission.lead.companyName}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                Contact: {submission.lead.fullName} ({submission.lead.workEmail})
              </p>
              <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                Phone: {submission.lead.phoneNumber || "Not provided"}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                Lead Tier: {leadTier === "premium" ? "Premium" : "Standard"} | Mode:{" "}
                {assessmentMode === "cybersecurity-risk" ? "Cybersecurity Risk" : "Business Services"}
              </p>

              <div className="mt-5 space-y-3">
                {selectedServiceItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#C8D6EE] bg-[#F7FAFF] p-4 text-sm leading-6 text-[#5D6B85]">
                    No services added yet. Pick services from the matched providers list.
                  </div>
                ) : (
                  selectedServiceItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"
                    >
                      <p className="text-sm font-semibold text-[#111827]">{item.serviceName}</p>
                      <p className="mt-1 text-xs text-[#5D6B85]">{item.expertName}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-[#7B89A2]">{item.deliveryWindow}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#111827]">
                            ${item.priceUsd.toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeSelectedService(item.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D9E3F3] bg-white text-[#5D6B85] transition hover:bg-[#F7FAFF]"
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

              <div className="mt-5 rounded-2xl border border-[#D9E3F3] bg-[#F7FAFF] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5D6B85]">Services selected</span>
                  <span className="font-semibold text-[#111827]">{selectedServiceItems.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[#5D6B85]">Estimated total</span>
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
                className="mt-5 h-11 w-full rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Briefcase className="h-4 w-4" />
                Submit Service Request
              </Button>

              {requestSent ? (
                <div className="mt-4 rounded-2xl border border-[#B7EDC8] bg-[#F2FBF5] p-4 text-sm leading-6 text-[#166534]">
                  Service request submitted. Our team will contact {submission.lead.fullName} shortly.
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

