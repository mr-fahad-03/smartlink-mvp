/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type {
  AssessmentSubmission,
  BackendMatchRecommendation,
  ExpertApplicationStatusView,
  MissingFeedbackReason,
  ResultsFeedbackAnswer,
} from "@/types";

const DEFAULT_API_BASE = "http://localhost:5000/api";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Backend API failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function postJsonWithAuth<T>(path: string, payload: unknown, token: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Backend API failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestWithAuth<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Backend API failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function derivePreferredSupportType(submission: AssessmentSubmission) {
  const joined = submission.responses
    .map((response) => `${response.selectedOptionText} ${response.selectedOptionLabel}`)
    .join(" ")
    .toLowerCase();

  if (
    joined.includes("do it for me") ||
    joined.includes("done-for-you") ||
    joined.includes("someone to handle it") ||
    joined.includes("full setup done for me")
  ) {
    return "Do it for me";
  }

  if (joined.includes("advice")) return "Advice";
  return "Guided";
}

export async function createLeadInBackend(submission: AssessmentSubmission) {
  const preferredSupportType = derivePreferredSupportType(submission);
  const smartIntent = submission.diagnosticProfile?.smartIntentTag
    ? submission.diagnosticProfile.smartIntentTag
    : preferredSupportType === "Do it for me"
      ? "do_it_for_me"
      : preferredSupportType === "Advice"
        ? "advice"
        : "guided";
  return postJson<{ success: boolean; data: { id: string } }>("/leads", {
    fullName: submission.lead.fullName,
    workEmail: submission.lead.workEmail,
    phoneNumber: submission.lead.phoneNumber,
    audienceSegment: submission.lead.audienceSegment,
    companyName: submission.lead.companyName,
    role: submission.lead.role,
    businessType: submission.lead.businessType,
    location: submission.lead.location,
    locationScope: submission.lead.locationScope,
    island: submission.lead.island,
    website: submission.lead.website,
    teamSize: submission.lead.teamSize,
    budgetPreference: submission.lead.budgetPreference,
    urgencyPreference: submission.lead.urgencyPreference,
    priorConsultingExperience: submission.lead.priorConsultingExperience,
    leadTier: submission.leadTier,
    assessmentId: submission.assessmentId,
    normalizedScore: submission.normalizedScore,
    highestRiskCategory: submission.highestRiskCategory,
    selectedCategory: submission.highestRiskCategory,
    primaryIssue: submission.highestRiskCategory,
    preferredSupportType,
    metadata: {
      priorityActions: submission.priorityActions,
      diagnosticProfile: submission.diagnosticProfile,
      intent: smartIntent,
      supportPreference: preferredSupportType,
      diagnosticGoal: submission.diagnosticProfile?.goalOptionText,
      smartSignals: {
        urgentProblemSignal: Boolean(submission.diagnosticProfile?.urgentProblemSignal),
        premiumDoItForMeSignal: Boolean(submission.diagnosticProfile?.premiumDoItForMeSignal),
        needsGuidedExperienceSignal: Boolean(submission.diagnosticProfile?.needsGuidedExperienceSignal),
      },
      responses: submission.responses,
    },
    source: "web",
  });
}

export async function recommendMatchesFromBackend(submission: AssessmentSubmission) {
  const response = await postJson<{
    success: boolean;
    data: { recommendations: BackendMatchRecommendation[]; count: number };
  }>("/matches/recommend", {
    assessmentId: submission.assessmentId,
    selectedCategory: submission.highestRiskCategory,
    highestRiskCategory: submission.highestRiskCategory,
    primaryIssue: submission.highestRiskCategory,
    preferredSupportType: derivePreferredSupportType(submission),
    location: submission.lead.location,
    urgencyPreference: submission.lead.urgencyPreference,
    budgetPreference: submission.lead.budgetPreference,
  });

  return response.data.recommendations;
}

export async function submitPrivateFeedbackToBackend(params: {
  submission: AssessmentSubmission;
  matchHelpfulRating: ResultsFeedbackAnswer;
  feedbackReason: MissingFeedbackReason[];
  expertId?: string;
}) {
  const { submission, matchHelpfulRating, feedbackReason, expertId } = params;
  return postJson("/feedback/private", {
    assessmentId: submission.assessmentId,
    expertId,
    matchHelpfulRating,
    feedbackReason,
  });
}

export async function submitPublicReviewToBackend(payload: {
  token: string;
  publicStarRating: number;
  publicReviewComment?: string;
  wouldRecommend?: boolean;
  matchHelpfulRating?: ResultsFeedbackAnswer;
  feedbackReason?: MissingFeedbackReason[];
}) {
  return postJson("/reviews/public", payload);
}

export async function createIntroductionRequestsInBackend(params: {
  submission: AssessmentSubmission;
  requests: Array<{
    expertId: string;
    expertName: string;
    serviceIds: string[];
    serviceNames: string[];
    category?: string;
    urgencyLevel?: string;
    budgetPreference?: string;
    billable?: boolean;
    leadTier?: string;
    expertTier?: string;
  }>;
}) {
  const { submission, requests } = params;
  return postJson<{
    success: boolean;
    data: { reviewTokens: Array<{ expertId: string; reviewToken: string; expiresAt: string }> };
  }>("/introduction-requests", {
    assessmentId: submission.assessmentId,
    leadName: submission.lead.fullName,
    leadEmail: submission.lead.workEmail,
    leadPhone: submission.lead.phoneNumber,
    requests,
  });
}

export async function uploadExpertDocumentToBackend(file: File, token: string) {
  const formData = new FormData();
  formData.append("document", file);

  const response = await fetch(`${getApiBaseUrl()}/experts/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Backend API failed: ${response.status}`);
  }

  return response.json() as Promise<{ success: boolean; data: { fileUrl: string; fileName: string } }>;
}

export async function submitExpertApplicationToBackend(
  payload: {
    fullName: string;
    professionalTitle: string;
    businessName: string;
    workEmail: string;
    phoneNumber: string;
    primaryLocation: string;
    mainSpecialization: string;
    hourlyRate: string;
    shortBio: string;
    availabilityStatus: string;
    maxClientsPerWeek: string;
    preferredWorkTypes: string;
    governmentIdUploaded: boolean | string;
    professionalHeadshotUploaded: boolean | string;
    referenceContactsReady: boolean | string;
    businessLicenseAttached: boolean | string;
    certificationsProvided: boolean | string;
  },
  token: string,
) {
  return postJsonWithAuth<{ success: boolean; data: { application_id: string; status: string } }>(
    "/experts/applications/submit",
    payload,
    token,
  );
}

export async function getMyExpertApplicationStatus(token: string) {
  const response = await requestWithAuth<{ success: boolean; data: ExpertApplicationStatusView | null }>(
    "/experts/applications/me",
    token,
  );
  return response.data;
}

export async function getExpertDashboardData(token: string) {
  const response = await requestWithAuth<{ success: boolean; data: any }>(
    "/experts/dashboard",
    token,
  );
  return response.data;
}

export async function getClientDashboardData(token: string) {
  const response = await requestWithAuth<{ success: boolean; data: any }>(
    "/client/dashboard",
    token,
  );
  return response.data;
}

export async function submitClientReviewToBackend(
  payload: {
    leadId: string;
    expertId: string;
    publicStarRating: number;
    publicReviewComment?: string;
    wouldRecommend?: boolean;
    matchHelpfulRating?: string;
    feedbackReason?: string[];
  },
  token: string,
) {
  return postJsonWithAuth<{ success: boolean; data: any }>(
    "/client/reviews",
    payload,
    token,
  );
}

export async function updateExpertProfile(payload: Record<string, any>, token: string) {
  return postJsonWithAuth<{ success: boolean; data: any }>(
    "/experts/me",
    payload,
    token,
  );
}

