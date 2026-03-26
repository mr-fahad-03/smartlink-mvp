import type { AssessmentSubmission, Expert, QuizCategory } from "@/types";

export type MatchTier = "Best Match" | "Great Match" | "Good Match";

export interface ExpertMarketplaceProfile {
  locationLabel: string;
  coverageAreas: string[];
  remoteFriendly: boolean;
}

export interface RankedExpertMatch {
  expert: Expert;
  profile: ExpertMarketplaceProfile;
  totalScore: number;
  matchTier: MatchTier;
  primarySpecialization: QuizCategory;
  availableWithin48Hours: boolean;
  availabilityLabel: string;
  matchReason: string;
  breakdown: {
    category: number;
    location: number;
    budget: number;
    urgency: number;
    experience: number;
    marketplaceBoost: number;
  };
}

const MATCH_WEIGHTS = {
  category: 0.45,
  location: 0.2,
  budget: 0.15,
  urgency: 0.1,
  experience: 0.1,
} as const;

export const EXPERT_MARKETPLACE_META: Record<string, ExpertMarketplaceProfile> = {
  exp_ana_khan: {
    locationLabel: "Nassau",
    coverageAreas: ["nassau", "new-providence", "family-islands"],
    remoteFriendly: true,
  },
  exp_daniel_cho: {
    locationLabel: "Grand Bahama",
    coverageAreas: ["grand-bahama", "nassau"],
    remoteFriendly: true,
  },
  exp_sofia_ramirez: {
    locationLabel: "Remote / Nassau",
    coverageAreas: ["nassau", "grand-bahama", "family-islands", "outside-bahamas"],
    remoteFriendly: true,
  },
};

function normalizeLocation(value?: string) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return "unknown";
  }
  if (normalized.includes("nassau") || normalized.includes("new providence")) {
    return "nassau";
  }
  if (normalized.includes("grand bahama") || normalized.includes("freeport")) {
    return "grand-bahama";
  }
  if (
    normalized.includes("abaco") ||
    normalized.includes("exuma") ||
    normalized.includes("eleuthera") ||
    normalized.includes("family islands") ||
    normalized.includes("harbour island") ||
    normalized.includes("spanish wells")
  ) {
    return "family-islands";
  }
  if (normalized.includes("outside")) {
    return "outside-bahamas";
  }
  if (normalized.includes("bahamas")) {
    return "bahamas";
  }

  return "unknown";
}

function scoreLocation(profile: ExpertMarketplaceProfile, submissionLocation?: string) {
  const normalizedLocation = normalizeLocation(submissionLocation);

  if (normalizedLocation === "unknown") {
    return {
      score: 70,
      reason: `${profile.locationLabel} coverage supports Bahamas-based delivery.`,
    };
  }

  if (profile.coverageAreas.includes(normalizedLocation)) {
    return {
      score: 100,
      reason: `Aligned with your location in ${submissionLocation}.`,
    };
  }

  if (profile.remoteFriendly) {
    return {
      score: normalizedLocation === "outside-bahamas" ? 88 : 82,
      reason: "Can still support your location through remote delivery.",
    };
  }

  return {
    score: 55,
    reason: "Location fit is workable, but not the strongest alignment in this shortlist.",
  };
}

function scoreBudget(hourlyRateUsd: number, budgetPreference?: string) {
  switch (budgetPreference) {
    case "Under $150/hour":
      if (hourlyRateUsd < 150) {
        return { score: 100, reason: "Fits your preferred cost range." };
      }
      if (hourlyRateUsd <= 165) {
        return { score: 74, reason: "Slightly above budget, but still close to your range." };
      }
      return { score: 56, reason: "Above the preferred budget range." };
    case "$150-$175/hour":
      if (hourlyRateUsd >= 150 && hourlyRateUsd <= 175) {
        return { score: 100, reason: "Matches your target budget range well." };
      }
      if (hourlyRateUsd < 150 || hourlyRateUsd <= 185) {
        return { score: 82, reason: "Near your target budget range." };
      }
      return { score: 62, reason: "Higher than the budget range you selected." };
    case "$176-$200/hour":
      if (hourlyRateUsd >= 176 && hourlyRateUsd <= 200) {
        return { score: 100, reason: "Matches the premium budget range you selected." };
      }
      if (hourlyRateUsd >= 160 && hourlyRateUsd < 176) {
        return { score: 84, reason: "A little below your range, but still a close budget fit." };
      }
      return { score: 68, reason: "Not the closest budget fit, but still in a workable band." };
    case "$200+/hour":
      if (hourlyRateUsd >= 200) {
        return { score: 100, reason: "Fits the enterprise-level budget you selected." };
      }
      return { score: 88, reason: "Comes in below your maximum budget ceiling." };
    case "Not sure yet":
    case undefined:
      return { score: 78, reason: "Budget is still flexible, so fit is primarily driven by expertise." };
    default:
      return { score: 75, reason: "Budget preference was broad, so this remains a reasonable fit." };
  }
}

function scoreUrgency(availableWithin48Hours: boolean, availableInHours: number, urgencyPreference?: string) {
  switch (urgencyPreference) {
    case "Urgent - within 48 hours":
      if (availableWithin48Hours) {
        return { score: 100, reason: "Can respond within your urgent timeline." };
      }
      return { score: 52, reason: "Availability is slower than your urgent timeline." };
    case "Within 1 week":
      if (availableInHours <= 168) {
        return { score: 100, reason: "Can support your one-week timeline." };
      }
      return { score: 72, reason: "Availability is reasonable, but not ideal for your timeline." };
    case "Flexible / exploring":
      return {
        score: availableWithin48Hours ? 92 : 82,
        reason: "Your timeline is flexible, so availability remains a strong fit.",
      };
    default:
      return {
        score: availableWithin48Hours ? 88 : 74,
        reason: "Availability remains strong for your current stage.",
      };
  }
}

function scoreExperience(yearsExperience: number, priorConsultingExperience?: string) {
  switch (priorConsultingExperience) {
    case "First time hiring outside expertise":
      if (yearsExperience >= 10) {
        return { score: 100, reason: "Strong senior experience for a first guided engagement." };
      }
      if (yearsExperience >= 8) {
        return { score: 88, reason: "Good experience level for a first external engagement." };
      }
      return { score: 72, reason: "Solid experience, though not the strongest onboarding fit." };
    case "Worked with one provider before":
      if (yearsExperience >= 8) {
        return { score: 100, reason: "Well suited for teams with some prior provider exposure." };
      }
      if (yearsExperience >= 6) {
        return { score: 84, reason: "Good practical experience for your current maturity." };
      }
      return { score: 70, reason: "Experience fit is acceptable, but less senior than the top options." };
    case "Experienced with external consultants":
      if (yearsExperience >= 6) {
        return { score: 96, reason: "Experience level is strong for a team used to outside advisors." };
      }
      return { score: 80, reason: "Still a workable fit for a team with existing provider experience." };
    default:
      if (yearsExperience >= 8) {
        return { score: 90, reason: "Brings meaningful practical experience to the engagement." };
      }
      return { score: 78, reason: "Experience level is solid for the needs you described." };
  }
}

function scoreCategory(expert: Expert, highestRiskCategory: QuizCategory) {
  if (expert.specialties.includes(highestRiskCategory)) {
    return {
      score: 100,
      reason: `Directly specializes in your highest-risk area: ${highestRiskCategory}.`,
    };
  }

  return {
    score: 58,
    reason: `Supports adjacent security work, though ${highestRiskCategory} is not the primary specialty.`,
  };
}

function getMarketplaceBoost(expert: Expert) {
  const visibilityBoost =
    expert.visibilityLevel === "priority"
      ? 8
      : expert.visibilityLevel === "featured"
        ? 4
        : 0;

  return visibilityBoost + expert.rankingWeightBoost;
}

export function getAvailability(submittedAtIso: string, availableAtIso: string) {
  const submittedAt = new Date(submittedAtIso).getTime();
  const availableAt = new Date(availableAtIso).getTime();
  const diffInHours = Math.ceil((availableAt - submittedAt) / (1000 * 60 * 60));
  const availableWithin48Hours = diffInHours <= 48;

  if (diffInHours <= 0) {
    return {
      availableWithin48Hours,
      availableInHours: 0,
      label: "Available now",
    };
  }

  if (availableWithin48Hours) {
    return {
      availableWithin48Hours,
      availableInHours: diffInHours,
      label: "Available within 48 hours",
    };
  }

  return {
    availableWithin48Hours,
    availableInHours: diffInHours,
    label: `Available in ${diffInHours} hours`,
  };
}

export function getMatchTier(totalScore: number): MatchTier {
  if (totalScore >= 85) {
    return "Best Match";
  }
  if (totalScore >= 72) {
    return "Great Match";
  }
  return "Good Match";
}

export function getMatchTierTone(tier: MatchTier) {
  if (tier === "Best Match") {
    return "bg-[#EEF3FF] text-[#356AF6]";
  }
  if (tier === "Great Match") {
    return "bg-[#EBF8EF] text-[#15803D]";
  }
  return "bg-[#FFF4D6] text-[#B7791F]";
}

export function rankExpertsForSubmission(
  submission: AssessmentSubmission,
  highestRiskCategory: QuizCategory,
  experts: Expert[],
) {
  return experts
    .filter((expert) => expert.matchingVisibility !== "hidden")
    .map<RankedExpertMatch>((expert) => {
      const profile = EXPERT_MARKETPLACE_META[expert.id] ?? {
        locationLabel: "The Bahamas",
        coverageAreas: ["bahamas"],
        remoteFriendly: true,
      };
      const availability = getAvailability(submission.submittedAt, expert.nextAvailableAt);
      const category = scoreCategory(expert, highestRiskCategory);
      const location = scoreLocation(profile, submission.lead.location);
      const budget = scoreBudget(expert.hourlyRateUsd, submission.lead.budgetPreference);
      const urgency = scoreUrgency(
        availability.availableWithin48Hours,
        availability.availableInHours,
        submission.lead.urgencyPreference,
      );
      const experience = scoreExperience(
        expert.yearsExperience,
        submission.lead.priorConsultingExperience,
      );
      const marketplaceBoost = getMarketplaceBoost(expert);
      const primarySpecialization =
        expert.specialties.find((specialty) => specialty === highestRiskCategory) ??
        expert.specialties[0];

      const weightedScore = Math.round(
        category.score * MATCH_WEIGHTS.category +
          location.score * MATCH_WEIGHTS.location +
          budget.score * MATCH_WEIGHTS.budget +
          urgency.score * MATCH_WEIGHTS.urgency +
          experience.score * MATCH_WEIGHTS.experience,
      );
      const totalScore = Math.min(100, weightedScore + marketplaceBoost);

      const scoredReasons = [
        { score: category.score, reason: category.reason },
        { score: location.score, reason: location.reason },
        { score: budget.score, reason: budget.reason },
        { score: urgency.score, reason: urgency.reason },
        { score: experience.score, reason: experience.reason },
      ]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.reason);

      return {
        expert,
        profile,
        totalScore,
        matchTier: getMatchTier(totalScore),
        primarySpecialization,
        availableWithin48Hours: availability.availableWithin48Hours,
        availabilityLabel: availability.label,
        matchReason: scoredReasons.join(" "),
        breakdown: {
          category: category.score,
          location: location.score,
          budget: budget.score,
          urgency: urgency.score,
          experience: experience.score,
          marketplaceBoost,
        },
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || b.expert.rating - a.expert.rating);
}
