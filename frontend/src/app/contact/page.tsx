import Link from "next/link";

import { PageOrientation } from "@/components/navigation/page-orientation";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <main className="sl-page min-h-screen px-6 py-8 text-[#111827]">
      <div className="mx-auto w-full max-w-5xl">
        <PageOrientation
          fallbackHref="/"
          eyebrow="Contact"
          title="Get in Touch"
          description="A lightweight contact page for the MVP so users always have a real destination from the landing page."
          currentView="Contact Page"
          stepLabel="Support Access"
          nextLabel="Return home or start the assessment when you are ready."
        />

        <section className="mt-6 rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
          <div className="space-y-4 text-sm leading-7 text-[#5D6B85]">
            <p>
              For MVP purposes, contact requests can be routed through the assessment and expert
              inquiry flow. This page gives the site a complete, non-broken public footer path.
            </p>
            <p>
              If you want, I can later turn this into a real contact form with inquiry routing
              and support categories.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="h-11 rounded-xl bg-[#356AF6] px-5 text-white hover:bg-[#2C59D8]">
              <Link href="/quiz">Start Assessment</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl border-[#D9E3F3] bg-white px-5 text-[#111827] hover:bg-[#F7FAFF]">
              <Link href="/">Back Home</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
