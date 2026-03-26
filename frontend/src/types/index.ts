export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type AssessmentMode = "business-services" | "cybersecurity-risk";
export type LeadTier = "standard" | "premium";
export type ExpertVisibilityLevel = "basic" | "featured" | "priority";
export type MatchingVisibility = "visible" | "priority-only" | "hidden";

export type QuizCategory =
  | "Business Setup"
  | "Licenses & Approvals"
  | "IT & Cybersecurity"
  | "Accounting & Finance"
  | "General Business Support";

export interface Option {
  id: string;
  label: string;
  text: string;
  riskPoints: number;
  explanation: string;
  tags: string[];
}

export interface Question {
  id: string;
  text: string;
  category: QuizCategory;
  options: Option[];
  objective: string;
}

export interface AssessmentCategorySummary {
  category: QuizCategory;
  riskPoints: number;
  maxRiskPoints: number;
  riskLevel: RiskLevel;
}

export interface AssessmentResult {
  assessmentId: string;
  submittedAt: string;
  totalRiskPoints: number;
  normalizedScore: number;
  riskLevel: RiskLevel;
  categoryBreakdown: AssessmentCategorySummary[];
  strengths: string[];
  priorityActions: string[];
  recommendedExpertIds: string[];
}

export interface LeadCaptureInfo {
  fullName: string;
  workEmail: string;
  phoneNumber?: string;
  companyName: string;
  role: string;
  businessType: string;
  location: string;
  website?: string;
  teamSize: string;
  budgetPreference?: string;
  urgencyPreference?: string;
  priorConsultingExperience?: string;
  selectedMapLocation?: string;
  locationLatitude?: number;
  locationLongitude?: number;
}

export interface LeadTrackingRecord {
  expertId: string;
  matchScore: number;
  matchTier: string;
  leadTier: LeadTier;
  visibilityLevel: ExpertVisibilityLevel;
  status: "new" | "contacted" | "qualified";
}

export interface RankingControlSnapshot {
  expertId: string;
  visibilityLevel: ExpertVisibilityLevel;
  matchingVisibility: MatchingVisibility;
  rankingWeightBoost: number;
}

export interface AssessmentResponseItem {
  questionId: string;
  questionText: string;
  category: QuizCategory;
  selectedOptionId: string;
  selectedOptionLabel: string;
  selectedOptionText: string;
  selectedOptionRiskPoints: number;
}

export interface AssessmentSubmission {
  assessmentId: string;
  submittedAt: string;
  assessmentMode: AssessmentMode;
  leadTier: LeadTier;
  totalQuestions: number;
  answeredQuestions: number;
  totalRiskPoints: number;
  maxRiskPoints: number;
  normalizedScore: number;
  riskLevel: RiskLevel;
  highestRiskCategory: QuizCategory;
  categoryBreakdown: AssessmentCategorySummary[];
  priorityActions: string[];
  recommendedExpertIds: string[];
  lead: LeadCaptureInfo;
  responses: AssessmentResponseItem[];
  leadTracking: LeadTrackingRecord[];
  rankingControlSnapshot: RankingControlSnapshot[];
}

export interface Expert {
  id: string;
  fullName: string;
  role: string;
  organization: string;
  yearsExperience: number;
  specialties: QuizCategory[];
  certifications: string[];
  languages: string[];
  timezone: string;
  rating: number;
  hourlyRateUsd: number;
  nextAvailableAt: string;
  bio: string;
  visibilityLevel: ExpertVisibilityLevel;
  matchingVisibility: MatchingVisibility;
  rankingWeightBoost: number;
}

export interface QuizSection {
  id: string;
  title: string;
  description: string;
  weight: number;
  questions: Question[];
}

export interface QuizData {
  id: string;
  title: string;
  description: string;
  estimatedDurationMinutes: number;
  passingScore: number;
  sections: QuizSection[];
}

export interface QuizEnginePayload {
  tenantId: string;
  locale: string;
  version: string;
  fetchedAt: string;
  quiz: QuizData;
  experts: Expert[];
  sampleAssessmentResult: AssessmentResult;
}
