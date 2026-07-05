"use client";

import React, { useEffect, useState } from "react";
import { getExpertDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { canUseExpertSection } from "@/lib/role-guard";
import { useRouter } from "next/navigation";
import { Eye, MousePointerClick, TrendingUp, Users } from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>({ impressionsByDate: [] });
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
        
        setMetrics(response.metrics || {});
        setAnalytics(response.analytics || { impressionsByDate: [] });
      } catch (error) {
        console.error("Failed to load analytics:", error);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Performance</h1>
        <p className="text-gray-500">Track your visibility and engagement on the platform.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profile Views</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.profileViews || 0}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.conversionRate || "0%"}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.responseRate || "0%"}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">New Matches</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.newMatches || 0}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Profile Views Over Time</h3>
        {analytics.impressionsByDate?.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            Not enough data to generate chart.
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.impressionsByDate?.map((item: any) => (
              <div key={item.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400 text-right">{item.date}</div>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(100, item.views * 10)}%` }} // Simple scaling for demonstration
                  ></div>
                </div>
                <div className="w-12 text-sm font-bold text-gray-900 dark:text-white">{item.views}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
