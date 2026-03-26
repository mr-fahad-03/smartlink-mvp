import type { AssessmentSubmission } from "@/types";

export const ASSESSMENT_STORAGE_KEY = "smartlinkbahamas:last-assessment";

export function saveAssessmentSubmission(payload: AssessmentSubmission) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(payload));
}

export function loadAssessmentSubmission(): AssessmentSubmission | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(ASSESSMENT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AssessmentSubmission;
  } catch {
    return null;
  }
}
