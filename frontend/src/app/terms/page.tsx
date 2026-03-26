import { PageOrientation } from "@/components/navigation/page-orientation";

export default function TermsPage() {
  return (
    <main className="sl-page min-h-screen px-6 py-8 text-[#111827]">
      <div className="mx-auto w-full max-w-5xl">
        <PageOrientation
          fallbackHref="/"
          eyebrow="Terms"
          title="Terms Summary"
          description="A simple terms placeholder for the MVP experience so every public link resolves properly."
          currentView="Terms Page"
          stepLabel="Company Information"
          nextLabel="Return home or continue into the guided assessment."
        />

        <section className="mt-6 rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
          <div className="space-y-5 text-sm leading-7 text-[#5D6B85]">
            <p>
              SmartLinkBahamas is currently presented as an MVP experience for matching,
              onboarding, and conversion flow validation.
            </p>
            <p>
              Provider rankings, assessment results, and service recommendations shown here are
              prototype outputs designed to demonstrate the intended product behavior.
            </p>
            <p>
              We can later replace this with launch-ready legal copy once business rules,
              inquiry handling, and production operations are finalized.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
