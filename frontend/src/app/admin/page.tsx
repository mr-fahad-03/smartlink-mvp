import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileSearch,
  Mail,
  MailCheck,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

const navItems = [
  { key: "expert-applications", label: "Expert Applications", icon: FileSearch },
  { key: "marketplace", label: "Market Place", icon: BadgeCheck },
  { key: "automated-emails", label: "Automated Emails", icon: MailCheck },
];

const applications = [
  {
    name: "Ana Khan",
    specialty: "Network Security",
    status: "Pending Review",
    submitted: "2 hours ago",
  },
  {
    name: "Daniel Cho",
    specialty: "Incident Response",
    status: "Shortlisted",
    submitted: "5 hours ago",
  },
  {
    name: "Sofia Ramirez",
    specialty: "Identity & Access Management",
    status: "Pending Review",
    submitted: "1 day ago",
  },
];

const marketplaceChecks = [
  "Expert profile completeness check",
  "Minimum rating threshold monitoring",
  "Service delivery SLA flagging",
  "Client complaint escalation tracking",
];

const emailFlows = [
  "Application received",
  "Application approved",
  "Application rejected",
  "Review follow-up reminder",
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(69,176,160,0.12),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.12),transparent_35%),#f4f7fb] text-[#111827]">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 p-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_20px_50px_rgba(17,24,39,0.1)] backdrop-blur-md">
          <div className="rounded-2xl bg-[#111827] px-4 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-300">SmartLinkBahamas</p>
            <h1 className="mt-1 text-lg font-semibold">Admin Panel</h1>
            <p className="mt-1 text-xs text-slate-300">UI Mockup Only</p>
          </div>

          <nav className="mt-5 space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
                    index === 0
                      ? "bg-[#45B0A0]/12 font-semibold text-[#2f8f90]"
                      : "text-[#4b5563] hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              <ShieldCheck className="h-4 w-4 text-[#2f8f90]" />
              Access Policy
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              MFA login, approval workflow, quality control, and email automation are visual-only in this version.
            </p>
          </div>
        </aside>

        <section className="space-y-6">
          <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_50px_rgba(17,24,39,0.1)]">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f8f90]">
              Admin Basics
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Expert Operations & Marketplace Control
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Clean admin shell with only the three core sections you requested.
            </p>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_14px_36px_rgba(17,24,39,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 text-lg font-semibold">
                  <FileSearch className="h-5 w-5 text-[#2f8f90]" />
                  Expert Applications
                </h3>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-[#6B7280]">
                  {applications.length} pending
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {applications.map((application) => (
                  <article
                    key={application.name}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{application.name}</p>
                        <p className="text-sm text-[#6B7280]">{application.specialty}</p>
                      </div>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        {application.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {application.submitted}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_14px_36px_rgba(17,24,39,0.08)]">
                <h3 className="inline-flex items-center gap-2 text-lg font-semibold">
                  <BadgeCheck className="h-5 w-5 text-[#2f8f90]" />
                  Market Place
                </h3>
                <ul className="mt-4 space-y-2">
                  {marketplaceChecks.map((check) => (
                    <li
                      key={check}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#4b5563]"
                    >
                      {check}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_14px_36px_rgba(17,24,39,0.08)]">
                <h3 className="inline-flex items-center gap-2 text-lg font-semibold">
                  <Mail className="h-5 w-5 text-[#2f8f90]" />
                  Automated Emails
                </h3>
                <div className="mt-4 space-y-2">
                  {emailFlows.map((flow) => (
                    <div
                      key={flow}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <p className="text-sm text-[#4b5563]">{flow}</p>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Enabled
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

