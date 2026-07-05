"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getAdminAccessToken, getSessionMe } from "@/lib/admin-session";
import { canUseExpertSection } from "@/lib/role-guard";

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export default function ExpertProfileOptimizerPage() {
  const router = useRouter();
  const [expertId, setExpertId] = useState("");
  const [approvedCategoryTags, setApprovedCategoryTags] = useState("");
  const [approvedServiceTags, setApprovedServiceTags] = useState("");
  const [voice, setVoice] = useState<"professional" | "friendly" | "direct">("professional");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [responseJson, setResponseJson] = useState<string>("");

  useEffect(() => {
    let active = true;
    getSessionMe()
      .then((session) => {
        if (!active) return;
        if (!canUseExpertSection(session.role)) {
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!active) return;
        router.replace("/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  const parseTags = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const generateDraft = async () => {
    const token = getAdminAccessToken();
    if (!expertId.trim() || !token) {
      setStatus("error");
      setMessage("Expert ID and active admin session are required.");
      return;
    }

    setStatus("loading");
    setMessage("");
    setResponseJson("");

    try {
      const response = await fetch(`${DEFAULT_API_BASE}/experts/${expertId.trim()}/optimize-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approvedCategoryTags: parseTags(approvedCategoryTags),
          approvedServiceTags: parseTags(approvedServiceTags),
          voice,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || `Request failed (${response.status})`);
      }

      setStatus("success");
      setMessage("AI draft created and saved as draft (not published).");
      setResponseJson(JSON.stringify(payload, null, 2));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to generate draft.");
    }
  };

  return (
    <main className="sl-page min-h-screen px-6 py-12 text-[#111827]">
      <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[#D9E3F3] bg-white p-8 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">Expert Tools</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Improve My Profile with AI</h1>
        <p className="mt-2 text-sm text-[#5D6B85]">
          Generate structured profile suggestions and save as draft for review before publishing.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="expertId" className="text-sm font-semibold">Expert ID</label>
            <input
              id="expertId"
              value={expertId}
              onChange={(event) => setExpertId(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#D9E3F3] px-3 text-sm outline-none focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
              placeholder="exp_123"
            />
          </div>

          <div>
            <label htmlFor="approvedCategoryTags" className="text-sm font-semibold">Approved Category Tags (comma separated)</label>
            <input
              id="approvedCategoryTags"
              value={approvedCategoryTags}
              onChange={(event) => setApprovedCategoryTags(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#D9E3F3] px-3 text-sm outline-none focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
              placeholder="Operations, Systems, Legal Help"
            />
          </div>

          <div>
            <label htmlFor="approvedServiceTags" className="text-sm font-semibold">Approved Service Tags (comma separated)</label>
            <input
              id="approvedServiceTags"
              value={approvedServiceTags}
              onChange={(event) => setApprovedServiceTags(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#D9E3F3] px-3 text-sm outline-none focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
              placeholder="Business registration, Compliance, Growth strategy"
            />
          </div>

          <div>
            <label htmlFor="voice" className="text-sm font-semibold">Voice</label>
            <select
              id="voice"
              value={voice}
              onChange={(event) => setVoice(event.target.value as "professional" | "friendly" | "direct")}
              className="mt-1 h-11 w-full rounded-xl border border-[#D9E3F3] px-3 text-sm outline-none focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="direct">Direct</option>
            </select>
          </div>

          <Button
            type="button"
            disabled={status === "loading"}
            onClick={generateDraft}
            className="h-11 rounded-xl bg-[#356AF6] px-6 text-white hover:bg-[#2C59D8]"
          >
            {status === "loading" ? "Generating draft..." : "Generate Draft"}
          </Button>

          {status !== "idle" ? (
            <p className={`text-sm ${status === "success" ? "text-[#15803D]" : "text-rose-600"}`}>{message}</p>
          ) : null}

          {responseJson ? (
            <pre className="overflow-x-auto rounded-xl border border-[#D9E3F3] bg-[#FCFDFF] p-4 text-xs text-[#374151]">{responseJson}</pre>
          ) : null}
        </div>
      </div>
    </main>
  );
}
