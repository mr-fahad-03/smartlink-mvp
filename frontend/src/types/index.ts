export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type QuizCategory =
  | "Network Security"
  | "Identity & Access Management"
  | "Endpoint Security"
  | "Cloud Security"
  | "Incident Response";

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
  phoneNumber: string;
  companyName: string;
  role: string;
  businessType: string;
  location: string;
  website?: string;
  teamSize: string;
  consent: boolean;
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
