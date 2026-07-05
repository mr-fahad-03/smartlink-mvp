"use client";

import React, { useEffect, useState } from "react";
import { getExpertDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { canUseExpertSection } from "@/lib/role-guard";
import { useRouter } from "next/navigation";

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const session = await getSessionMe();
        if (!active) return;

        if (!canUseExpertSection(session.role)) {
          router.replace("/login");
          return;
        }

        const token = getAdminAccessToken();
        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await getExpertDashboardData(token);
        if (!active) return;
        setOpportunities(response.opportunities || []);
      } catch (error) {
        console.error("Failed to load opportunities:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [router]);

  async function handleAction(id: string, action: string) {
    let status = '';
    if (action === 'accept') status = 'accepted';
    else if (action === 'pass') status = 'declined';
    else if (action === 'info') status = 'more_info';

    try {
      const token = getAdminAccessToken();
      if (!token) return;

      const res = await fetch(`/api/v1/experts/opportunities/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        // Remove from list
        setOpportunities(opportunities.filter(opp => opp.id !== id));
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Opportunities</h1>
      <p className="text-gray-500">Review and respond to matching leads.</p>
      
      <div className="space-y-4">
        {opportunities.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500">You have no new opportunities at this time.</p>
          </div>
        ) : (
          opportunities.map((opp) => (
            <div key={opp.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-xl">{opp.clientName}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                      {opp.matchScore}% Match
                    </span>
                    <span>{opp.category}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  Posted {new Date(opp.postedAt).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {opp.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Urgency</span>
                  <strong className="text-gray-900 dark:text-gray-200">{opp.urgency}</strong>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Location</span>
                  <strong className="text-gray-900 dark:text-gray-200">{opp.location}</strong>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Budget Range</span>
                  <strong className="text-gray-900 dark:text-gray-200">{opp.budgetRange}</strong>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => handleAction(opp.id, 'accept')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Accept Opportunity
                </button>
                <button onClick={() => handleAction(opp.id, 'pass')} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Pass
                </button>
                <button onClick={() => handleAction(opp.id, 'info')} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ml-auto">
                  Request More Info
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
