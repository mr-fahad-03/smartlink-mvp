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

import { InnerNav } from "@/components/navigation/inner-nav";
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
  biz_need_start_setup: "Operations",
  biz_need_grow_scale: "Growth",
  biz_need_fix_problem: "Operations",
  biz_need_manage_operations_systems: "Systems",
  biz_need_legal_compliance: "Legal Help",
  biz_need_accounting_taxes_finances: "Financial Advice",
  biz_need_technology_it_issues: "Systems",
  biz_need_marketing_getting_customers: "Growth",
  personal_need_career_job: "Career Help",
  personal_need_money_budget_debt: "Financial Advice",
  personal_need_legal_personal_matters: "Legal Help",
  personal_need_technology_it_help: "Personal Tech Support",
  personal_need_business_side_hustle: "Growth",
  personal_need_education_learning: "Career Help",
  personal_need_guidance_life_decisions: "General Support",
  personal_need_not_sure: "General Support",
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

const BUSINESS_DIAGNOSTIC_PROMPT_IDS = [
  "business_primary_need",
  "business_situation",
  "business_goal",
] as const;

const PERSONAL_DIAGNOSTIC_PROMPT_IDS = [
  "personal_primary_need",
  "personal_situation",
  "personal_goal",
] as const;

const BUSINESS_PRIMARY_HELP_OPTIONS: QuizOption[] = [
  { id: "biz_need_start_setup", label: "Starting or setting up a business", text: "Starting or setting up a business", support: "You need structure, requirements, and the right launch path.", riskPoints: 5 },
  { id: "biz_need_grow_scale", label: "Growing or scaling my business", text: "Growing or scaling my business", support: "You want stronger momentum and sustainable growth.", riskPoints: 4 },
  { id: "biz_need_fix_problem", label: "Fixing a problem in my business", text: "Fixing a problem in my business", support: "You need practical support to resolve a blocker quickly.", riskPoints: 6 },
  { id: "biz_need_manage_operations_systems", label: "Managing operations or systems", text: "Managing operations or systems", support: "You need cleaner workflows, systems, and execution.", riskPoints: 5 },
  { id: "biz_need_legal_compliance", label: "Legal or compliance support", text: "Legal or compliance support", support: "You need clear legal direction and compliance confidence.", riskPoints: 6 },
  { id: "biz_need_accounting_taxes_finances", label: "Accounting, taxes, or finances", text: "Accounting, taxes, or finances", support: "You need clarity on financial decisions and obligations.", riskPoints: 5 },
  { id: "biz_need_technology_it_issues", label: "Technology or IT issues", text: "Technology or IT issues", support: "You need reliable technical support for systems and tools.", riskPoints: 5 },
  { id: "biz_need_marketing_getting_customers", label: "Marketing or getting customers", text: "Marketing or getting customers", support: "You need better visibility, leads, and customer traction.", riskPoints: 4 },
];

const BUSINESS_SITUATION_OPTIONS: QuizOption[] = [
  { id: "situation_start", label: "I don't know where to start", text: "I don't know where to start", support: "You need a clear first move.", riskPoints: 4 },
  { id: "situation_not_working", label: "Something isn't working", text: "Something isn't working", support: "A blocker is slowing progress.", riskPoints: 6 },
  { id: "situation_need_advice", label: "I need expert advice before making a decision", text: "I need expert advice before making a decision", support: "You need confidence before committing.", riskPoints: 4 },
  { id: "situation_failed", label: "I tried before but it didn't work", text: "I tried before but it didn't work", support: "An earlier approach did not solve it.", riskPoints: 7 },
  { id: "situation_urgent", label: "I need help urgently", text: "I need help urgently", support: "Time pressure is high.", riskPoints: 8 },
];

const BUSINESS_GOAL_OPTIONS: QuizOption[] = [
  { id: "goal_get_unstuck", label: "Get unstuck and move forward", text: "Get unstuck and move forward", support: "You want clear momentum again.", riskPoints: 4 },
  { id: "goal_save_time", label: "Save time and avoid mistakes", text: "Save time and avoid mistakes", support: "You want a safer and faster path.", riskPoints: 3 },
  { id: "goal_right_decision", label: "Make the right decision", text: "Make the right decision", support: "You want confidence in the next move.", riskPoints: 3 },
  { id: "goal_fix_urgent_issue", label: "Fix an urgent issue", text: "Fix an urgent issue", support: "You need immediate problem resolution.", riskPoints: 8 },
  { id: "goal_grow_revenue", label: "Grow faster / increase revenue", text: "Grow faster / increase revenue", support: "You want stronger growth outcomes.", riskPoints: 4 },
];

const PERSONAL_PRIMARY_HELP_OPTIONS: QuizOption[] = [
  { id: "personal_need_career_job", label: "Career or job decisions", text: "Career or job decisions", support: "You need guidance on your next career move.", riskPoints: 4 },
  { id: "personal_need_money_budget_debt", label: "Money, budgeting, or debt", text: "Money, budgeting, or debt", support: "You need practical financial clarity and support.", riskPoints: 5 },
  { id: "personal_need_legal_personal_matters", label: "Legal or personal matters", text: "Legal or personal matters", support: "You need clear legal or personal direction.", riskPoints: 5 },
  { id: "personal_need_technology_it_help", label: "Technology or IT help", text: "Technology or IT help", support: "You need help solving a personal tech issue.", riskPoints: 4 },
  { id: "personal_need_business_side_hustle", label: "Starting a business or side hustle", text: "Starting a business or side hustle", support: "You need support to launch confidently.", riskPoints: 4 },
  { id: "personal_need_education_learning", label: "Education or learning", text: "Education or learning", support: "You need help choosing or planning your learning path.", riskPoints: 3 },
  { id: "personal_need_guidance_life_decisions", label: "Personal guidance or life decisions", text: "Personal guidance or life decisions", support: "You need trusted support for a personal decision.", riskPoints: 4 },
  { id: "personal_need_not_sure", label: "Something else / not sure", text: "Something else / not sure", support: "You need clarity before choosing the right support path.", riskPoints: 4 },
];

const PERSONAL_SITUATION_OPTIONS: QuizOption[] = [
  { id: "personal_situation_start", label: "I don't know where to start", text: "I don't know where to start", support: "You need a simple first step.", riskPoints: 4 },
  { id: "personal_situation_stuck", label: "I'm feeling stuck", text: "I'm feeling stuck", support: "You need help breaking through a blocker.", riskPoints: 5 },
  { id: "personal_situation_need_advice", label: "I need advice before making a decision", text: "I need advice before making a decision", support: "You want confidence before moving forward.", riskPoints: 4 },
  { id: "personal_situation_failed", label: "I tried before but it didn't work", text: "I tried before but it didn't work", support: "A previous attempt did not solve the issue.", riskPoints: 6 },
  { id: "personal_situation_urgent", label: "I need help urgently", text: "I need help urgently", support: "You need immediate support.", riskPoints: 8 },
];

const PERSONAL_GOAL_OPTIONS: QuizOption[] = [
  { id: "personal_goal_clarity_direction", label: "Get clarity and direction", text: "Get clarity and direction", support: "You want a clearer path forward.", riskPoints: 3 },
  { id: "personal_goal_solve_problem", label: "Solve a specific problem", text: "Solve a specific problem", support: "You want a direct fix to a clear issue.", riskPoints: 5 },
  { id: "personal_goal_right_decision", label: "Make the right decision", text: "Make the right decision", support: "You want confidence in your next choice.", riskPoints: 3 },
  { id: "personal_goal_save_time", label: "Save time and avoid mistakes", text: "Save time and avoid mistakes", support: "You want a smarter and faster approach.", riskPoints: 3 },
  { id: "personal_goal_improve_situation", label: "Improve my situation", text: "Improve my situation", support: "You want practical progress in your current situation.", riskPoints: 4 },
];

const SITUATION_OPTIONS: QuizOption[] = [
  { id: "situation_stuck", label: "My application is stuck", text: "My application is stuck", support: "You started, but progress has slowed or stalled.", riskPoints: 6 },
  { id: "situation_start", label: "I don't know where to start", text: "I don't know where to start", support: "You need a clearer path before taking the next step.", riskPoints: 4 },
  { id: "situation_urgent", label: "I need help urgently", text: "I need help urgently", support: "Time matters and you need support quickly.", riskPoints: 8 },
  { id: "situation_failed", label: "I tried before but it didn't work", text: "I tried before but it didn't work", support: "You need a stronger plan after an earlier failed attempt.", riskPoints: 7 },
  { id: "situation_not_working", label: "Something isn't working but I'm not sure why", text: "Something isn't working but I'm not sure why", support: "You need clarity before things get worse.", riskPoints: 5 },
  { id: "situation_need_advice", label: "I need expert advice before making a decision", text: "I need expert advice before making a decision", support: "You want confidence before the next move.", riskPoints: 4 },
  { id: "situation_business_help", label: "I need help starting or fixing a business", text: "I need help starting or fixing a business", support: "You need practical guidance to get a business moving or back on track.", riskPoints: 6 },
  { id: "situation_trust", label: "I don't know who to trust", text: "I don't know who to trust", support: "You need a trustworthy direction before committing your time or money.", riskPoints: 5 },
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

function getBusinessDiagnosticPrompts(selectedCategory: QuizCategory): QuizPrompt[] {
  return [
    {
      id: BUSINESS_DIAGNOSTIC_PROMPT_IDS[0],
      text: "What do you need help with right now?",
      helper: "Pick the closest category so we can route you to the right expert type.",
      category: selectedCategory,
      options: BUSINESS_PRIMARY_HELP_OPTIONS,
    },
    {
      id: BUSINESS_DIAGNOSTIC_PROMPT_IDS[1],
      text: "What best describes your situation?",
      helper: "This gives us context and urgency for smarter matching.",
      category: selectedCategory,
      options: BUSINESS_SITUATION_OPTIONS,
    },
    {
      id: BUSINESS_DIAGNOSTIC_PROMPT_IDS[2],
      text: "What are you trying to achieve?",
      helper: "Your goal helps us prioritize the best expert fit.",
      category: selectedCategory,
      options: BUSINESS_GOAL_OPTIONS,
    },
  ];
}

function getPersonalDiagnosticPrompts(selectedCategory: QuizCategory): QuizPrompt[] {
  return [
    {
      id: PERSONAL_DIAGNOSTIC_PROMPT_IDS[0],
      text: "What do you need help with today?",
      helper: "Pick the option that feels closest to what you are dealing with.",
      category: selectedCategory,
      options: PERSONAL_PRIMARY_HELP_OPTIONS,
    },
    {
      id: PERSONAL_DIAGNOSTIC_PROMPT_IDS[1],
      text: "What best describes your situation?",
      helper: "This helps us understand your context and urgency.",
      category: selectedCategory,
      options: PERSONAL_SITUATION_OPTIONS,
    },
    {
      id: PERSONAL_DIAGNOSTIC_PROMPT_IDS[2],
      text: "What are you trying to achieve?",
      helper: "Your goal helps us match you to the right support faster.",
      category: selectedCategory,
      options: PERSONAL_GOAL_OPTIONS,
    },
  ];
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

function buildQuizPrompts(selectedRoutingId?: string, audience?: AudienceSegment): QuizPrompt[] {
  const selectedCategory = HELP_CATEGORY_MAP[selectedRoutingId ?? ""] ?? "General Support";
  if (audience === "business-owner") {
    return getBusinessDiagnosticPrompts(selectedCategory);
  }
  if (audience === "personal-help") {
    return getPersonalDiagnosticPrompts(selectedCategory);
  }
  const basePrompts = getBasePrompts(selectedCategory, audience);
  if (selectedRoutingId !== "need_cybersecurity") return basePrompts;
  return [basePrompts[0], basePrompts[1], ...CYBER_CHECK_PROMPTS, basePrompts[2], basePrompts[3], basePrompts[4]];
}

function deriveInitialAnswers(initialSituation: string | undefined, audience: AudienceSegment) {
  if (!initialSituation) {
    return {} as Record<string, string>;
  }

  if (audience === "business-owner") {
    if (BUSINESS_SITUATION_OPTIONS.some((option) => option.id === initialSituation)) {
      return { business_situation: initialSituation };
    }
    if (initialSituation === "situation_business_help") {
      return { business_primary_need: "biz_need_fix_problem" };
    }
    if (initialSituation === "situation_trust") {
      return { business_situation: "situation_need_advice" };
    }
    return {} as Record<string, string>;
  }

  if (audience === "personal-help") {
    if (initialSituation === "situation_start") {
      return { personal_situation: "personal_situation_start" };
    }
    if (initialSituation === "situation_not_working") {
      return { personal_situation: "personal_situation_stuck" };
    }
    if (initialSituation === "situation_need_advice" || initialSituation === "situation_trust") {
      return { personal_situation: "personal_situation_need_advice" };
    }
    if (initialSituation === "situation_failed") {
      return { personal_situation: "personal_situation_failed" };
    }
    if (initialSituation === "situation_urgent") {
      return { personal_situation: "personal_situation_urgent" };
    }
    return {} as Record<string, string>;
  }

  if (SITUATION_OPTIONS.some((option) => option.id === initialSituation)) {
    return { situation_now: initialSituation };
  }
  return {} as Record<string, string>;
}

function getFirstUnansweredIndex(prompts: QuizPrompt[], answers: Record<string, string>) {
  const firstUnansweredIndex = prompts.findIndex((prompt) => !answers[prompt.id]);
  return firstUnansweredIndex === -1 ? prompts.length : firstUnansweredIndex;
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

function calculateAssessment(
  prompts: QuizPrompt[],
  answers: Record<string, string>,
  selectedCategory: QuizCategory,
  audience: AudienceSegment,
) {
  const includedPromptIds =
    audience === "business-owner"
      ? [...BUSINESS_DIAGNOSTIC_PROMPT_IDS]
      : audience === "personal-help"
        ? [...PERSONAL_DIAGNOSTIC_PROMPT_IDS]
      : selectedCategory === "Cybersecurity"
        ? prompts.map((prompt) => prompt.id)
        : ["situation_now", "problem_need", "urgency", "budget"];
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

  const selectedAudience = AUDIENCE_SEGMENTS.some((segment) => segment.id === initialAudience)
    ? (initialAudience as AudienceSegment)
    : undefined;
  const currentAudience = selectedAudience ?? "business-owner";
  const initialAnswers = deriveInitialAnswers(initialSituation, currentAudience);
  const initialRoutingId = currentAudience === "business-owner"
    ? initialAnswers.business_primary_need
    : currentAudience === "personal-help"
      ? initialAnswers.personal_primary_need
      : initialAnswers.problem_need;
  const initialPrompts = buildQuizPrompts(initialRoutingId, currentAudience);

  const [answers, setAnswers] = useState<Record<string, string>>(() => initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(() => getFirstUnansweredIndex(initialPrompts, initialAnswers));
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

  const selectedRoutingId = currentAudience === "business-owner"
    ? answers.business_primary_need
    : currentAudience === "personal-help"
      ? answers.personal_primary_need
      : answers.problem_need;
  const selectedAudienceLabel = AUDIENCE_SEGMENTS.find((segment) => segment.id === currentAudience)?.label;
  const selectedCategory = HELP_CATEGORY_MAP[selectedRoutingId ?? ""] ?? "General Support";
  const prompts = useMemo(() => buildQuizPrompts(selectedRoutingId, currentAudience), [selectedRoutingId, currentAudience]);
  const totalQuestions = prompts.length;
  const answeredCount = prompts.filter((prompt) => Boolean(answers[prompt.id])).length;
  const currentPrompt = prompts[currentIndex];
  const assessment = useMemo(
    () => calculateAssessment(prompts, answers, selectedCategory, currentAudience),
    [answers, prompts, selectedCategory, currentAudience],
  );
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
  const filteredLocationSuggestions = useMemo(
    () => getLocationSuggestions(leadLocationValue, locationScope).slice(0, 5),
    [leadLocationValue, locationScope],
  );
  const assessmentMode = deriveAssessmentMode(selectedCategory);
  const isBusinessAudience = currentAudience === "business-owner";
  const isPersonalAudience = currentAudience === "personal-help";
  const isDiagnosticAudience = isBusinessAudience || isPersonalAudience;
  const modeLabel =
    assessmentMode === "cybersecurity-risk"
      ? "Cybersecurity Risk Mode"
      : currentAudience === "personal-help"
        ? "Personal Support Mode"
        : currentAudience === "not-sure"
          ? "Guided Support Mode"
          : "Business Services Mode";
  const stepLabel = flowStep === "quiz" || flowStep === "cyberIntro"
    ? `Step ${Math.min(currentIndex + 1, totalQuestions)} of ${totalQuestions}`
    : flowStep === "lead"
      ? "Step 2 of 3"
      : "Step 3 of 3";
  const selectedBusinessCategory = getSelectedOption(BUSINESS_PRIMARY_HELP_OPTIONS, answers.business_primary_need);
  const selectedBusinessSituation = getSelectedOption(BUSINESS_SITUATION_OPTIONS, answers.business_situation);
  const selectedBusinessGoal = getSelectedOption(BUSINESS_GOAL_OPTIONS, answers.business_goal);
  const selectedPersonalCategory = getSelectedOption(PERSONAL_PRIMARY_HELP_OPTIONS, answers.personal_primary_need);
  const selectedPersonalSituation = getSelectedOption(PERSONAL_SITUATION_OPTIONS, answers.personal_situation);
  const selectedPersonalGoal = getSelectedOption(PERSONAL_GOAL_OPTIONS, answers.personal_goal);
  const selectedLegacySituation = getSelectedOption(SITUATION_OPTIONS, answers.situation_now);
  const selectedLegacyHelp = getSelectedOption(ALL_HELP_OPTIONS, answers.problem_need);
  const selectedLocation = getSelectedOption(LOCATION_OPTIONS, answers.location);
  const selectedUrgency = getSelectedOption(URGENCY_OPTIONS, answers.urgency);
  const selectedBudget = getSelectedOption(BUDGET_OPTIONS, answers.budget);
  const selectedDiagnosticCategory = isBusinessAudience ? selectedBusinessCategory : selectedPersonalCategory;
  const selectedDiagnosticSituation = isBusinessAudience ? selectedBusinessSituation : selectedPersonalSituation;
  const selectedDiagnosticGoal = isBusinessAudience ? selectedBusinessGoal : selectedPersonalGoal;

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
    const nextAnswers = { ...answers, [prompt.id]: option.id };
    setAnswers(nextAnswers);
    setIsTransitioning(true);
    if (nextQuestionTimeout.current) clearTimeout(nextQuestionTimeout.current);
    nextQuestionTimeout.current = setTimeout(() => {
      const shouldOpenCyberIntro = currentAudience !== "business-owner" && prompt.id === "problem_need" && option.id === "need_cybersecurity";
      if (shouldOpenCyberIntro) {
        setFlowStep("cyberIntro");
      } else {
        const nextPromptIndex = prompts.findIndex(
          (candidate, index) => index > currentIndex && !nextAnswers[candidate.id],
        );
        setCurrentIndex(nextPromptIndex === -1 ? prompts.length : nextPromptIndex);
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
    const budgetPreference = selectedBudget?.text;
    const selectedDiagnosticSituation = isBusinessAudience ? selectedBusinessSituation : selectedPersonalSituation;
    const selectedDiagnosticCategory = isBusinessAudience ? selectedBusinessCategory : selectedPersonalCategory;
    const selectedDiagnosticGoal = isBusinessAudience ? selectedBusinessGoal : selectedPersonalGoal;
    const urgencyPreference = isDiagnosticAudience
      ? selectedDiagnosticSituation?.id === "situation_urgent" || selectedDiagnosticSituation?.id === "personal_situation_urgent"
        ? "24-48 hours"
        : undefined
      : selectedUrgency?.text;
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
    const diagnosticProfile = {
      categoryOptionId: isDiagnosticAudience ? selectedDiagnosticCategory?.id : selectedLegacyHelp?.id,
      categoryOptionText: isDiagnosticAudience ? selectedDiagnosticCategory?.text : selectedLegacyHelp?.text,
      situationOptionId: isDiagnosticAudience ? selectedDiagnosticSituation?.id : selectedLegacySituation?.id,
      situationOptionText: isDiagnosticAudience ? selectedDiagnosticSituation?.text : selectedLegacySituation?.text,
      goalOptionId: isDiagnosticAudience ? selectedDiagnosticGoal?.id : undefined,
      goalOptionText: isDiagnosticAudience ? selectedDiagnosticGoal?.text : undefined,
    };

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
        audienceSegment: currentAudience,
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
      diagnosticProfile,
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
          <InnerNav breadcrumb={modeLabel} stepLabel={stepLabel} />

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
                  <p className="mt-3 text-base leading-7 text-[#5D6B85]">We&apos;ll check a few basics: account protection, backups, virus defences, and recovery readiness. Takes about 30 seconds.</p>
                  <Button type="button" onClick={continueCyberIntro} size="lg" className="mt-6 h-12 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]">Continue</Button>
                </motion.div>
              ) : currentPrompt ? (
                <motion.div key={currentPrompt.id} initial={{ opacity: 0, x: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reducedMotion ? 0 : -16 }} transition={{ duration: 0.2 }} className="mt-8">
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">{currentPrompt.text}</h2>
                    {currentPrompt.helper ? <p className="mt-3 text-base leading-7 text-[#5D6B85]">{currentPrompt.helper}</p> : null}
                  </div>
                  <div className="mt-6 space-y-3">
                    {currentPrompt.options.map((option) => {
                      const isSelected = answers[currentPrompt.id] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleOptionSelect(currentPrompt, option)}
                          className={cn(
                            "group w-full rounded-2xl border bg-[#FCFDFF] px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356AF6] focus-visible:ring-offset-2",
                            isSelected
                              ? "border-[#356AF6] bg-[#EEF3FF]"
                              : "border-[#D9E3F3] hover:border-[#BFD0F8] hover:bg-white hover:shadow-[0_8px_20px_rgba(56,75,107,0.07)]",
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-[#111827]">{option.label}</p>
                              {option.text && option.text !== option.label ? <p className="mt-1 text-sm text-[#5D6B85]">{option.text}</p> : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline hint */}
                  <p className="mt-5 text-sm text-[#8A99B4]">
                    Not sure? Choose the closest option — we’ll refine later.
                  </p>
                </motion.div>
              ) : null}
            </div>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Current Snapshot</p>
                <div className="mt-4 grid gap-3">
                  {selectedAudienceLabel ? <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Audience</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedAudienceLabel}</p></div> : null}
                  {isDiagnosticAudience ? (
                    <>
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Category</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedDiagnosticCategory?.text || "Not selected yet"}</p></div>
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Situation</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedDiagnosticSituation?.text || "Not selected yet"}</p></div>
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Goal</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedDiagnosticGoal?.text || "Not selected yet"}</p></div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Situation</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedLegacySituation?.text || "Not selected yet"}</p></div>
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Help Needed</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedLegacyHelp?.text || "Not selected yet"}</p></div>
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Location</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedLocation?.text || "Not selected yet"}</p></div>
                      <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Urgency</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedUrgency?.text || "Not selected yet"}</p></div>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Matching Notes</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-sm font-medium text-[#111827]">Takes 60 seconds · No commitment · Instant results.</p></div>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-sm font-medium text-[#111827]">Not sure about an answer? Choose the closest option — the system is designed to guide you even if you’re unsure.</p></div>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-sm font-medium text-[#111827]">{isDiagnosticAudience ? "Category, situation, and goal help us match you with the right expert faster." : "Budget, urgency, and location help us rank the right experts faster."}</p></div>
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
                  <div className="mt-4 divide-y divide-[#EEF3FF]">
                    {[
                      selectedAudienceLabel ? { label: "Audience", value: selectedAudienceLabel } : null,
                      isDiagnosticAudience
                        ? { label: "Category", value: selectedDiagnosticCategory?.label || "—" }
                        : { label: "Help needed", value: selectedLegacyHelp?.label || "—" },
                      isDiagnosticAudience
                        ? { label: "Situation", value: selectedDiagnosticSituation?.label || "—" }
                        : { label: "Urgency", value: selectedUrgency?.label || "—" },
                      isDiagnosticAudience
                        ? { label: "Goal", value: selectedDiagnosticGoal?.label || "—" }
                        : { label: "Budget", value: selectedBudget?.label || "—" },
                      { label: "Priority", value: selectedCategory },
                    ].filter((item): item is { label: string; value: string } => Boolean(item)).map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2.5">
                        <span className="text-xs text-[#7B89A2]">{item.label}</span>
                        <span className="text-xs font-semibold text-[#111827] text-right max-w-[60%]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-[#1E40AF]">We only use your information to connect you with relevant experts. No spam, no sales calls.</p>
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
