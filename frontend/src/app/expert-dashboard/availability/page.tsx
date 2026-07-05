"use client";

import React, { useEffect, useState } from "react";
import { getExpertDashboardData } from "@/lib/backend-api";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { canUseExpertSection } from "@/lib/role-guard";
import { useRouter } from "next/navigation";
import { Calendar, Save, Clock, ToggleLeft, ToggleRight } from "lucide-react";

export default function AvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [availabilityStatus, setAvailabilityStatus] = useState("available_now");
  const [remoteAvailable, setRemoteAvailable] = useState(true);

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
        if (!token) return router.replace("/login");

        const response = await getExpertDashboardData(token);
        if (!active) return;
        
        if (response.profile) {
          setAvailabilityStatus(response.profile.availability_status || "available_now");
          setRemoteAvailable(response.profile.remote_available ?? true);
        }
      } catch (error) {
        console.error("Failed to load availability:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    try {
      const token = getAdminAccessToken();
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/v1/experts/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          availability_status: availabilityStatus,
          remote_available: remoteAvailable
        })
      });

      if (!res.ok) throw new Error("Failed to update availability");
      
      setSuccessMsg("Availability updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Availability Management</h1>
        <p className="text-gray-500">Let clients know when you're ready to take on new work.</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Current Status
            </h3>
            
            <div className="grid gap-3">
              <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${availabilityStatus === 'available_now' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                <input type="radio" name="status" value="available_now" checked={availabilityStatus === 'available_now'} onChange={(e) => setAvailabilityStatus(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 block text-sm font-medium text-gray-900 dark:text-white">Available Now</span>
              </label>
              <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${availabilityStatus === 'available_this_week' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                <input type="radio" name="status" value="available_this_week" checked={availabilityStatus === 'available_this_week'} onChange={(e) => setAvailabilityStatus(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 block text-sm font-medium text-gray-900 dark:text-white">Available This Week</span>
              </label>
              <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${availabilityStatus === 'fully_booked' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                <input type="radio" name="status" value="fully_booked" checked={availabilityStatus === 'fully_booked'} onChange={(e) => setAvailabilityStatus(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 block text-sm font-medium text-gray-900 dark:text-white">Fully Booked</span>
              </label>
              <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${availabilityStatus === 'on_vacation' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                <input type="radio" name="status" value="on_vacation" checked={availabilityStatus === 'on_vacation'} onChange={(e) => setAvailabilityStatus(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 block text-sm font-medium text-gray-900 dark:text-white">On Vacation</span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Preferences
            </h3>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Available for Remote Work</h4>
                <p className="text-xs text-gray-500 mt-1">Allow clients outside your immediate location to match with you.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setRemoteAvailable(!remoteAvailable)}
                className={`${remoteAvailable ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {remoteAvailable ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Availability
          </button>
        </div>
      </form>
    </div>
  );
}
