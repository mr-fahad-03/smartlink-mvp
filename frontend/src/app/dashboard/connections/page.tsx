/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Mail,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
  Tag
} from "lucide-react";
import Link from "next/link";
import { getClientDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken } from "@/lib/admin-session";

export default function ClientConnectionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  }, []);

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
        Error loading connections: {errorMsg}
      </div>
    );
  }

  const { connections = [] } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Expert Connections</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track your introductions to vetted local experts.</p>
      </div>

      {connections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Connections Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            When you complete an assessment, you can request an introduction to the matched experts. They will appear here.
          </p>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition duration-200"
          >
            Check Matches
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {connections.map((conn: any) => {
            const isAccepted = conn.status === "accepted" || conn.status === "completed";
            const isPending = conn.status === "submitted" || conn.status === "pending";
            const isDeclined = conn.status === "declined";

            return (
              <div
                key={conn.id}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition duration-200"
              >
                <div className="flex-1 space-y-4">
                  {/* Top line with status */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isAccepted
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
                        : isPending
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900"
                        : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-900"
                    }`}>
                      {isAccepted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isPending ? <Clock className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {conn.status.toUpperCase()}
                    </span>

                    {conn.expert?.is_verified && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-200 dark:border-blue-900">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Vetted
                      </span>
                    )}

                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      Requested {new Date(conn.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Profile section */}
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                      {conn.expert?.name || conn.expert_name}
                      {conn.expert?.rating > 0 && (
                        <span className="inline-flex items-center text-sm font-semibold text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-0.5 rounded-lg border border-yellow-200 dark:border-yellow-900">
                          <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                          {Number(conn.expert.rating).toFixed(1)}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      {conn.expert?.role || "Consulting Specialist"} {conn.expert?.organization ? `at ${conn.expert.organization}` : ""}
                    </p>
                  </div>

                  {/* Expert details block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Response time: <strong className="text-gray-900 dark:text-white">{conn.expert?.average_response_time || 24}h</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Location: <strong className="text-gray-900 dark:text-white">{conn.expert?.location || "Bahamas"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Urgency: <strong className="text-gray-900 dark:text-white">{conn.urgency_level || "Medium"}</strong></span>
                    </div>
                  </div>

                  {/* Services Requested */}
                  {conn.service_names && conn.service_names.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Requested Services</span>
                      <div className="flex flex-wrap gap-1.5">
                        {conn.service_names.map((svc: string) => (
                          <span key={svc} className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-xl">
                            <Tag className="w-3 h-3 text-gray-400" />
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side Action Block */}
                <div className="md:w-72 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-6 md:pt-0 md:pl-8">
                  {isAccepted ? (
                    <div className="space-y-4">
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-2 text-center md:text-left">
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center md:justify-start gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Connection Ready
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Reach out to {conn.expert.name} directly via email. Mention SmartLink Bahamas for priority scheduling.
                        </p>
                      </div>

                      <a
                        href={`mailto:${conn.expert.email}`}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition duration-200"
                      >
                        <Mail className="w-4 h-4" />
                        Email {conn.expert.name}
                        <ArrowUpRight className="w-4 h-4" />
                      </a>

                      <Link
                        href="/dashboard/reviews"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs border border-gray-200 dark:border-gray-700 rounded-xl transition duration-200"
                      >
                        <Star className="w-3.5 h-3.5" />
                        Write public review
                      </Link>
                    </div>
                  ) : isPending ? (
                    <div className="text-center md:text-left space-y-3">
                      <div className="bg-orange-50/50 dark:bg-orange-950/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                        <p className="text-xs text-orange-800 dark:text-orange-300 font-bold flex items-center justify-center md:justify-start gap-1 mb-1">
                          <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
                          Awaiting Accept
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          We have notified {conn.expert_name || "the expert"}. Once accepted, their direct email will appear here immediately.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center md:text-left">
                      <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-bold mb-1">Expert Declined</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          The expert passed on this opportunity. You can request matches from another assessment project.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
