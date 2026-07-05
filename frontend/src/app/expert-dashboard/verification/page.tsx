"use client";

import React, { useState } from "react";
import { getAdminAccessToken } from "@/lib/admin-session";
import { UploadCloud, CheckCircle2, ShieldCheck, FileText, AlertCircle } from "lucide-react";

export default function VerificationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      const token = getAdminAccessToken();
      if (!token) throw new Error("Authentication required");

      const formData = new FormData();
      formData.append("document", file);

      const res = await fetch("/api/v1/experts/documents/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed. Please try again.");

      setSuccess(true);
      setFile(null);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification & Credentials</h1>
        <p className="text-gray-500">Upload documents to verify your identity and expertise.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleUpload} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upload New Document</h3>
            
            {success && (
              <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Document uploaded successfully and is pending review.
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {errorMsg}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <input
                type="file"
                id="document-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label htmlFor="document-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-12 h-12 text-blue-500 mb-4" />
                <span className="text-gray-900 dark:text-white font-medium mb-1">
                  {file ? file.name : "Click to upload or drag and drop"}
                </span>
                <span className="text-sm text-gray-500">SVG, PNG, JPG or PDF (max. 5MB)</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!file || uploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                {uploading ? "Uploading..." : "Submit for Verification"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-500" /> Trust & Safety
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Verified profiles receive up to 3x more opportunities and client requests.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                Identity Verification (Required)
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5" />
                Business Registration (Optional)
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5" />
                Professional Certifications (Optional)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
