import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Expert, QuizCategory } from "@/types";
import { CheckCircle2, Clock3, ShieldCheck, Star } from "lucide-react";

interface ExpertMatchCardProps {
  expert: Expert;
  highestRiskCategory: QuizCategory;
  matchReason: string;
  availableWithin48Hours: boolean;
  availabilityLabel: string;
}

export function ExpertMatchCard({
  expert,
  highestRiskCategory,
  matchReason,
  availableWithin48Hours,
  availabilityLabel,
}: ExpertMatchCardProps) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-5 shadow-[0_18px_45px_rgba(2,6,23,0.35)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(79,70,229,0.16),transparent_42%,rgba(16,185,129,0.1))]" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{expert.fullName}</h3>
            <p className="text-sm text-muted-foreground">
              {expert.role} at {expert.organization}
            </p>
          </div>
          <Badge className="bg-success text-success-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {expert.specialties.map((specialty) => (
            <Badge key={`${expert.id}-${specialty}`} variant="outline" className="border-white/25">
              {specialty}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 text-foreground">
            <Star className="h-4 w-4 text-secondary" />
            {expert.rating.toFixed(1)} rating
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            {expert.yearsExperience}+ years
          </span>
          <span
            className={
              availableWithin48Hours
                ? "inline-flex items-center gap-1 text-success"
                : "inline-flex items-center gap-1 text-danger"
            }
          >
            <Clock3 className="h-4 w-4" />
            {availabilityLabel}
          </span>
        </div>

        <div className="rounded-xl border border-white/15 bg-background/45 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Why You Matched
          </p>
          <p className="mt-1 text-sm text-foreground">{matchReason}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Priority domain: {highestRiskCategory}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">${expert.hourlyRateUsd}/hour</p>
          <Button size="sm">Request Intro</Button>
        </div>
      </div>
    </article>
  );
}
