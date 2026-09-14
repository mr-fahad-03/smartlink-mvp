"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { registerUser, resendVerification, signInWithPassword } from "@/lib/admin-session";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadEmail: string;
  leadName?: string;
  onSuccess: () => void;
  actionIntent?: string; // e.g. "hire an expert", "request an introduction", "see all results"
}

type ModalTab = "magic_link" | "sign_in" | "register";

export function VerificationModal({
  isOpen,
  onClose,
  leadEmail,
  leadName = "Client",
  onSuccess,
  actionIntent = "see all results and connect with experts",
}: VerificationModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>("magic_link");
  const [email, setEmail] = useState(leadEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setVerificationLink(null);
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    resetState();

    try {
      const result = await resendVerification(
        email.trim(),
        typeof window !== "undefined" ? `${window.location.origin}/results?verified=true` : undefined
      );

      if (result.alreadyVerified) {
        setSuccessMessage("Your email is already verified! Please sign in with your password to access your dashboard.");
        setActiveTab("sign_in");
        return;
      }

      setSuccessMessage(
        result.message || `We sent a verification link to ${email.trim()}. Click the link in your email to instantly verify!`
      );
      if (result.verificationLink) {
        setVerificationLink(result.verificationLink);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    setLoading(true);
    resetState();

    try {
      await signInWithPassword(email.trim(), password, "client");
      setSuccessMessage("Signed in successfully! Unlocking your results...");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
        setErrorMessage("Incorrect password. Please verify your password or use the email verification link.");
      } else {
        setErrorMessage(msg || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and choose a password.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    resetState();

    try {
      const reg = await registerUser({
        email: email.trim(),
        password,
        fullName: leadName,
        role: "client",
      });

      // If already verified or verification not required, attempt sign-in
      if (reg.emailVerified || !reg.verificationRequired) {
        try {
          await signInWithPassword(email.trim(), password, "client");
          setSuccessMessage("Account created and verified! Unlocking results...");
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
          return;
        } catch (_) {}
      }

      setSuccessMessage("Account created! A verification link has been sent to your email.");
      if (reg.verificationLink) {
        setVerificationLink(reg.verificationLink);
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("account_exists")) {
        setErrorMessage("An account with this email already exists. Please sign in below.");
        setActiveTab("sign_in");
      } else {
        setErrorMessage(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!verificationLink) return;
    try {
      await navigator.clipboard.writeText(verificationLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (_) {}
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-[#D9E3F3] bg-white p-6 shadow-[0_24px_50px_rgba(30,41,59,0.2)] sm:p-8"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#356AF6]">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF8EF] px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Access
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#111827]">Verify Your Account</h2>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-[#5D6B85]">
            To {actionIntent}, please verify your account. This protects your business details and ensures direct access to matched advisors.
          </p>

          {/* Tabs */}
          <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-[#F4F7FC] p-1 text-xs font-medium text-[#5D6B85]">
            <button
              type="button"
              onClick={() => {
                setActiveTab("magic_link");
                resetState();
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                activeTab === "magic_link" ? "bg-white font-semibold text-[#356AF6] shadow-sm" : "hover:text-[#111827]"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Email Link
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("sign_in");
                resetState();
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                activeTab === "sign_in" ? "bg-white font-semibold text-[#356AF6] shadow-sm" : "hover:text-[#111827]"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                resetState();
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                activeTab === "register" ? "bg-white font-semibold text-[#356AF6] shadow-sm" : "hover:text-[#111827]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              New Account
            </button>
          </div>

          {/* Alerts */}
          {errorMessage ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <p className="leading-5">{errorMessage}</p>
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <p className="leading-5 font-medium">{successMessage}</p>
              </div>
              {verificationLink ? (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-700 truncate max-w-[280px]">{verificationLink}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="h-7 text-xs border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100"
                  >
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Tab 1: Magic Link Form */}
          {activeTab === "magic_link" && (
            <form onSubmit={handleSendMagicLink} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111827]">Account Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="h-11 w-full rounded-xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[#356AF6] font-semibold text-white hover:bg-[#2C59D8]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send Instant Verification Link
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-[#7B89A2]">
                Already have an account password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("sign_in");
                    resetState();
                  }}
                  className="font-semibold text-[#356AF6] hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </form>
          )}

          {/* Tab 2: Sign In Form */}
          {activeTab === "sign_in" && (
            <form onSubmit={handleSignIn} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111827]">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="h-11 w-full rounded-xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#111827]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("magic_link");
                      resetState();
                    }}
                    className="text-xs text-[#356AF6] hover:underline"
                  >
                    Use email verification instead
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    className="h-11 w-full rounded-xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[#356AF6] font-semibold text-white hover:bg-[#2C59D8]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In & Unlock Results"}
              </Button>
            </form>
          )}

          {/* Tab 3: Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111827]">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="h-11 w-full rounded-xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111827]">Create Password</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                    className="h-11 w-full rounded-xl border border-[#D9E3F3] bg-white px-10 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[#356AF6] font-semibold text-white hover:bg-[#2C59D8]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account & Unlock"}
              </Button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#7B89A2] hover:text-[#111827] transition"
            >
              Continue browsing preview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
