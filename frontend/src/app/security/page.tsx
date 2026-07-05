"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  changePassword,
  disableTotp,
  enrollTotp,
  getSessionMe,
  revokeAllSessions,
  verifyTotpSetup,
} from "@/lib/admin-session";
import { canAccessSecurity } from "@/lib/role-guard";

export default function SecurityPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpUrl, setTotpUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    let active = true;
    getSessionMe()
      .then((session) => {
        if (!active) return;
        if (!canAccessSecurity(session.role)) {
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

  const handleEnrollTotp = async () => {
    setError("");
    setMessage("");
    try {
      const data = await enrollTotp();
      setTotpSecret(data.secretBase32);
      setTotpUrl(data.otpauthUrl);
      setMessage("Authenticator secret generated. Add it to your app and verify.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll authenticator.");
    }
  };

  const handleVerifyTotp = async () => {
    setError("");
    setMessage("");
    try {
      await verifyTotpSetup(totpCode.trim());
      setMessage("Authenticator MFA enabled.");
      setTotpCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify authenticator code.");
    }
  };

  const handleDisableTotp = async () => {
    setError("");
    setMessage("");
    try {
      await disableTotp();
      setMessage("Authenticator MFA disabled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable authenticator MFA.");
    }
  };

  const handleRevokeAll = async () => {
    setError("");
    setMessage("");
    try {
      await revokeAllSessions();
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke sessions.");
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await changePassword(currentPassword, newPassword);
      setMessage("Password changed. Please login again.");
      setCurrentPassword("");
      setNewPassword("");
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    }
  };

  return (
    <main className="sl-page mx-auto min-h-screen max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-[#111827]">Account Security</h1>

      <section className="mt-6 rounded-2xl border border-[#D9E3F3] bg-white p-5">
        <h2 className="text-lg font-semibold">Multi-Factor Authentication</h2>
        <p className="mt-1 text-sm text-[#64748B]">Use authenticator app as primary method and email OTP fallback.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={handleEnrollTotp} className="rounded-lg bg-[#356AF6] px-4 py-2 text-sm font-semibold text-white">
            Enroll Authenticator
          </button>
          <button type="button" onClick={handleDisableTotp} className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-sm font-semibold text-[#334155]">
            Disable Authenticator
          </button>
        </div>

        {totpSecret ? (
          <div className="mt-3 rounded-lg bg-[#F8FAFF] p-3 text-xs text-[#334155]">
            <p>Secret: {totpSecret}</p>
            <p className="mt-1 break-all">URI: {totpUrl}</p>
          </div>
        ) : null}

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="6-digit code"
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value)}
            className="h-10 flex-1 rounded-lg border border-[#D9E3F3] px-3 text-sm"
          />
          <button type="button" onClick={handleVerifyTotp} className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
            Verify
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#D9E3F3] bg-white p-5">
        <h2 className="text-lg font-semibold">Password Policy</h2>
        <p className="mt-1 text-sm text-[#64748B]">Use 8-12 chars, include uppercase, lowercase, number, and avoid last 5 passwords.</p>
        <form onSubmit={handleChangePassword} className="mt-4 grid gap-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-10 rounded-lg border border-[#D9E3F3] px-3 text-sm"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="h-10 rounded-lg border border-[#D9E3F3] px-3 text-sm"
            required
          />
          <button type="submit" className="h-10 rounded-lg bg-[#356AF6] text-sm font-semibold text-white">
            Change Password
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-[#D9E3F3] bg-white p-5">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <p className="mt-1 text-sm text-[#64748B]">Use this to log out from all devices immediately.</p>
        <button type="button" onClick={handleRevokeAll} className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
          Logout from all devices
        </button>
      </section>

      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </main>
  );
}
