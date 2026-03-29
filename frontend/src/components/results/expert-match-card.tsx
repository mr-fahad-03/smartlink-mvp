import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMatchTierTone, type MatchTier } from "@/lib/expert-matching";
import type { Expert, QuizCategory } from "@/types";
import { CheckCircle2, Clock3, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";

interface ExpertMatchCardProps {
  expert: Expert;
  highestRiskCategory: QuizCategory;
  matchReason: string;
  availableWithin48Hours: boolean;
  availabilityLabel: string;
  matchTier: MatchTier;
  matchScore: number;
  locationFitStrong: boolean;
  isFirstTimeUser: boolean;
}

export function ExpertMatchCard({
  expert,
  highestRiskCategory,
  matchReason,
  availableWithin48Hours,
  availabilityLabel,
  matchTier,
  matchScore,
  locationFitStrong,
  isFirstTimeUser,
}: ExpertMatchCardProps) {
  const primarySpecialization =
    expert.specialties.find((specialty) => specialty === highestRiskCategory) ??
    expert.specialties[0];
  const isTopRated = expert.rating >= 4.8;
  const decisionHooks = [
    isFirstTimeUser && expert.yearsExperience >= 8
      ? { label: "Best for first-time users", tone: "bg-[#EEF3FF] text-[#356AF6]", icon: Sparkles }
      : null,
    availableWithin48Hours
      ? { label: "Fastest response", tone: "bg-[#EBF8EF] text-[#15803D]", icon: Clock3 }
      : null,
    locationFitStrong
      ? { label: "Strong experience in your location", tone: "bg-[#FFF7E8] text-[#B45309]", icon: MapPin }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <article className="rounded-[24px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_12px_28px_rgba(56,75,107,0.06)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">{expert.fullName}</h3>
            <p className="text-sm text-[#5D6B85]">
              {expert.role} at {expert.organization}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge className={`h-auto rounded-full px-3 py-1 text-xs font-semibold ${getMatchTierTone(matchTier)}`}>
              {matchTier}
            </Badge>
            <Badge className="h-auto rounded-full bg-[#EBF8EF] px-3 py-1 text-xs font-semibold text-[#15803D]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </Badge>
            {isTopRated ? (
              <Badge className="h-auto rounded-full bg-[#FFF7E8] px-3 py-1 text-xs font-semibold text-[#B45309]">
                <Star className="h-3.5 w-3.5" />
                Top Rated
              </Badge>
            ) : null}
            {availableWithin48Hours ? (
              <Badge className="h-auto rounded-full bg-[#EEF8FF] px-3 py-1 text-xs font-semibold text-[#2563EB]">
                <Clock3 className="h-3.5 w-3.5" />
                Fast Response
              </Badge>
            ) : null}
            {primarySpecialization === highestRiskCategory ? (
              <Badge className="h-auto rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold text-[#356AF6]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Best Match
              </Badge>
            ) : null}
          </div>
        </div>

        {decisionHooks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {decisionHooks.map((hook) => {
              const Icon = hook.icon;
              return (
                <span
                  key={hook.label}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${hook.tone}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {hook.label}
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {expert.specialties.map((specialty) => (
            <Badge
              key={`${expert.id}-${specialty}`}
              variant="outline"
              className="h-auto rounded-full border-[#D9E3F3] bg-white px-3 py-1 text-xs text-[#5D6B85]"
            >
              {specialty}
            </Badge>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
              Response Time
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111827]">{availabilityLabel}</p>
          </div>
          <div className="rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
              Match Score
            </p>
            <p className="mt-2 text-sm font-semibold text-[#111827]">{matchScore}/100</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 text-[#111827]">
            <Star className="h-4 w-4 text-[#F59E0B]" />
            {expert.rating.toFixed(1)} rating
          </span>
          <span className="inline-flex items-center gap-1 text-[#5D6B85]">
            <ShieldCheck className="h-4 w-4 text-[#356AF6]" />
            {expert.yearsExperience}+ years
          </span>
          <span className="inline-flex items-center gap-1 text-[#5D6B85]">
            <CheckCircle2 className="h-4 w-4 text-[#356AF6]" />
            {primarySpecialization}
          </span>
          <span
            className={
              availableWithin48Hours
                ? "inline-flex items-center gap-1 text-[#15803D]"
                : "inline-flex items-center gap-1 text-[#E11D48]"
            }
          >
            <Clock3 className="h-4 w-4" />
            {availabilityLabel}
          </span>
        </div>

        <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
            Why You Matched
          </p>
          <p className="mt-2 text-sm leading-6 text-[#111827]">{matchReason}</p>
          <p className="mt-2 text-xs text-[#5D6B85]">
            Priority domain: {highestRiskCategory}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
              Estimated Cost
            </p>
            <p className="text-sm font-semibold text-[#111827]">${expert.hourlyRateUsd}/hour</p>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-[#356AF6] px-4 text-white hover:bg-[#2C59D8]"
          >
            Request Introduction
          </Button>
        </div>
      </div>
    </article>
  );
}
