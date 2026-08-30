"use client";

import React, { useEffect, useState } from "react";
import { getExpertDashboardData, updateExpertProfile } from "@/lib/backend-api";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { canUseExpertSection } from "@/lib/role-guard";
import { useRouter } from "next/navigation";
import { Save, User, Briefcase, MapPin, DollarSign, Building } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    organization: "",
    location: "",
    hourly_rate_usd: "",
  });

  // Package & Intro State
  const [introBio, setIntroBio] = useState("");
  const [introStatus, setIntroStatus] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: "",
    category: "General Support",
    priceUsd: "150",
    deliveryWindow: "3-5 days",
    description: "",
  });

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
        
        if (response.profile) {
          setProfile(response.profile);
          setFormData({
            name: response.profile.name || "",
            role: response.profile.role || "",
            organization: response.profile.organization || "",
            location: response.profile.location || "",
            hourly_rate_usd: response.profile.hourly_rate_usd || "",
          });

          const meta = response.profile.metadata || {};
          setIntroBio(meta.introduction_bio?.text || response.profile.role || "");
          setIntroStatus(meta.introduction_bio?.status || null);
          setPackages(Array.isArray(meta.custom_packages) ? meta.custom_packages : []);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const token = getAdminAccessToken();
      if (!token) throw new Error("No token found");

      await updateExpertProfile({
        name: formData.name,
        role: formData.role,
        organization: formData.organization,
        location: formData.location,
        hourly_rate_usd: Number(formData.hourly_rate_usd) || 0
      }, token);
      
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIntroBio = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const token = getAdminAccessToken();
      if (!token) throw new Error("No token found");

      await updateExpertProfile({
        introduction_bio: introBio
      }, token);

      setIntroStatus("pending");
      setSuccessMsg("Introduction bio submitted for Admin approval!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to submit introduction bio.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackage.name.trim() || !newPackage.description.trim()) {
      setErrorMsg("Package name and description are required.");
      return;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const token = getAdminAccessToken();
      if (!token) throw new Error("No token found");

      const pkgItem = {
        id: `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: newPackage.name.trim(),
        category: newPackage.category,
        priceUsd: Number(newPackage.priceUsd) || 150,
        deliveryWindow: newPackage.deliveryWindow,
        description: newPackage.description.trim(),
        status: "pending",
      };

      const updatedList = [...packages, pkgItem];
      await updateExpertProfile({
        custom_packages: updatedList
      }, token);

      setPackages(updatedList);
      setNewPackage({
        name: "",
        category: "General Support",
        priceUsd: "150",
        deliveryWindow: "3-5 days",
        description: "",
      });
      setShowPackageModal(false);
      setSuccessMsg("Service package created and submitted for Admin approval!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to create service package.");
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
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile &amp; Package Management</h1>
        <p className="text-gray-500">Manage your identity, custom service packages, and introduction bio for client matching.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-medium">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* ── PROFILE DETAILS ── */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">Personal &amp; Professional Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" /> Professional Role
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" /> Organization / Business
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" /> Hourly Rate (USD)
              </label>
              <input
                type="number"
                name="hourly_rate_usd"
                value={formData.hourly_rate_usd}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Profile Info
          </button>
        </div>
      </form>

      {/* ── INTRODUCTION BIO ── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Introduction Bio</h2>
            <p className="text-xs text-gray-500">Short intro text shown to clients during matching. Requires Admin approval.</p>
          </div>
          {introStatus === "approved" && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
              Approved ✓
            </span>
          )}
          {introStatus === "pending" && (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
              Pending Admin Review
            </span>
          )}
          {introStatus === "rejected" && (
            <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-semibold rounded-full">
              Rejected ✗
            </span>
          )}
        </div>

        <textarea
          rows={3}
          value={introBio}
          onChange={(e) => setIntroBio(e.target.value)}
          placeholder="Describe your expertise and how you help clients solve problems (2-3 sentences)..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveIntroBio}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            Submit Bio for Admin Approval
          </button>
        </div>
      </section>

      {/* ── CUSTOM SERVICE PACKAGES ── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service Packages</h2>
            <p className="text-xs text-gray-500">Create custom packages for client introductions. Once approved by Admin, they will be visible to clients.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPackageModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Add New Package
          </button>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No custom packages created yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add your specific consulting offers so clients can select them during expert matching.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">{pkg.name}</h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{pkg.category}</span>
                  </div>
                  {pkg.status === "approved" && (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-full">
                      Approved ✓
                    </span>
                  )}
                  {pkg.status === "pending" && (
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-full">
                      Pending Review
                    </span>
                  )}
                  {pkg.status === "rejected" && (
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-semibold rounded-full">
                      Rejected ✗
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{pkg.description}</p>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-600 text-gray-500">
                  <span>Price: <strong className="text-gray-900 dark:text-white">${pkg.priceUsd}</strong></span>
                  <span>Delivery: <strong>{pkg.deliveryWindow}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── ADD PACKAGE MODAL ── */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Custom Service Package</h3>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Package Name *</label>
                <input
                  type="text"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  placeholder="e.g. IT Security Baseline Audit"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <select
                    value={newPackage.category}
                    onChange={(e) => setNewPackage({ ...newPackage, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {["Operations", "Cybersecurity", "IT Support", "Systems", "Growth", "Financial Advice", "Legal Help", "General Support"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Price ($USD) *</label>
                  <input
                    type="number"
                    value={newPackage.priceUsd}
                    onChange={(e) => setNewPackage({ ...newPackage, priceUsd: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Delivery Window</label>
                <input
                  type="text"
                  value={newPackage.deliveryWindow}
                  onChange={(e) => setNewPackage({ ...newPackage, deliveryWindow: e.target.value })}
                  placeholder="e.g. 3-5 days"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Description *</label>
                <textarea
                  rows={3}
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  placeholder="Describe what is included in this package..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
