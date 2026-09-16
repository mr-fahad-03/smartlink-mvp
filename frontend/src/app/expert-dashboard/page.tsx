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
  ArrowRight,
  Sparkles,
  MapPin,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { getExpertDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken, getSessionMe, clearAdminSession } from "@/lib/admin-session";
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
      } catch (error: any) {
        console.error("Failed to load dashboard data:", error);
        const msg = String(error?.message || error).toLowerCase();
        if (msg.includes("expired") || msg.includes("invalid") || msg.includes("session") || msg.includes("401")) {
          clearAdminSession();
          router.replace("/login?expired=true");
          return;
        }
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

  const { profile, metrics, actionItems, opportunities } = data;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            Expert Workspace
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Welcome back, {profile?.name || "Expert Partner"}!
          </h1>
          <p className="mt-2 text-indigo-100 text-[0.98rem] leading-6">
            {profile?.role ? `${profile.role} ${profile.organization ? `at ${profile.organization}` : ""}` : "Manage client requests, review matches, and update your availability."}
          </p>
        </div>
        {/* Decorative Blur Spheres */}
        <div className="absolute right-0 top-0 -z-0 h-48 w-48 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute -bottom-8 -right-8 -z-0 h-48 w-48 rounded-full bg-purple-400/40 blur-3xl" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="New Matches" value={metrics?.newMatches} icon={Briefcase} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-950/20" />
        <MetricCard title="Pending Requests" value={metrics?.pendingRequests} icon={Clock} colorClass="text-orange-600 dark:text-orange-400" bgClass="bg-orange-50 dark:bg-orange-950/20" />
        <MetricCard title="Active Clients" value={metrics?.activeClients} icon={Users} colorClass="text-green-600 dark:text-green-400" bgClass="bg-green-50 dark:bg-green-950/20" />
        <MetricCard title="Response Rate" value={metrics?.responseRate} icon={MessageSquare} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-50 dark:bg-purple-950/20" />
        <MetricCard title="Avg Response Time" value={metrics?.averageResponseTime} icon={Clock} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-950/20" />
        <MetricCard title="Rating" value={metrics?.rating} icon={Star} colorClass="text-amber-500" bgClass="bg-amber-50 dark:bg-amber-950/20" />
        <MetricCard title="Profile Views" value={metrics?.profileViews} icon={Eye} colorClass="text-pink-600 dark:text-pink-400" bgClass="bg-pink-50 dark:bg-pink-950/20" />
        <MetricCard title="Conversion Rate" value={metrics?.conversionRate} icon={CheckCircle2} colorClass="text-teal-600 dark:text-teal-400" bgClass="bg-teal-50 dark:bg-teal-950/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Action Required */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Action Required</h2>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            {actionItems?.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="bg-green-50 dark:bg-green-950/20 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-gray-850 dark:text-gray-250">You're all caught up!</h4>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">No outstanding administrative actions at this time.</p>
              </div>
            ) : (
              actionItems?.map((item: any) => (
                <div 
                  key={item.id} 
                  className={`flex gap-3 items-start pl-3 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl pr-2 border-l-4 ${
                    item.urgency === 'high' ? 'border-l-rose-500' :
                    item.urgency === 'medium' ? 'border-l-amber-500' :
                    'border-l-blue-500'
                  }`}
                >
                  <div className={`mt-0.5 rounded-full p-1.5 ${
                    item.urgency === 'high' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' :
                    item.urgency === 'medium' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                    'bg-blue-50 dark:bg-blue-950/20 text-blue-600'
                  }`}>
                    {item.type === 'client_response' ? <MessageSquare className="w-4 h-4" /> :
                     item.type === 'profile_info' ? <AlertCircle className="w-4 h-4" /> :
                     item.type === 'verification' ? <ShieldAlert className="w-4 h-4" /> :
                     <Star className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.description}</p>
                    <button className="text-blue-600 dark:text-blue-400 text-xs font-semibold mt-2 hover:underline flex items-center gap-1">
                      Resolve now <ArrowRight className="w-3.5 h-3.5" />
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">New Opportunities</h2>
            <Link href="/expert-dashboard/opportunities" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {opportunities?.length === 0 ? (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-10 text-center rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">No New Opportunities</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  We'll notify you as soon as new client assessments match your specialization and availability.
                </p>
              </div>
            ) : (
              opportunities?.map((opp: any) => (
                <div key={opp.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-950 dark:text-white text-lg tracking-tight">{opp.clientName}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                          {opp.matchScore}% Match
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                        <span className="text-xs font-medium text-slate-650 dark:text-slate-400">{opp.category}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-450 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg">
                      Posted {new Date(opp.postedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-650 dark:text-gray-305 mb-5 leading-relaxed line-clamp-2">
                    {opp.description}
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-xs mb-6 text-gray-600 dark:text-gray-400 border-t border-b border-slate-50 dark:border-slate-700/40 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span><strong className="font-bold text-gray-900 dark:text-gray-200">Urgency:</strong> {opp.urgency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span><strong className="font-bold text-gray-900 dark:text-gray-200">Location:</strong> {opp.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span><strong className="font-bold text-gray-900 dark:text-gray-200">Budget:</strong> {opp.budgetRange}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200">
                      Accept
                    </button>
                    <button className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600/50 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200">
                      Pass
                    </button>
                    <button className="text-blue-600 hover:text-blue-750 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-bold transition-colors ml-auto flex items-center gap-1">
                      Request More Info <ArrowRight className="w-4 h-4" />
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

function MetricCard({ title, value, icon: Icon, colorClass, bgClass }: { title: string; value: any; icon: any; colorClass: string; bgClass: string }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</span>
        <div className={`p-2 rounded-xl ${bgClass} ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value !== undefined ? value : "0"}</p>
    </div>
  );
}
