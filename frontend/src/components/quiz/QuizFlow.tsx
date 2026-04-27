"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Building2,
  Globe2,
  Loader2,
  LocateFixed,
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

const FINAL_QUESTIONS_HELPER = "Just a few quick details so we can match you with the right expert.";

const BAHAMAS_ISLAND_ALIASES: Array<{ token: string; island: string }> = [
  { token: "new providence", island: "New Providence" },
  { token: "nassau", island: "New Providence" },
  { token: "grand bahama", island: "Grand Bahama" },
  { token: "freeport", island: "Grand Bahama" },
  { token: "abaco", island: "Abaco" },
  { token: "exuma", island: "Exuma" },
  { token: "eleuthera", island: "Eleuthera" },
  { token: "andros", island: "Andros" },
  { token: "long island", island: "Long Island" },
  { token: "bimini", island: "Bimini" },
  { token: "cat island", island: "Cat Island" },
  { token: "harbour island", island: "Harbour Island" },
  { token: "berry islands", island: "Berry Islands" },
  { token: "san salvador", island: "San Salvador" },
  { token: "acklins", island: "Acklins" },
  { token: "crooked island", island: "Crooked Island" },
  { token: "mayaguana", island: "Mayaguana" },
  { token: "ragged island", island: "Ragged Island" },
  { token: "family islands", island: "Other Family Island" },
];

interface ReverseGeocodeAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  island?: string;
  country?: string;
  country_code?: string;
}

interface ReverseGeocodeResponse {
  display_name?: string;
  address?: ReverseGeocodeAddress;
}

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

type BusinessNeedRoute =
  | "biz_need_start_setup"
  | "biz_need_grow_scale"
  | "biz_need_fix_problem"
  | "biz_need_manage_operations_systems"
  | "biz_need_legal_compliance"
  | "biz_need_accounting_taxes_finances"
  | "biz_need_technology_it_issues"
  | "biz_need_marketing_getting_customers";

interface BusinessFollowUpPromptTemplate {
  id: string;
  text: string;
  helper: string;
  options: QuizOption[];
}

const BUSINESS_PRIMARY_PROMPT_ID = "business_primary_need";
const PERSONAL_PRIMARY_PROMPT_ID = "personal_primary_need";

type PersonalNeedRoute =
  | "personal_need_career_job"
  | "personal_need_money_budget_debt"
  | "personal_need_legal_personal_matters"
  | "personal_need_technology_it_help"
  | "personal_need_business_side_hustle"
  | "personal_need_education_learning"
  | "personal_need_guidance_life_decisions"
  | "personal_need_not_sure";

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













const BUSINESS_FOLLOW_UP_PROMPTS: Record<BusinessNeedRoute, [BusinessFollowUpPromptTemplate, BusinessFollowUpPromptTemplate, BusinessFollowUpPromptTemplate]> = {
  biz_need_start_setup: [
    {
      id: "biz_setup_stage",
      text: "What stage are you at?",
      helper: "This helps us match you to setup experts based on where you are now.",
      options: [
        { id: "biz_setup_stage_idea", label: "Just an idea", text: "Just an idea", support: "You are early and need foundational clarity.", riskPoints: 5 },
        { id: "biz_setup_stage_planning", label: "Planning and researching", text: "Planning and researching", support: "You are preparing and validating the path.", riskPoints: 4 },
        { id: "biz_setup_stage_ready_register", label: "Ready to register", text: "Ready to register", support: "You are close to execution and need precise setup support.", riskPoints: 6 },
        { id: "biz_setup_stage_started_unsure", label: "Already started but unsure what to do next", text: "Already started but unsure what to do next", support: "You need clarity to avoid early mistakes.", riskPoints: 6 },
      ],
    },
    
    
    {
      id: "biz_setup_need",
      text: "What do you need help with most?",
      helper: "Choose the area where expert support would create the biggest immediate impact.",
      options: [
        { id: "biz_setup_need_registration", label: "Business registration / legal setup", text: "Business registration / legal setup", support: "You need compliant legal setup from day one.", riskPoints: 6 },
        { id: "biz_setup_need_plan", label: "Business plan", text: "Business plan", support: "You need strategy and structure before execution.", riskPoints: 4 },
        { id: "biz_setup_need_funding", label: "Funding or budgeting", text: "Funding or budgeting", support: "You need financial clarity to launch safely.", riskPoints: 5 },
        { id: "biz_setup_need_structure", label: "Choosing the right structure", text: "Choosing the right structure", support: "You need fit-for-purpose setup decisions early.", riskPoints: 4 },
        { id: "biz_setup_need_not_sure", label: "Not sure", text: "Not sure", support: "You need guided support to define priorities.", riskPoints: 4 },
      ],
    },
    {
      id: "biz_setup_concern",
      text: "What’s your biggest concern?",
      helper: "This helps us prioritize what to solve first.",
      options: [
        { id: "biz_setup_concern_doing_wrong", label: "Doing it wrong", text: "Doing it wrong", support: "You want confidence and fewer costly mistakes.", riskPoints: 6 },
        { id: "biz_setup_concern_costs", label: "Costs", text: "Costs", support: "Budget pressure is an active concern.", riskPoints: 4 },
        { id: "biz_setup_concern_start", label: "Not knowing where to start", text: "Not knowing where to start", support: "You need a clear first step.", riskPoints: 5 },
        { id: "biz_setup_concern_compliance", label: "Compliance issues", text: "Compliance issues", support: "Regulatory confidence is a priority.", riskPoints: 6 },
      ],
    },
  ],
  biz_need_grow_scale: [
    {
      id: "biz_growth_improve",
      text: "What are you trying to improve?",
      helper: "We use this to route you to growth-focused experts.",
      options: [
        { id: "biz_growth_improve_sales", label: "Increase sales", text: "Increase sales", support: "Revenue growth is your top objective.", riskPoints: 6 },
        { id: "biz_growth_improve_markets", label: "Expand to new markets", text: "Expand to new markets", support: "You want expansion support and planning.", riskPoints: 5 },
        { id: "biz_growth_improve_experience", label: "Improve customer experience", text: "Improve customer experience", support: "Retention and satisfaction are key priorities.", riskPoints: 4 },
        { id: "biz_growth_improve_brand", label: "Build a stronger brand", text: "Build a stronger brand", support: "You want stronger positioning and trust.", riskPoints: 4 },
      ],
    },
    {
      id: "biz_growth_blocker",
      text: "What’s holding you back?",
      helper: "This identifies the most important growth constraint to solve first.",
      options: [
        { id: "biz_growth_blocker_customers", label: "Not enough customers", text: "Not enough customers", support: "Demand and customer acquisition are constrained.", riskPoints: 6 },
        { id: "biz_growth_blocker_marketing", label: "Weak marketing", text: "Weak marketing", support: "Marketing performance needs improvement.", riskPoints: 5 },
        { id: "biz_growth_blocker_strategy", label: "No clear strategy", text: "No clear strategy", support: "You need a focused plan before scaling.", riskPoints: 5 },
        { id: "biz_growth_blocker_resources", label: "Limited time/resources", text: "Limited time/resources", support: "Execution capacity is tight.", riskPoints: 4 },
      ],
    },
    {
      id: "biz_growth_success",
      text: "What would success look like?",
      helper: "We’ll use this to align the recommended support path.",
      options: [
        { id: "biz_growth_success_revenue", label: "More revenue", text: "More revenue", support: "Financial growth is the key target.", riskPoints: 6 },
        { id: "biz_growth_success_customers", label: "More customers", text: "More customers", support: "Customer growth is the main KPI.", riskPoints: 5 },
        { id: "biz_growth_success_systems", label: "Better systems", text: "Better systems", support: "You want scalable operations as you grow.", riskPoints: 3 },
        { id: "biz_growth_success_less_stress", label: "Less stress", text: "Less stress", support: "You want a smoother growth pace with less operational burden.", riskPoints: 3 },
      ],
    },
  ],
  biz_need_fix_problem: [
    {
      id: "biz_problem_type",
      text: "What kind of problem are you facing?",
      helper: "This is a high-value category, so we prioritize clarity and urgency.",
      options: [
        { id: "biz_problem_type_losing_money", label: "Losing money", text: "Losing money", support: "Revenue or margin impact needs urgent attention.", riskPoints: 8 },
        { id: "biz_problem_type_operations", label: "Operational issues", text: "Operational issues", support: "Execution problems are slowing business performance.", riskPoints: 6 },
        { id: "biz_problem_type_team", label: "Staff/team problems", text: "Staff/team problems", support: "People and delivery challenges are affecting outcomes.", riskPoints: 5 },
        { id: "biz_problem_type_complaints", label: "Customer complaints", text: "Customer complaints", support: "Customer trust and retention are at risk.", riskPoints: 6 },
        { id: "biz_problem_type_technical", label: "Technical/system issues", text: "Technical/system issues", support: "System reliability is affecting operations.", riskPoints: 6 },
      ],
    },
    {
      id: "biz_problem_severity",
      text: "How serious is the issue?",
      helper: "Severity helps us prioritize response speed and matching quality.",
      options: [
        { id: "biz_problem_severity_urgent", label: "Urgent (affecting business now)", text: "Urgent (affecting business now)", support: "Immediate impact is active.", riskPoints: 8 },
        { id: "biz_problem_severity_moderate", label: "Moderate (needs fixing soon)", text: "Moderate (needs fixing soon)", support: "The issue is important but not yet critical.", riskPoints: 5 },
        { id: "biz_problem_severity_minor", label: "Minor (just exploring)", text: "Minor (just exploring)", support: "You are validating options before acting.", riskPoints: 2 },
      ],
    },
    {
      id: "biz_problem_attempt",
      text: "What have you tried so far?",
      helper: "This helps us avoid repeating approaches that already failed.",
      options: [
        { id: "biz_problem_attempt_self", label: "Tried fixing it myself", text: "Tried fixing it myself", support: "You need a stronger external perspective.", riskPoints: 4 },
        { id: "biz_problem_attempt_advice", label: "Asked for advice", text: "Asked for advice", support: "You have partial direction but need execution.", riskPoints: 3 },
        { id: "biz_problem_attempt_hired_before", label: "Hired someone before", text: "Hired someone before", support: "Past support didn’t fully solve the issue.", riskPoints: 5 },
        { id: "biz_problem_attempt_none", label: "Haven’t done anything yet", text: "Haven’t done anything yet", support: "You need a practical first move.", riskPoints: 4 },
      ],
    },
  ],
  biz_need_manage_operations_systems: [
    {
      id: "biz_ops_area",
      text: "What area needs improvement?",
      helper: "We use this to match operations and systems-focused experts.",
      options: [
        { id: "biz_ops_area_workflow", label: "Workflow/processes", text: "Workflow/processes", support: "Core process efficiency needs improvement.", riskPoints: 5 },
        { id: "biz_ops_area_productivity", label: "Staff productivity", text: "Staff productivity", support: "Team output and coordination can improve.", riskPoints: 4 },
        { id: "biz_ops_area_customer_management", label: "Customer management", text: "Customer management", support: "Customer operations need stronger structure.", riskPoints: 4 },
        { id: "biz_ops_area_inventory_tracking", label: "Inventory or tracking", text: "Inventory or tracking", support: "Tracking and control systems need refinement.", riskPoints: 5 },
      ],
    },
    {
      id: "biz_ops_issue",
      text: "What’s the main issue?",
      helper: "This identifies the bottleneck that should be fixed first.",
      options: [
        { id: "biz_ops_issue_manual_tasks", label: "Too many manual tasks", text: "Too many manual tasks", support: "Automation and systemization are needed.", riskPoints: 6 },
        { id: "biz_ops_issue_visibility", label: "Lack of visibility", text: "Lack of visibility", support: "You need better reporting and tracking.", riskPoints: 5 },
        { id: "biz_ops_issue_disorganization", label: "Disorganization", text: "Disorganization", support: "Process clarity and ownership are missing.", riskPoints: 5 },
        { id: "biz_ops_issue_inefficiency", label: "Inefficiency", text: "Inefficiency", support: "Current systems are slowing execution.", riskPoints: 5 },
      ],
    },
    {
      id: "biz_ops_outcome",
      text: "What do you want?",
      helper: "This helps determine the right delivery model for support.",
      options: [
        { id: "biz_ops_outcome_automation", label: "Automation", text: "Automation", support: "You want to reduce manual effort.", riskPoints: 5 },
        { id: "biz_ops_outcome_tools", label: "Better systems/tools", text: "Better systems/tools", support: "You need improved operational tooling.", riskPoints: 4 },
        { id: "biz_ops_outcome_guidance", label: "Expert guidance", text: "Expert guidance", support: "You want strategic implementation support.", riskPoints: 4 },
        { id: "biz_ops_outcome_full_setup_for_me", label: "Full setup done for me", text: "Full setup done for me", support: "You prefer end-to-end execution by experts.", riskPoints: 6 },
      ],
    },
  ],
  biz_need_legal_compliance: [
    {
      id: "biz_legal_need",
      text: "What do you need help with?",
      helper: "Legal clarity helps us route to the right specialist quickly.",
      options: [
        { id: "biz_legal_need_contracts", label: "Contracts", text: "Contracts", support: "You need strong agreements and risk control.", riskPoints: 5 },
        { id: "biz_legal_need_regulatory", label: "Regulatory compliance", text: "Regulatory compliance", support: "Compliance confidence is the main need.", riskPoints: 6 },
        { id: "biz_legal_need_licensing", label: "Business licensing", text: "Business licensing", support: "Licensing and registration support is needed.", riskPoints: 5 },
        { id: "biz_legal_need_disputes", label: "Disputes", text: "Disputes", support: "You need timely guidance on a conflict.", riskPoints: 7 },
      ],
    },
    {
      id: "biz_legal_status",
      text: "What’s your situation?",
      helper: "This clarifies whether support should be preventive or reactive.",
      options: [
        { id: "biz_legal_status_preventive", label: "Preventive (want to stay compliant)", text: "Preventive (want to stay compliant)", support: "You want to avoid legal issues before they occur.", riskPoints: 3 },
        { id: "biz_legal_status_issue", label: "Already facing an issue", text: "Already facing an issue", support: "A current legal matter needs resolution.", riskPoints: 7 },
        { id: "biz_legal_status_documents", label: "Need documents prepared", text: "Need documents prepared", support: "You need legally sound documentation.", riskPoints: 4 },
        { id: "biz_legal_status_not_sure", label: "Not sure", text: "Not sure", support: "You need guided legal triage before action.", riskPoints: 4 },
      ],
    },
    {
      id: "biz_legal_urgency",
      text: "Urgency?",
      helper: "Urgency helps determine response speed and lead priority.",
      options: [
        { id: "biz_legal_urgency_immediate", label: "Immediate", text: "Immediate", support: "Time-critical legal support is needed.", riskPoints: 8 },
        { id: "biz_legal_urgency_soon", label: "Soon", text: "Soon", support: "Support is needed in the near term.", riskPoints: 5 },
        { id: "biz_legal_urgency_exploring", label: "Just exploring", text: "Just exploring", support: "You’re gathering direction before acting.", riskPoints: 2 },
      ],
    },
  ],
  biz_need_accounting_taxes_finances: [
    {
      id: "biz_fin_need",
      text: "What do you need help with?",
      helper: "Financial needs help us match you to the right advisory profile.",
      options: [
        { id: "biz_fin_need_bookkeeping", label: "Bookkeeping", text: "Bookkeeping", support: "You need cleaner and reliable records.", riskPoints: 4 },
        { id: "biz_fin_need_taxes", label: "Taxes", text: "Taxes", support: "Tax compliance and planning are key.", riskPoints: 6 },
        { id: "biz_fin_need_planning", label: "Financial planning", text: "Financial planning", support: "You need stronger financial decision support.", riskPoints: 4 },
        { id: "biz_fin_need_cash_flow", label: "Cash flow issues", text: "Cash flow issues", support: "Cash pressure needs immediate stabilization.", riskPoints: 7 },
      ],
    },
    {
      id: "biz_fin_problem",
      text: "What’s the main problem?",
      helper: "This helps us prioritize your most critical finance risk.",
      options: [
        { id: "biz_fin_problem_disorganized", label: "Disorganized finances", text: "Disorganized finances", support: "Financial records and controls need structure.", riskPoints: 5 },
        { id: "biz_fin_problem_profit", label: "Not making enough profit", text: "Not making enough profit", support: "Profitability needs focused diagnosis.", riskPoints: 6 },
        { id: "biz_fin_problem_taxes", label: "Don’t understand taxes", text: "Don’t understand taxes", support: "You need tax clarity and compliance support.", riskPoints: 6 },
        { id: "biz_fin_problem_behind", label: "Falling behind", text: "Falling behind", support: "Backlogs and deadlines are creating risk.", riskPoints: 7 },
      ],
    },
    {
      id: "biz_fin_outcome",
      text: "What do you want?",
      helper: "This determines whether we prioritize advisory or execution-first experts.",
      options: [
        { id: "biz_fin_outcome_handle_for_me", label: "Someone to handle it", text: "Someone to handle it", support: "You prefer done-without-friction execution.", riskPoints: 6 },
        { id: "biz_fin_outcome_guidance", label: "Advice and guidance", text: "Advice and guidance", support: "You want strategic support and decisions.", riskPoints: 4 },
        { id: "biz_fin_outcome_setup_systems", label: "Setup systems", text: "Setup systems", support: "You want repeatable financial processes.", riskPoints: 4 },
        { id: "biz_fin_outcome_cleanup_fix", label: "Cleanup and fix", text: "Cleanup and fix", support: "You need corrective stabilization first.", riskPoints: 5 },
      ],
    },
  ],
  biz_need_technology_it_issues: [
    {
      id: "biz_it_type",
      text: "What type of issue?",
      helper: "Tech issue type helps us route to the right specialist set.",
      options: [
        { id: "biz_it_type_website", label: "Website problems", text: "Website problems", support: "Online presence is affected.", riskPoints: 5 },
        { id: "biz_it_type_system", label: "System/software issues", text: "System/software issues", support: "Internal systems need troubleshooting.", riskPoints: 6 },
        { id: "biz_it_type_cyber", label: "Cybersecurity concerns", text: "Cybersecurity concerns", support: "Security risk needs urgent visibility.", riskPoints: 7 },
        { id: "biz_it_type_general", label: "General IT support", text: "General IT support", support: "You need reliable day-to-day IT help.", riskPoints: 4 },
      ],
    },
    {
      id: "biz_it_impact",
      text: "How is it affecting you?",
      helper: "Impact level helps determine urgency and support depth.",
      options: [
        { id: "biz_it_impact_customers", label: "Losing customers", text: "Losing customers", support: "Revenue risk is active.", riskPoints: 7 },
        { id: "biz_it_impact_operations", label: "Slowing operations", text: "Slowing operations", support: "Productivity and delivery are impacted.", riskPoints: 6 },
        { id: "biz_it_impact_security", label: "Security risk", text: "Security risk", support: "Potential exposure needs immediate attention.", riskPoints: 8 },
        { id: "biz_it_impact_minor", label: "Minor inconvenience", text: "Minor inconvenience", support: "Issue exists but impact is limited.", riskPoints: 2 },
      ],
    },
    {
      id: "biz_it_need",
      text: "What do you need?",
      helper: "We’ll match based on whether you need urgent fix, continuity, or planning.",
      options: [
        { id: "biz_it_need_immediate_fix", label: "Immediate fix", text: "Immediate fix", support: "You need rapid intervention.", riskPoints: 8 },
        { id: "biz_it_need_ongoing", label: "Ongoing support", text: "Ongoing support", support: "You need stable continuous support.", riskPoints: 5 },
        { id: "biz_it_need_upgrade", label: "System upgrade", text: "System upgrade", support: "You want modernization and scalability.", riskPoints: 4 },
        { id: "biz_it_need_advice", label: "Advice", text: "Advice", support: "You need direction before implementation.", riskPoints: 3 },
      ],
    },
  ],
  biz_need_marketing_getting_customers: [
    {
      id: "biz_marketing_need",
      text: "What do you need help with?",
      helper: "Marketing focus helps us route to the right growth specialist.",
      options: [
        { id: "biz_marketing_need_social", label: "Social media", text: "Social media", support: "You need stronger social execution.", riskPoints: 4 },
        { id: "biz_marketing_need_ads", label: "Advertising", text: "Advertising", support: "Paid acquisition performance needs improvement.", riskPoints: 5 },
        { id: "biz_marketing_need_branding", label: "Branding", text: "Branding", support: "You need stronger market positioning.", riskPoints: 4 },
        { id: "biz_marketing_need_leads", label: "Lead generation", text: "Lead generation", support: "Pipeline growth is the top priority.", riskPoints: 6 },
      ],
    },
    {
      id: "biz_marketing_challenge",
      text: "What’s your biggest challenge?",
      helper: "Challenge mapping helps us prioritize immediate growth blockers.",
      options: [
        { id: "biz_marketing_challenge_leads", label: "Not enough leads", text: "Not enough leads", support: "Demand generation needs attention.", riskPoints: 7 },
        { id: "biz_marketing_challenge_conversion", label: "Poor conversions", text: "Poor conversions", support: "Offer, funnel, or messaging needs optimization.", riskPoints: 6 },
        { id: "biz_marketing_challenge_inconsistent", label: "Inconsistent marketing", text: "Inconsistent marketing", support: "Execution cadence is weak.", riskPoints: 5 },
        { id: "biz_marketing_challenge_strategy", label: "No strategy", text: "No strategy", support: "You need a clear acquisition plan.", riskPoints: 6 },
      ],
    },
    {
      id: "biz_marketing_outcome",
      text: "What do you want?",
      helper: "This clarifies whether you want advice, execution, or coaching.",
      options: [
        { id: "biz_marketing_outcome_customers", label: "More customers", text: "More customers", support: "Customer growth is the direct objective.", riskPoints: 6 },
        { id: "biz_marketing_outcome_plan", label: "Better marketing plan", text: "Better marketing plan", support: "You want strategic clarity first.", riskPoints: 4 },
        { id: "biz_marketing_outcome_done_for_you", label: "Done-for-you service", text: "Done-for-you service", support: "You prefer execution by the expert team.", riskPoints: 6 },
        { id: "biz_marketing_outcome_coaching", label: "Coaching", text: "Coaching", support: "You want guided support and capability building.", riskPoints: 3 },
      ],
    },
  ],
};

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

const PERSONAL_FOLLOW_UP_PROMPTS: Record<PersonalNeedRoute, [BusinessFollowUpPromptTemplate, BusinessFollowUpPromptTemplate, BusinessFollowUpPromptTemplate]> = {
  personal_need_career_job: [
    {
      id: "personal_career_situation",
      text: "What best describes your situation?",
      helper: "This helps us understand where you are in your career journey.",
      options: [
        { id: "personal_career_situation_new_job", label: "Looking for a new job", text: "Looking for a new job", support: "You are actively pursuing a role change.", riskPoints: 4 },
        { id: "personal_career_situation_switch", label: "Want to switch careers", text: "Want to switch careers", support: "You need clarity on a career transition.", riskPoints: 5 },
        { id: "personal_career_situation_unhappy", label: "Not happy in current role", text: "Not happy in current role", support: "Current role fit is low and needs action.", riskPoints: 5 },
        { id: "personal_career_situation_starting", label: "Just starting my career", text: "Just starting my career", support: "You need an early-stage strategy and guidance.", riskPoints: 3 },
      ],
    },
    {
      id: "personal_career_challenge",
      text: "What's your biggest challenge?",
      helper: "We'll focus your match around this blocker first.",
      options: [
        { id: "personal_career_challenge_interviews", label: "Not getting interviews", text: "Not getting interviews", support: "You need stronger positioning and applications.", riskPoints: 6 },
        { id: "personal_career_challenge_direction", label: "Not sure what direction to take", text: "Not sure what direction to take", support: "You need guided direction before applying broadly.", riskPoints: 5 },
        { id: "personal_career_challenge_resume", label: "Need to improve my resume", text: "Need to improve my resume", support: "Your profile needs clearer market fit.", riskPoints: 4 },
        { id: "personal_career_challenge_confidence", label: "Lack of confidence", text: "Lack of confidence", support: "You need structure and confidence-building support.", riskPoints: 4 },
      ],
    },
    {
      id: "personal_career_need",
      text: "What do you need help with?",
      helper: "Choose the support format that feels most useful now.",
      options: [
        { id: "personal_career_need_resume", label: "Resume / CV help", text: "Resume / CV help", support: "Focused support on profile quality.", riskPoints: 3 },
        { id: "personal_career_need_advice", label: "Career advice", text: "Career advice", support: "Guidance-first support for decision clarity.", riskPoints: 3 },
        { id: "personal_career_need_interview", label: "Interview preparation", text: "Interview preparation", support: "You need confidence and structure before interviews.", riskPoints: 4 },
        { id: "personal_career_need_strategy", label: "Job search strategy", text: "Job search strategy", support: "You need a practical roadmap and targeting plan.", riskPoints: 4 },
      ],
    },
  ],
  personal_need_money_budget_debt: [
    {
      id: "personal_money_dealing",
      text: "What are you dealing with?",
      helper: "This helps us identify the right finance support path.",
      options: [
        { id: "personal_money_dealing_manage", label: "Struggling to manage money", text: "Struggling to manage money", support: "Money management basics need attention.", riskPoints: 5 },
        { id: "personal_money_dealing_debt", label: "In debt", text: "In debt", support: "Debt pressure requires targeted guidance.", riskPoints: 7 },
        { id: "personal_money_dealing_save", label: "Want to save more", text: "Want to save more", support: "You need practical saving structure.", riskPoints: 3 },
        { id: "personal_money_dealing_invest", label: "Want to invest", text: "Want to invest", support: "You need confident next steps for growth decisions.", riskPoints: 3 },
      ],
    },
    {
      id: "personal_money_issue",
      text: "What's the biggest issue?",
      helper: "We'll prioritize this first in your action path.",
      options: [
        { id: "personal_money_issue_spending", label: "Spending too much", text: "Spending too much", support: "Spending controls and habits need structure.", riskPoints: 5 },
        { id: "personal_money_issue_income", label: "Not enough income", text: "Not enough income", support: "Income pressure is limiting your options.", riskPoints: 6 },
        { id: "personal_money_issue_budget", label: "No clear budget", text: "No clear budget", support: "A budgeting framework is missing.", riskPoints: 4 },
        { id: "personal_money_issue_overwhelmed", label: "Overwhelmed", text: "Overwhelmed", support: "You need simple decisions and guided support.", riskPoints: 5 },
      ],
    },
    {
      id: "personal_money_need",
      text: "What do you want?",
      helper: "Pick the format that matches how you want help delivered.",
      options: [
        { id: "personal_money_need_plan", label: "A simple plan", text: "A simple plan", support: "You want clear and practical next steps.", riskPoints: 3 },
        { id: "personal_money_need_guide", label: "Someone to guide me", text: "Someone to guide me", support: "You want guided accountability and support.", riskPoints: 4 },
        { id: "personal_money_need_tools", label: "Tools/templates", text: "Tools/templates", support: "You prefer lightweight self-serve support.", riskPoints: 2 },
        { id: "personal_money_need_fix", label: "Help fixing my situation", text: "Help fixing my situation", support: "You need corrective, hands-on support.", riskPoints: 6 },
      ],
    },
  ],
  personal_need_legal_personal_matters: [
    {
      id: "personal_legal_type",
      text: "What type of help do you need?",
      helper: "This lets us route to the right legal support lane.",
      options: [
        { id: "personal_legal_type_contracts", label: "Contracts or agreements", text: "Contracts or agreements", support: "You need clear legal documentation support.", riskPoints: 4 },
        { id: "personal_legal_type_dispute", label: "Dispute or issue with someone", text: "Dispute or issue with someone", support: "A conflict needs guidance and action.", riskPoints: 6 },
        { id: "personal_legal_type_advice", label: "Personal legal advice", text: "Personal legal advice", support: "You need legal clarity before deciding.", riskPoints: 5 },
        { id: "personal_legal_type_not_sure", label: "Not sure", text: "Not sure", support: "You need guided triage to identify the right legal next step.", riskPoints: 4 },
      ],
    },
    {
      id: "personal_legal_situation",
      text: "What's your situation?",
      helper: "Urgency and context improve response quality.",
      options: [
        { id: "personal_legal_situation_preventive", label: "Preventive (just checking)", text: "Preventive (just checking)", support: "You want to avoid future issues.", riskPoints: 3 },
        { id: "personal_legal_situation_issue", label: "Already have an issue", text: "Already have an issue", support: "A current matter needs active support.", riskPoints: 6 },
        { id: "personal_legal_situation_urgent", label: "Urgent situation", text: "Urgent situation", support: "You need immediate legal guidance.", riskPoints: 8 },
      ],
    },
    {
      id: "personal_legal_need",
      text: "What do you want?",
      helper: "Choose whether you need guidance, prep, or full handling.",
      options: [
        { id: "personal_legal_need_advice", label: "Advice", text: "Advice", support: "Guidance-first support.", riskPoints: 3 },
        { id: "personal_legal_need_docs", label: "Document preparation", text: "Document preparation", support: "You need legally sound document support.", riskPoints: 4 },
        { id: "personal_legal_need_handle", label: "Someone to handle it", text: "Someone to handle it", support: "You want full-service support.", riskPoints: 6 },
        { id: "personal_legal_need_direction", label: "Direction on next steps", text: "Direction on next steps", support: "You need clear legal direction before acting.", riskPoints: 4 },
      ],
    },
  ],
  personal_need_technology_it_help: [
    {
      id: "personal_tech_issue",
      text: "What's the issue?",
      helper: "Issue type helps us route quickly.",
      options: [
        { id: "personal_tech_issue_device", label: "Device not working", text: "Device not working", support: "Your device needs troubleshooting.", riskPoints: 5 },
        { id: "personal_tech_issue_internet", label: "Internet/network issues", text: "Internet/network issues", support: "Connectivity issues are interrupting your flow.", riskPoints: 5 },
        { id: "personal_tech_issue_software", label: "Software/app problems", text: "Software/app problems", support: "App reliability or setup needs support.", riskPoints: 4 },
        { id: "personal_tech_issue_security", label: "Security concerns", text: "Security concerns", support: "Potential risk needs immediate clarity.", riskPoints: 7 },
      ],
    },
    {
      id: "personal_tech_impact",
      text: "How is it affecting you?",
      helper: "Impact level helps prioritize urgency.",
      options: [
        { id: "personal_tech_impact_cant_work", label: "Can't work", text: "Can't work", support: "This is blocking key daily tasks.", riskPoints: 8 },
        { id: "personal_tech_impact_slowing", label: "Slowing me down", text: "Slowing me down", support: "Performance is affected and needs improvement.", riskPoints: 5 },
        { id: "personal_tech_impact_annoying", label: "Just annoying", text: "Just annoying", support: "Impact is low but still worth fixing.", riskPoints: 2 },
        { id: "personal_tech_impact_safety", label: "Concerned about safety", text: "Concerned about safety", support: "Security confidence is a priority.", riskPoints: 7 },
      ],
    },
    {
      id: "personal_tech_need",
      text: "What do you need?",
      helper: "Choose the support style that fits your situation.",
      options: [
        { id: "personal_tech_need_fix", label: "Fix the issue", text: "Fix the issue", support: "You need a direct resolution.", riskPoints: 6 },
        { id: "personal_tech_need_ongoing", label: "Ongoing support", text: "Ongoing support", support: "You want continuity and prevention.", riskPoints: 5 },
        { id: "personal_tech_need_advice", label: "Advice", text: "Advice", support: "You need guidance before action.", riskPoints: 3 },
        { id: "personal_tech_need_setup", label: "Setup help", text: "Setup help", support: "You need configuration and onboarding support.", riskPoints: 4 },
      ],
    },
  ],
  personal_need_business_side_hustle: [
    {
      id: "personal_hustle_stage",
      text: "Where are you right now?",
      helper: "Your stage helps us choose practical next steps.",
      options: [
        { id: "personal_hustle_stage_idea", label: "Just an idea", text: "Just an idea", support: "You are at idea stage and need structure.", riskPoints: 4 },
        { id: "personal_hustle_stage_planning", label: "Planning", text: "Planning", support: "You are validating and preparing.", riskPoints: 4 },
        { id: "personal_hustle_stage_ready", label: "Ready to start", text: "Ready to start", support: "You need launch-level support.", riskPoints: 6 },
        { id: "personal_hustle_stage_started", label: "Already started", text: "Already started", support: "You need optimization and direction.", riskPoints: 5 },
      ],
    },
    {
      id: "personal_hustle_challenge",
      text: "What's your biggest challenge?",
      helper: "We use this to focus your expert match.",
      options: [
        { id: "personal_hustle_challenge_start", label: "Don't know where to start", text: "Don't know where to start", support: "You need a clear first roadmap.", riskPoints: 5 },
        { id: "personal_hustle_challenge_fear", label: "Fear of failure", text: "Fear of failure", support: "You need confidence and structure.", riskPoints: 4 },
        { id: "personal_hustle_challenge_money", label: "Not enough money", text: "Not enough money", support: "Resource constraints are limiting progress.", riskPoints: 6 },
        { id: "personal_hustle_challenge_guidance", label: "Need guidance", text: "Need guidance", support: "You need an experienced guide.", riskPoints: 4 },
      ],
    },
    {
      id: "personal_hustle_need",
      text: "What do you want?",
      helper: "Choose the support format that best fits your pace.",
      options: [
        { id: "personal_hustle_need_step", label: "Step-by-step help", text: "Step-by-step help", support: "You want structured implementation support.", riskPoints: 4 },
        { id: "personal_hustle_need_advice", label: "Business advice", text: "Business advice", support: "You need strategic direction before executing.", riskPoints: 4 },
        { id: "personal_hustle_need_setup", label: "Setup support", text: "Setup support", support: "You need practical setup execution.", riskPoints: 5 },
        { id: "personal_hustle_need_guide", label: "Someone to guide me", text: "Someone to guide me", support: "You want guided accountability and support.", riskPoints: 4 },
      ],
    },
  ],
  personal_need_education_learning: [
    {
      id: "personal_learning_focus",
      text: "What are you focused on?",
      helper: "We'll match your support to your learning context.",
      options: [
        { id: "personal_learning_focus_school", label: "School/college", text: "School/college", support: "You need support tied to academics.", riskPoints: 3 },
        { id: "personal_learning_focus_skill", label: "Learning a new skill", text: "Learning a new skill", support: "You need a focused skill-growth path.", riskPoints: 3 },
        { id: "personal_learning_focus_professional", label: "Professional development", text: "Professional development", support: "You need growth aligned with your career goals.", riskPoints: 3 },
        { id: "personal_learning_focus_cert", label: "Certification", text: "Certification", support: "You need structure for exam and prep readiness.", riskPoints: 4 },
      ],
    },
    {
      id: "personal_learning_challenge",
      text: "What's the challenge?",
      helper: "This helps us prioritize the most practical support mode.",
      options: [
        { id: "personal_learning_challenge_consistent", label: "Hard to stay consistent", text: "Hard to stay consistent", support: "You need accountability and a routine.", riskPoints: 4 },
        { id: "personal_learning_challenge_material", label: "Don't understand material", text: "Don't understand material", support: "You need targeted explanation and coaching.", riskPoints: 5 },
        { id: "personal_learning_challenge_not_sure", label: "Not sure what to learn", text: "Not sure what to learn", support: "You need guidance before committing effort.", riskPoints: 4 },
        { id: "personal_learning_challenge_time", label: "Time management", text: "Time management", support: "You need a practical schedule and pacing.", riskPoints: 4 },
      ],
    },
    {
      id: "personal_learning_need",
      text: "What do you want?",
      helper: "Pick the format that best supports your learning style.",
      options: [
        { id: "personal_learning_need_plan", label: "Study plan", text: "Study plan", support: "You want clear milestones and pacing.", riskPoints: 3 },
        { id: "personal_learning_need_coaching", label: "Coaching/tutoring", text: "Coaching/tutoring", support: "You need direct instructional support.", riskPoints: 4 },
        { id: "personal_learning_need_guidance", label: "Guidance", text: "Guidance", support: "You want decision support and direction.", riskPoints: 3 },
        { id: "personal_learning_need_resources", label: "Resources", text: "Resources", support: "You prefer practical self-serve tools.", riskPoints: 2 },
      ],
    },
  ],
  personal_need_guidance_life_decisions: [
    {
      id: "personal_guidance_dealing",
      text: "What are you dealing with?",
      helper: "We'll use this to shape your support track.",
      options: [
        { id: "personal_guidance_dealing_stuck", label: "Feeling stuck", text: "Feeling stuck", support: "You need momentum and clarity.", riskPoints: 5 },
        { id: "personal_guidance_dealing_major_decision", label: "Major life decision", text: "Major life decision", support: "You need confident decision support.", riskPoints: 6 },
        { id: "personal_guidance_dealing_direction", label: "Lack of direction", text: "Lack of direction", support: "You need structure and priorities.", riskPoints: 5 },
        { id: "personal_guidance_dealing_growth", label: "Personal growth", text: "Personal growth", support: "You want intentional progress and reflection.", riskPoints: 3 },
      ],
    },
    {
      id: "personal_guidance_challenge",
      text: "What's the biggest challenge?",
      helper: "We'll prioritize this blocker first.",
      options: [
        { id: "personal_guidance_challenge_overthinking", label: "Overthinking", text: "Overthinking", support: "You need decision structure and focus.", riskPoints: 4 },
        { id: "personal_guidance_challenge_fear", label: "Fear of making the wrong choice", text: "Fear of making the wrong choice", support: "You need confidence and risk clarity.", riskPoints: 6 },
        { id: "personal_guidance_challenge_clarity", label: "No clarity", text: "No clarity", support: "You need practical direction quickly.", riskPoints: 5 },
        { id: "personal_guidance_challenge_motivation", label: "Low motivation", text: "Low motivation", support: "You need accountability and sustainable momentum.", riskPoints: 4 },
      ],
    },
    {
      id: "personal_guidance_need",
      text: "What do you want?",
      helper: "Choose what would help you move forward fastest.",
      options: [
        { id: "personal_guidance_need_clarity", label: "Clarity", text: "Clarity", support: "You want a clear understanding before acting.", riskPoints: 3 },
        { id: "personal_guidance_need_advice", label: "Advice", text: "Advice", support: "You want guided thinking and support.", riskPoints: 3 },
        { id: "personal_guidance_need_talk", label: "Someone to talk to", text: "Someone to talk to", support: "You want supportive human guidance.", riskPoints: 4 },
        { id: "personal_guidance_need_plan", label: "A plan forward", text: "A plan forward", support: "You want practical next steps and structure.", riskPoints: 4 },
      ],
    },
  ],
  personal_need_not_sure: [
    {
      id: "personal_unsure_closest",
      text: "What feels closest to your situation?",
      helper: "This safety-net step helps us route you without guesswork.",
      options: [
        { id: "personal_unsure_closest_work", label: "Work or career", text: "Work or career", support: "Career-related support seems closest.", riskPoints: 4 },
        { id: "personal_unsure_closest_money", label: "Money", text: "Money", support: "Financial support seems most relevant.", riskPoints: 5 },
        { id: "personal_unsure_closest_life", label: "Personal/life decisions", text: "Personal/life decisions", support: "Life guidance appears most relevant.", riskPoints: 5 },
        { id: "personal_unsure_closest_tech", label: "Tech issues", text: "Tech issues", support: "Technology support appears most relevant.", riskPoints: 4 },
        { id: "personal_unsure_closest_other", label: "Something else", text: "Something else", support: "You need broad support and triage.", riskPoints: 4 },
      ],
    },
    {
      id: "personal_unsure_feeling",
      text: "How are you feeling about it?",
      helper: "This helps us set urgency and support style.",
      options: [
        { id: "personal_unsure_feeling_stressed", label: "Stressed", text: "Stressed", support: "You need calmer, structured support.", riskPoints: 6 },
        { id: "personal_unsure_feeling_confused", label: "Confused", text: "Confused", support: "You need clarity before committing.", riskPoints: 5 },
        { id: "personal_unsure_feeling_exploring", label: "Just exploring", text: "Just exploring", support: "You are still evaluating options.", riskPoints: 2 },
        { id: "personal_unsure_feeling_urgent", label: "Need help urgently", text: "Need help urgently", support: "You need fast response support.", riskPoints: 8 },
      ],
    },
    {
      id: "personal_unsure_need",
      text: "What would help most right now?",
      helper: "We'll use this to choose the first support step.",
      options: [
        { id: "personal_unsure_need_direction", label: "Clear direction", text: "Clear direction", support: "You need a simple plan and priorities.", riskPoints: 4 },
        { id: "personal_unsure_need_guide", label: "Someone to guide me", text: "Someone to guide me", support: "You need guided support and accountability.", riskPoints: 4 },
        { id: "personal_unsure_need_answers", label: "Quick answers", text: "Quick answers", support: "You need fast clarity and triage.", riskPoints: 3 },
        { id: "personal_unsure_need_not_sure", label: "Not sure", text: "Not sure", support: "Guided AI-first routing is likely best.", riskPoints: 4 },
      ],
    },
  ],
};

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
  { id: "need_career_help", label: "Work or career support", text: "Work or career support", support: "For career direction, transitions, and job progress.", riskPoints: 4 },
  { id: "need_financial_advice", label: "Financial advice", text: "Financial advice", support: "For money, planning, or financial decisions.", riskPoints: 4 },
  { id: "need_legal_help", label: "Legal help", text: "Legal help", support: "For legal guidance and next steps.", riskPoints: 5 },
  { id: "need_personal_tech_support", label: "Technology help", text: "Technology help", support: "For devices, accounts, or personal IT issues.", riskPoints: 4 },
  { id: "need_operations", label: "Business support", text: "Business support", support: "For setup, operations, and practical business issues.", riskPoints: 4 },
  { id: "need_general_support", label: "I’m not sure, guide me", text: "I’m not sure, guide me", support: "We’ll start with guided support and route you smartly.", riskPoints: 4 },
];

const GUIDED_SITUATION_OPTIONS: QuizOption[] = [
  { id: "situation_start", label: "I don’t know where to start", text: "I don’t know where to start", support: "You need a clear first move.", riskPoints: 5 },
  { id: "situation_urgent", label: "I need help urgently", text: "I need help urgently", support: "Time pressure is high right now.", riskPoints: 8 },
  { id: "situation_not_working", label: "Something isn’t working but I don’t know why", text: "Something isn’t working but I don’t know why", support: "There’s friction but root cause is unclear.", riskPoints: 6 },
  { id: "situation_failed", label: "I tried before but it didn’t work", text: "I tried before but it didn’t work", support: "Previous attempt did not solve it.", riskPoints: 7 },
  { id: "situation_need_advice", label: "I need expert advice before making a decision", text: "I need expert advice before making a decision", support: "You need confidence before moving.", riskPoints: 5 },
  { id: "situation_start_or_fix", label: "I want to start or fix something (business or personal)", text: "I want to start or fix something (business or personal)", support: "You need direction with implementation support.", riskPoints: 5 },
  { id: "situation_trust", label: "I don’t know who to trust", text: "I don’t know who to trust", support: "You need trustworthy expert guidance.", riskPoints: 5 },
  { id: "situation_clear_direction", label: "I just want clear direction", text: "I just want clear direction", support: "You need simple, practical next steps.", riskPoints: 4 },
];

const GUIDED_URGENCY_OPTIONS: QuizOption[] = [
  { id: "urgency_now", label: "Right now (urgent)", text: "Right now (urgent)", support: "You need help as soon as possible.", riskPoints: 8 },
  { id: "urgency_48h", label: "24-48 hours", text: "24-48 hours", support: "You need someone who can move very quickly.", riskPoints: 7 },
  { id: "urgency_week", label: "Within a week", text: "Within a week", support: "You need support soon, but not instantly.", riskPoints: 5 },
  { id: "urgency_exploring", label: "Just exploring", text: "Just exploring", support: "You are gathering clarity first.", riskPoints: 2 },
];

const ALL_HELP_OPTIONS: QuizOption[] = [
  ...BUSINESS_HELP_OPTIONS,
  ...INDIVIDUAL_HELP_OPTIONS,
  { id: "need_general_support", label: "General support", text: "General support", support: "Guided support when you are not sure where to begin.", riskPoints: 4 },
];

const LOCATION_OPTIONS: QuizOption[] = [
  { id: "location_nassau", label: "Nassau", text: "Nassau, New Providence", support: "Local support in Nassau and surrounding areas.", riskPoints: 1 },
  { id: "location_grand_bahama", label: "Grand Bahama", text: "Freeport, Grand Bahama", support: "Matching focused on Grand Bahama availability.", riskPoints: 1 },
  { id: "location_family_islands", label: "Family Islands", text: "Family Islands, Bahamas", support: "Support across the outer islands and remote delivery.", riskPoints: 2 },
  { id: "location_outside", label: "Outside The Bahamas", text: "Outside The Bahamas", support: "Remote-first matching for international support needs.", riskPoints: 2 },
];

const URGENCY_OPTIONS: QuizOption[] = [
  { id: "urgency_now", label: "Right now (urgent)", text: "Right now (urgent)", support: "You need immediate support.", riskPoints: 8 },
  { id: "urgency_48h", label: "24-48 hours", text: "24-48 hours", support: "You need someone who can move quickly.", riskPoints: 8 },
  { id: "urgency_week", label: "Within a week", text: "Within a week", support: "You need help soon, but not immediately.", riskPoints: 5 },
  { id: "urgency_exploring", label: "Just exploring", text: "Just exploring", support: "You are gathering clarity before moving.", riskPoints: 2 },
];

const BUDGET_OPTIONS: QuizOption[] = [
  { id: "budget_free", label: "Free / just exploring", text: "Free / just exploring", support: "You are exploring options before committing spend.", riskPoints: 1 },
  { id: "budget_low", label: "Low ($0-$150)", text: "Low ($0-$150)", support: "You want cost-conscious options.", riskPoints: 1 },
  { id: "budget_medium", label: "Medium ($150-$500)", text: "Medium ($150-$500)", support: "You are open to a balanced service investment.", riskPoints: 1 },
  { id: "budget_high", label: "High ($500+)", text: "High ($500+)", support: "You are open to premium support.", riskPoints: 1 },
  { id: "budget_unsure", label: "Not sure", text: "Not sure", support: "You want clarity first, then pricing options.", riskPoints: 2 },
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

function getBusinessDiagnosticPrompts(selectedCategory: QuizCategory, selectedNeedId?: string): QuizPrompt[] {
  const isKnownNeed = BUSINESS_PRIMARY_HELP_OPTIONS.some((option) => option.id === selectedNeedId);
  const route = (isKnownNeed ? selectedNeedId : "biz_need_start_setup") as BusinessNeedRoute;
  const followUpPrompts = BUSINESS_FOLLOW_UP_PROMPTS[route].map((prompt) => ({
    ...prompt,
    category: selectedCategory,
  }));

  return [{
    id: BUSINESS_PRIMARY_PROMPT_ID,
    text: "What do you need help with right now?",
    helper: "Pick the closest category so we can route you to the right expert type.",
    category: selectedCategory,
    options: BUSINESS_PRIMARY_HELP_OPTIONS,
  }, ...followUpPrompts];
}

function getPersonalDiagnosticPrompts(selectedCategory: QuizCategory, selectedNeedId?: string): QuizPrompt[] {
  const isKnownNeed = PERSONAL_PRIMARY_HELP_OPTIONS.some((option) => option.id === selectedNeedId);
  const route = (isKnownNeed ? selectedNeedId : "personal_need_not_sure") as PersonalNeedRoute;
  const followUpPrompts = PERSONAL_FOLLOW_UP_PROMPTS[route].map((prompt) => ({
    ...prompt,
    category: selectedCategory,
  }));

  return [{
    id: PERSONAL_PRIMARY_PROMPT_ID,
    text: "What do you need help with right now?",
    helper: "Pick the option that feels closest to what you are dealing with.",
    category: selectedCategory,
    options: PERSONAL_PRIMARY_HELP_OPTIONS,
  }, ...followUpPrompts];
}

function getBasePrompts(selectedCategory: QuizCategory, audience?: AudienceSegment): QuizPrompt[] {
  if (audience === "not-sure") {
    return [
      {
        id: "situation_now",
        text: "Which of these feels closest to your situation?",
        helper: "Choose the statement that best matches where you are right now.",
        category: "General Support",
        options: GUIDED_SITUATION_OPTIONS,
      },
      {
        id: "problem_need",
        text: "What would help you the most right now?",
        helper: "We’ll use this to guide you to the right support type quickly.",
        category: selectedCategory,
        options: NOT_SURE_HELP_OPTIONS,
      },
      {
        id: "urgency",
        text: "How urgent is this for you?",
        helper: FINAL_QUESTIONS_HELPER,
        category: selectedCategory,
        options: GUIDED_URGENCY_OPTIONS,
      },
      { id: "budget", text: "What budget range are you comfortable with?", helper: "This keeps recommendations aligned with what works for you.", category: selectedCategory, options: BUDGET_OPTIONS },
      { id: "location", text: "Where are you located?", helper: "We use this to prioritize nearby or remote-friendly experts.", category: selectedCategory, options: LOCATION_OPTIONS },
    ];
  }

  const helpOptions = getHelpOptionsForAudience(audience);

  return [
    { id: "situation_now", text: "What situation are you in right now?", helper: "Pick the statement that feels closest to what you're dealing with.", category: "General Support", options: SITUATION_OPTIONS },
    { id: "problem_need", text: "What problem do you need solved?", helper: "This keeps the rest of the flow focused and simple.", category: selectedCategory, options: helpOptions },
    { id: "urgency", text: "How soon do you need help?", helper: FINAL_QUESTIONS_HELPER, category: selectedCategory, options: URGENCY_OPTIONS },
    { id: "budget", text: "What budget range are you comfortable with?", helper: "This keeps recommendations aligned with what works for you.", category: selectedCategory, options: BUDGET_OPTIONS },
    { id: "location", text: "Where are you located?", helper: "We use this to prioritize nearby or remote-friendly experts.", category: selectedCategory, options: LOCATION_OPTIONS },
  ];
}

function buildQuizPrompts(selectedRoutingId?: string, audience?: AudienceSegment): QuizPrompt[] {
  const selectedCategory = HELP_CATEGORY_MAP[selectedRoutingId ?? ""] ?? "General Support";
  if (audience === "business-owner") {
    return getBusinessDiagnosticPrompts(selectedCategory, selectedRoutingId);
  }
  if (audience === "personal-help") {
    return getPersonalDiagnosticPrompts(selectedCategory, selectedRoutingId);
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
    if (initialSituation === "situation_start") return { [BUSINESS_PRIMARY_PROMPT_ID]: "biz_need_start_setup" };
    if (initialSituation === "situation_business_help") return { [BUSINESS_PRIMARY_PROMPT_ID]: "biz_need_fix_problem" };
    if (initialSituation === "situation_not_working") return { [BUSINESS_PRIMARY_PROMPT_ID]: "biz_need_fix_problem" };
    if (initialSituation === "situation_failed") return { [BUSINESS_PRIMARY_PROMPT_ID]: "biz_need_fix_problem" };
    if (initialSituation === "situation_urgent") return { [BUSINESS_PRIMARY_PROMPT_ID]: "biz_need_fix_problem" };
    if (initialSituation === "situation_need_advice" || initialSituation === "situation_trust") {
      return { [BUSINESS_PRIMARY_PROMPT_ID]: "biz_need_legal_compliance" };
    }
    return {} as Record<string, string>;
  }

  if (audience === "personal-help") {
    if (initialSituation === "situation_start") return { [PERSONAL_PRIMARY_PROMPT_ID]: "personal_need_not_sure" };
    if (initialSituation === "situation_stuck") return { [PERSONAL_PRIMARY_PROMPT_ID]: "personal_need_guidance_life_decisions" };
    if (initialSituation === "situation_not_working") return { [PERSONAL_PRIMARY_PROMPT_ID]: "personal_need_guidance_life_decisions" };
    if (initialSituation === "situation_need_advice" || initialSituation === "situation_trust") {
      return { [PERSONAL_PRIMARY_PROMPT_ID]: "personal_need_guidance_life_decisions" };
    }
    if (initialSituation === "situation_failed") return { [PERSONAL_PRIMARY_PROMPT_ID]: "personal_need_not_sure" };
    if (initialSituation === "situation_urgent") return { [PERSONAL_PRIMARY_PROMPT_ID]: "personal_need_not_sure" };
    return {} as Record<string, string>;
  }

  if (initialSituation === "situation_stuck") return { situation_now: "situation_not_working" };
  if (GUIDED_SITUATION_OPTIONS.some((option) => option.id === initialSituation)) return { situation_now: initialSituation };
  if (SITUATION_OPTIONS.some((option) => option.id === initialSituation)) return { situation_now: initialSituation };
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

function isBahamasAddress(response?: ReverseGeocodeResponse) {
  const countryCode = response?.address?.country_code?.toLowerCase();
  const country = response?.address?.country?.toLowerCase();
  return countryCode === "bs" || country?.includes("bahamas") === true;
}

function deriveIslandFromAddress(address?: ReverseGeocodeAddress) {
  if (!address) return "";
  const searchableParts = [
    address.island,
    address.state,
    address.county,
    address.city,
    address.town,
    address.village,
    address.suburb,
    address.neighbourhood,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!searchableParts) return "";
  const matchedAlias = BAHAMAS_ISLAND_ALIASES.find((alias) => searchableParts.includes(alias.token));
  return matchedAlias?.island ?? "";
}

function buildAddressFromReverseLookup(response?: ReverseGeocodeResponse) {
  const address = response?.address;
  if (!address) return response?.display_name?.split(",").slice(0, 3).join(", ").trim() ?? "";

  const roadWithNumber = [address.house_number, address.road].filter(Boolean).join(" ").trim();
  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    address.state ||
    address.island;
  const parts = [roadWithNumber || address.road, address.suburb || address.neighbourhood, locality, address.country]
    .filter(Boolean)
    .map((part) => String(part).trim());
  const uniqueParts = Array.from(new Set(parts.filter(Boolean)));

  if (uniqueParts.length === 0) {
    return response?.display_name?.split(",").slice(0, 3).join(", ").trim() ?? "";
  }

  return uniqueParts.join(", ");
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
    urgencyPreference === "Right now (urgent)" ||
    urgencyPreference === "24-48 hours" ||
    budgetPreference === "High ($500+)"
  ) {
    return "premium";
  }

  return "standard";
}

function hasUrgentSignal(options: Array<QuizOption | undefined>) {
  return options.some((option) => {
    if (!option) return false;
    const signalText = `${option.id} ${option.label} ${option.text}`.toLowerCase();
    return signalText.includes("urgent") || signalText.includes("immediate") || signalText.includes("affecting business now");
  });
}

function hasPremiumServiceSignal(options: Array<QuizOption | undefined>) {
  return options.some((option) => {
    if (!option) return false;
    const signalText = `${option.id} ${option.label} ${option.text}`.toLowerCase();
    return signalText.includes("done-for-you") ||
      signalText.includes("done for you") ||
      signalText.includes("someone to handle it") ||
      signalText.includes("handle it") ||
      signalText.includes("full setup done for me");
  });
}

function hasGuidedExperienceSignal(options: Array<QuizOption | undefined>) {
  return options.some((option) => {
    if (!option) return false;
    const signalText = `${option.id} ${option.label} ${option.text}`.toLowerCase();
    return signalText.includes("not sure");
  });
}

function hasAdviceSignal(options: Array<QuizOption | undefined>) {
  return options.some((option) => {
    if (!option) return false;
    const signalText = `${option.id} ${option.label} ${option.text}`.toLowerCase();
    return signalText.includes("advice");
  });
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
    audience === "business-owner" || audience === "personal-help"
      ? prompts.map((prompt) => prompt.id)
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
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationBlurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedAudience = AUDIENCE_SEGMENTS.some((segment) => segment.id === initialAudience)
    ? (initialAudience as AudienceSegment)
    : undefined;
  const currentAudience = selectedAudience ?? "business-owner";
  const initialAnswers = deriveInitialAnswers(initialSituation, currentAudience);
  const initialRoutingId = currentAudience === "business-owner"
    ? initialAnswers[BUSINESS_PRIMARY_PROMPT_ID]
    : currentAudience === "personal-help"
      ? initialAnswers[PERSONAL_PRIMARY_PROMPT_ID]
      : initialAnswers.problem_need;
  const initialPrompts = buildQuizPrompts(initialRoutingId, currentAudience);

  const [answers, setAnswers] = useState<Record<string, string>>(() => initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(() => getFirstUnansweredIndex(initialPrompts, initialAnswers));
  const [flowStep, setFlowStep] = useState<FlowStep>("quiz");
  const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectionMessage, setLocationDetectionMessage] = useState("");

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
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (locationBlurTimeout.current) clearTimeout(locationBlurTimeout.current);
    };
  }, []);

  const selectedRoutingId = currentAudience === "business-owner"
    ? answers[BUSINESS_PRIMARY_PROMPT_ID]
    : currentAudience === "personal-help"
      ? answers[PERSONAL_PRIMARY_PROMPT_ID]
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
  const selectedBusinessCategory = getSelectedOption(BUSINESS_PRIMARY_HELP_OPTIONS, answers[BUSINESS_PRIMARY_PROMPT_ID]);
  const businessFollowUpOnePrompt = isBusinessAudience ? prompts[1] : undefined;
  const businessFollowUpTwoPrompt = isBusinessAudience ? prompts[2] : undefined;
  const businessFollowUpThreePrompt = isBusinessAudience ? prompts[3] : undefined;
  const selectedBusinessFollowUpOne = businessFollowUpOnePrompt
    ? getSelectedOption(businessFollowUpOnePrompt.options, answers[businessFollowUpOnePrompt.id])
    : undefined;
  const selectedBusinessFollowUpTwo = businessFollowUpTwoPrompt
    ? getSelectedOption(businessFollowUpTwoPrompt.options, answers[businessFollowUpTwoPrompt.id])
    : undefined;
  const selectedBusinessFollowUpThree = businessFollowUpThreePrompt
    ? getSelectedOption(businessFollowUpThreePrompt.options, answers[businessFollowUpThreePrompt.id])
    : undefined;
  const selectedPersonalCategory = getSelectedOption(PERSONAL_PRIMARY_HELP_OPTIONS, answers[PERSONAL_PRIMARY_PROMPT_ID]);
  const personalFollowUpOnePrompt = isPersonalAudience ? prompts[1] : undefined;
  const personalFollowUpTwoPrompt = isPersonalAudience ? prompts[2] : undefined;
  const personalFollowUpThreePrompt = isPersonalAudience ? prompts[3] : undefined;
  const selectedPersonalFollowUpOne = personalFollowUpOnePrompt
    ? getSelectedOption(personalFollowUpOnePrompt.options, answers[personalFollowUpOnePrompt.id])
    : undefined;
  const selectedPersonalFollowUpTwo = personalFollowUpTwoPrompt
    ? getSelectedOption(personalFollowUpTwoPrompt.options, answers[personalFollowUpTwoPrompt.id])
    : undefined;
  const selectedPersonalFollowUpThree = personalFollowUpThreePrompt
    ? getSelectedOption(personalFollowUpThreePrompt.options, answers[personalFollowUpThreePrompt.id])
    : undefined;
  const legacySituationPrompt = prompts.find((prompt) => prompt.id === "situation_now");
  const legacyHelpPrompt = prompts.find((prompt) => prompt.id === "problem_need");
  const legacyUrgencyPrompt = prompts.find((prompt) => prompt.id === "urgency");
  const selectedLegacySituation = legacySituationPrompt
    ? getSelectedOption(legacySituationPrompt.options, answers.situation_now)
    : getSelectedOption(SITUATION_OPTIONS, answers.situation_now);
  const selectedLegacyHelp = legacyHelpPrompt
    ? getSelectedOption(legacyHelpPrompt.options, answers.problem_need)
    : getSelectedOption(ALL_HELP_OPTIONS, answers.problem_need);
  const selectedLocation = getSelectedOption(LOCATION_OPTIONS, answers.location);
  const selectedUrgency = legacyUrgencyPrompt
    ? getSelectedOption(legacyUrgencyPrompt.options, answers.urgency)
    : getSelectedOption(URGENCY_OPTIONS, answers.urgency);
  const selectedBudget = getSelectedOption(BUDGET_OPTIONS, answers.budget);
  const selectedDiagnosticCategory = isBusinessAudience ? selectedBusinessCategory : selectedPersonalCategory;
  const selectedDiagnosticSituation = isBusinessAudience ? selectedBusinessFollowUpOne : selectedPersonalFollowUpOne;
  const selectedDiagnosticGoal = isBusinessAudience ? selectedBusinessFollowUpThree : selectedPersonalFollowUpThree;
  const isFirstQuestion = currentIndex <= 0;

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

  const handleDetectCurrentLocation = async () => {
    if (isDetectingLocation) return;
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationDetectionMessage("Location auto-detect is not supported on this device. Please enter your address manually.");
      return;
    }

    setIsDetectingLocation(true);
    setLocationDetectionMessage("Detecting your location...");

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 120000,
        });
      });

      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(position.coords.latitude),
        lon: String(position.coords.longitude),
        addressdetails: "1",
      });
      const reverseLookup = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { "Accept-Language": "en" },
      });

      if (!reverseLookup.ok) {
        throw new Error("REVERSE_LOOKUP_FAILED");
      }

      const reverseLookupPayload = (await reverseLookup.json()) as ReverseGeocodeResponse;
      const detectedAddress = buildAddressFromReverseLookup(reverseLookupPayload);
      if (!detectedAddress) {
        throw new Error("EMPTY_ADDRESS");
      }

      const inBahamas = isBahamasAddress(reverseLookupPayload);
      const detectedIsland = inBahamas ? deriveIslandFromAddress(reverseLookupPayload.address) : "";

      setValue("location", detectedAddress, { shouldDirty: true, shouldValidate: true });
      setValue("locationScope", inBahamas ? "bahamas" : "outside-bahamas", { shouldDirty: true, shouldValidate: true });
      setValue("island", inBahamas ? detectedIsland : "", { shouldDirty: true, shouldValidate: true });
      setIsLocationSuggestionsOpen(false);
      setLocationDetectionMessage("Location detected. You can adjust it if needed.");
    } catch (error) {
      const geolocationErrorCode =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: number }).code
          : undefined;

      if (geolocationErrorCode === 1) {
        setLocationDetectionMessage("Location access is blocked. Allow location access or enter your address manually.");
      } else if (geolocationErrorCode === 2) {
        setLocationDetectionMessage("Unable to detect your location right now. Please enter your address manually.");
      } else if (geolocationErrorCode === 3) {
        setLocationDetectionMessage("Location request timed out. Please try again or enter your address manually.");
      } else {
        setLocationDetectionMessage("Couldn’t auto-detect your address. You can enter it manually.");
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleOptionSelect = (prompt: QuizPrompt, option: QuizOption) => {
    if (flowStep !== "quiz") return;
    setAnswers((previous) => ({ ...previous, [prompt.id]: option.id }));

    const shouldOpenCyberIntro =
      currentAudience !== "business-owner" &&
      prompt.id === "problem_need" &&
      option.id === "need_cybersecurity";

    if (shouldOpenCyberIntro) {
      setFlowStep("cyberIntro");
      return;
    }

    const isLastQuestion = currentIndex >= prompts.length - 1;
    if (isLastQuestion) {
      setCurrentIndex(prompts.length);
      return;
    }

    setCurrentIndex((previous) => Math.min(previous + 1, prompts.length));
  };

  const handlePreviousQuestion = () => {
    if (flowStep !== "quiz") return;
    setCurrentIndex((previous) => Math.max(previous - 1, 0));
  };

  const goBackFromCyberIntro = () => {
    setFlowStep("quiz");
  };

  const continueCyberIntro = () => {
    setFlowStep("quiz");
    setCurrentIndex((previous) => Math.min(previous + 1, prompts.length));
  };

  const handleBackToQuiz = () => {
    setFlowStep("quiz");
    setCurrentIndex(Math.max(prompts.length - 1, 0));
  };

  const handleLeadCaptureSubmit = (values: LeadCaptureFormValues) => {
    const submittedAt = new Date().toISOString();
    const budgetPreference = selectedBudget?.text;
    const businessSelectedOptions = [
      selectedBusinessFollowUpOne,
      selectedBusinessFollowUpTwo,
      selectedBusinessFollowUpThree,
    ];
    const personalSelectedOptions = [
      selectedPersonalFollowUpOne,
      selectedPersonalFollowUpTwo,
      selectedPersonalFollowUpThree,
    ];
    const guidedSelectedOptions = [
      selectedLegacySituation,
      selectedLegacyHelp,
      selectedUrgency,
    ];
    const businessHasUrgentSignal = isBusinessAudience && hasUrgentSignal(businessSelectedOptions);
    const personalHasUrgentSignal = isPersonalAudience && hasUrgentSignal(personalSelectedOptions);
    const businessHasDoItForMeSignal = isBusinessAudience && hasPremiumServiceSignal(businessSelectedOptions);
    const personalHasDoItForMeSignal = isPersonalAudience && hasPremiumServiceSignal(personalSelectedOptions);
    const guidedHasDoItForMeSignal = currentAudience === "not-sure" && hasPremiumServiceSignal(guidedSelectedOptions);
    const businessNeedsGuidedExperience = isBusinessAudience && hasGuidedExperienceSignal(businessSelectedOptions);
    const personalNeedsGuidedExperience = isPersonalAudience && hasGuidedExperienceSignal(personalSelectedOptions);
    const guidedNeedsGuidedExperience = currentAudience === "not-sure" && hasGuidedExperienceSignal(guidedSelectedOptions);
    const personalAdviceSignal = isPersonalAudience && hasAdviceSignal(personalSelectedOptions);
    const guidedAdviceSignal = currentAudience === "not-sure" && hasAdviceSignal(guidedSelectedOptions);
    const urgencyPreference = isBusinessAudience
      ? businessHasUrgentSignal
        ? "Right now (urgent)"
        : undefined
      : isPersonalAudience
        ? personalHasUrgentSignal
          ? "Right now (urgent)"
          : undefined
        : selectedUrgency?.id === "urgency_now"
          ? "Right now (urgent)"
          : selectedUrgency?.id === "urgency_48h"
            ? "24-48 hours"
          : selectedUrgency?.id === "urgency_week"
            ? "Within a week"
            : currentAudience === "not-sure" && hasUrgentSignal(guidedSelectedOptions)
              ? "Right now (urgent)"
            : selectedUrgency?.text;
    const basePriorityActions = buildPriorityActions(selectedCategory, answers);
    const priorityActions = [
      ...(businessNeedsGuidedExperience || personalNeedsGuidedExperience || guidedNeedsGuidedExperience
        ? ["Guided AI first: user selected at least one \"Not sure\" response."]
        : []),
      ...(personalAdviceSignal || guidedAdviceSignal
        ? ["Advice-first support can start with a lower-cost, scalable service path."]
        : []),
      ...basePriorityActions,
    ].slice(0, 3);
    const derivedLeadTier = deriveLeadTier(
      assessment.normalizedScore,
      selectedCategory,
      urgencyPreference,
      budgetPreference,
    );
    const highValueProblemLead = isBusinessAudience &&
      selectedBusinessCategory?.id === "biz_need_fix_problem" &&
      businessHasUrgentSignal;
    const leadTier: LeadTier =
      highValueProblemLead || businessHasDoItForMeSignal || personalHasDoItForMeSignal || guidedHasDoItForMeSignal
        ? "premium"
        : derivedLeadTier;
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
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBackFromCyberIntro}
                      size="lg"
                      className="h-12 rounded-xl border-[#D9E3F3] px-6 text-[#111827] hover:bg-[#F7FAFF]"
                    >
                      Previous
                    </Button>
                    <Button type="button" onClick={continueCyberIntro} size="lg" className="h-12 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]">Continue</Button>
                  </div>
                </motion.div>
              ) : currentPrompt ? (
                <motion.div key={currentPrompt.id} initial={{ opacity: 0, x: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reducedMotion ? 0 : -16 }} transition={{ duration: 0.2 }} className="mt-8">
                  <div className="mb-5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={isFirstQuestion}
                      className="h-10 rounded-xl border-[#D9E3F3] px-4 text-[#111827] hover:bg-[#F7FAFF]"
                    >
                      Previous
                    </Button>
                  </div>
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
                    isBusinessAudience ? (
                      <>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Category</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedBusinessCategory?.text || "Not selected yet"}</p></div>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs text-[#7B89A2]">{businessFollowUpOnePrompt?.text || "Question 1"}</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedBusinessFollowUpOne?.text || "Not selected yet"}</p></div>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs text-[#7B89A2]">{businessFollowUpTwoPrompt?.text || "Question 2"}</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedBusinessFollowUpTwo?.text || "Not selected yet"}</p></div>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs text-[#7B89A2]">{businessFollowUpThreePrompt?.text || "Question 3"}</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedBusinessFollowUpThree?.text || "Not selected yet"}</p></div>
                      </>
                    ) : isPersonalAudience ? (
                      <>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Category</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedPersonalCategory?.text || "Not selected yet"}</p></div>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs text-[#7B89A2]">{personalFollowUpOnePrompt?.text || "Question 1"}</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedPersonalFollowUpOne?.text || "Not selected yet"}</p></div>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs text-[#7B89A2]">{personalFollowUpTwoPrompt?.text || "Question 2"}</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedPersonalFollowUpTwo?.text || "Not selected yet"}</p></div>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs text-[#7B89A2]">{personalFollowUpThreePrompt?.text || "Question 3"}</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedPersonalFollowUpThree?.text || "Not selected yet"}</p></div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Category</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedDiagnosticCategory?.text || "Not selected yet"}</p></div>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Situation</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedDiagnosticSituation?.text || "Not selected yet"}</p></div>
                        <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Goal</p><p className="mt-2 text-sm font-semibold text-[#111827]">{selectedDiagnosticGoal?.text || "Not selected yet"}</p></div>
                      </>
                    )
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
                  <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"><p className="text-sm font-medium text-[#111827]">{isBusinessAudience ? "Category plus your three business follow-up answers drive smarter expert matching." : isPersonalAudience ? "Category plus your three personal follow-up answers help us match the right expert type faster." : "Budget, urgency, and location help us rank the right experts faster."}</p></div>
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
                      ...(isBusinessAudience
                        ? [
                          { label: businessFollowUpOnePrompt?.text || "Question 1", value: selectedBusinessFollowUpOne?.label || "—" },
                          { label: businessFollowUpTwoPrompt?.text || "Question 2", value: selectedBusinessFollowUpTwo?.label || "—" },
                          { label: businessFollowUpThreePrompt?.text || "Question 3", value: selectedBusinessFollowUpThree?.label || "—" },
                        ]
                        : isPersonalAudience
                          ? [
                            { label: personalFollowUpOnePrompt?.text || "Question 1", value: selectedPersonalFollowUpOne?.label || "—" },
                            { label: personalFollowUpTwoPrompt?.text || "Question 2", value: selectedPersonalFollowUpTwo?.label || "—" },
                            { label: personalFollowUpThreePrompt?.text || "Question 3", value: selectedPersonalFollowUpThree?.label || "—" },
                          ]
                        : isDiagnosticAudience
                          ? [
                            { label: "Situation", value: selectedDiagnosticSituation?.label || "—" },
                            { label: "Goal", value: selectedDiagnosticGoal?.label || "—" },
                          ]
                          : [
                            { label: "Urgency", value: selectedUrgency?.label || "—" },
                            { label: "Budget", value: selectedBudget?.label || "—" },
                          ]),
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
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label htmlFor="location" className="text-sm font-medium text-[#111827]">Address</label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDetectCurrentLocation}
                            disabled={isDetectingLocation}
                            className="h-8 rounded-lg border-[#D9E3F3] px-3 text-xs text-[#111827] hover:bg-[#F7FAFF]"
                          >
                            {isDetectingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                            {isDetectingLocation ? "Detecting..." : "Use my current location"}
                          </Button>
                        </div>
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
                        {locationDetectionMessage ? (
                          <p className={cn(
                            "text-xs",
                            locationDetectionMessage.includes("detected")
                              ? "text-emerald-700"
                              : locationDetectionMessage.includes("Detecting")
                                ? "text-[#5D6B85]"
                                : "text-amber-700",
                          )}
                          >
                            {locationDetectionMessage}
                          </p>
                        ) : null}
                        <p className="text-xs text-[#7B89A2]">We can auto-detect your location where possible, and you can always adjust it manually.</p>
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

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToQuiz}
                      size="lg"
                      className="h-12 rounded-xl border-[#D9E3F3] px-6 text-[#111827] hover:bg-[#F7FAFF]"
                    >
                      Back to Questions
                    </Button>
                    <Button type="submit" size="lg" className="h-12 flex-1 bg-[#356AF6] text-white hover:bg-[#2C59D8]">View My Results</Button>
                  </div>
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
