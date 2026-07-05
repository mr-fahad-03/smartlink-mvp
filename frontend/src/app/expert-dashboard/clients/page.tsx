"use client";

import React, { useEffect, useState } from "react";
import { getExpertDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { canUseExpertSection } from "@/lib/role-guard";
import { useRouter } from "next/navigation";
import { Mail, Phone, Calendar, MoreVertical } from "lucide-react";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
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
        setClients(response.clients || []);
      } catch (error) {
        console.error("Failed to load clients:", error);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Clients</h1>
          <p className="text-gray-500">Manage your ongoing client relationships.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 p-8 text-center rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500">You don't have any active clients yet.</p>
          </div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    {client.clientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{client.clientName}</h3>
                    <span className="text-xs text-gray-500">{client.category}</span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 mt-auto mb-6">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`mailto:${client.email}`} className="hover:text-blue-600 truncate">{client.email}</a>
                </div>
                {client.phone && client.phone !== "N/A" && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`tel:${client.phone}`} className="hover:text-blue-600">{client.phone}</a>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Client since {new Date(client.acceptedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                <button className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 py-2 rounded-lg text-sm font-medium transition-colors">
                  Message
                </button>
                <button className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 py-2 rounded-lg text-sm font-medium transition-colors">
                  View Project
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
