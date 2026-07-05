"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Clock, 
  Star, 
  Eye, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { getExpertDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { canUseExpertSection } from "@/lib/role-guard";
import { useRouter } from "next/navigation";

export default function ExpertDashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (errorMsg) {
    return <div>Error loading dashboard: {errorMsg}</div>;
  }

  if (!data) {
    return <div>Error loading dashboard. No data returned. Please try again.</div>;
  }

  const { metrics, actionItems, opportunities } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="New Matches" value={metrics?.newMatches} icon={Briefcase} color="text-blue-500" />
        <MetricCard title="Pending Requests" value={metrics?.pendingRequests} icon={Clock} color="text-orange-500" />
        <MetricCard title="Active Clients" value={metrics?.activeClients} icon={Users} color="text-green-500" />
        <MetricCard title="Response Rate" value={metrics?.responseRate} icon={MessageSquare} color="text-purple-500" />
        <MetricCard title="Avg Response Time" value={metrics?.averageResponseTime} icon={Clock} color="text-indigo-500" />
        <MetricCard title="Rating" value={metrics?.rating} icon={Star} color="text-yellow-500" />
        <MetricCard title="Profile Views" value={metrics?.profileViews} icon={Eye} color="text-pink-500" />
        <MetricCard title="Conversion Rate" value={metrics?.conversionRate} icon={CheckCircle2} color="text-teal-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Action Required */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Action Required</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-4">
            {actionItems?.length === 0 ? (
              <p className="text-gray-500 text-sm">You're all caught up!</p>
            ) : (
              actionItems?.map((item: any) => (
                <div key={item.id} className="flex gap-3 items-start border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                  <div className={`mt-0.5 rounded-full p-1.5 ${
                    item.urgency === 'high' ? 'bg-red-100 text-red-600' :
                    item.urgency === 'medium' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {item.type === 'client_response' ? <MessageSquare className="w-4 h-4" /> :
                     item.type === 'profile_info' ? <AlertCircle className="w-4 h-4" /> :
                     item.type === 'verification' ? <ShieldAlert className="w-4 h-4" /> :
                     <Star className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                    <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                      Resolve now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* New Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Opportunities</h2>
            <Link href="/expert-dashboard/opportunities" className="text-sm text-blue-600 hover:underline flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {opportunities?.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500">No new opportunities at the moment.</p>
              </div>
            ) : (
              opportunities?.map((opp: any) => (
                <div key={opp.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{opp.clientName}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                          {opp.matchScore}% Match
                        </span>
                        <span>{opp.category}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      Posted {new Date(opp.postedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {opp.description}
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-5 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <strong className="text-gray-900 dark:text-gray-200 mr-1">Urgency:</strong> {opp.urgency}
                    </div>
                    <div className="flex items-center">
                      <strong className="text-gray-900 dark:text-gray-200 mr-1">Location:</strong> {opp.location}
                    </div>
                    <div className="flex items-center">
                      <strong className="text-gray-900 dark:text-gray-200 mr-1">Budget:</strong> {opp.budgetRange}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Accept
                    </button>
                    <button className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Pass
                    </button>
                    <button className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto">
                      Request More Info
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
