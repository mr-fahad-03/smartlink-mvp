"use client";

import { useMemo, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { submitPublicReviewToBackend } from "@/lib/backend-api";
import type { MissingFeedbackReason, ResultsFeedbackAnswer } from "@/types";

const FEEDBACK_REASON_OPTIONS: Array<{ value: MissingFeedbackReason; label: string }> = [
  { value: "not_relevant", label: "Expert was not relevant" },
  { value: "no_response", label: "Expert did not respond" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "wrong_location", label: "Wrong location" },
  { value: "different_help_needed", label: "I needed a different type of help" },
  { value: "other", label: "Other" },
];

const HELP_MATCH_OPTIONS: Array<{ value: ResultsFeedbackAnswer; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "No" },
];

function ReviewContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [publicStarRating, setPublicStarRating] = useState<number>(5);
  const [publicReviewComment, setPublicReviewComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean>(true);
  const [matchHelpfulRating, setMatchHelpfulRating] = useState<ResultsFeedbackAnswer>("yes");
  const [feedbackReason, setFeedbackReason] = useState<MissingFeedbackReason[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggleReason = (reason: MissingFeedbackReason) => {
    setFeedbackReason((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    );
  };

  const submitReview = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Missing review token. Please use the link provided after your introduction request.");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      await submitPublicReviewToBackend({
        token,
        publicStarRating,
        publicReviewComment: publicReviewComment.trim() || undefined,
        wouldRecommend,
        matchHelpfulRating,
        feedbackReason,
      });

      setStatus("success");
      setMessage("Thank you. Your review was submitted and is now pending moderation.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="sl-page min-h-screen px-6 py-12 text-[#111827]">
      <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[#D9E3F3] bg-white p-8 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">Public Review</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">How was your experience?</h1>
        <p className="mt-2 text-sm text-[#5D6B85]">Your review helps improve trust and future matching quality.</p>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-sm font-semibold">Star rating (1-5)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPublicStarRating(value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    publicStarRating === value
                      ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                      : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Would you recommend this expert?</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  wouldRecommend
                    ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                    : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  !wouldRecommend
                    ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                    : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                }`}
              >
                No
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Was this match helpful?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {HELP_MATCH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMatchHelpfulRating(option.value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    matchHelpfulRating === option.value
                      ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                      : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">What could be improved?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FEEDBACK_REASON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleReason(option.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    feedbackReason.includes(option.value)
                      ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                      : "border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="publicReviewComment" className="text-sm font-semibold">Comment (optional)</label>
            <textarea
              id="publicReviewComment"
              value={publicReviewComment}
              onChange={(event) => setPublicReviewComment(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-xl border border-[#D9E3F3] px-4 py-3 text-sm outline-none focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
              placeholder="Share a short note about your experience"
            />
          </div>

          <Button
            type="button"
            onClick={submitReview}
            disabled={isSubmitting}
            className="h-11 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>

          {status !== "idle" ? (
            <p className={`text-sm ${status === "success" ? "text-[#15803D]" : "text-rose-600"}`}>{message}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="sl-page min-h-screen px-6 py-12 text-[#111827]">
          <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[#D9E3F3] bg-white p-8 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <p className="text-sm text-[#5D6B85]">Loading review form...</p>
          </div>
        </main>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
