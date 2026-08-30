"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { resendVerification } from "@/lib/admin-session";

function formatVerificationLink(link: string | null): string {
  if (!link || typeof window === "undefined") return link || "";
  try {
    const url = new URL(link);
    if (url.searchParams.has("redirect_to")) {
      url.searchParams.set("redirect_to", `${window.location.origin}/login?verified=true`);
    }
    return url.toString();
  } catch (_) {
    return link;
  }
}

export default function VerifyPendingPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const triggerResend = useCallback(async (targetEmail: string) => {
    if (!targetEmail) return;
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await resendVerification(
        targetEmail.trim(),
        typeof window !== "undefined" ? `${window.location.origin}/login?verified=true` : undefined
      );
      if (result.alreadyVerified) {
        setAlreadyVerified(true);
        setMessage("Account is already verified! You can sign in now.");
        return;
      }
      setMessage("Verification request processed.");
      if (result.verificationLink) {
        setVerificationLink(result.verificationLink);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate verification link.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const queryEmail = new URLSearchParams(window.location.search).get("email");
    if (queryEmail) {
      setEmail(queryEmail);
      triggerResend(queryEmail);
    }
  }, [triggerResend]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await triggerResend(email);
  };

  const formattedLink = formatVerificationLink(verificationLink);

  const handleCopyLink = async () => {
    if (!formattedLink) return;
    try {
      await navigator.clipboard.writeText(formattedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (_) {
      // ignore clipboard error
    }
  };

  return (
    <main className="sl-page flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-[#D9E3F3] bg-white p-6 shadow-[0_16px_36px_rgba(56,75,107,0.08)]">
        {alreadyVerified ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#111827]">Account Verified!</h1>
              <p className="mt-2 text-sm text-[#4B5563]">
                Your email <span className="font-semibold text-slate-800">{email}</span> has already been verified successfully.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login?verified=true"
                className="inline-flex items-center justify-center h-11 w-full rounded-xl bg-[#356AF6] text-sm font-semibold text-white transition-colors hover:bg-blue-600 shadow-md"
              >
                Proceed to Sign In →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-[#111827]">Email verification required</h1>
            <p className="mt-2 text-sm text-[#4B5563]">Enter your account email to resend verification link.</p>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="name@example.com"
                className="h-10 w-full rounded-lg border border-[#D9E3F3] px-3 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-lg bg-[#356AF6] text-sm font-semibold text-white disabled:opacity-60 transition-colors hover:bg-blue-600"
              >
                {loading ? "Sending..." : "Resend verification"}
              </button>
            </form>

            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

            {/* Dialog Box for Unconfigured Email Service */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-amber-900">Email service not configured yet</h3>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Because local/staging SMTP mail delivery is disabled, use your generated account verification link below:
                  </p>

                  {formattedLink ? (
                    <div className="mt-3 space-y-2.5">
                      <div className="relative rounded-lg border border-amber-200 bg-white p-2.5 font-mono text-xs text-slate-700 break-all select-all shadow-inner">
                        {formattedLink}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
                        >
                          {copied ? "✓ Link Copied!" : "Copy verification link"}
                        </button>
                        <a
                          href={formattedLink}
                          target="_self"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#356AF6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Verify account now →
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs italic text-amber-700">
                      {loading ? "Generating verification link..." : "Click 'Resend verification' above to generate link."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
