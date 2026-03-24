import {
  BadgeCheck,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  Mail,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const sideNav = [
  { key: "expert-applications", label: "Expert Applications", icon: FileSearch },
  { key: "marketplace", label: "Market Place", icon: BadgeCheck },
  { key: "automated-emails", label: "Automated Emails", icon: Mail },
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

const qualityPoints = [
  "Expert profile completeness and documentation checks",
  "Rating and dispute monitoring for marketplace trust",
  "Delivery SLA and response-time quality controls",
];

const emailFlows = [
  "Application received confirmation",
  "Approval notification with onboarding steps",
  "Rejection notification with improvement notes",
  "Reminder email for pending reviewer action",
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F8F9FA_100%)] text-[#111827]">
      <div className="mx-auto grid w-full max-w-[1360px] gap-6 px-6 py-8 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
          <div className="rounded-2xl border border-slate-200 bg-[#F8F9FA] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#45B0A0]">
              SmartLinkBahamas
            </p>
            <h1 className="mt-1 text-lg font-semibold text-[#111827]">Admin Panel</h1>
            <p className="mt-1 text-xs text-[#6B7280]">UI Mockup Only</p>
          </div>

          <nav className="mt-5 space-y-2">
            {sideNav.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    index === 0
                      ? "border border-[#45B0A0]/25 bg-[#45B0A0]/10 font-semibold text-[#2f8f90]"
                      : "border border-transparent text-[#4b5563] hover:border-slate-200 hover:bg-[#F8F9FA]"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-[#45B0A0]/25 bg-[#45B0A0]/8 p-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2f8f90]">
              <ShieldCheck className="h-4 w-4" />
              Admin Scope
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Expert review, marketplace quality, and automated email control screens only.
            </p>
          </div>
        </aside>

        <section className="space-y-6">
          <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#45B0A0]">
              Admin Basics
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
                  Marketplace Operations Console
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Professional UI shell for core admin workflows. No backend functionality is connected yet.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-[#F8F9FA] px-3 py-1 text-xs font-semibold text-[#6B7280]">
                Last updated: Just now
              </span>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">Applications Pending</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">08</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">Quality Flags</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">03</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">Email Flows Active</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">12</p>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#111827]">
                  <FileSearch className="h-5 w-5 text-[#45B0A0]" />
                  Expert Applications
                </h3>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {applications.length} in queue
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1.3fr_1fr_0.9fr_1fr] bg-[#F8F9FA] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  <p>Applicant</p>
                  <p>Specialty</p>
                  <p>Status</p>
                  <p>Actions</p>
                </div>
                {applications.map((application) => (
                  <div
                    key={application.name}
                    className="grid grid-cols-[1.3fr_1fr_0.9fr_1fr] items-center border-t border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{application.name}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#6B7280]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {application.submitted}
                      </p>
                    </div>
                    <p className="text-sm text-[#4b5563]">{application.specialty}</p>
                    <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {application.status}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
                <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#111827]">
                  <BadgeCheck className="h-5 w-5 text-[#45B0A0]" />
                  Market Place
                </h3>
                <div className="mt-4 space-y-2">
                  {qualityPoints.map((point) => (
                    <article key={point} className="rounded-xl border border-slate-200 bg-[#F8F9FA] px-3 py-2.5">
                      <p className="text-sm text-[#4b5563]">{point}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
                <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#111827]">
                  <Mail className="h-5 w-5 text-[#45B0A0]" />
                  Automated Emails
                </h3>
                <div className="mt-4 space-y-2">
                  {emailFlows.map((flow) => (
                    <div
                      key={flow}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F8F9FA] px-3 py-2"
                    >
                      <p className="text-sm text-[#4b5563]">{flow}</p>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Enabled
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                    <BellRing className="h-4 w-4 text-[#45B0A0]" />
                    Notification Preview
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    “Expert application approved. Onboarding email sent automatically.”
                  </p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

