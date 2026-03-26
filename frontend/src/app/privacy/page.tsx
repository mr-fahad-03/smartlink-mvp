import { PageOrientation } from "@/components/navigation/page-orientation";

export default function PrivacyPage() {
  return (
    <main className="sl-page min-h-screen px-6 py-8 text-[#111827]">
      <div className="mx-auto w-full max-w-5xl">
        <PageOrientation
          fallbackHref="/"
          eyebrow="Privacy"
          title="Privacy Overview"
          description="A simple MVP privacy summary for SmartLinkBahamas while the product is still in mockup and pilot stage."
          currentView="Privacy Page"
          stepLabel="Company Information"
          nextLabel="Return home or continue into the quiz when you are ready."
        />

        <section className="mt-6 rounded-[30px] border border-[#D9E3F3] bg-white p-6 shadow-[0_14px_34px_rgba(56,75,107,0.08)]">
          <div className="space-y-5 text-sm leading-7 text-[#5D6B85]">
            <p>
              SmartLinkBahamas collects the details you provide during the quiz and lead
              capture flow so we can generate results, rank experts, and support follow-up.
            </p>
            <p>
              For MVP purposes, this experience is focused on prototype validation and
              marketplace flow testing. Data handling and production privacy policies can be
              expanded before public launch.
            </p>
            <p>
              If you want, I can later turn this into a fuller launch-ready privacy page with
              sections for data usage, retention, cookies, and contact details.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
