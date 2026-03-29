"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Building2,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { PageOrientation } from "@/components/navigation/page-orientation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockQuizEnginePayload } from "@/data";
import { saveAssessmentSubmission } from "@/lib/assessment-storage";
import { rankExpertsForSubmission } from "@/lib/expert-matching";
import { cn } from "@/lib/utils";
import type {
  AudienceSegment,
  AssessmentMode,
  AssessmentSubmission,
  LeadTier,
  QuizCategory,
  RiskLevel as StoredRiskLevel,
} from "@/types";

interface QuizFlowProps {
  initialSituation?: string;
  initialAudience?: string;
}

interface LeadCaptureFormValues {
  fullName: string;
  workEmail: string;
  phoneNumber: string;
  companyName: string;
  role: string;
  businessType: string;
  locationScope: "bahamas" | "outside-bahamas" | "";
  location: string;
  island: string;
  website: string;
  teamSize: string;
  priorConsultingExperience: string;
}

interface QuizOption {
  id: string;
  label: string;
  text: string;
  support?: string;
  riskPoints: number;
}

interface QuizPrompt {
  id: string;
  text: string;
  helper?: string;
  category: QuizCategory;
  options: QuizOption[];
}

type FlowStep = "quiz" | "cyberIntro" | "lead" | "loading";
type DisplayRiskLevel = "Low" | "Moderate" | "High" | "Critical";

const ROLE_OPTIONS = [
  "Founder / Owner",
  "CEO / Managing Director",
  "Operations Manager",
  "IT Manager",
  "Finance Lead",
  "Administrative Lead",
  "Consultant / Advisor",
];

const BUSINESS_TYPE_OPTIONS = [
  "Professional Services",
  "Retail / E-Commerce",
  "Hospitality / Tourism",
  "Healthcare",
  "Financial Services",
  "Technology",
  "Education",
  "Construction / Real Estate",
  "Logistics / Transportation",
  "Nonprofit / NGO",
  "Public Sector",
  "Other",
];

const LOCATION_SUGGESTIONS = [
  { label: "Bay Street, Nassau", detail: "New Providence, The Bahamas", scope: "bahamas" as const, island: "New Providence" },
  { label: "Cable Beach, Nassau", detail: "New Providence, The Bahamas", scope: "bahamas" as const, island: "New Providence" },
  { label: "Downtown Freeport", detail: "Grand Bahama, The Bahamas", scope: "bahamas" as const, island: "Grand Bahama" },
  { label: "Lucaya, Freeport", detail: "Grand Bahama, The Bahamas", scope: "bahamas" as const, island: "Grand Bahama" },
  { label: "Marsh Harbour", detail: "Abaco, The Bahamas", scope: "bahamas" as const, island: "Abaco" },
  { label: "George Town", detail: "Exuma, The Bahamas", scope: "bahamas" as const, island: "Exuma" },
  { label: "Governors Harbour", detail: "Eleuthera, The Bahamas", scope: "bahamas" as const, island: "Eleuthera" },
  { label: "Outside The Bahamas", detail: "International", scope: "outside-bahamas" as const },
];

const BAHAMAS_ISLAND_OPTIONS = [
  "New Providence",
  "Grand Bahama",
  "Abaco",
  "Exuma",
  "Eleuthera",
  "Andros",
  "Long Island",
  "Bimini",
  "Cat Island",
  "Harbour Island",
  "Berry Islands",
  "San Salvador",
  "Acklins",
  "Crooked Island",
  "Mayaguana",
  "Ragged Island",
  "Other Family Island",
];

const AUDIENCE_SEGMENTS: { id: AudienceSegment; label: string }[] = [
  { id: "business-owner", label: "Business owner" },
  { id: "personal-help", label: "Personal help" },
  { id: "not-sure", label: "Not sure yet" },
];

const HELP_CATEGORY_MAP: Record<string, QuizCategory> = {
  need_operations: "Operations",
  need_cybersecurity: "Cybersecurity",
  need_systems: "Systems",
  need_growth: "Growth",
  need_career_help: "Career Help",
  need_financial_advice: "Financial Advice",
  need_legal_help: "Legal Help",
  need_personal_tech_support: "Personal Tech Support",
  need_general_support: "General Support",
};

const SITUATION_OPTIONS: QuizOption[] = [
  { id: "situation_stuck", label: "My application is stuck", text: "My application is stuck", support: "You started, but progress has slowed or stalled.", riskPoints: 6 },
  { id: "situation_start", label: "I don't know where to start", text: "I don't know where to start", support: "You need a clearer path before taking the next step.", riskPoints: 4 },
  { id: "situation_urgent", label: "I need help urgently", text: "I need help urgently", support: "Time matters and you need support quickly.", riskPoints: 8 },
  { id: "situation_failed", label: "I tried before but it didn't work", text: "I tried before but it didn't work", support: "You need a stronger plan after an earlier failed attempt.", riskPoints: 7 },
  { id: "situation_not_working", label: "Something isn't working but I'm not sure why", text: "Something isn't working but I'm not sure why", support: "You need clarity before things get worse.", riskPoints: 5 },
  { id: "situation_need_advice", label: "I need expert advice before making a decision", text: "I need expert advice before making a decision", support: "You want confidence before the next move.", riskPoints: 4 },
];

const BUSINESS_HELP_OPTIONS: QuizOption[] = [
  { id: "need_operations", label: "Operations", text: "Operations", support: "Help with processes, execution, and bottlenecks.", riskPoints: 4 },
  { id: "need_cybersecurity", label: "Cybersecurity", text: "Cybersecurity", support: "Protection, backups, and recovery readiness.", riskPoints: 6 },
  { id: "need_systems", label: "Systems", text: "Systems", support: "Support for tools, workflows, and business systems.", riskPoints: 4 },
  { id: "need_growth", label: "Growth", text: "Growth", support: "Strategy, traction, and smarter next moves.", riskPoints: 3 },
];

const INDIVIDUAL_HELP_OPTIONS: QuizOption[] = [
  { id: "need_career_help", label: "Career help", text: "Career help", support: "Direction, opportunities, and practical support.", riskPoints: 3 },
  { id: "need_financial_advice", label: "Financial advice", text: "Financial advice", support: "Planning, money decisions, and financial clarity.", riskPoints: 4 },
  { id: "need_legal_help", label: "Legal help", text: "Legal help", support: "Personal legal guidance and support.", riskPoints: 5 },
  { id: "need_personal_tech_support", label: "Personal tech support", text: "Personal tech support", support: "Device, account, and everyday technology help.", riskPoints: 4 },
];

const NOT_SURE_HELP_OPTIONS: QuizOption[] = [
  { id: "need_operations", label: "Business / operations", text: "Business / operations", support: "For process, execution, or workflow issues.", riskPoints: 4 },
  { id: "need_cybersecurity", label: "Cybersecurity / tech", text: "Cybersecurity / tech", support: "For online protection, recovery, or tech concerns.", riskPoints: 5 },
  { id: "need_financial_advice", label: "Financial advice", text: "Financial advice", support: "For money, planning, or financial decisions.", riskPoints: 4 },
  { id: "need_legal_help", label: "Legal help", text: "Legal help", support: "For legal guidance and next steps.", riskPoints: 5 },
];

const ALL_HELP_OPTIONS: QuizOption[] = [
  ...BUSINESS_HELP_OPTIONS,
  ...INDIVIDUAL_HELP_OPTIONS,
];

const LOCATION_OPTIONS: QuizOption[] = [
  { id: "location_nassau", label: "Nassau", text: "Nassau, New Providence", support: "Local support in Nassau and surrounding areas.", riskPoints: 1 },
  { id: "location_grand_bahama", label: "Grand Bahama", text: "Freeport, Grand Bahama", support: "Matching focused on Grand Bahama availability.", riskPoints: 1 },
  { id: "location_family_islands", label: "Family Islands", text: "Family Islands, Bahamas", support: "Support across the outer islands and remote delivery.", riskPoints: 2 },
  { id: "location_outside", label: "Outside The Bahamas", text: "Outside The Bahamas", support: "Remote-first matching for international support needs.", riskPoints: 2 },
];

const URGENCY_OPTIONS: QuizOption[] = [
  { id: "urgency_48h", label: "24-48 hours", text: "24-48 hours", support: "You need someone who can move quickly.", riskPoints: 8 },
  { id: "urgency_week", label: "Within a week", text: "Within a week", support: "You need help soon, but not immediately.", riskPoints: 5 },
  { id: "urgency_exploring", label: "Just exploring", text: "Just exploring", support: "You are gathering clarity before moving.", riskPoints: 2 },
];

const BUDGET_OPTIONS: QuizOption[] = [
  { id: "budget_under_150", label: "Under $150/hour", text: "Under $150/hour", support: "Keep the shortlist focused on leaner options.", riskPoints: 1 },
  { id: "budget_150_175", label: "$150-$175/hour", text: "$150-$175/hour", support: "Balanced budget for specialist support.", riskPoints: 1 },
  { id: "budget_176_200", label: "$176-$200/hour", text: "$176-$200/hour", support: "Premium-range advisor support.", riskPoints: 1 },
  { id: "budget_200_plus", label: "$200+/hour", text: "$200+/hour", support: "Open to senior or highly specialized providers.", riskPoints: 1 },
  { id: "budget_unsure", label: "Not sure yet", text: "Not sure yet", support: "You want clarity first, then pricing options.", riskPoints: 2 },
];

const PRIOR_EXPERIENCE_OPTIONS = [
  "First time hiring outside expertise",
  "Worked with one provider before",
  "Experienced with external consultants",
];

const CYBER_CHECK_PROMPTS: QuizPrompt[] = [
  { id: "cyber_accounts", text: "Do you have a way to protect your business accounts?", helper: "Keep it simple. Just choose the option that feels most true today.", category: "Cybersecurity", options: [
    { id: "cyber_accounts_yes", label: "Yes", text: "Yes, we have protection in place", support: "Good starting point.", riskPoints: 0 },
    { id: "cyber_accounts_some", label: "Some protection", text: "Some protection, but not consistently", support: "There are partial gaps.", riskPoints: 4 },
    { id: "cyber_accounts_no", label: "No / not sure", text: "No or not sure", support: "This may need urgent attention.", riskPoints: 8 },
  ] },
  { id: "cyber_backup", text: "Do you regularly back up your data?", helper: "This helps us understand how easily you could recover if something went wrong.", category: "Cybersecurity", options: [
    { id: "cyber_backup_yes", label: "Yes", text: "Yes, regularly", support: "Recovery is more likely to be faster.", riskPoints: 0 },
    { id: "cyber_backup_some", label: "Sometimes", text: "Sometimes", support: "There may still be recovery gaps.", riskPoints: 4 },
    { id: "cyber_backup_no", label: "No / not sure", text: "No or not sure", support: "This is often a major risk area.", riskPoints: 8 },
  ] },
  { id: "cyber_virus", text: "Do you have protection against viruses?", helper: "We are checking everyday practical protection, not technical setups.", category: "Cybersecurity", options: [
    { id: "cyber_virus_yes", label: "Yes", text: "Yes", support: "Good baseline protection.", riskPoints: 0 },
    { id: "cyber_virus_some", label: "Some protection", text: "Some protection", support: "Coverage may be inconsistent.", riskPoints: 4 },
    { id: "cyber_virus_no", label: "No / not sure", text: "No or not sure", support: "This can increase exposure quickly.", riskPoints: 8 },
  ] },
  { id: "cyber_hacking", text: "Do you have protection against hacking?", helper: "Think about whether your business has clear protective measures in place.", category: "Cybersecurity", options: [
    { id: "cyber_hacking_yes", label: "Yes", text: "Yes", support: "There is some active protection in place.", riskPoints: 0 },
    { id: "cyber_hacking_some", label: "Some protection", text: "Some protection", support: "You may still have important gaps.", riskPoints: 4 },
    { id: "cyber_hacking_no", label: "No / not sure", text: "No or not sure", support: "This suggests a higher exposure level.", riskPoints: 8 },
  ] },
  { id: "cyber_recovery", text: "If something went wrong today, could you recover quickly?", helper: "We want to understand how resilient your business feels right now.", category: "Cybersecurity", options: [
    { id: "cyber_recovery_yes", label: "Yes", text: "Yes, we could recover quickly", support: "Recovery confidence is strong.", riskPoints: 0 },
    { id: "cyber_recovery_some", label: "Maybe", text: "Maybe, but it would be difficult", support: "Recovery may be slower than you want.", riskPoints: 4 },
    { id: "cyber_recovery_no", label: "No / not sure", text: "No or not sure", support: "Recovery readiness likely needs help.", riskPoints: 8 },
  ] },
];

function toStoredRiskLevel(percentage: number): StoredRiskLevel {
  if (percentage >= 75) return "critical";
  if (percentage >= 50) return "high";
  if (percentage >= 25) return "moderate";
  return "low";
}

function toDisplayRiskLevel(percentage: number): DisplayRiskLevel {
  if (percentage >= 75) return "Critical";
  if (percentage >= 50) return "High";
  if (percentage >= 25) return "Moderate";
  return "Low";
}

function getRiskLevelClasses(riskLevel: DisplayRiskLevel): string {
  if (riskLevel === "Critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (riskLevel === "High") return "border-amber-200 bg-amber-50 text-amber-700";
  if (riskLevel === "Moderate") return "border-[#BFD0F8] bg-[#EEF3FF] text-[#356AF6]";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getSelectedOption(options: QuizOption[], selectedId?: string) {
  return options.find((option) => option.id === selectedId);
}

function getHelpOptionsForAudience(audience?: AudienceSegment) {
  if (audience === "personal-help") return INDIVIDUAL_HELP_OPTIONS;
  if (audience === "not-sure") return NOT_SURE_HELP_OPTIONS;
  return BUSINESS_HELP_OPTIONS;
}

function getBasePrompts(selectedCategory: QuizCategory, audience?: AudienceSegment): QuizPrompt[] {
  const helpOptions = getHelpOptionsForAudience(audience);

  return [
    { id: "situation_now", text: "What situation are you in right now?", helper: "Pick the statement that feels closest to what you're dealing with.", category: "General Support", options: SITUATION_OPTIONS },
    { id: "problem_need", text: "What problem do you need solved?", helper: "This keeps the rest of the flow focused and simple.", category: selectedCategory, options: helpOptions },
    { id: "location", text: "Where are you located?", helper: "We use this to prioritize nearby or remote-friendly experts.", category: selectedCategory, options: LOCATION_OPTIONS },
    { id: "urgency", text: "How soon do you need help?", helper: "This helps us prioritize response time and shortlist the right providers.", category: selectedCategory, options: URGENCY_OPTIONS },
    { id: "budget", text: "What budget range are you working with?", helper: "A quick range helps us keep the recommendations practical.", category: selectedCategory, options: BUDGET_OPTIONS },
  ];
}

function buildQuizPrompts(selectedHelpId?: string, audience?: AudienceSegment): QuizPrompt[] {
  const selectedCategory = HELP_CATEGORY_MAP[selectedHelpId ?? ""] ?? "General Support";
  const basePrompts = getBasePrompts(selectedCategory, audience);
  if (selectedHelpId !== "need_cybersecurity") return basePrompts;
  return [basePrompts[0], basePrompts[1], ...CYBER_CHECK_PROMPTS, basePrompts[2], basePrompts[3], basePrompts[4]];
}

function getLocationSuggestions(value?: string, scope?: "bahamas" | "outside-bahamas" | "") {
  const scopedSuggestions = scope
    ? LOCATION_SUGGESTIONS.filter((item) => item.scope === scope)
    : LOCATION_SUGGESTIONS;

  if (!value?.trim()) return scopedSuggestions;
  const normalized = value.trim().toLowerCase();
  return scopedSuggestions.filter(
    (item) =>
      item.label.toLowerCase().includes(normalized) ||
      item.detail.toLowerCase().includes(normalized),
  );
}

function deriveLeadLocationDefaults(selectedLocationId?: string) {
  if (selectedLocationId === "location_nassau") {
    return { locationScope: "bahamas" as const, island: "New Providence", location: "Nassau, New Providence" };
  }

  if (selectedLocationId === "location_grand_bahama") {
    return { locationScope: "bahamas" as const, island: "Grand Bahama", location: "Freeport, Grand Bahama" };
  }

  if (selectedLocationId === "location_family_islands") {
    return { locationScope: "bahamas" as const, island: "", location: "" };
  }

  if (selectedLocationId === "location_outside") {
    return { locationScope: "outside-bahamas" as const, island: "", location: "" };
  }

  return { locationScope: "" as const, island: "", location: "" };
}

function deriveAssessmentMode(category: QuizCategory): AssessmentMode {
  return category === "Cybersecurity" ? "cybersecurity-risk" : "business-services";
}

function deriveLeadTier(
  normalizedScore: number,
  category: QuizCategory,
  urgencyPreference?: string,
  budgetPreference?: string,
): LeadTier {
  if (
    category === "Cybersecurity" ||
    normalizedScore >= 60 ||
    urgencyPreference === "24-48 hours" ||
    budgetPreference === "$176-$200/hour" ||
    budgetPreference === "$200+/hour"
  ) {
    return "premium";
  }

  return "standard";
}

function buildPriorityActions(category: QuizCategory, answers: Record<string, string>): string[] {
  if (category === "Cybersecurity") {
    const actions: string[] = [];
    if (answers.cyber_accounts === "cyber_accounts_no" || answers.cyber_accounts === "cyber_accounts_some") actions.push("Strengthen protection for business accounts so sign-ins are harder to compromise.");
    if (answers.cyber_backup === "cyber_backup_no" || answers.cyber_backup === "cyber_backup_some") actions.push("Set up a reliable backup routine so important data can be recovered quickly.");
    if (answers.cyber_virus === "cyber_virus_no" || answers.cyber_virus === "cyber_virus_some") actions.push("Put stronger virus protection in place across the devices your business relies on.");
    if (answers.cyber_hacking === "cyber_hacking_no" || answers.cyber_hacking === "cyber_hacking_some") actions.push("Review your current protection against hacking and close the biggest gaps first.");
    if (answers.cyber_recovery === "cyber_recovery_no" || answers.cyber_recovery === "cyber_recovery_some") actions.push("Build a simple recovery plan so the business can get back on track faster after a problem.");
    return actions.length > 0 ? actions.slice(0, 3) : ["Keep protections current and review backup and recovery readiness regularly."];
  }
  if (category === "Operations") return ["Identify the workflow or blocker slowing progress most.", "Reduce friction in the current process before adding more complexity.", "Connect with an operations-focused expert who can help you move faster."];
  if (category === "Systems") return ["Pinpoint the tool, system, or setup causing the most drag.", "Simplify the current setup before layering on more tools.", "Match with a systems expert who can improve reliability and clarity."];
  if (category === "Growth") return ["Clarify the next growth priority before spreading effort too thin.", "Focus on the move that creates the most traction first.", "Connect with a growth advisor who can turn uncertainty into a practical plan."];
  if (category === "Career Help") return ["Clarify the next career move before taking scattered action.", "Focus on the strongest opportunity path first.", "Connect with a career advisor who can help you move with more confidence."];
  if (category === "Financial Advice") return ["Identify the money decision causing the most stress or uncertainty.", "Get clear on priorities before making the next financial move.", "Connect with a financial advisor who can help you make the next step practical."];
  if (category === "Legal Help") return ["Clarify the legal issue that needs attention first.", "Gather the key facts and documents before taking the next step.", "Connect with a legal expert who can help you move forward clearly."];
  if (category === "Personal Tech Support") return ["Pinpoint the device, account, or setup issue causing the most disruption.", "Start with the fastest practical fix before trying multiple workarounds.", "Connect with a tech support expert who can solve the issue quickly."];
  return ["Clarify the immediate blocker so the right support path is obvious.", "Prioritize the next practical action instead of trying to solve everything at once.", "Connect with the right expert to move forward faster."];
}

function calculateAssessment(prompts: QuizPrompt[], answers: Record<string, string>, selectedCategory: QuizCategory) {
  const includedPromptIds = selectedCategory === "Cybersecurity" ? prompts.map((prompt) => prompt.id) : ["situation_now", "problem_need", "urgency", "budget"];
  const includedPrompts = prompts.filter((prompt) => includedPromptIds.includes(prompt.id));
  const totalRiskPoints = includedPrompts.reduce((sum, prompt) => {
    const selectedOption = getSelectedOption(prompt.options, answers[prompt.id]);
    return sum + (selectedOption?.riskPoints ?? 0);
  }, 0);
  const maxRiskPoints = includedPrompts.reduce((sum, prompt) => sum + Math.max(...prompt.options.map((option) => option.riskPoints)), 0);
  const normalizedScore = maxRiskPoints === 0 ? 0 : Math.round((totalRiskPoints / maxRiskPoints) * 100);
  return { totalRiskPoints, maxRiskPoints, normalizedScore };
}

export function QuizFlow({ initialSituation, initialAudience }: QuizFlowProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const nextQuestionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationBlurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (initialSituation && SITUATION_OPTIONS.some((option) => option.id === initialSituation)) {
      return { situation_now: initialSituation };
    }

    return {} as Record<string, string>;
  });
  const [currentIndex, setCurrentIndex] = useState(
    initialSituation && SITUATION_OPTIONS.some((option) => option.id === initialSituation) ? 1 : 0,
  );
  const [flowStep, setFlowStep] = useState<FlowStep>("quiz");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LeadCaptureFormValues>({
    defaultValues: {
      fullName: "",
      workEmail: "",
      phoneNumber: "",
      companyName: "",
      role: "",
      businessType: "",
      locationScope: "",
      location: "",
      island: "",
      website: "",
      teamSize: "",
      priorConsultingExperience: "",
    },
  });

  useEffect(() => {
    return () => {
      if (nextQuestionTimeout.current) clearTimeout(nextQuestionTimeout.current);
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (locationBlurTimeout.current) clearTimeout(locationBlurTimeout.current);
    };
  }, []);

  const selectedAudience = AUDIENCE_SEGMENTS.some((segment) => segment.id === initialAudience)
    ? (initialAudience as AudienceSegment)
    : undefined;
  const currentAudience = selectedAudience ?? "business-owner";
  const selectedHelpId = answers.problem_need;
  const selectedAudienceLabel = AUDIENCE_SEGMENTS.find((segment) => segment.id === selectedAudience)?.label;
  const selectedCategory = HELP_CATEGORY_MAP[selectedHelpId ?? ""] ?? "General Support";
  const prompts = useMemo(() => buildQuizPrompts(selectedHelpId, currentAudience), [selectedHelpId, currentAudience]);
  const totalQuestions = prompts.length;
  const answeredCount = prompts.filter((prompt) => Boolean(answers[prompt.id])).length;
  const currentPrompt = prompts[currentIndex];
  const assessment = useMemo(() => calculateAssessment(prompts, answers, selectedCategory), [answers, prompts, selectedCategory]);
  const displayRiskLevel = toDisplayRiskLevel(assessment.normalizedScore);
  const progressValue = flowStep === "quiz" || flowStep === "cyberIntro" ? (totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100)) : 100;

  useEffect(() => {
    if (flowStep === "quiz" && currentIndex >= prompts.length) setFlowStep("lead");
  }, [currentIndex, flowStep, prompts.length]);

  useEffect(() => {
    const defaults = deriveLeadLocationDefaults(answers.location);
    if (!defaults.locationScope) return;
    setValue("locationScope", defaults.locationScope, { shouldDirty: true });
    setValue("location", defaults.location, { shouldDirty: true });
    setValue("island", defaults.island, { shouldDirty: true });
  }, [answers.location, setValue]);

  const locationScope = watch("locationScope");
  const leadLocationValue = watch("location");
  const selectedIsland = watch("island");
  const filteredLocationSuggestions = useMemo(
    () => getLocationSuggestions(leadLocationValue, locationScope).slice(0, 5),
    [leadLocationValue, locationScope],
  );
  const assessmentMode = deriveAssessmentMode(selectedCategory);
  const isBusinessAudience = currentAudience === "business-owner";
  const modeLabel =
    assessmentMode === "cybersecurity-risk"
      ? "Cybersecurity Risk Mode"
      : currentAudience === "personal-help"
        ? "Personal Support Mode"
        : currentAudience === "not-sure"
          ? "Guided Support Mode"
          : "Business Services Mode";
  const currentViewLabel = flowStep === "quiz" ? `Question ${Math.min(currentIndex + 1, totalQuestions)} of ${totalQuestions}` : flowStep === "cyberIntro" ? "Quick Setup Check" : flowStep === "lead" ? "Lead Capture" : "Building Results";
  const stepLabel = flowStep === "quiz" || flowStep === "cyberIntro" ? "Step 1 of 3" : flowStep === "lead" ? "Step 2 of 3" : "Step 3 of 3";
  const nextStepLabel = flowStep === "quiz"
    ? currentPrompt?.id === "problem_need" && answers.problem_need === "need_cybersecurity"
      ? "You will see a short 30-second setup check next."
      : answeredCount >= totalQuestions - 1
        ? "Complete the form to unlock your results and matched experts."
        : "Choose the next option to keep moving."
    : flowStep === "cyberIntro"
      ? "You are about to answer a few simple cybersecurity check questions."
      : flowStep === "lead"
        ? "Submit your details to view results and matched experts."
        : "You will be redirected to your personalized results page.";

  useEffect(() => {
    if (locationScope !== "bahamas") {
      setValue("island", "", { shouldDirty: true });
    }
  }, [locationScope, setValue]);

  const handleLocationSuggestionSelect = (suggestion: (typeof LOCATION_SUGGESTIONS)[number]) => {
    setValue("location", suggestion.label, { shouldDirty: true, shouldValidate: true });
    if (suggestion.scope === "bahamas") {
      setValue("locationScope", "bahamas", { shouldDirty: true, shouldValidate: true });
      if (suggestion.island) {
        setValue("island", suggestion.island, { shouldDirty: true, shouldValidate: true });
      }
    } else {
      setValue("locationScope", "outside-bahamas", { shouldDirty: true, shouldValidate: true });
      setValue("island", "", { shouldDirty: true, shouldValidate: true });
    }
    setIsLocationSuggestionsOpen(false);
  };

  const handleLocationFocus = () => {
    if (locationBlurTimeout.current) clearTimeout(locationBlurTimeout.current);
    setIsLocationSuggestionsOpen(true);
  };

  const handleLocationBlur = () => {
    locationBlurTimeout.current = setTimeout(() => {
      setIsLocationSuggestionsOpen(false);
    }, 140);
  };

  const handleOptionSelect = (prompt: QuizPrompt, option: QuizOption) => {
    if (isTransitioning || (flowStep !== "quiz" && flowStep !== "cyberIntro")) return;
    setAnswers((previous) => ({ ...previous, [prompt.id]: option.id }));
    setIsTransitioning(true);
    if (nextQuestionTimeout.current) clearTimeout(nextQuestionTimeout.current);
    nextQuestionTimeout.current = setTimeout(() => {
      if (prompt.id === "problem_need" && option.id === "need_cybersecurity") {
        setFlowStep("cyberIntro");
      } else {
        setCurrentIndex((previous) => previous + 1);
      }
      setIsTransitioning(false);
    }, 220);
  };

  const continueCyberIntro = () => {
    setFlowStep("quiz");
    setCurrentIndex((previous) => previous + 1);
  };
  const handleLeadCaptureSubmit = (values: LeadCaptureFormValues) => {
    const submittedAt = new Date().toISOString();
    const priorityActions = buildPriorityActions(selectedCategory, answers);
    const budgetPreference = getSelectedOption(BUDGET_OPTIONS, answers.budget)?.text;
    const urgencyPreference = getSelectedOption(URGENCY_OPTIONS, answers.urgency)?.text;
    const leadTier = deriveLeadTier(
      assessment.normalizedScore,
      selectedCategory,
      urgencyPreference,
      budgetPreference,
    );
    const categoryBreakdown = [{
      category: selectedCategory,
      riskPoints: assessment.totalRiskPoints,
      maxRiskPoints: assessment.maxRiskPoints,
      riskLevel: toStoredRiskLevel(assessment.normalizedScore),
    }];
    const fallbackQuizLocation = getSelectedOption(LOCATION_OPTIONS, answers.location)?.text;
    const baseLocation = values.location.trim() || fallbackQuizLocation || "Not provided";
    const resolvedLocation =
      values.locationScope === "bahamas" && values.island && !baseLocation.toLowerCase().includes(values.island.toLowerCase())
        ? `${baseLocation}, ${values.island}`
        : baseLocation;

    const responses = prompts.map((prompt) => {
      const selectedOption = getSelectedOption(prompt.options, answers[prompt.id]);
      if (!selectedOption) return null;
      return {
        questionId: prompt.id,
        questionText: prompt.text,
        category: prompt.category,
        selectedOptionId: selectedOption.id,
        selectedOptionLabel: selectedOption.label,
        selectedOptionText: selectedOption.text,
        selectedOptionRiskPoints: selectedOption.riskPoints,
      };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));

    const payload: AssessmentSubmission = {
      assessmentId: `asmt_${Date.now()}`,
      submittedAt,
      assessmentMode,
      leadTier,
      totalQuestions,
      answeredQuestions: answeredCount,
      totalRiskPoints: assessment.totalRiskPoints,
      maxRiskPoints: assessment.maxRiskPoints,
      normalizedScore: assessment.normalizedScore,
      riskLevel: toStoredRiskLevel(assessment.normalizedScore),
      highestRiskCategory: selectedCategory,
      categoryBreakdown,
      priorityActions,
      recommendedExpertIds: [],
      lead: {
        fullName: values.fullName.trim(),
        workEmail: values.workEmail.trim(),
        phoneNumber: values.phoneNumber.trim() || undefined,
        audienceSegment: selectedAudience,
        companyName: values.companyName.trim() || undefined,
        role: values.role || undefined,
        businessType: values.businessType || undefined,
        location: resolvedLocation,
        locationScope: values.locationScope || undefined,
        island: values.locationScope === "bahamas" ? values.island || undefined : undefined,
        website: values.website?.trim() || undefined,
        teamSize: values.teamSize || undefined,
        budgetPreference,
        urgencyPreference,
        priorConsultingExperience: values.priorConsultingExperience || undefined,
      },
      responses,
      leadTracking: [],
      rankingControlSnapshot: [],
    };

    const rankedExperts = rankExpertsForSubmission(payload, payload.highestRiskCategory, mockQuizEnginePayload.experts);
    payload.recommendedExpertIds = rankedExperts.length > 0
      ? rankedExperts.slice(0, 3).map((match) => match.expert.id)
      : mockQuizEnginePayload.sampleAssessmentResult.recommendedExpertIds;
    payload.leadTracking = rankedExperts.slice(0, 3).map((match) => ({
      expertId: match.expert.id,
      matchScore: match.totalScore,
      matchTier: match.matchTier,
      leadTier,
      visibilityLevel: match.expert.visibilityLevel,
      status: "new",
    }));
    payload.rankingControlSnapshot = rankedExperts.slice(0, 3).map((match) => ({
      expertId: match.expert.id,
      visibilityLevel: match.expert.visibilityLevel,
      matchingVisibility: match.expert.matchingVisibility,
      rankingWeightBoost: match.expert.rankingWeightBoost,
    }));

    saveAssessmentSubmission(payload);
    setFlowStep("loading");
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    loadingTimeout.current = setTimeout(() => {
      router.push("/results");
    }, 2000);
  };

  if (totalQuestions === 0) return null;

  return (
    <main className="sl-page relative min-h-screen overflow-hidden text-[#111827]">
      <div className="pointer-events-none absolute inset-0">
        <div className="sl-grid absolute inset-0 opacity-60" />
      </div>

      <AnimatePresence mode="wait">
        <section
          className={cn(
            "relative mx-auto w-full max-w-6xl px-6 pb-14 pt-14 transition duration-300",
            (flowStep === "lead" || flowStep === "loading") && "pointer-events-none blur-[3px]",
          )}
        >
          <PageOrientation
            fallbackHref="/"
            eyebrow={modeLabel}
            title={
              assessmentMode === "cybersecurity-risk"
                ? "Cybersecurity Risk Check"
                : "Tell us what you need help with"
            }
            description={
              assessmentMode === "cybersecurity-risk"
                ? "You are in the cybersecurity path now. We keep the questions simple, practical, and non-technical while the platform scores risk in the background."
                : "This quiz is built to stay fast and clear. You answer simple questions, and the system handles the matching logic in the background."
            }
            currentView={currentViewLabel}
            stepLabel={stepLabel}
            nextLabel={nextStepLabel}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.32fr_0.68fr]">
            <div className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_16px_36px_rgba(56,75,107,0.08)] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge className="bg-[#EEF3FF] text-[#356AF6]">{modeLabel}</Badge>
                <Badge variant="outline" className={cn("border text-xs", getRiskLevelClasses(displayRiskLevel))}>
                  {displayRiskLevel} Priority
                </Badge>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 text-sm text-[#5D6B85]">
                  <span>Progress</span>
                  <span>{progressValue}% complete</span>
                </div>
                <Progress value={progressValue} className="mt-3 h-2 rounded-full bg-[#E5EDFB]" />
              </div>

              {flowStep === "cyberIntro" ? (
                <motion.div key="cyber-intro" initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -14 }} transition={{ duration: 0.2 }} className="mt-8 rounded-[26px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-7">
                  <Badge className="bg-[#EEF3FF] text-[#356AF6]">Cybersecurity Flow</Badge>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#111827]">Let&apos;s quickly check your setup (takes 30 seconds)</h2>
                  <p className="mt-3 text-base leading-7 text-[#5D6B85]">This takes about 30 seconds. We&apos;ll keep the questions simple and use your answers to estimate risk in the background.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {["Protecting business accounts", "Backup readiness", "Virus protection", "Recovery confidence"].map((item) => (
                      <div key={item} className="rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3 text-sm font-medium text-[#111827]">{item}</div>
                    ))}
                  </div>
                  <Button type="button" onClick={continueCyberIntro} size="lg" className="mt-7 h-12 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]">Continue</Button>
                </motion.div>
              ) : currentPrompt ? (
                <motion.div key={currentPrompt.id} initial={{ opacity: 0, x: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reducedMotion ? 0 : -16 }} transition={{ duration: 0.2 }} className="mt-8">
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">{currentPrompt.text}</h2>
                    {currentPrompt.helper ? <p className="mt-3 text-base leading-7 text-[#5D6B85]">{currentPrompt.helper}</p> : null}
                  </div>
                  <div className="mt-8 space-y-4">
                    {currentPrompt.options.map((option) => (
                      <button key={option.id} type="button" onClick={() => handleOptionSelect(currentPrompt, option)} className="group w-full rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5 text-left transition hover:border-[#BFD0F8] hover:bg-white hover:shadow-[0_12px_26px_rgba(56,75,107,0.08)]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-[#111827]">{option.label}</p>
                            <p className="mt-2 text-sm leading-6 text-[#5D6B85]">{option.text}</p>
                            {option.support ? <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">{option.support}</p> : null}
                          </div>
                          <span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold text-[#356AF6] transition group-hover:bg-[#356AF6] group-hover:text-white">Select</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </div>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Current Snapshot</p>
                <div className="mt-4 grid gap-3">
                  {selectedAudienceLabel ? <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Audience</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedAudienceLabel}</p></div> : null}
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Situation</p><p className="mt-2 text-sm font-semibold text-[#111827]">{getSelectedOption(SITUATION_OPTIONS, answers.situation_now)?.text || "Not selected yet"}</p></div>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Help Needed</p><p className="mt-2 text-sm font-semibold text-[#111827]">{getSelectedOption(ALL_HELP_OPTIONS, answers.problem_need)?.text || "Not selected yet"}</p></div>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Location</p><p className="mt-2 text-sm font-semibold text-[#111827]">{getSelectedOption(LOCATION_OPTIONS, answers.location)?.text || "Not selected yet"}</p></div>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Urgency</p><p className="mt-2 text-sm font-semibold text-[#111827]">{getSelectedOption(URGENCY_OPTIONS, answers.urgency)?.text || "Not selected yet"}</p></div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Matching Notes</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-sm font-medium text-[#111827]">We keep the questions simple and handle the scoring behind the scenes.</p></div>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-sm font-medium text-[#111827]">If you choose IT / cybersecurity, we ask a short setup check before matching.</p></div>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-sm font-medium text-[#111827]">Budget, urgency, and location help us rank the right experts faster.</p></div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        {flowStep === "lead" ? (
          <motion.div key="lead-capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-[#1B2C52]/18 px-6 py-10 backdrop-blur-md">
            <div className="flex min-h-full items-start justify-center">
            <div className="my-auto w-full max-w-5xl rounded-[34px] border border-[#D9E3F3] bg-white/96 p-6 shadow-[0_28px_60px_rgba(56,75,107,0.18)] sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[26px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] p-6">
                  <Badge className="bg-[#EEF3FF] text-[#356AF6]">Almost Done</Badge>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#111827]">Where should we send your matched experts?</h2>
                  <p className="mt-3 text-sm leading-7 text-[#5D6B85]">You&apos;ve completed the quiz. Add your details below and we&apos;ll unlock your results and matched expert recommendations.</p>
                  <div className="mt-6 space-y-3">
                    {[
                      selectedAudienceLabel ? `Audience: ${selectedAudienceLabel}` : null,
                      `Help needed: ${getSelectedOption(ALL_HELP_OPTIONS, answers.problem_need)?.text || "Not selected"}`,
                      `Urgency: ${getSelectedOption(URGENCY_OPTIONS, answers.urgency)?.text || "Not selected"}`,
                      `Budget: ${getSelectedOption(BUDGET_OPTIONS, answers.budget)?.text || "Not selected"}`,
                      `Current priority: ${selectedCategory}`,
                    ].filter((item): item is string => Boolean(item)).map((item) => <div key={item} className="rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3 text-sm font-medium text-[#111827]">{item}</div>)}
                  </div>
                  <div className="mt-6 rounded-2xl border border-[#D9E3F3] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Location Notes</p>
                    <div className="mt-3 space-y-3">
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Region</p>
                        <p className="mt-1 text-sm font-semibold text-[#111827]">
                          {locationScope === "bahamas"
                            ? "Located in The Bahamas"
                            : locationScope === "outside-bahamas"
                              ? "Outside The Bahamas"
                              : "Choose your region"}
                        </p>
                      </div>
                      {locationScope === "bahamas" ? (
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Island</p>
                          <p className="mt-1 text-sm font-semibold text-[#111827]">{selectedIsland || "Select your island"}</p>
                        </div>
                      ) : null}
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Address</p>
                        <p className="mt-1 text-sm font-semibold text-[#111827]">{leadLocationValue || "Start typing your address"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleSubmit(handleLeadCaptureSubmit)} className="space-y-5 rounded-[26px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6" noValidate>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                      {isBusinessAudience ? "Primary Contact" : "Personal Details"}
                    </p>
                    <div className="mt-3 space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="fullName" className="text-sm font-medium text-[#111827]">
                          {isBusinessAudience ? "Primary Contact Name" : "Name"}
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="fullName"
                            type="text"
                            placeholder={isBusinessAudience ? "Enter primary contact name" : "Enter your full name"}
                            className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-11 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                            {...register("fullName", {
                              required: isBusinessAudience ? "Primary contact name is required." : "Name is required.",
                              minLength: { value: 2, message: "Please enter at least 2 characters." },
                            })}
                          />
                        </div>
                        {errors.fullName ? <p className="text-xs text-rose-600">{errors.fullName.message}</p> : null}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="workEmail" className="text-sm font-medium text-[#111827]">
                          {isBusinessAudience ? "Primary Contact Email" : "Email"}
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="workEmail"
                            type="email"
                            placeholder={isBusinessAudience ? "contact@company.com" : "name@email.com"}
                            className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-11 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                            {...register("workEmail", {
                              required: isBusinessAudience ? "Primary contact email is required." : "Email is required.",
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Please enter a valid email address.",
                              },
                            })}
                          />
                        </div>
                        {errors.workEmail ? <p className="text-xs text-rose-600">{errors.workEmail.message}</p> : null}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <label htmlFor="phoneNumber" className="text-sm font-medium text-[#111827]">
                            {isBusinessAudience ? "Primary Contact Phone" : "Phone"}
                          </label>
                          <span className="text-xs font-medium text-[#7B89A2]">Optional</span>
                        </div>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="phoneNumber"
                            type="tel"
                            placeholder="+1 (242) 555-0123"
                            className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-11 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                            {...register("phoneNumber", {
                              validate: (value) => !value || value.trim().length >= 7 || "Please enter a valid phone number.",
                            })}
                          />
                        </div>
                        {errors.phoneNumber ? <p className="text-xs text-rose-600">{errors.phoneNumber.message}</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Location</p>
                    <div className="mt-3 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setValue("locationScope", "bahamas", { shouldDirty: true, shouldValidate: true })}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-left transition",
                            locationScope === "bahamas"
                              ? "border-[#356AF6] bg-[#EEF3FF] shadow-[0_10px_24px_rgba(53,106,246,0.10)]"
                              : "border-[#D9E3F3] bg-white hover:border-[#BFD0F8] hover:bg-[#F8FBFF]",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className={cn("h-4 w-4", locationScope === "bahamas" ? "text-[#356AF6]" : "text-[#7B89A2]")} />
                            <div>
                              <p className="text-sm font-semibold text-[#111827]">Located in The Bahamas</p>
                              <p className="mt-1 text-xs text-[#7B89A2]">Use island selection for more precise matching.</p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setValue("locationScope", "outside-bahamas", { shouldDirty: true, shouldValidate: true })}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-left transition",
                            locationScope === "outside-bahamas"
                              ? "border-[#356AF6] bg-[#EEF3FF] shadow-[0_10px_24px_rgba(53,106,246,0.10)]"
                              : "border-[#D9E3F3] bg-white hover:border-[#BFD0F8] hover:bg-[#F8FBFF]",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Globe2 className={cn("h-4 w-4", locationScope === "outside-bahamas" ? "text-[#356AF6]" : "text-[#7B89A2]")} />
                            <div>
                              <p className="text-sm font-semibold text-[#111827]">Outside The Bahamas</p>
                              <p className="mt-1 text-xs text-[#7B89A2]">We will prioritize remote-friendly experts.</p>
                            </div>
                          </div>
                        </button>
                      </div>
                      {errors.locationScope ? <p className="text-xs text-rose-600">{errors.locationScope.message}</p> : null}
                      <input type="hidden" {...register("locationScope", { required: "Please select whether you are in The Bahamas or outside." })} />

                      {locationScope === "bahamas" ? (
                        <div className="space-y-1.5">
                          <label htmlFor="island" className="text-sm font-medium text-[#111827]">Island</label>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                              id="island"
                              className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                              {...register("island", {
                                validate: (value) => locationScope !== "bahamas" || Boolean(value) || "Please select your island.",
                              })}
                            >
                              <option value="">Select island</option>
                              {BAHAMAS_ISLAND_OPTIONS.map((island) => <option key={island} value={island}>{island}</option>)}
                            </select>
                          </div>
                          {errors.island ? <p className="text-xs text-rose-600">{errors.island.message}</p> : null}
                        </div>
                      ) : null}

                      <div className="space-y-1.5">
                        <label htmlFor="location" className="text-sm font-medium text-[#111827]">Address</label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          <input
                            id="location"
                            type="text"
                            placeholder={locationScope === "outside-bahamas" ? "City, state, or country" : "Street, area, or landmark"}
                            autoComplete="off"
                            className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-11 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                            {...register("location", {
                              required: "Address is required.",
                              minLength: { value: 3, message: "Please enter at least 3 characters." },
                            })}
                            onFocus={handleLocationFocus}
                            onBlur={handleLocationBlur}
                          />
                          {isLocationSuggestionsOpen && filteredLocationSuggestions.length > 0 ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#D9E3F3] bg-white shadow-[0_18px_40px_rgba(56,75,107,0.12)]">
                              {filteredLocationSuggestions.map((suggestion) => (
                                <button
                                  key={`${suggestion.label}-${suggestion.detail}`}
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    handleLocationSuggestionSelect(suggestion);
                                  }}
                                  className="flex w-full items-start justify-between gap-3 border-b border-[#EEF3FF] px-4 py-3 text-left last:border-b-0 hover:bg-[#F8FBFF]"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-[#111827]">{suggestion.label}</p>
                                    <p className="mt-1 text-xs text-[#7B89A2]">{suggestion.detail}</p>
                                  </div>
                                  <span className="rounded-full bg-[#EEF3FF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                                    Suggestion
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <p className="text-xs text-[#7B89A2]">Start typing and pick the closest address suggestion, just like a lightweight Google-style search.</p>
                        {errors.location ? <p className="text-xs text-rose-600">{errors.location.message}</p> : null}
                      </div>
                    </div>
                  </div>

                  {isBusinessAudience ? (
                    <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Business Details</p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="companyName" className="text-sm font-medium text-[#111827]">Company Name</label>
                          <div className="relative">
                            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="companyName"
                              type="text"
                              className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-11 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                              {...register("companyName", { required: "Company name is required." })}
                            />
                          </div>
                          {errors.companyName ? <p className="text-xs text-rose-600">{errors.companyName.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="role" className="text-sm font-medium text-[#111827]">Primary Role</label>
                          <div className="relative">
                            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                              id="role"
                              className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                              {...register("role", { required: "Primary role is required." })}
                            >
                              <option value="">Select primary role</option>
                              {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                            </select>
                          </div>
                          {errors.role ? <p className="text-xs text-rose-600">{errors.role.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="businessType" className="text-sm font-medium text-[#111827]">Business Type</label>
                          <div className="relative">
                            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                              id="businessType"
                              className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                              {...register("businessType", { required: "Business type is required." })}
                            >
                              <option value="">Select business type</option>
                              {BUSINESS_TYPE_OPTIONS.map((businessType) => <option key={businessType} value={businessType}>{businessType}</option>)}
                            </select>
                          </div>
                          {errors.businessType ? <p className="text-xs text-rose-600">{errors.businessType.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="teamSize" className="text-sm font-medium text-[#111827]">Team Size</label>
                          <div className="relative">
                            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                              id="teamSize"
                              className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                              {...register("teamSize", { required: "Please select your team size." })}
                            >
                              <option value="">Select team size</option>
                              <option value="1-10">1-10 employees</option>
                              <option value="11-50">11-50 employees</option>
                              <option value="51-200">51-200 employees</option>
                              <option value="201-500">201-500 employees</option>
                              <option value="500+">500+ employees</option>
                            </select>
                          </div>
                          {errors.teamSize ? <p className="text-xs text-rose-600">{errors.teamSize.message}</p> : null}
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label htmlFor="priorConsultingExperience" className="text-sm font-medium text-[#111827]">Prior Provider Experience</label>
                          <div className="relative">
                            <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                              id="priorConsultingExperience"
                              className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                              {...register("priorConsultingExperience", { required: "Please select your prior provider experience." })}
                            >
                              <option value="">Select experience level</option>
                              {PRIOR_EXPERIENCE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                          </div>
                          {errors.priorConsultingExperience ? <p className="text-xs text-rose-600">{errors.priorConsultingExperience.message}</p> : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <Button type="submit" size="lg" className="h-12 w-full bg-[#356AF6] text-white hover:bg-[#2C59D8]">View My Results</Button>
                </form>
              </div>
            </div>
            </div>
          </motion.div>
        ) : null}

        {flowStep === "loading" ? (
          <motion.div key="loading-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2C52]/20 backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl border border-[#D9E3F3] bg-white/95 px-6 py-10 text-center shadow-[0_24px_50px_rgba(56,75,107,0.18)]">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#356AF6]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#111827]">Loading Results</h2>
              <p className="mt-2 text-sm text-[#6B7280]">Building your personalized snapshot and matched expert shortlist.</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
