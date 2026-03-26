import Link from "next/link";
import {
  BadgeCheck,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileSearch,
  Globe,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  XCircle,
} from "lucide-react";

import { PageOrientation } from "@/components/navigation/page-orientation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sideNav = [
  {
    key: "expert-applications",
    label: "Expert Applications",
    helper: "Review submissions",
    icon: FileSearch,
    active: true,
  },
  {
    key: "marketplace",
    label: "Market Place",
    helper: "Control expert visibility",
    icon: BadgeCheck,
    active: false,
  },
  {
    key: "automated-emails",
    label: "Automated Emails",
    helper: "Notification flows",
    icon: Mail,
    active: false,
  },
];

const applicationCards = [
  {
    name: "Ana Khan",
    role: "Principal Security Architect",
    firm: "Sentinel Forge",
    specialty: "Network Security",
    submitted: "2 hours ago",
    profileCompletion: "96%",
    credentials: "ID verified, 3 certifications uploaded",
    compliance: "Business license and Chamber letter attached",
    statusTone: "bg-[#FFF4D6] text-[#B7791F]",
    statusLabel: "Pending Review",
  },
  {
    name: "Daniel Cho",
    role: "Incident Response Lead",
    firm: "BlueTrace Labs",
    specialty: "Endpoint Security",
    submitted: "5 hours ago",
    profileCompletion: "91%",
    credentials: "Identity check complete, 2 certifications uploaded",
    compliance: "License review complete, insurance pending",
    statusTone: "bg-[#EEF3FF] text-[#356AF6]",
    statusLabel: "Final Check",
  },
  {
    name: "Sofia Ramirez",
    role: "IAM Program Consultant",
    firm: "AccessGrid Advisory",
    specialty: "Cloud Security",
    submitted: "1 day ago",
    profileCompletion: "94%",
    credentials: "Identity verified, 4 certifications uploaded",
    compliance: "License complete, references approved",
    statusTone: "bg-[#F3EDFF] text-[#7C3AED]",
    statusLabel: "Ready To Approve",
  },
];

const marketplaceControls = [
  {
    name: "Ana Khan",
    specialties: "Business Setup, Licenses & Approvals",
    location: "Nassau",
    trustState: ["Verified", "Featured"],
    visibility: "Visible In Matching",
    response: "Fast Response",
    leadTier: "Premium",
    rankingBoost: "+6",
  },
  {
    name: "Daniel Cho",
    specialties: "IT & Cybersecurity, General Business Support",
    location: "Grand Bahama",
    trustState: ["Verified"],
    visibility: "Priority Only",
    response: "Available This Week",
    leadTier: "Premium",
    rankingBoost: "+10",
  },
  {
    name: "Sofia Ramirez",
    specialties: "Accounting & Finance, General Business Support",
    location: "Remote / Nassau",
    trustState: ["Featured"],
    visibility: "Visible In Matching",
    response: "Fast Response",
    leadTier: "Standard",
    rankingBoost: "+0",
  },
];

const emailFlows = [
  {
    name: "Application Received",
    audience: "All new expert applicants",
    status: "Enabled",
    detail: "Sent immediately after an expert submits profile, credentials, and license documents.",
  },
  {
    name: "Expert Approved",
    audience: "Approved experts",
    status: "Enabled",
    detail: "Includes next onboarding steps, verification badge guidance, and marketplace expectations.",
  },
  {
    name: "Expert Rejected",
    audience: "Rejected experts",
    status: "Enabled",
    detail: "Shares a courteous outcome with improvement notes and reapplication guidance.",
  },
  {
    name: "Visibility Changed",
    audience: "Existing marketplace experts",
    status: "Draft",
    detail: "Notifies experts when they are featured, hidden, or restored to matching visibility.",
  },
];

function getVisibilityTone(value: string) {
  if (value === "Visible In Matching") {
    return "bg-[#EBF8EF] text-[#15803D]";
  }
  if (value === "Priority Only") {
    return "bg-[#EEF3FF] text-[#356AF6]";
  }
  return "bg-[#FFF1F2] text-[#E11D48]";
}

export default function AdminPage() {
  return (
    <main className="sl-page min-h-screen text-[#111827]">
      <div className="mx-auto grid w-full max-w-[1420px] gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
          <div className="rounded-[24px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
              SmartLinkBahamas
            </p>
            <h1 className="mt-2 text-xl font-semibold text-[#111827]">Admin Control</h1>
            <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
              Expert onboarding review, marketplace trust, and automated communication controls.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {sideNav.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    item.active
                      ? "border-[#BFD0F8] bg-[#EEF3FF]"
                      : "border-transparent bg-transparent hover:border-[#D9E3F3] hover:bg-[#F7FAFF]"
                  }`}
                >
                  <span className="inline-flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                        item.active ? "bg-white text-[#356AF6]" : "bg-[#F4F7FC] text-[#7B89A2]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className={`block text-sm font-semibold ${item.active ? "text-[#356AF6]" : "text-[#111827]"}`}>
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs text-[#7B89A2]">{item.helper}</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#A0AECB]" />
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
              <ShieldCheck className="h-4 w-4" />
              Marketplace Controls
            </p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-[#5D6B85]">
                <p>Approve or reject expert applications.</p>
                <p>Mark experts as Verified or Featured.</p>
                <p>Control whether experts appear in matching results.</p>
                <p>Prepare lead tiers and ranking controls for future monetization.</p>
              </div>
            <Button
              asChild
              className="mt-4 h-10 w-full rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8]"
            >
              <Link href="/expert-apply">Preview Expert Application</Link>
            </Button>
          </div>
        </aside>

        <section className="space-y-6">
          <PageOrientation
            fallbackHref="/"
            eyebrow="Admin Basics"
            title="Expert Onboarding & Marketplace Control"
            description="Review expert applications, validate credentials, approve trusted providers, and control exactly who appears in SmartLink matching."
            currentView="Admin Dashboard"
            stepLabel="Operations Workspace"
            nextLabel="Approve qualified experts, then set verification, featured status, and matching visibility."
          />

          <div className="grid gap-4 md:grid-cols-4">
            <article className="rounded-[24px] border border-[#D9E3F3] bg-white p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)]">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Pending Applications</p>
              <p className="mt-3 text-3xl font-semibold text-[#111827]">08</p>
            </article>
            <article className="rounded-[24px] border border-[#D9E3F3] bg-white p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)]">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Ready To Publish</p>
              <p className="mt-3 text-3xl font-semibold text-[#111827]">03</p>
            </article>
            <article className="rounded-[24px] border border-[#D9E3F3] bg-white p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)]">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Verified Experts</p>
              <p className="mt-3 text-3xl font-semibold text-[#111827]">41</p>
            </article>
            <article className="rounded-[24px] border border-[#D9E3F3] bg-white p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)]">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Visibility Changes</p>
              <p className="mt-3 text-3xl font-semibold text-[#111827]">06</p>
            </article>
          </div>

          <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                  <FileSearch className="h-5 w-5 text-[#356AF6]" />
                  Expert Applications
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                  Each application includes profile details, verification status, business license review, and certification readiness.
                </p>
              </div>
              <Badge className="h-auto rounded-full bg-[#FFF4D6] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#B7791F]">
                {applicationCards.length} In Review
              </Badge>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              {applicationCards.map((application) => (
                <article
                  key={application.name}
                  className="rounded-[26px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[#111827]">{application.name}</p>
                      <p className="mt-1 text-sm text-[#5D6B85]">
                        {application.role} at {application.firm}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${application.statusTone}`}>
                      {application.statusLabel}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                        <UserRound className="h-4 w-4 text-[#356AF6]" />
                        Profile Details
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#111827]">{application.specialty}</p>
                      <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                        Profile completion: {application.profileCompletion}
                      </p>
                      <p className="mt-1 text-xs text-[#7B89A2]">Submitted {application.submitted}</p>
                    </div>

                    <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                        <ShieldCheck className="h-4 w-4 text-[#356AF6]" />
                        Credentials & Verification
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#111827]">{application.credentials}</p>
                    </div>

                    <div className="rounded-2xl border border-[#D9E3F3] bg-white p-4">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                        <Globe className="h-4 w-4 text-[#356AF6]" />
                        Business License / Certifications
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#111827]">{application.compliance}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#EBF8EF] px-3 py-2 text-xs font-semibold text-[#15803D]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FFF1F2] px-3 py-2 text-xs font-semibold text-[#E11D48]"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#EEF3FF] px-3 py-2 text-xs font-semibold text-[#356AF6]"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Mark Verified
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F3EDFF] px-3 py-2 text-xs font-semibold text-[#7C3AED]"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Feature
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                    <BadgeCheck className="h-5 w-5 text-[#356AF6]" />
                    Marketplace Controls
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                    Mark experts as Verified or Featured, decide whether they appear in matching results, and prepare lead/ranking controls for future monetization.
                  </p>
                </div>
                <Badge className="h-auto rounded-full bg-[#EEF3FF] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                  Matching Visibility
                </Badge>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-[#D9E3F3]">
                <div className="grid grid-cols-[1.2fr_0.95fr_0.95fr_0.95fr_0.95fr_0.8fr] bg-[#F7FAFF] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <p>Expert</p>
                  <p>Trust Flags</p>
                  <p>Visibility</p>
                  <p>Matching Control</p>
                  <p>Lead Tier</p>
                  <p>Ranking</p>
                </div>
                {marketplaceControls.map((expert) => (
                  <div
                    key={expert.name}
                    className="grid grid-cols-[1.2fr_0.95fr_0.95fr_0.95fr_0.95fr_0.8fr] items-center gap-4 border-t border-[#EEF2FA] px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{expert.name}</p>
                      <p className="mt-1 text-sm text-[#5D6B85]">{expert.specialties}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#7B89A2]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {expert.location} | {expert.response}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {expert.trustState.map((flag) => (
                        <span
                          key={`${expert.name}-${flag}`}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            flag === "Verified"
                              ? "bg-[#EBF8EF] text-[#15803D]"
                              : "bg-[#F3EDFF] text-[#7C3AED]"
                          }`}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>

                    <div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getVisibilityTone(expert.visibility)}`}>
                        {expert.visibility}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-xl border border-[#D9E3F3] bg-white px-3 py-2 text-xs font-semibold text-[#111827]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Visible
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-xl border border-[#D9E3F3] bg-white px-3 py-2 text-xs font-semibold text-[#111827]"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Priority
                      </button>
                    </div>
                    <div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${expert.leadTier === "Premium" ? "bg-[#FFF4D6] text-[#B7791F]" : "bg-[#EEF3FF] text-[#356AF6]"}`}>
                        {expert.leadTier}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#111827]">{expert.rankingBoost}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#356AF6]" />
                <h2 className="text-xl font-semibold text-[#111827]">Automated Emails</h2>
              </div>
              <p className="mt-1 text-sm leading-6 text-[#5D6B85]">
                Triggered messages tied to expert applications, approvals, rejections, and marketplace visibility changes.
              </p>

              <div className="mt-5 space-y-3">
                {emailFlows.map((flow) => (
                  <article
                    key={flow.name}
                    className="rounded-[22px] border border-[#D9E3F3] bg-[#FCFDFF] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{flow.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7B89A2]">
                          {flow.audience}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          flow.status === "Enabled"
                            ? "bg-[#EBF8EF] text-[#15803D]"
                            : "bg-[#FFF4D6] text-[#B7791F]"
                        }`}
                      >
                        {flow.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{flow.detail}</p>
                  </article>
                ))}
              </div>

              <div className="mt-5 rounded-[22px] border border-[#D9E3F3] bg-[#F7FAFF] px-4 py-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <BellRing className="h-4 w-4 text-[#356AF6]" />
                  Notification Preview
                </p>
                <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                  &quot;Expert approved and marked Verified. Matching visibility is now active, and onboarding instructions were emailed automatically.&quot;
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
