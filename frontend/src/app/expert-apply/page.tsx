"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  MapPin,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Zap,
} from "lucide-react";

import { InnerNav } from "@/components/navigation/inner-nav";
import { Button } from "@/components/ui/button";

const EXPERT_DRAFT_STORAGE_KEY = "smartlink:expert-application-draft";

const specializationOptions = [
  "Business Setup",
  "Cybersecurity",
  "Accounting",
  "Legal",
  "IT Support",
] as const;

const availabilityOptions = ["Available now", "This week", "Not available"] as const;

type ExpertDraftBooleanField =
  | "governmentIdUploaded"
  | "professionalHeadshotUploaded"
  | "referenceContactsReady"
  | "businessLicenseAttached"
  | "certificationsProvided";

interface ExpertApplicationDraft {
  fullName: string;
  professionalTitle: string;
  businessName: string;
  workEmail: string;
  phoneNumber: string;
  primaryLocation: string;
  mainSpecialization: string;
  hourlyRate: string;
  shortBio: string;
  availabilityStatus: string;
  maxClientsPerWeek: string;
  preferredWorkTypes: string;
  governmentIdUploaded: boolean;
  professionalHeadshotUploaded: boolean;
  referenceContactsReady: boolean;
  businessLicenseAttached: boolean;
  certificationsProvided: boolean;
}

const defaultDraft: ExpertApplicationDraft = {
  fullName: "",
  professionalTitle: "",
  businessName: "",
  workEmail: "",
  phoneNumber: "",
  primaryLocation: "",
  mainSpecialization: "",
  hourlyRate: "",
  shortBio: "",
  availabilityStatus: "",
  maxClientsPerWeek: "",
  preferredWorkTypes: "",
  governmentIdUploaded: false,
  professionalHeadshotUploaded: false,
  referenceContactsReady: false,
  businessLicenseAttached: false,
  certificationsProvided: false,
};

const uploadFields: { label: string; key: ExpertDraftBooleanField; hint: string }[] = [
  { label: "Government ID", key: "governmentIdUploaded", hint: "Passport, driver's license, or national ID" },
  { label: "Professional Headshot", key: "professionalHeadshotUploaded", hint: "Clear, professional photo" },
  { label: "Business License", key: "businessLicenseAttached", hint: "Current approved license" },
  { label: "Certifications", key: "certificationsProvided", hint: "Relevant industry certifications" },
  { label: "References", key: "referenceContactsReady", hint: "2–3 professional contacts ready to verify" },
];

const profileFieldKeys: (keyof ExpertApplicationDraft)[] = [
  "fullName", "professionalTitle", "businessName", "workEmail",
  "phoneNumber", "primaryLocation", "mainSpecialization", "hourlyRate",
  "shortBio", "availabilityStatus", "maxClientsPerWeek", "preferredWorkTypes",
];

const FORM_STEPS = ["Profile", "Documents", "Availability", "Review"] as const;

function calcStrength(draft: ExpertApplicationDraft) {
  const textFilled = profileFieldKeys.filter((k) => {
    const v = draft[k];
    return typeof v === "string" ? v.trim().length > 0 : Boolean(v);
  }).length;
  const docsFilled = uploadFields.filter((f) => draft[f.key]).length;
  return Math.round((textFilled / profileFieldKeys.length) * 65 + (docsFilled / uploadFields.length) * 35);
}

function getChecklistStatus(filled: boolean): { label: string; color: string; dot: string } {
  if (filled) return { label: "Completed", color: "text-[#16A34A]", dot: "bg-[#16A34A]" };
  return { label: "Missing", color: "text-[#9CA3AF]", dot: "bg-[#D1D5DB]" };
}

export default function ExpertApplyPage() {
  const [draft, setDraft] = useState<ExpertApplicationDraft>(defaultDraft);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const strength = useMemo(() => calcStrength(draft), [draft]);

  useEffect(() => {
    const stored = globalThis.localStorage?.getItem(EXPERT_DRAFT_STORAGE_KEY);
    if (!stored) return;
    try {
      setDraft((prev) => ({ ...prev, ...(JSON.parse(stored) as Partial<ExpertApplicationDraft>) }));
    } catch { /* ignore corrupt draft */ }
  }, []);

  const set = <K extends keyof ExpertApplicationDraft>(field: K, value: ExpertApplicationDraft[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const toggle = (field: ExpertDraftBooleanField) =>
    setDraft((prev) => ({ ...prev, [field]: !prev[field] }));

  const saveDraft = () => {
    globalThis.localStorage?.setItem(EXPERT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setSavedMsg("Draft saved.");
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const clearDraft = () => {
    globalThis.localStorage?.removeItem(EXPERT_DRAFT_STORAGE_KEY);
    setDraft(defaultDraft);
    setCurrentStep(0);
  };

  const initials =
    draft.fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "SL";

  const inputCls =
    "h-10 w-full rounded-xl border border-[#D9E3F3] bg-white px-3.5 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15 placeholder:text-[#A0AECB]";

  const stepPercent = Math.round(((currentStep + 1) / FORM_STEPS.length) * 100);

  return (
    <main className="sl-page min-h-screen bg-[#F7F9FD] text-[#111827]">
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <InnerNav breadcrumb="Expert Application" />

        {/* ── HERO ── */}
        <section className="mt-6 rounded-2xl border border-[#D9E3F3] bg-white px-7 py-6 shadow-sm">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#356AF6]">Expert Network</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#111827]">
            Join SmartLink and get matched with qualified clients in your area
          </h1>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {[
              { icon: Zap, label: "Get matched with real client requests" },
              { icon: Globe, label: "No cold outreach required" },
              { icon: Sparkles, label: "Control your availability and rates" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-xl border border-[#D9E3F3] bg-[#F8FBFF] px-3.5 py-2.5">
                <Icon className="h-4 w-4 shrink-0 text-[#356AF6]" />
                <p className="text-sm font-medium text-[#111827]">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-800">
            <BadgeCheck className="h-3.5 w-3.5" />
            Applications are reviewed within 2 business days. You&apos;ll be notified once approved.
          </p>
        </section>

        {/* ── STEP PROGRESS ── */}
        <section className="mt-4 rounded-2xl border border-[#D9E3F3] bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#111827]">
              Step {currentStep + 1} of {FORM_STEPS.length} — {FORM_STEPS[currentStep]}
            </span>
            <span className={`text-sm font-semibold ${strength >= 80 ? "text-[#16A34A]" : "text-[#356AF6]"}`}>
              {stepPercent}% complete
            </span>
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {FORM_STEPS.map((step, i) => (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? "bg-[#356AF6]" : "bg-[#E7EEFB]"}`}
                aria-label={`Go to ${step}`}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {FORM_STEPS.map((step, i) => (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`flex-1 text-center text-[0.7rem] font-medium transition ${i === currentStep ? "text-[#356AF6]" : "text-[#9CA3AF]"}`}
              >
                {step}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
          {/* ── MAIN FORM ── */}
          <div className="space-y-4">

            {/* STEP 0 — Profile */}
            {currentStep === 0 && (
              <section className="rounded-2xl border border-[#D9E3F3] bg-white p-5 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <UserRound className="h-3.5 w-3.5 text-[#356AF6]" />
                  Profile Details
                </p>
                <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                  {[
                    { key: "fullName",          label: "Full Name *",       placeholder: "Jane Smith" },
                    { key: "professionalTitle", label: "Title *",           placeholder: "Business Setup Advisor" },
                    { key: "businessName",      label: "Business / Firm *", placeholder: "Acme Consulting" },
                    { key: "workEmail",         label: "Work Email *",      placeholder: "jane@acme.com" },
                    { key: "phoneNumber",       label: "Phone",             placeholder: "+1 (242) 555-0101" },
                    { key: "primaryLocation",   label: "Location *",        placeholder: "Nassau, Bahamas" },
                    { key: "hourlyRate",        label: "Hourly Rate (USD)", placeholder: "175" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium text-[#5D6B85]">{label}</label>
                      <input
                        value={draft[key as keyof ExpertApplicationDraft] as string}
                        onChange={(e) => set(key as keyof ExpertApplicationDraft, e.target.value)}
                        placeholder={placeholder}
                        className={inputCls}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#5D6B85]">Specialization *</label>
                    <select
                      value={draft.mainSpecialization}
                      onChange={(e) => set("mainSpecialization", e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select category…</option>
                      {specializationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <p className="text-[0.7rem] text-[#A0AECB]">e.g. Business Setup, Cybersecurity, Accounting — used for matching accuracy</p>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1">
                  <label className="text-xs font-medium text-[#5D6B85]">Bio *</label>
                  <textarea
                    value={draft.shortBio}
                    onChange={(e) => set("shortBio", e.target.value)}
                    placeholder="Describe the problems you solve and who you help (2–3 sentences)"
                    className="min-h-[96px] w-full rounded-xl border border-[#D9E3F3] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15 placeholder:text-[#A0AECB]"
                  />
                  <p className="text-[0.7rem] text-[#A0AECB]">2–3 sentences. Describe the problems you solve and who you help.</p>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button onClick={() => setCurrentStep(1)} className="rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8]">
                    Next: Documents
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 1 — Documents */}
            {currentStep === 1 && (
              <section className="rounded-2xl border border-[#D9E3F3] bg-white p-5 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#356AF6]" />
                  Credentials &amp; Documents
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
                  <Lock className="h-4 w-4 shrink-0 text-[#2563EB]" />
                  <p className="text-xs text-[#1E40AF]">
                    Your documents are securely stored and used only for verification purposes.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {uploadFields.map(({ label, key, hint }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition ${
                        draft[key]
                          ? "border-[#BBF7D0] bg-[#F0FDF4]"
                          : "border-dashed border-[#C8D6EE] bg-white hover:border-[#356AF6]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${draft[key] ? "text-[#15803D]" : "text-[#111827]"}`}>{label}</span>
                        {draft[key]
                          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
                          : <Upload className="h-4 w-4 shrink-0 text-[#A0AECB]" />
                        }
                      </div>
                      <p className="text-[0.7rem] text-[#9CA3AF]">{hint}</p>
                      <span className={`mt-1 inline-flex self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${draft[key] ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#EEF3FF] text-[#356AF6]"}`}>
                        {draft[key] ? "Added ✓" : "Upload"}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-medium text-amber-800">
                    Applications may be declined if profiles are incomplete or experience is unclear.
                  </p>
                </div>
                <div className="mt-5 flex justify-between">
                  <Button onClick={() => setCurrentStep(0)} variant="outline" className="rounded-xl border-[#D9E3F3]">
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(2)} className="rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8]">
                    Next: Availability
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 2 — Availability */}
            {currentStep === 2 && (
              <section className="rounded-2xl border border-[#D9E3F3] bg-white p-5 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <MapPin className="h-3.5 w-3.5 text-[#356AF6]" />
                  Availability &amp; Preferences
                </p>
                <div className="mt-4 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[#5D6B85]">Current Availability</label>
                    <div className="flex flex-wrap gap-2">
                      {availabilityOptions.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => set("availabilityStatus", o)}
                          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                            draft.availabilityStatus === o
                              ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                              : "border-[#D9E3F3] bg-white text-[#5D6B85] hover:border-[#356AF6]/50"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#5D6B85]">Maximum clients per week</label>
                    <input
                      value={draft.maxClientsPerWeek}
                      onChange={(e) => set("maxClientsPerWeek", e.target.value)}
                      placeholder="e.g. 3"
                      className={inputCls + " max-w-xs"}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#5D6B85]">Preferred types of work</label>
                    <textarea
                      value={draft.preferredWorkTypes}
                      onChange={(e) => set("preferredWorkTypes", e.target.value)}
                      placeholder="e.g. licensing support, financial planning, cybersecurity reviews, long-term advisory"
                      className="min-h-[80px] w-full rounded-xl border border-[#D9E3F3] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15 placeholder:text-[#A0AECB]"
                    />
                  </div>

                  <div className="rounded-xl border border-[#BFD0F8] bg-[#EEF3FF] px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-[#356AF6]">
                      <Clock className="h-4 w-4 shrink-0" />
                      Experts who respond within 24 hours receive significantly more client requests.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex justify-between">
                  <Button onClick={() => setCurrentStep(1)} variant="outline" className="rounded-xl border-[#D9E3F3]">
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} className="rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8]">
                    Next: Review
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 3 — Review & Submit */}
            {currentStep === 3 && (
              <section className="rounded-2xl border border-[#D9E3F3] bg-white p-5 shadow-sm">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#356AF6]" />
                  Review &amp; Submit
                </p>

                {/* Profile summary */}
                <div className="mt-4 rounded-xl border border-[#D9E3F3] bg-[#F8FBFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7B89A2]">Profile Summary</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                    {[
                      { l: "Name", v: draft.fullName || "—" },
                      { l: "Title", v: draft.professionalTitle || "—" },
                      { l: "Business", v: draft.businessName || "—" },
                      { l: "Email", v: draft.workEmail || "—" },
                      { l: "Location", v: draft.primaryLocation || "—" },
                      { l: "Specialization", v: draft.mainSpecialization || "—" },
                      { l: "Rate", v: draft.hourlyRate ? `$${draft.hourlyRate}/hr` : "—" },
                      { l: "Availability", v: draft.availabilityStatus || "—" },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex gap-2">
                        <span className="w-28 shrink-0 text-[#9CA3AF]">{l}</span>
                        <span className="font-medium text-[#111827]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents summary */}
                <div className="mt-3 rounded-xl border border-[#D9E3F3] bg-[#F8FBFF] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7B89A2]">Documents</p>
                  <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {uploadFields.map(({ label, key }) => {
                      const status = getChecklistStatus(draft[key]);
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          <span className="text-[#111827]">{label}</span>
                          <span className={`ml-auto text-xs font-semibold ${status.color}`}>{status.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Profile strength */}
                <div className="mt-3 rounded-xl border border-[#D9E3F3] bg-[#F8FBFF] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#111827]">Your profile strength: {strength}%</span>
                    <span className={`font-semibold ${strength >= 80 ? "text-[#16A34A]" : "text-[#356AF6]"}`}>
                      {strength >= 80 ? "Review Ready" : "In Progress"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7EEFB]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${strength >= 80 ? "bg-[#16A34A]" : "bg-[#356AF6]"}`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <Button onClick={() => setCurrentStep(2)} variant="outline" className="rounded-xl border-[#D9E3F3]">
                    Back
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={saveDraft} variant="outline" className="rounded-xl border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]">
                      <Save className="h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button onClick={clearDraft} variant="outline" className="rounded-xl border-[#D9E3F3] bg-white text-[#5D6B85] hover:bg-[#F7FAFF]">
                      <RotateCcw className="h-4 w-4" />
                      Clear
                    </Button>
                    <Button className="rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8]">
                      Submit &amp; Start Receiving Client Matches
                    </Button>
                  </div>
                  {savedMsg && <span className="w-full text-xs text-[#16A34A]">{savedMsg}</span>}
                </div>
              </section>
            )}

            {/* Save/Clear always accessible */}
            {currentStep < 3 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveDraft}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#5D6B85] hover:text-[#111827]"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save &amp; Continue Later
                </button>
                <span className="text-[#D9E3F3]">|</span>
                <button
                  type="button"
                  onClick={clearDraft}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#5D6B85] hover:text-[#111827]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear Draft
                </button>
                {savedMsg && <span className="text-xs text-[#16A34A]">{savedMsg}</span>}
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="space-y-4">
            {/* Profile strength mini bar */}
            <div className="rounded-2xl border border-[#D9E3F3] bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#111827]">Profile strength</span>
                <span className={`text-sm font-semibold ${strength >= 80 ? "text-[#16A34A]" : "text-[#356AF6]"}`}>{strength}%</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E7EEFB]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${strength >= 80 ? "bg-[#16A34A]" : "bg-[#356AF6]"}`}
                  style={{ width: `${strength}%` }}
                />
              </div>
            </div>

            {/* Live preview card */}
            <section className="rounded-2xl border border-[#D9E3F3] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Profile Preview</p>
              <p className="mt-1 text-[0.7rem] text-[#A0AECB]">How you appear to clients in matching results</p>
              <div className="mt-4 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-base font-semibold text-[#356AF6]">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#111827]">{draft.fullName || "Your Name"}</p>
                  <p className="truncate text-sm text-[#6B7A99]">{draft.professionalTitle || "Professional Title"}</p>
                  {draft.primaryLocation && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#A0AECB]">
                      <MapPin className="h-3 w-3" />{draft.primaryLocation}
                    </p>
                  )}
                </div>
              </div>
              {draft.mainSpecialization && (
                <span className="mt-3 inline-block rounded-full border border-[#D9E3F3] bg-[#F8FBFF] px-3 py-1 text-xs font-semibold text-[#356AF6]">
                  {draft.mainSpecialization}
                </span>
              )}
              {draft.shortBio && (
                <p className="mt-3 line-clamp-3 text-sm text-[#5D6B85]">{draft.shortBio}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-[#D9E3F3] bg-[#F8FBFF] px-3 py-2">
                  <p className="text-[#A0AECB]">Rate</p>
                  <p className="mt-0.5 font-semibold text-[#111827]">{draft.hourlyRate ? `$${draft.hourlyRate}/hr` : "—"}</p>
                </div>
                <div className="rounded-xl border border-[#D9E3F3] bg-[#F8FBFF] px-3 py-2">
                  <p className="text-[#A0AECB]">Availability</p>
                  <p className="mt-0.5 font-semibold text-[#111827] truncate">{draft.availabilityStatus || "—"}</p>
                </div>
              </div>
            </section>

            {/* Dynamic checklist */}
            <section className="rounded-2xl border border-[#D9E3F3] bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                <BadgeCheck className="h-3.5 w-3.5 text-[#356AF6]" />
                Document Checklist
              </p>
              <ul className="mt-4 space-y-2.5">
                {uploadFields.map(({ label, key }) => {
                  const status = getChecklistStatus(draft[key]);
                  return (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${draft[key] ? "text-[#16A34A]" : "text-[#D9E3F3]"}`} />
                      <span className={draft[key] ? "text-[#111827]" : "text-[#9CA3AF]"}>{label}</span>
                      <span className={`ml-auto text-[0.68rem] font-semibold ${status.color}`}>{status.label}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-[0.7rem] text-amber-800">Applications may be declined if profiles are incomplete or experience is unclear.</p>
              </div>
            </section>

            {/* Match preview */}
            <section className="rounded-2xl border border-[#D9E3F3] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Example Client Requests</p>
              <p className="mt-1 text-[0.7rem] text-[#A0AECB]">The types of requests you may receive once approved</p>
              <div className="mt-3 space-y-2.5">
                {[
                  { label: "Urgent", color: "bg-rose-50 text-rose-700 border-rose-200", title: "Business owner in Nassau needs help with licensing", detail: "Looking for fast-response guidance." },
                  { label: "Guidance", color: "bg-[#EBF8EF] text-[#15803D] border-[#BBF7D0]", title: "Individual needs financial advice before a major decision", detail: "Looking for clear, practical support." },
                ].map((r) => (
                  <div key={r.title} className="rounded-xl border border-[#D9E3F3] bg-[#F8FBFF] p-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold ${r.color}`}>{r.label}</span>
                    <p className="mt-2 text-xs font-semibold text-[#111827]">{r.title}</p>
                    <p className="mt-1 text-[0.7rem] text-[#6B7A99]">{r.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* What happens after approval */}
            <section className="rounded-2xl border border-[#D9E3F3] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">After Approval</p>
              <ol className="mt-4 space-y-3">
                {[
                  "You'll receive matched client requests directly.",
                  "Accept or decline leads — you're always in control.",
                  "Your profile appears in matching results for relevant clients.",
                  "Update your availability anytime from your dashboard.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#5D6B85]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-xs font-semibold text-[#356AF6]">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
