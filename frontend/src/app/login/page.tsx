import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { PageOrientation } from "@/components/navigation/page-orientation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="sl-page min-h-screen px-6 py-8 text-[#111827]">
      <div className="mx-auto w-full max-w-5xl">
        <PageOrientation
          fallbackHref="/"
          eyebrow="Admin Access"
          title="Admin Login Preview"
          description="Authentication is not implemented in the MVP yet, but this route is now available for review and leads into the admin mockup workspace."
          currentView="Login Page"
          stepLabel="Mockup Access"
          nextLabel="Continue into the admin panel basics for Milestone 1 review."
        />

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <Badge className="bg-[#EEF3FF] text-[#356AF6]">Milestone 1 Mockup</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#111827]">
              Admin panel access is ready for review
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#5D6B85]">
              This is a non-authenticated preview route so the admin panel can be reviewed without
              backend login logic yet.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Expert Applications",
                "Market Place",
                "Automated Emails",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3 text-sm font-medium text-[#111827]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
            <div className="rounded-[24px] border border-[#D9E3F3] bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#356AF6]">
                  <LockKeyhole className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                    Login Preview
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#111827]">
                    Mock access only
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Email</p>
                  <p className="mt-1 text-sm text-[#111827]">admin@smartlinkbahamas.com</p>
                </div>
                <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#7B89A2]">Security</p>
                  <p className="mt-1 text-sm text-[#111827]">MFA-ready placeholder for later implementation</p>
                </div>
                <div className="rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 py-3">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
                    <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                    No authentication logic yet, review mode only
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="h-11 rounded-xl bg-[#356AF6] px-5 text-white hover:bg-[#2C59D8]">
                  <Link href="/admin">Open Admin Panel</Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-xl border-[#D9E3F3] bg-white px-5 text-[#111827] hover:bg-[#F7FAFF]">
                  <Link href="/">Back Home</Link>
                </Button>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
