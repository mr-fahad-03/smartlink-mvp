"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Clock3,
  Handshake,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";

import { PageOrientation } from "@/components/navigation/page-orientation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockQuizEnginePayload } from "@/data";
import { loadAssessmentSubmission, updateAssessmentSubmission } from "@/lib/assessment-storage";
import {
  getMatchTierTone,
  rankExpertsForSubmission,
} from "@/lib/expert-matching";
import { cn } from "@/lib/utils";
import type {
  AdminAnalyticsSnapshot,
  AssessmentSubmission,
  Expert,
  ExpertPerformanceRecord,
  ExpertSubscriptionTier,
  IntroductionRequest,
  QuizCategory,
  UserActionType,
} from "@/types";

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
    id: "svc-operations-reset",
    name: "Operations Reset Plan",
    description: "Clarify bottlenecks, priorities, and the next operational move.",
    priceUsd: 1400,
    deliveryWindow: "5-7 days",
    categories: ["Operations", "Growth"],
  },
  {
    id: "svc-systems-fix",
    name: "Systems Improvement Sprint",
    description: "Improve tools, workflows, and system reliability.",
    priceUsd: 1600,
    deliveryWindow: "7-10 days",
    categories: ["Systems", "Operations"],
  },
  {
    id: "svc-cyber-baseline",
    name: "Cybersecurity Baseline Review",
    description: "Identify the biggest gaps in protection, backup, and recovery readiness.",
    priceUsd: 1200,
    deliveryWindow: "4-6 days",
    categories: ["Cybersecurity", "Personal Tech Support"],
  },
  {
    id: "svc-advice-guidance",
    name: "Advice & Guidance Session",
    description: "Get help with financial, legal, or career-related decisions.",
    priceUsd: 1750,
    deliveryWindow: "8-12 days",
    categories: ["Financial Advice", "Legal Help", "Career Help"],
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

function createTrackingId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getExpertTier(expert: Expert): ExpertSubscriptionTier {
  if (expert.subscriptionTier) {
    return expert.subscriptionTier;
  }

  if (expert.visibilityLevel === "priority") {
    return "featured";
  }

  if (expert.visibilityLevel === "featured") {
    return "premium";
  }

  return "basic";
}

function buildAdminAnalyticsSnapshot(
  introductionRequests: IntroductionRequest[],
  performanceRecords: ExpertPerformanceRecord[],
): AdminAnalyticsSnapshot {
  const leadsPerCategoryMap = new Map<QuizCategory, number>();

  introductionRequests.forEach((request) => {
    leadsPerCategoryMap.set(
      request.category,
      (leadsPerCategoryMap.get(request.category) ?? 0) + 1,
    );
  });

  const topPerformingExpertIds = [...performanceRecords]
    .sort((a, b) => {
      const aValue = a.introductionRequests * 3 + a.clickCount + a.selectionCount;
      const bValue = b.introductionRequests * 3 + b.clickCount + b.selectionCount;
      return bValue - aValue;
    })
    .slice(0, 5)
    .map((record) => record.expertId);

  const pendingResponses = performanceRecords.filter(
    (record) => record.responseStatus === "pending",
  ).length;
  const responded = performanceRecords.filter(
    (record) => record.responseStatus === "responded",
  ).length;

  return {
    totalLeadsGenerated: introductionRequests.length,
    leadsPerCategory: Array.from(leadsPerCategoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    })),
    topPerformingExpertIds,
    conversionIndicators: [
      { label: "Introduction Requests", value: introductionRequests.length },
      { label: "Experts Selected", value: performanceRecords.filter((item) => item.introductionRequests > 0).length },
      { label: "Pending Responses", value: pendingResponses },
      { label: "Responded Experts", value: responded },
    ],
  };
}

export default function ExpertMatchPage() {
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Record<string, SelectedServiceItem>>({});
  const [requestSent, setRequestSent] = useState(false);
  const [requestTimestamp, setRequestTimestamp] = useState<string | null>(null);
  const [hasLoggedView, setHasLoggedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const submissionRef = useRef<AssessmentSubmission | null>(null);
  const selectedCountRef = useRef(0);
  const requestSentRef = useRef(false);

  useEffect(() => {
    const stored = loadAssessmentSubmission();
    setSubmission(stored);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    submissionRef.current = submission;
  }, [submission]);

  useEffect(() => {
    selectedCountRef.current = Object.keys(selectedServices).length;
  }, [selectedServices]);

  useEffect(() => {
    requestSentRef.current = requestSent;
  }, [requestSent]);

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
    (submission?.highestRiskCategory === "Cybersecurity"
      ? "cybersecurity-risk"
      : "business-services");
  const audienceLabel =
    submission?.lead.audienceSegment === "personal-help"
      ? "Personal Support"
      : submission?.lead.audienceSegment === "not-sure"
        ? "Guided Support"
        : "Business Support";
  const leadTier = submission?.leadTier ?? "standard";
  const leadDisplayName =
    submission?.lead.companyName?.trim() || submission?.lead.fullName || "New lead";

  const introCountsByExpert = useMemo(() => {
    const requests = submission?.introductionRequests ?? [];
    return requests.reduce<Record<string, number>>((accumulator, request) => {
      accumulator[request.expertId] = (accumulator[request.expertId] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [submission?.introductionRequests]);

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

  const logMarketplaceAction = useCallback(
    ({
      actionType,
      expert,
      dropOffPoint,
    }: {
      actionType: UserActionType;
      expert?: Expert;
      dropOffPoint?: string;
    }) => {
      if (!submission) {
        return;
      }

      const updated = updateAssessmentSubmission((current) => {
        const nextPerformance = [...(current.expertPerformanceTracking ?? [])];

        if (expert) {
          const recordIndex = nextPerformance.findIndex((item) => item.expertId === expert.id);
          const baseRecord: ExpertPerformanceRecord =
            recordIndex >= 0
              ? { ...nextPerformance[recordIndex] }
              : {
                  expertId: expert.id,
                  expertName: expert.fullName,
                  subscriptionTier: getExpertTier(expert),
                  leadsReceived: 0,
                  introductionRequests: 0,
                  clickCount: 0,
                  selectionCount: 0,
                  responseStatus: "pending",
                };

          if (actionType === "expert_card_clicked") {
            baseRecord.clickCount += 1;
          }

          if (actionType === "service_selected") {
            baseRecord.selectionCount += 1;
          }

          if (recordIndex >= 0) {
            nextPerformance[recordIndex] = baseRecord;
          } else {
            nextPerformance.push(baseRecord);
          }
        }

        const nextEvents = [
          ...(current.userActionEvents ?? []),
          {
            id: createTrackingId("event"),
            assessmentId: current.assessmentId,
            actionType,
            timestamp: new Date().toISOString(),
            expertId: expert?.id,
            expertName: expert?.fullName,
            category: current.highestRiskCategory,
            urgencyLevel: current.lead.urgencyPreference,
            budgetPreference: current.lead.budgetPreference,
            dropOffPoint,
          },
        ];

        return {
          ...current,
          userActionEvents: nextEvents,
          expertPerformanceTracking: nextPerformance,
          adminAnalyticsSnapshot: buildAdminAnalyticsSnapshot(
            current.introductionRequests ?? [],
            nextPerformance,
          ),
        };
      });

      if (updated) {
        setSubmission(updated);
      }
    },
    [submission],
  );

  useEffect(() => {
    if (!submission || hasLoggedView) {
      return;
    }

    logMarketplaceAction({ actionType: "expert_match_viewed" });
    setHasLoggedView(true);
  }, [hasLoggedView, logMarketplaceAction, submission]);

  useEffect(() => {
    return () => {
      const currentSubmission = submissionRef.current;
      if (!currentSubmission) {
        return;
      }

      const dropOffPoint = requestSentRef.current
        ? undefined
        : selectedCountRef.current > 0
          ? "selected-services-without-introduction"
          : "viewed-matches-only";

      updateAssessmentSubmission((current) => {
        const nextEvents = [
          ...(current.userActionEvents ?? []),
          {
            id: createTrackingId("event"),
            assessmentId: current.assessmentId,
            actionType: "expert_match_exited" as const,
            timestamp: new Date().toISOString(),
            category: current.highestRiskCategory,
            urgencyLevel: current.lead.urgencyPreference,
            budgetPreference: current.lead.budgetPreference,
            dropOffPoint,
          },
        ];

        return {
          ...current,
          userActionEvents: nextEvents,
          adminAnalyticsSnapshot: buildAdminAnalyticsSnapshot(
            current.introductionRequests ?? [],
            current.expertPerformanceTracking ?? [],
          ),
        };
      });
    };
  }, []);

  const toggleService = (expert: Expert, service: ServicePackage) => {
    setRequestSent(false);
    const key = `${expert.id}:${service.id}`;
    const wasSelected = Boolean(selectedServices[key]);

    logMarketplaceAction({
      actionType: wasSelected ? "service_removed" : "service_selected",
      expert,
    });

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
    const item = selectedServices[id];

    if (item && submission) {
      const expert = mockQuizEnginePayload.experts.find((candidate) => candidate.id === item.expertId);
      if (expert) {
        logMarketplaceAction({ actionType: "service_removed", expert });
      }
    }

    setSelectedServices((previous) => {
      const clone = { ...previous };
      delete clone[id];
      return clone;
    });
  };

  const submitIntroductionRequest = () => {
    if (!submission || selectedServiceItems.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const introCategory = highestRisk?.category ?? submission.highestRiskCategory;
    const groupedByExpert = selectedServiceItems.reduce<Record<string, SelectedServiceItem[]>>(
      (accumulator, item) => {
        if (!accumulator[item.expertId]) {
          accumulator[item.expertId] = [];
        }

        accumulator[item.expertId].push(item);
        return accumulator;
      },
      {},
    );

    const nextRequests = Object.entries(groupedByExpert).flatMap(([expertId, items]) => {
      const expert = mockQuizEnginePayload.experts.find((candidate) => candidate.id === expertId);

      if (!expert) {
        return [];
      }

      return [
        {
          id: createTrackingId("intro"),
          assessmentId: submission.assessmentId,
          expertId,
          expertName: expert.fullName,
          leadName: submission.lead.fullName,
          leadEmail: submission.lead.workEmail,
          leadPhone: submission.lead.phoneNumber,
          requestedAt: now,
          serviceIds: items.map((item) => item.serviceId),
          serviceNames: items.map((item) => item.serviceName),
          category: introCategory,
          urgencyLevel: submission.lead.urgencyPreference,
          budgetPreference: submission.lead.budgetPreference,
          billable: submission.leadTier === "premium",
          leadTier: submission.leadTier,
          expertTier: getExpertTier(expert),
          status: "submitted" as const,
        },
      ];
    });

    const updated = updateAssessmentSubmission((current) => {
      const introductionRequests = [...(current.introductionRequests ?? []), ...nextRequests];
      const performanceMap = new Map<string, ExpertPerformanceRecord>(
        (current.expertPerformanceTracking ?? []).map((record) => [record.expertId, { ...record }]),
      );

      nextRequests.forEach((request) => {
        const existing = performanceMap.get(request.expertId) ?? {
          expertId: request.expertId,
          expertName: request.expertName,
          subscriptionTier: request.expertTier,
          leadsReceived: 0,
          introductionRequests: 0,
          clickCount: 0,
          selectionCount: 0,
          responseStatus: "pending" as const,
        };

        existing.leadsReceived += 1;
        existing.introductionRequests += 1;
        existing.responseStatus = "pending";
        performanceMap.set(request.expertId, existing);
      });

      const expertPerformanceTracking = Array.from(performanceMap.values());
      const userActionEvents = [
        ...(current.userActionEvents ?? []),
        ...nextRequests.map((request) => ({
          id: createTrackingId("event"),
          assessmentId: current.assessmentId,
          actionType: "introduction_requested" as const,
          timestamp: now,
          expertId: request.expertId,
          expertName: request.expertName,
          category: request.category,
          urgencyLevel: request.urgencyLevel,
          budgetPreference: request.budgetPreference,
        })),
      ];

      return {
        ...current,
        introductionRequests,
        expertPerformanceTracking,
        userActionEvents,
        adminAnalyticsSnapshot: buildAdminAnalyticsSnapshot(
          introductionRequests,
          expertPerformanceTracking,
        ),
      };
    });

    if (updated) {
      setSubmission(updated);
      setSelectedServices({});
      setRequestSent(true);
      setRequestTimestamp(now);
    }
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
              ? "Browse the providers ranked for your cybersecurity profile, then request a trusted introduction instead of contacting experts directly."
              : "Browse the providers ranked for your needs, then request a trusted introduction instead of contacting experts directly."
          }
          currentView={highestRisk.category}
          stepLabel="Step 4 of 4"
          nextLabel="Choose services, request an introduction, and let SmartLink route the lead cleanly."
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
                    className="overflow-hidden rounded-[28px] border border-[#D9E3F3] bg-white p-5 shadow-[0_18px_40px_rgba(56,75,107,0.08)] transition hover:border-[#BFD0F8] hover:shadow-[0_22px_44px_rgba(56,75,107,0.12)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#BFD0F8] bg-[#111827] text-base font-semibold text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)]">
                          {initials}
                        </div>
                        <span className="absolute -right-1 bottom-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#16A34A] text-white">
                          <ShieldCheck className="h-2.5 w-2.5" />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-[1.45rem] font-semibold leading-tight text-[#111827]">
                                {expert.fullName}
                              </h2>
                              <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", getMatchTierTone(match.matchTier))}>
                                {match.matchTier}
                              </span>
                            </div>
                            <p className="mt-1 text-[1rem] leading-6 text-[#111827]">
                              {expert.role} <span className="text-[#5D6B85]">| {expert.organization}</span>
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#5D6B85]">
                              <MapPin className="h-4 w-4 text-[#8A99B4]" />
                              {match.profile.locationLabel}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => logMarketplaceAction({ actionType: "expert_card_clicked", expert })}
                            className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F3] bg-[#F8FBFF] px-3 py-1.5 text-xs font-semibold text-[#356AF6] transition hover:border-[#BFD0F8] hover:bg-[#EEF3FF]"
                          >
                            Preview fit
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[#EEF2FA] pb-4 text-sm text-[#111827]">
                      <span className="font-semibold text-[#111827]">${expert.hourlyRateUsd}/hr</span>
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#356AF6] text-[#356AF6]">
                          <Star className="h-4 w-4 fill-current text-[#356AF6]" />
                        </span>
                        <span className="font-medium text-[#111827]">{expert.rating.toFixed(1)} rating</span>
                      </span>
                      <span className="font-medium text-[#111827]">{match.totalScore}/100 match score</span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#F3EDFF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {match.availableWithin48Hours ? "Available now" : match.availabilityLabel}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold text-[#356AF6]">
                        <Handshake className="h-3.5 w-3.5" />
                        Request introductions
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
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
                      <Badge className="h-auto rounded-full bg-[#F7FAFF] px-3 py-1 text-xs font-semibold text-[#5D6B85]">
                        {getExpertTier(expert) === "featured"
                          ? "Featured Tier"
                          : getExpertTier(expert) === "premium"
                            ? "Premium Tier"
                            : "Basic Tier"}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {expert.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            specialty === highestRisk.category
                              ? "bg-[#EEF3FF] text-[#356AF6]"
                              : "bg-[#F1F5F9] text-[#475569]"
                          }`}
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[#5D6B85]">
                      {expert.bio}
                    </p>

                    <div className="mt-4 rounded-[22px] border border-[#E6EBF5] bg-[#F8FAFD] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#111827]">Insights about {expert.fullName.split(" ")[0]}</p>
                        <span className="text-xs font-medium text-[#7B89A2]">
                          {introCountsByExpert[expert.id] ?? 0} introduction{(introCountsByExpert[expert.id] ?? 0) === 1 ? "" : "s"}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#111827]">
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#356AF6]" />
                          {match.matchReason}
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                          Primary specialization: {match.primarySpecialization}. Estimated rate ${expert.hourlyRateUsd}/hour.
                        </li>
                      </ul>
                    </div>

                    <div className="mt-4 rounded-[22px] border border-[#D9E3F3] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                          Select packages for introduction
                        </p>
                        <p className="text-xs font-medium text-[#5D6B85]">
                          Direct contact stays hidden until SmartLink routes the lead.
                        </p>
                      </div>

                      <div className="mt-4 space-y-3">
                          {services.map((service) => {
                            const selectionKey = `${expert.id}:${service.id}`;
                            const isSelected = Boolean(selectedServices[selectionKey]);

                            return (
                              <div
                                key={service.id}
                                className={cn(
                                  "rounded-[18px] border px-4 py-4 transition",
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
                                      "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition",
                                      isSelected
                                        ? "border border-[#BFD0F8] bg-white text-[#356AF6]"
                                        : "bg-[#356AF6] text-white hover:bg-[#2C59D8]",
                                    )}
                                  >
                                    <Plus className="h-4 w-4" />
                                    {isSelected ? "Added" : "Add to Request"}
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
                Introduction Request Summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#111827]">
                {leadDisplayName}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                Lead owner: {submission.lead.fullName}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                Routing email: {submission.lead.workEmail}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                Lead Tier: {leadTier === "premium" ? "Premium" : "Standard"} | Mode:{" "}
                {assessmentMode === "cybersecurity-risk" ? "Cybersecurity Risk" : audienceLabel}
              </p>
              <div className="mt-5 rounded-2xl border border-[#D9E3F3] bg-[#F7FAFF] p-4">
                <div className="flex items-start gap-3">
                  <Handshake className="mt-0.5 h-5 w-5 text-[#356AF6]" />
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">No direct contact details are shown</p>
                    <p className="mt-1 text-xs leading-5 text-[#5D6B85]">
                      SmartLink captures the introduction request first, links it to this lead and assessment, then routes it to the selected expert.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {selectedServiceItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#C8D6EE] bg-[#F7FAFF] p-4 text-sm leading-6 text-[#5D6B85]">
                    No services added yet. Pick services from the matched providers list to create an introduction request.
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
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[#5D6B85]">Tracked category</span>
                  <span className="font-semibold text-[#111827]">{highestRisk.category}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[#5D6B85]">Urgency / Budget</span>
                  <span className="font-semibold text-[#111827]">
                    {submission.lead.urgencyPreference || "Flexible"} / {submission.lead.budgetPreference || "Open"}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#D9E3F3] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  What This Tracks
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[#5D6B85]">
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-[#356AF6]" />
                    Lead, expert, and assessment linkage
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 text-[#356AF6]" />
                    Timestamp, urgency, and budget context
                  </li>
                  <li className="flex items-start gap-2">
                    <Briefcase className="mt-0.5 h-4 w-4 text-[#356AF6]" />
                    Billable introduction readiness and expert tier visibility
                  </li>
                </ul>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={submitIntroductionRequest}
                disabled={selectedServiceItems.length === 0}
                className="mt-5 h-11 w-full rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Handshake className="h-4 w-4" />
                Request Introduction
              </Button>

              {requestSent ? (
                <div className="mt-4 rounded-2xl border border-[#B7EDC8] bg-[#F2FBF5] p-4 text-sm leading-6 text-[#166534]">
                  Introduction request submitted{requestTimestamp ? ` on ${new Date(requestTimestamp).toLocaleString()}` : ""}. SmartLink will now route this lead to the selected expert{selectedServiceItems.length > 1 ? "s" : ""}.
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

