"use client";

import React, { useEffect, useState } from "react";
import { getExpertDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { canUseExpertSection } from "@/lib/role-guard";
import { useRouter } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const session = await getSessionMe();
        if (!active) return;
        if (!canUseExpertSection(session.role)) return router.replace("/login");
        
        const token = getAdminAccessToken();
        if (!token) return router.replace("/login");

        const response = await getExpertDashboardData(token);
        if (!active) return;
        
        setReviews(response.reviews || []);
        setMetrics(response.metrics || {});
      } catch (error) {
        console.error("Failed to load reviews:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews & Reputation</h1>
          <p className="text-gray-500">Monitor client feedback and your platform rating.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-1 justify-center">
              {metrics.rating || "0.0"} <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="text-sm text-gray-500">Overall Rating</div>
          </div>
          <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{reviews.length}</div>
            <div className="text-sm text-gray-500">Total Reviews</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-xl border border-gray-100 dark:border-gray-700">
            <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">You don't have any reviews yet.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{review.author}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                "{review.comment}"
              </p>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <MessageSquare className="w-4 h-4 mr-1" /> Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
