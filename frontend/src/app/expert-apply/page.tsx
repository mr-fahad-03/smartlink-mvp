"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  FileBadge2,
  Globe,
  MapPin,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  UserRound,
} from "lucide-react";

import { PageOrientation } from "@/components/navigation/page-orientation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const onboardingSteps = [
  {
    title: "Profile Details",
    detail: "Name, role, firm, service areas, rates, and short professional bio.",
  },
  {
    title: "Credentials & Verification",
    detail: "Identity check, references, proof of experience, and trust review.",
  },
  {
    title: "Business License / Certifications",
    detail: "Upload license, Chamber documents, and industry certifications.",
  },
  {
    title: "Admin Review",
    detail: "Our team approves, rejects, verifies, features, and controls visibility.",
  },
];

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
  | "portfolioUrlAdded"
  | "businessLicenseAttached"
  | "chamberMembershipAttached"
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
  portfolioUrlAdded: boolean;
  businessLicenseAttached: boolean;
  chamberMembershipAttached: boolean;
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
  portfolioUrlAdded: false,
  businessLicenseAttached: false,
  chamberMembershipAttached: false,
  certificationsProvided: false,
};

const verificationChecklist = [
  { key: "governmentIdUploaded", label: "Government-issued ID uploaded" },
  { key: "professionalHeadshotUploaded", label: "Professional headshot included" },
  { key: "businessLicenseAttached", label: "Business license attached" },
  { key: "certificationsProvided", label: "Certifications provided" },
  { key: "referenceContactsReady", label: "References ready for review" },
] as const satisfies ReadonlyArray<{ key: ExpertDraftBooleanField; label: string }>;

const credentialFields = [
  { label: "Government ID", key: "governmentIdUploaded" },
  { label: "Professional Headshot", key: "professionalHeadshotUploaded" },
  { label: "Reference Contacts", key: "referenceContactsReady" },
  { label: "LinkedIn / Portfolio URL", key: "portfolioUrlAdded" },
] as const satisfies ReadonlyArray<{ label: string; key: ExpertDraftBooleanField }>;

const licenseFields = [
  { label: "Business License", key: "businessLicenseAttached" },
  { label: "Chamber Membership", key: "chamberMembershipAttached" },
  { label: "Industry Certifications", key: "certificationsProvided" },
] as const satisfies ReadonlyArray<{ label: string; key: ExpertDraftBooleanField }>;

const profileFieldKeys: (keyof ExpertApplicationDraft)[] = [
  "fullName",
  "professionalTitle",
  "businessName",
  "workEmail",
  "phoneNumber",
  "primaryLocation",
  "mainSpecialization",
  "hourlyRate",
  "shortBio",
  "availabilityStatus",
  "maxClientsPerWeek",
  "preferredWorkTypes",
];

const requiredFieldKeys: (keyof ExpertApplicationDraft)[] = [
  "fullName",
  "professionalTitle",
  "businessName",
  "workEmail",
  "primaryLocation",
  "mainSpecialization",
  "shortBio",
];

function calculateProfileStrength(draft: ExpertApplicationDraft) {
  const hasValue = (key: keyof ExpertApplicationDraft) => {
    const value = draft[key];
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  };

  const completedProfileFields = profileFieldKeys.filter((key) => {
    return hasValue(key);
  }).length;
  const completedCredentialItems = verificationChecklist.filter((item) => draft[item.key]).length;
  const completedRequiredFields = requiredFieldKeys.filter((key) => hasValue(key)).length;

  const completenessScore = (completedProfileFields / profileFieldKeys.length) * 45;
  const credentialsScore = (completedCredentialItems / verificationChecklist.length) * 30;
  const requiredScore = (completedRequiredFields / requiredFieldKeys.length) * 25;

  return {
    profileStrength: Math.round(completenessScore + credentialsScore + requiredScore),
    completedProfileFields,
    completedCredentialItems,
    completedRequiredFields,
  };
}

export default function ExpertApplyPage() {
  const [draft, setDraft] = useState<ExpertApplicationDraft>(defaultDraft);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Progress is stored only after you choose Save & Continue Later.");
  const profileMetrics = useMemo(() => calculateProfileStrength(draft), [draft]);
  const profileStrength = profileMetrics.profileStrength;

  useEffect(() => {
    const storedDraft = globalThis.localStorage?.getItem(EXPERT_DRAFT_STORAGE_KEY);
    if (!storedDraft) return;

    try {
      const parsedDraft = JSON.parse(storedDraft) as Partial<ExpertApplicationDraft>;
      setDraft((previous) => ({ ...previous, ...parsedDraft }));
      setHasLoadedDraft(true);
      setSaveMessage("Saved draft restored from this device.");
    } catch {
      setSaveMessage("We found a saved draft, but it could not be restored cleanly.");
    }
  }, []);

  const updateDraftField = <K extends keyof ExpertApplicationDraft>(field: K, value: ExpertApplicationDraft[K]) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const toggleDraftFlag = (
    field: ExpertDraftBooleanField,
  ) => {
    setDraft((previous) => ({ ...previous, [field]: !previous[field] }));
  };

  const handleSaveDraft = () => {
    globalThis.localStorage?.setItem(EXPERT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setSaveMessage("Progress saved. You can return later on this device and continue.");
    setHasLoadedDraft(true);
  };

  const handleClearDraft = () => {
    globalThis.localStorage?.removeItem(EXPERT_DRAFT_STORAGE_KEY);
    setDraft(defaultDraft);
    setHasLoadedDraft(false);
    setSaveMessage("Saved draft cleared from this device.");
  };

  const previewInitials =
    draft.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SL";

  return (
    <main className="sl-page min-h-screen text-[#111827]">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <PageOrientation
          fallbackHref="/"
          eyebrow="Expert Onboarding"
          title="Apply To Join The SmartLink Expert Network"
          description="A polished onboarding flow for professionals who want to join the marketplace with profile details, verification, business licensing, and certification review."
          currentView="Expert Application"
          stepLabel="Onboarding Flow"
          nextLabel="Complete profile details first, then upload verification and compliance documents for review."
        />

        <section className="mt-6 rounded-[30px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
          <div className="max-w-3xl">
            <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
              Why This Matters
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#111827]">
              This onboarding is not just a form.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#5D6B85]">
              It is the entry point for expert quality, supply growth, and long-term marketplace trust.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Expert Supply Funnel",
                detail: "This flow brings strong experts into the network and prepares them to receive qualified client requests.",
              },
              {
                title: "Quality Control System",
                detail: "Structured fields, verification, and review signals help keep the marketplace trustworthy and reliable.",
              },
              {
                title: "Marketplace Foundation",
                detail: "The onboarding data shapes future matching, lead tracking, monetization, and performance visibility.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-[#D9E3F3] bg-white p-5 shadow-[0_10px_24px_rgba(56,75,107,0.05)]"
              >
                <h3 className="text-lg font-semibold text-[#111827]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5D6B85]">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {onboardingSteps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[24px] border border-[#D9E3F3] bg-white p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)]"
            >
              <span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                Step {index + 1}
              </span>
              <h2 className="mt-4 text-lg font-semibold text-[#111827]">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">{step.detail}</p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-[#111827]">Expert Application Form</h2>
                <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                  UI mockup only. No submission logic yet.
                </p>
              </div>
              <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                Review SLA: 2 Business Days
              </Badge>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                    Profile Strength
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#111827]">
                    Your profile strength: {profileStrength}%
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5D6B85]">
                    This score is based on profile completeness, uploaded credentials, and completion of required fields.
                  </p>
                </div>
                <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                  {profileStrength >= 80 ? "Review Ready" : "In Progress"}
                </Badge>
              </div>

              <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-[#E7EEFB]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#356AF6_0%,#6C8FFF_100%)]" style={{ width: `${profileStrength}%` }} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Profile Completeness</p>
                  <p className="mt-2 text-lg font-semibold text-[#111827]">{profileMetrics.completedProfileFields}/{profileFieldKeys.length}</p>
                </div>
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Credentials</p>
                  <p className="mt-2 text-lg font-semibold text-[#111827]">{profileMetrics.completedCredentialItems}/{verificationChecklist.length}</p>
                </div>
                <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Required Fields</p>
                  <p className="mt-2 text-lg font-semibold text-[#111827]">{profileMetrics.completedRequiredFields}/{requiredFieldKeys.length}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#5D6B85]">{saveMessage}</p>
            </div>

            <div className="mt-6 space-y-5">
              <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <UserRound className="h-4 w-4 text-[#356AF6]" />
                  Profile Details
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    { key: "fullName", label: "Full Name", placeholder: "Enter full name" },
                    { key: "professionalTitle", label: "Professional Title", placeholder: "e.g. Business Setup Advisor" },
                    { key: "businessName", label: "Business / Firm Name", placeholder: "Enter business or firm name" },
                    { key: "workEmail", label: "Work Email", placeholder: "name@business.com" },
                    { key: "phoneNumber", label: "Phone Number", placeholder: "+1 (242) 555-0101" },
                    { key: "primaryLocation", label: "Primary Location", placeholder: "Nassau, Bahamas" },
                    { key: "hourlyRate", label: "Estimated Hourly Rate", placeholder: "e.g. 175" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-sm font-medium text-[#111827]">{field.label}</label>
                      <input
                        value={draft[field.key as keyof ExpertApplicationDraft] as string}
                        onChange={(event) => updateDraftField(field.key as keyof ExpertApplicationDraft, event.target.value)}
                        placeholder={field.placeholder}
                        className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#111827]">Main Specialization</label>
                    <select
                      value={draft.mainSpecialization}
                      onChange={(event) => updateDraftField("mainSpecialization", event.target.value)}
                      className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                    >
                      <option value="">Select category</option>
                      {specializationOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {specializationOptions.map((category) => (
                        <span
                          key={category}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            draft.mainSpecialization === category
                              ? "border-[#356AF6] bg-[#EEF3FF] text-[#356AF6]"
                              : "border-[#D9E3F3] bg-[#F8FBFF] text-[#356AF6]"
                          }`}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <label className="text-sm font-medium text-[#111827]">Short Bio</label>
                  <textarea
                    value={draft.shortBio}
                    onChange={(event) => updateDraftField("shortBio", event.target.value)}
                    placeholder="Describe your experience, industries served, and the type of problems you solve best."
                    className="min-h-[120px] w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </div>
              </article>

              <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <ShieldCheck className="h-4 w-4 text-[#356AF6]" />
                  Credentials & Verification
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {credentialFields.map((field) => (
                    <div key={field.label} className="rounded-2xl border border-dashed border-[#C8D6EE] bg-white p-4">
                      <p className="text-sm font-medium text-[#111827]">{field.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#7B89A2]">
                        Upload or connect supporting verification material.
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleDraftFlag(field.key)}
                        className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                          draft[field.key]
                            ? "bg-[#EBF8EF] text-[#15803D]"
                            : "bg-[#EEF3FF] text-[#356AF6]"
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {draft[field.key] ? "Added" : "Upload"}
                      </button>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <FileBadge2 className="h-4 w-4 text-[#356AF6]" />
                  Business License / Certifications
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {licenseFields.map((field) => (
                    <div key={field.label} className="rounded-2xl border border-dashed border-[#C8D6EE] bg-white p-4">
                      <p className="text-sm font-medium text-[#111827]">{field.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#7B89A2]">
                        Attach the latest approved document for admin review.
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleDraftFlag(field.key)}
                        className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                          draft[field.key]
                            ? "bg-[#EBF8EF] text-[#15803D]"
                            : "bg-[#EEF3FF] text-[#356AF6]"
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {draft[field.key] ? "Added" : "Upload"}
                      </button>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <Sparkles className="h-4 w-4 text-[#356AF6]" />
                  Availability Settings
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#111827]">Availability Status</label>
                    <select
                      value={draft.availabilityStatus}
                      onChange={(event) => updateDraftField("availabilityStatus", event.target.value)}
                      className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                    >
                      <option value="">Select availability</option>
                      {availabilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#111827]">Maximum Clients Per Week</label>
                    <input
                      value={draft.maxClientsPerWeek}
                      onChange={(event) => updateDraftField("maxClientsPerWeek", event.target.value)}
                      placeholder="e.g. 3 new clients per week"
                      className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-[#111827]">Preferred Types Of Work</label>
                    <textarea
                      value={draft.preferredWorkTypes}
                      onChange={(event) => updateDraftField("preferredWorkTypes", event.target.value)}
                      placeholder="e.g. licensing support, cybersecurity reviews, financial planning sessions, urgent troubleshooting, long-term advisory work"
                      className="min-h-[96px] w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-[#BFD0F8] bg-[#EEF3FF] px-4 py-3">
                  <p className="text-sm font-medium leading-6 text-[#356AF6]">
                    Experts who respond within 24 hours receive significantly more client requests.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                <BadgeCheck className="h-5 w-5 text-[#356AF6]" />
                Review Checklist
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                Strong profiles usually complete the core fields, upload proof, and remove admin review friction early.
              </p>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium leading-6 text-amber-800">
                  Applications may be declined if profiles are incomplete or experience is unclear.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                {verificationChecklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3"
                  >
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${draft[item.key] ? "text-[#16A34A]" : "text-[#A0AECB]"}`} />
                    <p className="text-sm leading-6 text-[#111827]">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                  <UserRound className="h-5 w-5 text-[#356AF6]" />
                  Profile Preview
                </h2>
                <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                  Live Preview
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                This is how your profile can appear to users when they browse matched experts.
              </p>

              <article className="mt-5 rounded-[24px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_12px_28px_rgba(56,75,107,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF3FF] text-lg font-semibold text-[#356AF6]">
                      {previewInitials}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#111827]">{draft.fullName || "Your Name"}</h3>
                      <p className="text-sm text-[#5D6B85]">
                        {draft.professionalTitle || "Professional Title"} at {draft.businessName || "Your Firm"}
                      </p>
                    </div>
                  </div>
                  <Badge className="h-auto rounded-full bg-[#EBF8EF] px-3 py-1 text-xs font-semibold text-[#15803D]">
                    {profileMetrics.completedCredentialItems >= 3 ? "Verification Ready" : "In Review"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(draft.mainSpecialization ? [draft.mainSpecialization, draft.preferredWorkTypes || "Preferred Work", draft.availabilityStatus || "Availability"] : ["Business Setup", "Licensing", "Compliance"]).map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#D9E3F3] bg-white px-3 py-1 text-xs font-semibold text-[#356AF6]"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Availability</p>
                    <p className="mt-2 text-sm font-semibold text-[#111827]">{draft.availabilityStatus || "Not set yet"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Estimated Rate</p>
                    <p className="mt-2 text-sm font-semibold text-[#111827]">{draft.hourlyRate ? `$${draft.hourlyRate}/hour` : "Not set yet"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-[#111827]">
                    <Star className="h-4 w-4 text-[#F59E0B]" />
                    Preview rating slot
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#5D6B85]">
                    <ShieldCheck className="h-4 w-4 text-[#356AF6]" />
                    Profile strength {profileStrength}%
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#5D6B85]">
                    <MapPin className="h-4 w-4 text-[#356AF6]" />
                    {draft.primaryLocation || "Primary location"}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-[#D9E3F3] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Why users may choose you</p>
                  <p className="mt-2 text-sm leading-6 text-[#111827]">
                    {draft.shortBio || "Add your experience and preferred work so users can quickly understand why they should request an introduction."}
                  </p>
                </div>
              </article>
            </section>

            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                      Review Process
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-[#111827]">
                      What happens after you apply
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                      This is usually handled behind the scenes, so it stays collapsed by default.
                    </p>
                  </div>
                  <span className="rounded-full border border-[#D9E3F3] bg-[#F8FBFF] px-3 py-1 text-xs font-semibold text-[#356AF6] transition group-open:bg-[#EEF3FF]">
                    Expand
                  </span>
                </summary>

                <div className="mt-5 grid gap-3">
                  {[
                    {
                      icon: ShieldCheck,
                      title: "Approve / Reject Experts",
                      detail: "Applications are reviewed before they appear in the marketplace.",
                    },
                    {
                      icon: BadgeCheck,
                      title: "Mark Verified / Featured",
                      detail: "Strong profiles can receive trust and visibility upgrades.",
                    },
                    {
                      icon: Globe,
                      title: "Control Visibility In Matching",
                      detail: "Admin can control which experts appear and how strongly they rank.",
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        key={item.title}
                        className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"
                      >
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#111827]">
                          <Icon className="h-4 w-4 text-[#356AF6]" />
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#5D6B85]">{item.detail}</p>
                      </article>
                    );
                  })}
                </div>
              </details>
            </section>

            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                <Globe className="h-5 w-5 text-[#356AF6]" />
                Example client requests you may receive
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  {
                    title: "Business owner in Nassau needs help with licensing",
                    detail: "Urgent request. Looking for a fast-response expert who can guide approvals and next steps.",
                    tone: "bg-[#EEF3FF] text-[#356AF6]",
                  },
                  {
                    title: "Individual needs financial advice before a major decision",
                    detail: "Guidance request. Looking for clear, practical support before moving forward.",
                    tone: "bg-[#EBF8EF] text-[#15803D]",
                  },
                ].map((request) => (
                  <article
                    key={request.title}
                    className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${request.tone}`}>
                        Match Preview
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#111827]">{request.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5D6B85]">{request.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                Application Actions
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                Save your progress locally, return later on this device, and keep building your marketplace-ready profile.
              </p>
              {hasLoadedDraft ? (
                <div className="mt-4 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3 text-sm text-[#111827]">
                  Draft detected on this device. You can keep editing, save again, or clear it.
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="rounded-xl border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                >
                  <Save className="h-4 w-4" />
                  Save & Continue Later
                </Button>
                <Button
                  type="button"
                  onClick={handleClearDraft}
                  variant="outline"
                  className="rounded-xl border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Saved Draft
                </Button>
                <Button className="rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8]">
                  Submit & Start Receiving Client Matches
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-[#D9E3F3] bg-white text-[#111827] hover:bg-[#F7FAFF]"
                >
                  <Link href="/admin">View Admin Review Screen</Link>
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
