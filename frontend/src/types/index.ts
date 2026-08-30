export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type AssessmentMode = "business-services" | "cybersecurity-risk";
export type LeadTier = "standard" | "premium";
export type ExpertVisibilityLevel = "basic" | "featured" | "priority";
export type MatchingVisibility = "visible" | "priority-only" | "hidden";
export type AudienceSegment = "business-owner" | "personal-help" | "not-sure";
export type ResultsFeedbackAnswer = "yes" | "somewhat" | "no";
export type MissingFeedbackReason =
  | "not_relevant"
  | "no_response"
  | "too_expensive"
  | "wrong_location"
  | "different_help_needed"
  | "other";
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

export interface DiagnosticProfile {
  categoryOptionId?: string;
  categoryOptionText?: string;
  situationOptionId?: string;
  situationOptionText?: string;
  goalOptionId?: string;
  goalOptionText?: string;
  smartIntentTag?: "do_it_for_me" | "advice" | "guided";
  urgentProblemSignal?: boolean;
  premiumDoItForMeSignal?: boolean;
  needsGuidedExperienceSignal?: boolean;
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
  diagnosticProfile?: DiagnosticProfile;
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

export interface BackendMatchBreakdown {
  baseScore: number;
  fairnessBoost: number;
  performanceScore: number;
  priorityBoost: number;
  cooldownAdjustment: number;
  category: number;
  urgency: number;
  budget: number;
  reputation: number;
  location: number;
  budgetFitLabel: string;
  urgencyFitLabel: string;
  categoryFitLabel: string;
  locationFitLabel: string;
}

export interface BackendMatchRecommendation {
  rank: number;
  expertId: string;
  expert: Expert;
  matchScore: number;
  matchBand: "Best Match" | "Strong Match" | "Good Match";
  slotLabel?: "Top Match" | "Strong Match" | "Rising Expert" | null;
  badges: string[];
  availableNow: boolean;
  explanation: string;
  breakdown: BackendMatchBreakdown;
}

export type AdminRole = "super_admin" | "admin" | "moderator" | "auditor";

export interface AdminMe {
  userId: string;
  email: string | null;
  role: AdminRole;
  roles: AdminRole[];
  permissions: string[];
}

export interface AdminUserRoleRecord {
  id: string;
  user_id: string;
  user_email?: string | null;
  user_name?: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUserOption {
  id: string;
  label: string;
  subtitle: string;
}

export interface AdminExpertOption {
  id: string;
  label: string;
  subtitle: string;
  matching_visibility?: "visible" | "priority-only" | "hidden";
  is_paused?: boolean;
}

export interface AdminLeadOption {
  id: string;
  label: string;
  subtitle: string;
}

export interface ExpertApplicationRecord {
  application_id: string;
  expert_id: string;
  expert_name?: string | null;
  expert_role?: string | null;
  expert_organization?: string | null;
  expert_location?: string | null;
  expert_availability_status?: string | null;
  expert_hourly_rate_usd?: number | null;
  expert_category_tags?: string[];
  expert_service_tags?: string[];
  expert_profile_metadata?: Record<string, unknown>;
  metadata?: Record<string, any>;
  status: "under_review" | "needs_info" | "approved" | "rejected" | "flagged";
  submitted_by_user_id?: string | null;
  reviewed_by_user_id?: string | null;
  approved_by_user_id?: string | null;
  rejected_by_user_id?: string | null;
  recommendation?: string | null;
  requested_info_notes?: string | null;
  review_notes?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertProfileSummary {
  expert_id: string;
  name: string;
  role?: string | null;
  organization?: string | null;
  location?: string | null;
  availability_status?: string | null;
  hourly_rate_usd?: number | null;
  category_tags?: string[];
  service_tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ExpertApplicationStatusView {
  application: ExpertApplicationRecord | null;
  expert: ExpertProfileSummary | null;
}

export interface LeadAssignmentRecord {
  assignment_id: string;
  lead_id: string;
  lead_label?: string | null;
  expert_id: string;
  expert_label?: string | null;
  assigned_by_user_id: string;
  assigned_by_role: string;
  assignment_reason: string;
  is_high_value_lead: boolean;
  notes?: string | null;
  created_at: string;
}

export interface PlatformPricingSettings {
  id: string;
  is_active: boolean;
  lead_price_low: number;
  lead_price_medium: number;
  lead_price_high: number;
  pricing_band_low: string;
  pricing_band_medium: string;
  pricing_band_high: string;
  high_value_criteria: {
    requireUrgent: boolean;
    requireBudget: boolean;
    requireIntent: boolean;
    budgetLevels: ("low" | "medium" | "high" | "exploring")[];
    intentTypes: ("do_it_for_me" | "advice" | "guided")[];
  };
  created_at: string;
  updated_at: string;
}

export interface AdminFairnessSettings {
  id: string;
  fairness_boost_max: number;
  new_expert_boost_days: number;
  new_expert_boost_value: number;
  cooldown_threshold: number;
  new_expert_boost_enabled: boolean;
  exposure_boost_strength: "low" | "medium" | "high";
  rotation_frequency: "aggressive" | "balanced" | "minimal";
}

export interface AdminMatchOverrideRecord {
  id: string;
  lead_id?: string | null;
  assessment_id?: string | null;
  ordered_expert_ids: string[];
  ordered_expert_labels?: string[];
  allow_hidden_experts: boolean;
  is_active: boolean;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  lead_label?: string | null;
}

export interface AdminModerationReviewRecord {
  feedback_id: string;
  expert_id?: string | null;
  lead_id?: string | null;
  public_star_rating?: number | null;
  public_review_comment?: string | null;
  review_status: "approved" | "rejected" | "pending";
  is_suspicious?: boolean;
  suspicious_notes?: string | null;
  created_at: string;
  expert_label?: string | null;
  lead_label?: string | null;
  pending_recommendations_count?: number;
}

export interface ReviewModerationRecommendationRecord {
  id: string;
  review_id: string;
  moderator_user_id: string;
  moderator_email?: string | null;
  recommendation: "approve" | "reject";
  notes?: string | null;
  status: "pending" | "resolved";
  resolved_by_user_id?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  review?: AdminModerationReviewRecord | null;
}

export interface AdminAuditLogRecord {
  audit_id: string;
  user_id?: string | null;
  user_email?: string | null;
  role?: string | null;
  action_type: string;
  target_type?: string | null;
  target_id?: string | null;
  previous_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  timestamp: string;
  ip_address?: string | null;
  notes?: string | null;
}

export interface AdminReportsSummary {
  totalApplications: number;
  totalLeads: number;
  totalLeadsToday?: number;
  totalLeadsMonthToDate?: number;
  highValueLeads: number;
  noMatchLeads?: number;
  conversionRate?: number;
  averageResponseTimeHours?: number;
  introductionsCount?: number;
  connectedIntroductionsCount?: number;
  totalReviews: number;
  approvedReviews: number;
  suspiciousReviews?: number;
  totalExperts: number;
  activeExperts: number;
  featuredExperts: number;
  notRespondingExperts?: number;
  leadsByCategory: Record<string, number>;
}

export interface AdminLeadEscalationRecord {
  id: string;
  label: string;
  work_email?: string | null;
  subtitle: string;
  is_high_value: boolean;
  urgency_preference?: string | null;
  budget_preference?: string | null;
  intent_type?: string | null;
  primary_issue?: string | null;
}

export interface AdminExpertPerformanceRecord {
  expert_id: string;
  expert_name: string;
  profile_views: number;
  impressions: number;
  click_through_rate: number;
  response_time_hours: number;
  conversion_rate: number;
  rating: number;
  status_label: "High Performer" | "Needs Improvement" | "New Expert";
}

export interface AdminReviewsFeedbackSummary {
  trends: {
    approved_review_count: number;
    low_rating_count: number;
    suspicious_count: number;
    rating_buckets: Record<string, number>;
  };
  complaints: Array<{
    expert_id: string;
    expert_name: string;
    low_feedback_count: number;
  }>;
  alerts: {
    multiple_low_ratings: Array<{
      expert_id: string;
      expert_name: string;
      low_feedback_count: number;
    }>;
    not_responding_experts: Array<{
      expert_id: string;
      expert_name: string;
      response_time_hours: number;
    }>;
  };
}
