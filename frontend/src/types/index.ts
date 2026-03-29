export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type AssessmentMode = "business-services" | "cybersecurity-risk";
export type LeadTier = "standard" | "premium";
export type ExpertVisibilityLevel = "basic" | "featured" | "priority";
export type MatchingVisibility = "visible" | "priority-only" | "hidden";
export type AudienceSegment = "business-owner" | "personal-help" | "not-sure";
export type ResultsFeedbackAnswer = "yes" | "somewhat" | "no";
export type MissingFeedbackReason = "budget" | "relevance" | "location" | "urgency";
export type ConnectionStatus = "pending" | "connected" | "not-yet" | "not-connected";
export type ExpertSubscriptionTier = "basic" | "premium" | "featured";
export type IntroductionRequestStatus = "submitted" | "reviewed" | "sent-to-expert" | "accepted" | "declined";
export type ExpertResponseStatus = "pending" | "responded" | "not-responded";
export type UserActionType =
  | "expert_match_viewed"
  | "expert_card_clicked"
  | "service_selected"
  | "service_removed"
  | "introduction_requested"
  | "expert_match_exited";

export type QuizCategory =
  | "Operations"
  | "Cybersecurity"
  | "Systems"
  | "Growth"
  | "Career Help"
  | "Financial Advice"
  | "Legal Help"
  | "Personal Tech Support"
  | "General Support";

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
  audienceSegment?: AudienceSegment;
  companyName?: string;
  role?: string;
  businessType?: string;
  location: string;
  locationScope?: "bahamas" | "outside-bahamas";
  island?: string;
  website?: string;
  teamSize?: string;
  budgetPreference?: string;
  urgencyPreference?: string;
  priorConsultingExperience?: string;
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

export interface IntroductionRequest {
  id: string;
  assessmentId: string;
  expertId: string;
  expertName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  requestedAt: string;
  serviceIds: string[];
  serviceNames: string[];
  category: QuizCategory;
  urgencyLevel?: string;
  budgetPreference?: string;
  billable: boolean;
  leadTier: LeadTier;
  expertTier: ExpertSubscriptionTier;
  status: IntroductionRequestStatus;
}

export interface ExpertPerformanceRecord {
  expertId: string;
  expertName: string;
  subscriptionTier: ExpertSubscriptionTier;
  leadsReceived: number;
  introductionRequests: number;
  clickCount: number;
  selectionCount: number;
  responseTimeHours?: number;
  responseStatus: ExpertResponseStatus;
}

export interface UserActionEvent {
  id: string;
  assessmentId: string;
  actionType: UserActionType;
  timestamp: string;
  expertId?: string;
  expertName?: string;
  category?: QuizCategory;
  urgencyLevel?: string;
  budgetPreference?: string;
  dropOffPoint?: string;
}

export interface LeadsPerCategorySnapshot {
  category: QuizCategory;
  count: number;
}

export interface ConversionIndicatorSnapshot {
  label: string;
  value: number;
}

export interface AdminAnalyticsSnapshot {
  totalLeadsGenerated: number;
  leadsPerCategory: LeadsPerCategorySnapshot[];
  topPerformingExpertIds: string[];
  conversionIndicators: ConversionIndicatorSnapshot[];
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

export interface ExpertFeedbackRecord {
  status?: "positive" | "neutral" | "negative";
  notes?: string;
  submittedAt?: string;
}

export interface FeedbackLoopData {
  userFeedback?: ResultsFeedbackAnswer;
  missingReasons?: MissingFeedbackReason[];
  userFeedbackSubmittedAt?: string;
  connectionStatus?: ConnectionStatus;
  connectionCheckedAt?: string;
  expertFeedback?: ExpertFeedbackRecord;
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
  feedbackLoop?: FeedbackLoopData;
  introductionRequests?: IntroductionRequest[];
  expertPerformanceTracking?: ExpertPerformanceRecord[];
  userActionEvents?: UserActionEvent[];
  adminAnalyticsSnapshot?: AdminAnalyticsSnapshot;
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
  subscriptionTier?: ExpertSubscriptionTier;
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
