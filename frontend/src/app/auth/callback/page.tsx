"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { exchangeSocialToken, verifyTotpChallenge, sendEmailOtp, verifyEmailOtp } from "@/lib/admin-session";

function parseHashTokens() {
  if (typeof window === "undefined") return { accessToken: "" };
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get("access_token") || "",
  };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing social login...");
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState("");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<"totp" | "email_otp">("totp");
  const [devOtp, setDevOtp] = useState("");

  useEffect(() => {
    async function run() {
      try {
        const { accessToken } = parseHashTokens();
        if (!accessToken) {
          throw new Error("Missing social auth token in callback URL.");
        }

        const data = await exchangeSocialToken(accessToken);
        if (data.mfaRequired) {
          setTicket(data.ticket);
          setMethod(data.methods.includes("totp") ? "totp" : "email_otp");
          setStatus("MFA verification is required to finish login.");
          return;
        }

        const hasQuizAssessment = typeof window !== "undefined" && Boolean(localStorage.getItem("smartlink_assessment_submission"));
        router.replace(
          data.role === "admin" || data.role === "super_admin" || data.role === "moderator" || data.role === "auditor"
            ? "/admin"
            : data.role === "expert"
              ? "/expert-dashboard"
              : hasQuizAssessment
                ? "/results?verified=true"
                : "/dashboard"
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Social login failed.");
      }
    }
    run();
  }, [router]);

  const handleSendOtp = async () => {
    try {
      const result = await sendEmailOtp(ticket);
      if (result.devCode) setDevOtp(result.devCode);
      setStatus("Email OTP sent. Enter it below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    }
  };

  const handleVerify = async () => {
    try {
      let result: { role: string };
      if (method === "totp") {
        result = await verifyTotpChallenge(ticket, code.trim());
      } else {
        result = await verifyEmailOtp(ticket, code.trim());
      }
      const hasQuizAssessment = typeof window !== "undefined" && Boolean(localStorage.getItem("smartlink_assessment_submission"));
      router.replace(
        nextRole === "admin" || nextRole === "super_admin" || nextRole === "moderator" || nextRole === "auditor"
          ? "/admin"
          : nextRole === "expert"
            ? "/expert-dashboard"
            : hasQuizAssessment
              ? "/results?verified=true"
              : "/dashboard"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify MFA.");
    }
  };

  return (
    <main className="sl-page flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[#D9E3F3] bg-white p-6 shadow-[0_16px_36px_rgba(56,75,107,0.08)]">
        <h1 className="text-xl font-semibold text-[#111827]">Sign in callback</h1>
        <p className="mt-2 text-sm text-[#4B5563]">{status}</p>

        {ticket ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button type="button" onClick={() => setMethod("totp")} className={`rounded-lg px-3 py-2 ${method === "totp" ? "bg-[#EEF3FF]" : "bg-[#F8FAFC]"}`}>
                Authenticator
              </button>
              <button type="button" onClick={() => setMethod("email_otp")} className={`rounded-lg px-3 py-2 ${method === "email_otp" ? "bg-[#EEF3FF]" : "bg-[#F8FAFC]"}`}>
                Email OTP
              </button>
            </div>

            {method === "email_otp" ? (
              <button type="button" onClick={handleSendOtp} className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-xs font-semibold">
                Send OTP
              </button>
            ) : null}

            {devOtp ? <p className="text-xs text-amber-700">Dev OTP: {devOtp}</p> : null}

            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter MFA code"
              className="h-10 w-full rounded-lg border border-[#D9E3F3] px-3 text-sm"
            />
            <button type="button" onClick={handleVerify} className="h-10 w-full rounded-lg bg-[#356AF6] text-sm font-semibold text-white">
              Verify
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </div>
    </main>
  );
}
