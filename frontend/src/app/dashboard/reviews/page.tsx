/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  Star,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Info
} from "lucide-react";
import { getClientDashboardData, submitClientReviewToBackend } from "@/lib/backend-api";
import { getAdminAccessToken } from "@/lib/admin-session";

export default function ClientReviewsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [helpfulRating, setHelpfulRating] = useState<string>("yes_connected");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "history">("write");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const token = getAdminAccessToken();
        if (!token) {
          setErrorMsg("Session expired. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await getClientDashboardData(token);
        if (!active) return;
        setData(response);
      } catch (error: any) {
        console.error("Failed to load dashboard data:", error);
        setErrorMsg(error.message || String(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [submitSuccess]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-2xl border border-red-200">
        Error loading reviews: {errorMsg}
      </div>
    );
  }

  const { connections = [], reviews = [] } = data || {};

  // Filter connections that can be reviewed (accepted status)
  const reviewableConnections = connections.filter((conn: any) => conn.status === "accepted" || conn.status === "completed");

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnectionId) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const token = getAdminAccessToken();
      if (!token) throw new Error("Authentication token missing.");

      const selectedConn = reviewableConnections.find((c: any) => c.id === selectedConnectionId);
      if (!selectedConn) throw new Error("Invalid connection selected.");

      await submitClientReviewToBackend({
        leadId: selectedConn.lead_id,
        expertId: selectedConn.expert_id,
        publicStarRating: rating,
        publicReviewComment: comment || undefined,
        wouldRecommend,
        matchHelpfulRating: helpfulRating,
        feedbackReason: selectedReasons
      }, token);

      setSubmitSuccess(true);
      setSelectedConnectionId("");
      setComment("");
      setRating(5);
      setSelectedReasons([]);
      setHelpfulRating("yes_connected");
      
      // Auto redirect to history tab after 2 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab("history");
      }, 2500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const missingReasonOptions = [
    { value: "not_relevant", label: "Expert services were not relevant to my needs" },
    { value: "no_response", label: "Expert did not respond or follow up" },
    { value: "too_expensive", label: "Hourly rate/pricing was too expensive" },
    { value: "wrong_location", label: "Expert was not in my preferred island location" },
    { value: "different_help_needed", label: "I required a different kind of expertise" },
    { value: "other", label: "Other reason" }
  ];

  const helpfulOptions = [
    { value: "yes_connected", label: "Yes, I successfully connected and discussed work" },
    { value: "yes_chatting", label: "Yes, we are actively conversing" },
    { value: "no_response", label: "No, the expert never followed up" },
    { value: "not_helpful", label: "No, the match was not relevant" }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Review Center</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Submit public feedback and rate your matched experts.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("write")}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === "write"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Write a Review
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          My Reviews ({reviews.length})
        </button>
      </div>

      {activeTab === "write" ? (
        <div className="max-w-2xl">
          {submitSuccess && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 p-5 rounded-2xl flex items-start gap-3 mb-6 shadow-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="font-bold">Feedback Submitted!</h4>
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5 leading-relaxed">
                  Your review has been uploaded successfully. It is currently pending public moderation.
                </p>
              </div>
            </div>
          )}

          {reviewableConnections.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
              <MessageSquare className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="font-bold text-gray-900 dark:text-white">No Reviewable Connections</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                You can write a review once an expert accepts one of your introduction requests. Go to "Expert Connections" to request links or check status.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-6">
              {/* Select Connection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Select Connected Expert</label>
                <select
                  value={selectedConnectionId}
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Choose an Expert connection --</option>
                  {reviewableConnections.map((conn: any) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.expert.name} ({conn.category || "General Consultant"}) - Connected {new Date(conn.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Star Selector */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Star Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-yellow-400 dark:text-yellow-500 hover:scale-110 transition duration-150"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating) ? "fill-current" : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-gray-400 font-bold ml-2">
                    {rating === 5 ? "Exceptional" : rating === 4 ? "Very Good" : rating === 3 ? "Average" : rating === 2 ? "Below Average" : "Poor"}
                  </span>
                </div>
              </div>

              {/* public comment */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Public Review Description</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of your experience with this expert..."
                  rows={4}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none leading-relaxed"
                />
              </div>

              {/* Would Recommend */}
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <input
                  type="checkbox"
                  id="recommend"
                  checked={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.checked)}
                  className="w-4.5 h-4.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="recommend" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                  Yes, I would recommend this expert to other Bahamian businesses.
                </label>
              </div>

              {/* Match helpful feedback */}
              <div className="space-y-3 pt-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Was this match helpful?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {helpfulOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setHelpfulRating(opt.value)}
                      className={`flex items-start text-left p-3.5 border rounded-xl transition duration-150 ${
                        helpfulRating === opt.value
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center h-5 mr-3">
                        <input
                          type="radio"
                          name="helpfulRating"
                          checked={helpfulRating === opt.value}
                          onChange={() => {}} // handled by parent click
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Missing reasons if not fully satisfied */}
              {(rating < 4 || helpfulRating.startsWith("no")) && (
                <div className="space-y-3 bg-rose-50/50 dark:bg-rose-950/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                  <label className="text-xs font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4 shrink-0" />
                    Help us improve: What issues did you encounter?
                  </label>
                  <div className="space-y-2">
                    {missingReasonOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedReasons.includes(opt.value)}
                          onChange={() => handleReasonToggle(opt.value)}
                          className="w-4 h-4 rounded text-rose-600 border-gray-300 focus:ring-rose-500"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedConnectionId}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-40 disabled:pointer-events-none transition duration-200"
              >
                {submitting ? "Uploading Review..." : "Submit Public Review"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-xl mx-auto space-y-3">
              <Star className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="font-bold text-gray-900 dark:text-white">No Submitted Reviews</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You haven't written any expert reviews yet. Completed reviews will be displayed here along with moderation statuses.
              </p>
            </div>
          ) : (
            reviews.map((rev: any) => {
              const matchedConn = connections.find((c: any) => c.expert_id === rev.expert_id && c.lead_id === rev.lead_id);
              const expertName = matchedConn?.expert?.name || "Vetted Expert";
              const expertRole = matchedConn?.expert?.role || "Consultant";

              return (
                <div
                  key={rev.feedback_id}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{expertName}</h3>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">{expertRole}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        rev.review_status === "approved"
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
                          : rev.review_status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900"
                          : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900"
                      }`}>
                        {rev.review_status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars Display */}
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4.5 h-4.5 ${
                          star <= rev.public_star_rating ? "fill-current" : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-1.5">
                      {rev.public_star_rating}/5
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    {rev.public_review_comment || <span className="italic text-gray-400">No review comments provided.</span>}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      {rev.would_recommend ? <ThumbsUp className="w-3.5 h-3.5 text-green-500" /> : <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />}
                      {rev.would_recommend ? "Recommends this expert" : "Does not recommend"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
