"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  registerUser,
  sendEmailOtp,
  signInWithPassword,
  startSocialLogin,
  verifyEmailOtp,
  verifyTotpChallenge,
} from "@/lib/admin-session";

type SignupRole = "client" | "expert";
type AuthMode = "signin" | "signup";
type MfaMethod = "totp" | "email_otp";

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const record = error as Record<string, unknown>;
  return typeof record.code === "string" ? record.code : "";
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [signupRole, setSignupRole] = useState<SignupRole>("client");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [mfaTicket, setMfaTicket] = useState("");
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>("totp");
  const [mfaCode, setMfaCode] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");

  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "";
  const requireEmailVerification = process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_REQUIRED !== "false";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("verified") === "true") {
        setMessage("Email verified successfully! Please sign in below.");
      } else if (searchParams.get("expired") === "true") {
        setMessage("Your session has expired. Please sign in to continue.");
      }
    }
  }, []);

  const resetAuthState = () => {
    setError("");
    setMessage("");
    setMfaTicket("");
    setMfaCode("");
    setCaptchaRequired(false);
    setCaptchaToken("");
  };

  const completeLoginRedirect = (resolvedRole?: string) => {
    if (["super_admin", "admin", "moderator", "auditor"].includes(String(resolvedRole || ""))) {
      router.push("/admin");
      return;
    }
    if (String(resolvedRole || "") === "expert") {
      router.push("/expert-application-status");
      return;
    }
    router.push("/");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        const registered = await registerUser({
          email: email.trim(),
          password,
          fullName: fullName.trim() || undefined,
          role: signupRole,
        });

        if (registered.verificationRequired) {
          setMessage("Account created. Verify your email to continue.");
          router.push(`/auth/verify-pending?email=${encodeURIComponent(email.trim())}`);
          return;
        }

        const result = await signInWithPassword(email.trim(), password);
        if (result.mfaRequired) {
          setMfaTicket(result.ticket);
          setMfaMethod(result.methods.includes("totp") ? "totp" : "email_otp");
          setMessage("MFA required. Complete verification to continue.");
        } else {
          completeLoginRedirect(result.role);
        }
        return;
      }

      const result = await signInWithPassword(
        email.trim(),
        password,
        undefined,
        captchaRequired ? captchaToken.trim() : undefined,
      );

      if (result.mfaRequired) {
        setMfaTicket(result.ticket);
        setMfaMethod(result.methods.includes("totp") ? "totp" : "email_otp");
        setMessage("MFA required. Complete verification to continue.");
      } else {
        completeLoginRedirect(result.role);
      }
    } catch (submitError) {
      const code = getErrorCode(submitError);
      if (code === "account_exists") {
        setMode("signin");
      }
      if (code === "captcha_required" || code === "captcha_invalid") {
        setCaptchaRequired(true);
      }
      if (code === "email_unverified") {
        setMessage("Email verification pending. Use resend verification below.");
      }
      if (code === "over_email_send_rate_limit") {
        setError("Too many signup attempts right now. Please wait and try again.");
      } else {
        setError(submitError instanceof Error ? submitError.message : "Auth request failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSendEmailOtp = async () => {
    if (!mfaTicket) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await sendEmailOtp(mfaTicket);
      if (response.devCode) setDevOtpHint(response.devCode);
      setMessage("Email OTP sent. Check inbox and continue.");
    } catch (otpError) {
      setError(otpError instanceof Error ? otpError.message : "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyMfa = async () => {
    if (!mfaTicket || !mfaCode) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mfaMethod === "totp") {
        const response = await verifyTotpChallenge(mfaTicket, mfaCode.trim());
        completeLoginRedirect(response.role);
      } else {
        const response = await verifyEmailOtp(mfaTicket, mfaCode.trim());
        completeLoginRedirect(response.role);
      }
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Failed to verify MFA.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const callback = `${window.location.origin}/auth/callback`;
      const data = await startSocialLogin("google", callback);
      window.location.href = data.authUrl;
    } catch (socialError) {
      setError(socialError instanceof Error ? socialError.message : "Failed to start Google login.");
      setLoading(false);
    }
  };

  const onMicrosoftLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const callback = `${window.location.origin}/auth/callback`;
      const data = await startSocialLogin("azure", callback);
      window.location.href = data.authUrl;
    } catch (socialError) {
      setError(socialError instanceof Error ? socialError.message : "Failed to start Microsoft login.");
      setLoading(false);
    }
  };

  return (
    <main className="sl-page relative min-h-screen overflow-hidden bg-[linear-gradient(140deg,#f7fbff_0%,#eef4ff_45%,#f9f6ff_100%)] px-4 py-10 text-[#0f172a] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-140px] top-[-120px] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,#9fc7ff_0%,rgba(159,199,255,0)_70%)]" />
      <div className="pointer-events-none absolute bottom-[-140px] right-[-100px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,#c7b6ff_0%,rgba(199,182,255,0)_72%)]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
        <section className="rounded-[32px] border border-[#d8e5ff] bg-white/85 p-7 shadow-[0_24px_60px_rgba(44,78,150,0.12)] backdrop-blur sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#b8d3ff] bg-[#ecf4ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
            <Sparkles className="h-3.5 w-3.5" />
            SmartLink Identity
          </span>

          <h1 className="mt-5 text-3xl font-semibold leading-tight text-[#0f172a] sm:text-4xl">
            Fast login flow with enterprise-grade protection
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#4b5d7a] sm:text-base">
            Sign in once and SmartLink auto-detects your account type. MFA, verification, and session controls are already enforced in the background.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-[#dbe8ff] bg-[#f7faff] p-4">
              <div className="flex items-center gap-2 text-[#1d4ed8]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-semibold">Security by default</p>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#556686]">Role checks, lockout rules, and MFA challenge are active automatically when risk is detected.</p>
            </article>

            <article className="rounded-2xl border border-[#dbe8ff] bg-[#f7faff] p-4">
              <div className="flex items-center gap-2 text-[#1d4ed8]">
                <MailCheck className="h-4 w-4" />
                <p className="text-sm font-semibold">Email verification</p>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#556686]">New accounts stay protected until verified. Resend verification anytime in one click.</p>
            </article>

            <article className="rounded-2xl border border-[#dbe8ff] bg-[#f7faff] p-4">
              <div className="flex items-center gap-2 text-[#1d4ed8]">
                <Clock3 className="h-4 w-4" />
                <p className="text-sm font-semibold">Session control</p>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#556686]">High-privilege roles use strict idle timeout and can revoke active sessions instantly.</p>
            </article>

            <article className="rounded-2xl border border-[#dbe8ff] bg-[#f7faff] p-4">
              <div className="flex items-center gap-2 text-[#1d4ed8]">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-semibold">Simple onboarding</p>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#556686]">Create an account as User or Expert with social sign-in support for faster conversion.</p>
            </article>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#d8e5ff] bg-white/92 p-6 shadow-[0_26px_70px_rgba(26,54,110,0.16)] backdrop-blur sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#2563eb,#4f46e5)] text-xl font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)]">
              SL
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#0f172a]">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
            <p className="mt-1 text-sm text-[#5f6f8c]">
              {mode === "signin" ? "We will detect your role automatically after login." : "Choose account type and complete setup in under a minute."}
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#edf3ff] p-1.5 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                resetAuthState();
              }}
              className={`rounded-xl px-3 py-2.5 transition ${mode === "signin" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-[#5d6b85] hover:text-[#1e3a8a]"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                resetAuthState();
              }}
              className={`rounded-xl px-3 py-2.5 transition ${mode === "signup" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-[#5d6b85] hover:text-[#1e3a8a]"}`}
            >
              Sign Up
            </button>
          </div>

          {mode === "signup" ? (
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#edf3ff] p-1.5 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setSignupRole("client")}
                className={`rounded-xl px-3 py-2.5 transition ${signupRole === "client" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-[#5d6b85] hover:text-[#1e3a8a]"}`}
              >
                Signup as User
              </button>
              <button
                type="button"
                onClick={() => setSignupRole("expert")}
                className={`rounded-xl px-3 py-2.5 transition ${signupRole === "expert" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-[#5d6b85] hover:text-[#1e3a8a]"}`}
              >
                Signup as Expert
              </button>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

            {mode === "signup" ? (
              <div>
                <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5d6b85]">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  className="h-11 w-full rounded-2xl border border-[#d9e3f3] bg-[#fcfdff] px-4 text-sm text-[#0f172a] outline-none transition focus:border-[#356af6] focus:ring-2 focus:ring-[#356af6]/15"
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5d6b85]">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="h-11 w-full rounded-2xl border border-[#d9e3f3] bg-[#fcfdff] px-4 text-sm text-[#0f172a] outline-none transition focus:border-[#356af6] focus:ring-2 focus:ring-[#356af6]/15"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5d6b85]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="h-11 w-full rounded-2xl border border-[#d9e3f3] bg-[#fcfdff] px-4 pr-12 text-sm text-[#0f172a] outline-none transition focus:border-[#356af6] focus:ring-2 focus:ring-[#356af6]/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 my-auto h-8 rounded-md px-1 text-[#64748b] transition hover:text-[#1e293b]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signup" ? <p className="mt-1 text-xs text-[#64748b]">Use 8-12 chars with uppercase, lowercase, and number.</p> : null}
            </div>

            {mode === "signin" && captchaRequired && !mfaTicket ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <label className="mb-1.5 block text-[0.82rem] font-semibold text-amber-900">hCaptcha token required</label>
                <input
                  type="text"
                  value={captchaToken}
                  onChange={(event) => setCaptchaToken(event.target.value)}
                  placeholder="Paste captcha token"
                  className="h-11 w-full rounded-2xl border border-amber-200 bg-white px-4 text-sm text-[#0f172a] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  required
                />
                <p className="mt-1 text-xs text-amber-700">
                  {hcaptchaSiteKey
                    ? `hCaptcha is required for this attempt. Site key: ${hcaptchaSiteKey}`
                    : "Development mode: use token dev-bypass"}
                </p>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-2xl bg-[linear-gradient(145deg,#2563eb,#4f46e5)] text-[0.95rem] font-semibold text-white shadow-[0_12px_30px_rgba(59,97,240,0.36)] hover:brightness-105"
            >
              {mode === "signin" ? <LockKeyhole className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>

            {mode === "signin" && !mfaTicket ? (
              <div className="space-y-2 pt-1">
                <p className="text-center text-xs text-[#6b7c96]">or continue with social login</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onGoogleLogin}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d9e3f3] bg-white text-sm font-semibold text-[#334155] transition hover:bg-[#f8faff]"
                    disabled={loading}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#fff3ef] text-[10px] font-bold text-[#ea4335]">G</span>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={onMicrosoftLogin}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d9e3f3] bg-white text-sm font-semibold text-[#334155] transition hover:bg-[#f8faff]"
                    disabled={loading}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#eef4ff] text-[10px] font-bold text-[#2563eb]">M</span>
                    Microsoft
                  </button>
                </div>
              </div>
            ) : null}
          </form>

          {mfaTicket ? (
            <div className="mt-6 rounded-2xl border border-[#d9e3f3] bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1d4ed8]" />
                <h3 className="text-sm font-semibold text-[#1f2937]">Multi-Factor Verification</h3>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMfaMethod("totp")}
                  className={`rounded-xl px-3 py-2 ${mfaMethod === "totp" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-[#64748b]"}`}
                >
                  Authenticator App
                </button>
                <button
                  type="button"
                  onClick={() => setMfaMethod("email_otp")}
                  className={`rounded-xl px-3 py-2 ${mfaMethod === "email_otp" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-[#64748b]"}`}
                >
                  Email OTP
                </button>
              </div>

              {mfaMethod === "email_otp" ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onSendEmailOtp}
                    className="rounded-xl border border-[#cbd5e1] px-3 py-2 text-xs font-semibold text-[#334155] hover:bg-white"
                    disabled={loading}
                  >
                    Send OTP
                  </button>
                  {devOtpHint ? <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700">Dev OTP: {devOtpHint}</p> : null}
                </div>
              ) : null}

              <div className="mt-3">
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value)}
                  placeholder={mfaMethod === "totp" ? "Enter 6-digit authenticator code" : "Enter email OTP"}
                  className="h-10 w-full rounded-xl border border-[#d9e3f3] bg-white px-3 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={onVerifyMfa}
                className="mt-3 h-10 w-full rounded-xl bg-[linear-gradient(145deg,#2563eb,#4f46e5)] text-sm font-semibold text-white hover:brightness-105"
                disabled={loading || !mfaCode}
              >
                Verify and Continue
              </button>
            </div>
          ) : null}

          {mode === "signin" && requireEmailVerification ? (
            <p className="mt-6 text-center text-sm text-[#5d6b85]">
              Need to verify account?{" "}
              <Link href="/auth/verify-pending" className="font-semibold text-[#356af6] hover:underline">
                Resend verification email
              </Link>
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
