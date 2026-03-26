import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  FileBadge2,
  Globe,
  ShieldCheck,
  Sparkles,
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

const verificationChecklist = [
  "Government-issued ID uploaded",
  "Professional headshot included",
  "Business license attached",
  "Certifications provided",
  "References ready for review",
];

export default function ExpertApplyPage() {
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

            <div className="mt-6 space-y-5">
              <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <UserRound className="h-4 w-4 text-[#356AF6]" />
                  Profile Details
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    "Full Name",
                    "Professional Title",
                    "Business / Firm Name",
                    "Work Email",
                    "Phone Number",
                    "Primary Location",
                    "Main Specialization",
                    "Estimated Hourly Rate",
                  ].map((field) => (
                    <div key={field} className="space-y-1.5">
                      <label className="text-sm font-medium text-[#111827]">{field}</label>
                      <div className="h-11 rounded-2xl border border-[#D9E3F3] bg-white px-4 text-sm text-[#A0AECB] flex items-center">
                        {field}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5">
                  <label className="text-sm font-medium text-[#111827]">Short Bio</label>
                  <div className="min-h-[120px] rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3 text-sm text-[#A0AECB]">
                    Describe your experience, industries served, and the type of business problems you solve best.
                  </div>
                </div>
              </article>

              <article className="rounded-[24px] border border-[#D9E3F3] bg-[#FCFDFF] p-5">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                  <ShieldCheck className="h-4 w-4 text-[#356AF6]" />
                  Credentials & Verification
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    "Government ID",
                    "Professional Headshot",
                    "Reference Contacts",
                    "LinkedIn / Portfolio URL",
                  ].map((field) => (
                    <div key={field} className="rounded-2xl border border-dashed border-[#C8D6EE] bg-white p-4">
                      <p className="text-sm font-medium text-[#111827]">{field}</p>
                      <p className="mt-1 text-xs leading-5 text-[#7B89A2]">
                        Upload or connect supporting verification material.
                      </p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#EEF3FF] px-3 py-2 text-xs font-semibold text-[#356AF6]"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
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
                  {[
                    "Business License",
                    "Chamber Membership",
                    "Industry Certifications",
                  ].map((field) => (
                    <div key={field} className="rounded-2xl border border-dashed border-[#C8D6EE] bg-white p-4">
                      <p className="text-sm font-medium text-[#111827]">{field}</p>
                      <p className="mt-1 text-xs leading-5 text-[#7B89A2]">
                        Attach the latest approved document for admin review.
                      </p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#EEF3FF] px-3 py-2 text-xs font-semibold text-[#356AF6]"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </button>
                    </div>
                  ))}
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
              <div className="mt-5 space-y-3">
                {verificationChecklist.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                    <p className="text-sm leading-6 text-[#111827]">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[#111827]">
                <Sparkles className="h-5 w-5 text-[#356AF6]" />
                What Admin Can Control
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Approve / Reject Experts",
                    detail: "Review submissions and decide who can enter the marketplace.",
                  },
                  {
                    icon: BadgeCheck,
                    title: "Mark Verified / Featured",
                    detail: "Apply trust and promotional flags to strong expert profiles.",
                  },
                  {
                    icon: Globe,
                    title: "Control Visibility In Matching",
                    detail: "Show, hide, or prioritize experts in SmartLink matching results.",
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
            </section>

            <section className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                Application Actions
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button className="rounded-xl bg-[#356AF6] text-white hover:bg-[#2C59D8]">
                  Submit For Review
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
