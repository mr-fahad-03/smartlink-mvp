"use client";

import { FormEvent, useEffect, useState } from "react";

import { resendVerification } from "@/lib/admin-session";

export default function VerifyPendingPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryEmail = new URLSearchParams(window.location.search).get("email");
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await resendVerification(email.trim());
      setMessage("Verification link sent. Please check your email inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sl-page flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[#D9E3F3] bg-white p-6 shadow-[0_16px_36px_rgba(56,75,107,0.08)]">
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
            className="h-10 w-full rounded-lg bg-[#356AF6] text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending..." : "Resend verification"}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>
    </main>
  );
}
