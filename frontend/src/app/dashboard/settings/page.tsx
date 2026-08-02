/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Lock,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { getSessionMe, changePassword } from "@/lib/admin-session";

export default function ClientSettingsPage() {
  const [user, setUser] = useState<any>(null);
  
  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const session = await getSessionMe();
        setUser(session);
      } catch (err) {
        console.error("Failed to load user session info:", err);
      }
    }
    loadUser();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMsg("Password updated successfully! Redirecting to login...");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Redirect to login after 3 seconds since changePassword logs out automatically
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Please verify current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Settings & Security</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account details and update security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Account Details
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Full Name</span>
                <span className="text-sm font-semibold text-gray-950 dark:text-gray-200 mt-0.5 block">{user?.email?.split("@")[0] || "Client User"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Email Address</span>
                <span className="text-sm font-semibold text-gray-950 dark:text-gray-200 mt-0.5 block">{user?.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Workspace Role</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900 mt-1">
                  <Shield className="w-3.5 h-3.5" />
                  {user?.role || "CLIENT"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-2xl border border-blue-100 dark:border-blue-950 p-5 space-y-2">
            <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Security Information
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Your profile is verified and managed by SmartLink. For changing email addresses or organization affiliations, please contact our support team.
            </p>
          </div>
        </div>

        {/* Change Password Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handlePasswordChange} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              Update Password
            </h2>

            {successMsg && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold">{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 p-4 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-semibold">{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5 relative">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Current Password</label>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 bottom-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* New Password */}
              <div className="space-y-1.5 relative">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">New Password</label>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 bottom-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 relative">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Confirm New Password</label>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 bottom-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition duration-200 disabled:opacity-55 disabled:pointer-events-none"
            >
              {loading ? "Saving Changes..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
