import Link from "next/link";
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  BarChart3,
  BellRing,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileSearch,
  Globe,
  Info,
  Mail,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Users,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";

import { InnerNav } from "@/components/navigation/inner-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


// ─── Side navigation modes ───────────────────────────────────────────────────
const sideNav = [
  { key: "review", label: "Review Mode", helper: "Applications & approvals", icon: FileSearch, active: true },
  { key: "marketplace", label: "Marketplace Mode", helper: "Visibility & ranking", icon: BadgeCheck, active: false },
  { key: "automation", label: "Automation Mode", helper: "Emails & follow-ups", icon: Mail, active: false },
  { key: "reports", label: "Reports", helper: "Leads, match & performance", icon: BarChart3, active: false },
  { key: "activity", label: "Activity Log", helper: "Audit trail", icon: Activity, active: false },
];

// ─── Application data ─────────────────────────────────────────────────────────
type AppStatus = "Ready to Approve" | "Needs Information" | "Under Review";

interface ApplicationCard {
  name: string;
  role: string;
  firm: string;
  specialty: string;
  submitted: string;
  profileCompletion: number;
  credentials: string;
  compliance: string;
  status: AppStatus;
  activityHistory: string[];
}

const applicationCards: ApplicationCard[] = [
  {
    name: "Ana Khan",
    role: "Principal Security Architect",
    firm: "Sentinel Forge",
    specialty: "Network Security",
    submitted: "2 hours ago",
    profileCompletion: 96,
    credentials: "ID verified · 3 certifications uploaded",
    compliance: "Business license attached · Chamber letter included",
    status: "Under Review",
    activityHistory: ["Submitted 2 hours ago", "Auto-check passed"],
  },
  {
    name: "Daniel Cho",
    role: "Incident Response Lead",
    firm: "BlueTrace Labs",
    specialty: "Endpoint Security",
    submitted: "5 hours ago",
    profileCompletion: 72,
    credentials: "Identity check complete · Insurance pending",
    compliance: "License review incomplete",
    status: "Needs Information",
    activityHistory: ["Submitted 5 hours ago", "Info requested by Admin on Apr 7"],
  },
  {
    name: "Sofia Ramirez",
    role: "IAM Program Consultant",
    firm: "AccessGrid Advisory",
    specialty: "Cloud Security",
    submitted: "1 day ago",
    profileCompletion: 94,
    credentials: "Identity verified · 4 certifications uploaded",
    compliance: "License complete · References approved",
    status: "Ready to Approve",
    activityHistory: ["Submitted 1 day ago", "All docs verified", "Flagged as Ready by Admin on Apr 6"],
  },
];

function getStatusStyle(status: AppStatus) {
  if (status === "Ready to Approve") return { badge: "bg-[#EBF8EF] text-[#15803D]", bar: "bg-[#22C55E]" };
  if (status === "Needs Information") return { badge: "bg-[#FFF4D6] text-[#B7791F]", bar: "bg-[#F59E0B]" };
  return { badge: "bg-[#EEF3FF] text-[#356AF6]", bar: "bg-[#356AF6]" };
}

// ─── Marketplace data ─────────────────────────────────────────────────────────
type WeightLevel = "Low" | "Medium" | "High";

interface MarketplaceExpert {
  name: string;
  specialties: string;
  location: string;
  verified: boolean;
  featured: boolean;
  visible: boolean;
  rankingWeight: WeightLevel;
  leadTier: "Standard" | "Premium";
  response: string;
}

const marketplaceExperts: MarketplaceExpert[] = [
  { name: "Ana Khan", specialties: "Operations, Growth, Legal Help", location: "Nassau", verified: true, featured: true, visible: true, rankingWeight: "High", leadTier: "Premium", response: "Fast Response" },
  { name: "Daniel Cho", specialties: "Cybersecurity, Systems, Personal Tech", location: "Grand Bahama", verified: true, featured: false, visible: false, rankingWeight: "Medium", leadTier: "Premium", response: "This Week" },
  { name: "Sofia Ramirez", specialties: "Financial, Career, Operations", location: "Remote / Nassau", verified: false, featured: true, visible: true, rankingWeight: "Low", leadTier: "Standard", response: "Fast Response" },
];

// ─── Matching criteria ────────────────────────────────────────────────────────
interface MatchingCriterion {
  factor: string;
  weight: WeightLevel;
  description: string;
}

const matchingCriteria: MatchingCriterion[] = [
  { factor: "Expertise Match", weight: "High", description: "How closely the expert's specialty aligns with the client's problem" },
  { factor: "Urgency Alignment", weight: "High", description: "Whether the expert can respond within the client's required timeframe" },
  { factor: "Location / Proximity", weight: "Medium", description: "Same island or remote-friendly preference" },
  { factor: "Availability", weight: "Medium", description: "Current capacity and preferred work schedule" },
  { factor: "Prior Experience", weight: "Low", description: "Client's past consulting experience affecting match sensitivity" },
];

function getWeightStyle(w: WeightLevel) {
  if (w === "High") return "bg-[#EBF8EF] text-[#15803D]";
  if (w === "Medium") return "bg-[#FFF4D6] text-[#B7791F]";
  return "bg-[#EEF3FF] text-[#356AF6]";
}

// ─── Email automation ─────────────────────────────────────────────────────────
const emailFlows = [
  { name: "Application Received", audience: "New expert applicants", status: "Enabled", detail: "Sent immediately after an expert submits their profile and documents." },
  { name: "Expert Approved", audience: "Approved experts", status: "Enabled", detail: "Includes onboarding steps, badge guidance, and marketplace expectations." },
  { name: "Expert Rejected", audience: "Rejected experts", status: "Enabled", detail: "Courteous outcome with improvement notes and reapplication guidance." },
  { name: "Follow-up to Client", audience: "Matched clients (24 hrs post-match)", status: "Enabled", detail: "Check-in email asking if the client connected with their matched expert." },
  { name: "Visibility Changed", audience: "Marketplace experts", status: "Draft", detail: "Notifies experts when they are featured, hidden, or restored." },
  { name: "Info Requested", audience: "Applicant with incomplete profile", status: "Enabled", detail: "Prompts applicant to complete missing documents or fields." },
];

// ─── Reports data ─────────────────────────────────────────────────────────────
const leadsReport = [
  { category: "Cybersecurity", count: 34, percentage: 40 },
  { category: "Business Setup", count: 26, percentage: 30 },
  { category: "Accounting", count: 17, percentage: 20 },
  { category: "Legal Help", count: 9, percentage: 10 },
];

const matchPerformance = [
  { expert: "Sofia Ramirez", matched: 18, selected: 12, rate: 67 },
  { expert: "Ana Khan", matched: 15, selected: 9, rate: 60 },
  { expert: "Daniel Cho", matched: 10, selected: 4, rate: 40 },
];

const expertPerformance = [
  { expert: "Sofia Ramirez", leads: 18, responded: 16, avgResponse: "3 hrs" },
  { expert: "Ana Khan", leads: 15, responded: 13, avgResponse: "5 hrs" },
  { expert: "Daniel Cho", leads: 10, responded: 6, avgResponse: "22 hrs" },
];

// ─── Activity log ─────────────────────────────────────────────────────────────
const activityLog = [
  { admin: "Admin", action: "Approved", target: "Sofia Ramirez", timestamp: "Apr 6, 2026 · 4:22 PM", notes: "" },
  { admin: "Admin", action: "Requested Info", target: "Daniel Cho", timestamp: "Apr 7, 2026 · 9:10 AM", notes: "Insurance certificate missing" },
  { admin: "Admin", action: "Changed Visibility", target: "Ana Khan", timestamp: "Apr 7, 2026 · 11:30 AM", notes: "Set to Hidden for profile update" },
  { admin: "Admin", action: "Rejected", target: "Marcus Lee", timestamp: "Apr 7, 2026 · 2:05 PM", notes: "License expired — asked to reapply with renewed documents" },
  { admin: "Admin", action: "Boosted Ranking", target: "Sofia Ramirez", timestamp: "Apr 8, 2026 · 8:45 AM", notes: "Promoted to High weight for Cybersecurity leads" },
];

function getActionStyle(action: string) {
  if (action === "Approved") return "bg-[#EBF8EF] text-[#15803D]";
  if (action === "Rejected") return "bg-[#FFF1F2] text-[#E11D48]";
  if (action === "Requested Info") return "bg-[#FFF4D6] text-[#B7791F]";
  if (action === "Changed Visibility") return "bg-[#EEF3FF] text-[#356AF6]";
  return "bg-[#F3EDFF] text-[#7C3AED]";
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  return (
    <main className="sl-page min-h-screen text-[#111827]">
      <div className="mx-auto grid w-full max-w-[1420px] gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">

        {/* ── Sidebar ── */}
        <aside className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
          <div className="rounded-[24px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#356AF6]">SmartLinkBahamas</p>
            <h1 className="mt-2 text-xl font-semibold text-[#111827]">Admin Control Tower</h1>
            <p className="mt-1 text-sm leading-6 text-[#5D6B85]">Expert onboarding, marketplace trust, automation, and reporting.</p>
          </div>

          <nav className="mt-6 space-y-2">
            {sideNav.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key} type="button" className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${item.active ? "border-[#BFD0F8] bg-[#EEF3FF]" : "border-transparent bg-transparent hover:border-[#D9E3F3] hover:bg-[#F7FAFF]"}`}>
                  <span className="inline-flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.active ? "bg-white text-[#356AF6]" : "bg-[#F4F7FC] text-[#7B89A2]"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className={`block text-sm font-semibold ${item.active ? "text-[#356AF6]" : "text-[#111827]"}`}>{item.label}</span>
                      <span className="mt-1 block text-xs text-[#7B89A2]">{item.helper}</span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#A0AECB]" />
                </button>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="mt-6 rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">Quick Actions</p>
            <div className="mt-3 space-y-2">
              <button type="button" className="flex w-full items-center gap-2 rounded-xl bg-[#356AF6] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#2C59D8]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve Next
              </button>
              <button type="button" className="flex w-full items-center gap-2 rounded-xl bg-[#FFF4D6] px-3 py-2.5 text-xs font-semibold text-[#B7791F]">
                <Clock3 className="h-3.5 w-3.5" /> Review Pending
              </button>
              <button type="button" className="flex w-full items-center gap-2 rounded-xl bg-[#EEF3FF] px-3 py-2.5 text-xs font-semibold text-[#356AF6]">
                <Info className="h-3.5 w-3.5" /> Request Info
              </button>
              <Button asChild className="flex w-full items-center gap-2 rounded-xl bg-white border border-[#D9E3F3] px-3 py-2.5 h-auto text-xs font-semibold text-[#111827] hover:bg-[#F7FAFF] shadow-none">
                <Link href="/expert-apply"><Plus className="h-3.5 w-3.5 mr-1" /> Add Expert</Link>
              </Button>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <section className="space-y-6">
          <InnerNav breadcrumb="Admin Dashboard" />

          {/* ── Priority Action Panel ── */}
          <div className="rounded-[28px] border border-[#FED7A0] bg-[#FFFBF0] p-5 shadow-[0_8px_20px_rgba(251,191,36,0.08)]">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#B7791F]">
              <AlertCircle className="h-4 w-4" /> Priority Actions — Requires Attention
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button type="button" className="rounded-2xl border border-[#FED7A0] bg-white px-4 py-3 text-left transition hover:border-[#F59E0B] hover:shadow-sm">
                <p className="text-sm font-semibold text-[#111827]">1 Ready to Approve</p>
                <p className="mt-1 text-xs text-[#7B89A2]">Sofia Ramirez — all docs verified</p>
              </button>
              <button type="button" className="rounded-2xl border border-[#FED7A0] bg-white px-4 py-3 text-left transition hover:border-[#F59E0B] hover:shadow-sm">
                <p className="text-sm font-semibold text-[#111827]">1 Needs Information</p>
                <p className="mt-1 text-xs text-[#7B89A2]">Daniel Cho — insurance pending</p>
              </button>
              <button type="button" className="rounded-2xl border border-[#FED7A0] bg-white px-4 py-3 text-left transition hover:border-[#F59E0B] hover:shadow-sm">
                <p className="text-sm font-semibold text-[#111827]">1 Under Review</p>
                <p className="mt-1 text-xs text-[#7B89A2]">Ana Khan — submitted 2 hrs ago</p>
              </button>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Pending Applications", value: "08", tone: "text-[#B7791F]" },
              { label: "Ready to Approve", value: "03", tone: "text-[#15803D]" },
              { label: "Verified Experts", value: "41", tone: "text-[#356AF6]" },
              { label: "Total Leads (MTD)", value: "86", tone: "text-[#7C3AED]" },
            ].map((stat) => (
              <article key={stat.label} className="rounded-[24px] border border-[#D9E3F3] bg-white p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)]">
                <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">{stat.label}</p>
                <p className={`mt-3 text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
              </article>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════
              REVIEW MODE
          ══════════════════════════════════════════════════════ */}
          <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                  <FileSearch className="h-5 w-5 text-[#356AF6]" /> Review Queue
                </h2>
                <p className="mt-1 text-sm text-[#5D6B85]">Approve immediately, reject with a reason, or request missing information.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["Ready to Approve", "Needs Information", "Under Review"] as AppStatus[]).map((s) => (
                  <button key={s} type="button" className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(s).badge}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              {applicationCards.map((app) => {
                const style = getStatusStyle(app.status);
                return (
                  <article key={app.name} className="flex flex-col rounded-[26px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-[#111827]">{app.name}</p>
                        <p className="mt-1 text-sm text-[#5D6B85]">{app.role} · {app.firm}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>{app.status}</span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-[#7B89A2]">
                        <span>Profile completion</span>
                        <span className="font-semibold text-[#111827]">{app.profileCompletion}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#E5EDFB]">
                        <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${app.profileCompletion}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#356AF6]" />
                        <span className="text-[#5D6B85]">{app.credentials}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#356AF6]" />
                        <span className="text-[#5D6B85]">{app.compliance}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#356AF6]" />
                        <span className="text-[#5D6B85]">{app.specialty} · {app.submitted}</span>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-[#EEF3FF] bg-[#F7FAFF] px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Profile History</p>
                      {app.activityHistory.map((entry) => (
                        <p key={entry} className="mt-1 text-xs text-[#5D6B85]">· {entry}</p>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-[#EBF8EF] px-3 py-2 text-xs font-semibold text-[#15803D] transition hover:bg-[#D1FAE5]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF1F2] px-3 py-2 text-xs font-semibold text-[#E11D48] transition hover:bg-[#FFE4E6]">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFF4D6] px-3 py-2 text-xs font-semibold text-[#B7791F] transition hover:bg-[#FEF3C7]">
                        <Info className="h-3.5 w-3.5" /> Request Info
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* No-match fallback note */}
            <div className="mt-5 rounded-[22px] border border-[#D9E3F3] bg-[#F7FAFF] px-5 py-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                <AlertCircle className="h-4 w-4 text-[#F59E0B]" /> Lead Routing — No Match Fallback
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                If no experts are found for a lead, the system sends the client a &quot;We&apos;re finding the right match&quot; message and flags the lead here for manual follow-up. Admin can assign an expert directly or contact the client.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              MARKETPLACE MODE
          ══════════════════════════════════════════════════════ */}
          <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                  <BadgeCheck className="h-5 w-5 text-[#356AF6]" /> Marketplace Controls
                </h2>
                <p className="mt-1 text-sm text-[#5D6B85]">Toggle visibility (on/off), adjust ranking weight, and boost experts. Preview live matching results.</p>
              </div>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#D9E3F3] bg-[#EEF3FF] px-4 py-2 text-xs font-semibold text-[#356AF6] transition hover:bg-[#E0ECFF]">
                <Eye className="h-3.5 w-3.5" /> Preview Matching Results
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-[#D9E3F3]">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.9fr_1.1fr_0.9fr_0.7fr] bg-[#F7FAFF] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                <p>Expert</p><p>Trust</p><p>Visibility</p><p>Ranking Weight</p><p>Lead Tier</p><p>Boost</p>
              </div>
              {marketplaceExperts.map((expert) => (
                <div key={expert.name} className="grid grid-cols-[1.4fr_0.8fr_0.9fr_1.1fr_0.9fr_0.7fr] items-center gap-3 border-t border-[#EEF2FA] px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{expert.name}</p>
                    <p className="mt-0.5 text-xs text-[#5D6B85]">{expert.specialties}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#7B89A2]">
                      <Clock3 className="h-3 w-3" />{expert.location} · {expert.response}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {expert.verified && <span className="rounded-full bg-[#EBF8EF] px-2 py-0.5 text-xs font-semibold text-[#15803D]">Verified</span>}
                    {expert.featured && <span className="rounded-full bg-[#F3EDFF] px-2 py-0.5 text-xs font-semibold text-[#7C3AED]">Featured</span>}
                  </div>
                  <div>
                    <button type="button" className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${expert.visible ? "bg-[#EBF8EF] text-[#15803D] hover:bg-[#D1FAE5]" : "bg-[#FFF1F2] text-[#E11D48] hover:bg-[#FFE4E6]"}`}>
                      {expert.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {expert.visible ? "Visible" : "Hidden"}
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {(["Low", "Medium", "High"] as WeightLevel[]).map((w) => (
                      <button key={w} type="button" className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${expert.rankingWeight === w ? getWeightStyle(w) : "bg-[#F4F7FC] text-[#7B89A2] hover:bg-[#EEF3FF]"}`}>{w}</button>
                    ))}
                  </div>
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${expert.leadTier === "Premium" ? "bg-[#FFF4D6] text-[#B7791F]" : "bg-[#EEF3FF] text-[#356AF6]"}`}>{expert.leadTier}</span>
                  </div>
                  <div>
                    <button type="button" className="inline-flex items-center gap-1 rounded-xl bg-[#F3EDFF] px-3 py-1.5 text-xs font-semibold text-[#7C3AED] transition hover:bg-[#EDE9FE]">
                      <Sparkles className="h-3.5 w-3.5" /> Boost
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Matching Criteria ── */}
          <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div>
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                <Sliders className="h-5 w-5 text-[#356AF6]" /> Matching Criteria
              </h2>
              <p className="mt-1 text-sm text-[#5D6B85]">Adjust the weight for each matching factor. No formulas — just Low / Medium / High.</p>
            </div>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-[#D9E3F3]">
              <div className="grid grid-cols-[2fr_1.2fr_2fr] bg-[#F7FAFF] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                <p>Factor</p><p>Weight</p><p>Description</p>
              </div>
              {matchingCriteria.map((c) => (
                <div key={c.factor} className="grid grid-cols-[2fr_1.2fr_2fr] items-center gap-4 border-t border-[#EEF2FA] px-5 py-4">
                  <p className="text-sm font-semibold text-[#111827]">{c.factor}</p>
                  <div className="flex gap-1">
                    {(["Low", "Medium", "High"] as WeightLevel[]).map((w) => (
                      <button key={w} type="button" className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${c.weight === w ? getWeightStyle(w) : "bg-[#F4F7FC] text-[#7B89A2] hover:bg-[#EEF3FF]"}`}>{w}</button>
                    ))}
                  </div>
                  <p className="text-sm text-[#5D6B85]">{c.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              AUTOMATION MODE
          ══════════════════════════════════════════════════════ */}
          <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div>
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                <Mail className="h-5 w-5 text-[#356AF6]" /> Automation Mode
              </h2>
              <p className="mt-1 text-sm text-[#5D6B85]">Triggered emails for applicants, clients, and experts. Includes follow-up and response tracking.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {emailFlows.map((flow) => (
                <article key={flow.name} className="rounded-[22px] border border-[#D9E3F3] bg-[#FCFDFF] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{flow.name}</p>
                      <p className="mt-1 text-xs text-[#7B89A2]">{flow.audience}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${flow.status === "Enabled" ? "bg-[#EBF8EF] text-[#15803D]" : "bg-[#FFF4D6] text-[#B7791F]"}`}>{flow.status}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{flow.detail}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-[22px] border border-[#D9E3F3] bg-[#F7FAFF] px-4 py-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                <MessageSquare className="h-4 w-4 text-[#356AF6]" /> Expert Response Tracking
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5D6B85]">
                The system tracks whether experts respond to leads and records response time. A follow-up email to the client is triggered automatically at 24 hours if no response is detected.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              REPORTS
          ══════════════════════════════════════════════════════ */}
          <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                  <BarChart3 className="h-5 w-5 text-[#356AF6]" /> Reports
                </h2>
                <p className="mt-1 text-sm text-[#5D6B85]">Leads, match performance, and expert activity. Export as CSV.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E3F3] bg-[#F7FAFF] px-3 py-2 text-xs font-semibold text-[#5D6B85] transition hover:bg-[#EEF3FF]">
                  Last 30 days ▾
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-[#356AF6] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#2C59D8]">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {/* Leads by category */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Leads by Category</p>
                <div className="overflow-hidden rounded-[20px] border border-[#D9E3F3]">
                  <div className="grid grid-cols-3 bg-[#F7FAFF] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#7B89A2]">
                    <p>Category</p><p className="text-center">Leads</p><p className="text-right">Share</p>
                  </div>
                  {leadsReport.map((row) => (
                    <div key={row.category} className="grid grid-cols-3 items-center border-t border-[#EEF2FA] px-4 py-3">
                      <p className="text-sm font-medium text-[#111827]">{row.category}</p>
                      <p className="text-center text-sm font-semibold text-[#356AF6]">{row.count}</p>
                      <p className="text-right text-sm text-[#5D6B85]">{row.percentage}%</p>
                    </div>
                  ))}
                  <div className="border-t border-[#EEF2FA] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#111827]">Total</span>
                    <span className="text-xs font-semibold text-[#111827]">86 leads</span>
                  </div>
                </div>
              </div>

              {/* Match performance */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Match Performance</p>
                <div className="overflow-hidden rounded-[20px] border border-[#D9E3F3]">
                  <div className="grid grid-cols-3 bg-[#F7FAFF] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#7B89A2]">
                    <p>Expert</p><p className="text-center">Matched</p><p className="text-right">Selected</p>
                  </div>
                  {matchPerformance.map((row) => (
                    <div key={row.expert} className="grid grid-cols-3 items-center border-t border-[#EEF2FA] px-4 py-3">
                      <p className="text-sm font-medium text-[#111827]">{row.expert.split(" ")[0]}</p>
                      <p className="text-center text-sm text-[#5D6B85]">{row.matched}</p>
                      <p className="text-right text-sm font-semibold text-[#15803D]">{row.selected} <span className="text-xs text-[#7B89A2]">({row.rate}%)</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expert performance */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">Expert Performance</p>
                <div className="overflow-hidden rounded-[20px] border border-[#D9E3F3]">
                  <div className="grid grid-cols-3 bg-[#F7FAFF] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#7B89A2]">
                    <p>Expert</p><p className="text-center">Leads</p><p className="text-right">Avg. Response</p>
                  </div>
                  {expertPerformance.map((row) => (
                    <div key={row.expert} className="grid grid-cols-3 items-center border-t border-[#EEF2FA] px-4 py-3">
                      <p className="text-sm font-medium text-[#111827]">{row.expert.split(" ")[0]}</p>
                      <div className="text-center">
                        <span className="text-sm text-[#5D6B85]">{row.leads} </span>
                        <span className="text-xs text-[#7B89A2]">({row.responded} replied)</span>
                      </div>
                      <p className={`text-right text-sm font-semibold ${row.avgResponse === "3 hrs" || row.avgResponse === "5 hrs" ? "text-[#15803D]" : "text-[#E11D48]"}`}>{row.avgResponse}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              ACTIVITY LOG
          ══════════════════════════════════════════════════════ */}
          <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                  <Activity className="h-5 w-5 text-[#356AF6]" /> Activity Log
                </h2>
                <p className="mt-1 text-sm text-[#5D6B85]">Audit trail — approvals, rejections, visibility changes, and ranking updates.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E3F3] bg-[#F7FAFF] px-3 py-2 text-xs font-semibold text-[#5D6B85] transition hover:bg-[#EEF3FF]">
                  All Actions ▾
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E3F3] bg-[#F7FAFF] px-3 py-2 text-xs font-semibold text-[#5D6B85] transition hover:bg-[#EEF3FF]">
                  All Dates ▾
                </button>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-[#D9E3F3]">
              <div className="grid grid-cols-[1fr_1fr_1.2fr_1.5fr_1.8fr] bg-[#F7FAFF] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                <p>Admin</p><p>Action</p><p>Target</p><p>Timestamp</p><p>Notes</p>
              </div>
              {activityLog.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1.2fr_1.5fr_1.8fr] items-start gap-3 border-t border-[#EEF2FA] px-5 py-3.5">
                  <p className="text-sm font-medium text-[#111827]">{entry.admin}</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${getActionStyle(entry.action)}`}>{entry.action}</span>
                  <p className="text-sm text-[#5D6B85]">{entry.target}</p>
                  <p className="text-xs text-[#7B89A2]">{entry.timestamp}</p>
                  <p className="text-xs text-[#5D6B85]">{entry.notes || "—"}</p>
                </div>
              ))}
            </div>
          </section>

        </section>
      </div>
    </main>
  );
}
