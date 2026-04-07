import Link from "next/link";

import { InnerNav } from "@/components/navigation/inner-nav";

const sections = [
  {
    title: "Information We Collect",
    body: "We collect the information you provide when completing the assessment, including your name, email address, business or personal details, and location. This information is used solely to generate your results and match you with relevant service providers.",
  },
  {
    title: "How We Use Your Information",
    body: "Your information is used to produce personalised assessment results, rank matched experts, and facilitate introduction requests. We do not sell your personal data to third parties.",
  },
  {
    title: "Data Retention",
    body: "Assessment results are stored locally in your browser session. Any data submitted through the platform is retained only as long as necessary to fulfil the service you requested. You may request deletion at any time by contacting us.",
  },
  {
    title: "Cookies",
    body: "SmartLink Bahamas uses essential cookies to maintain your session and improve the assessment experience. No third-party tracking cookies are used without your consent.",
  },
  {
    title: "Contact",
    body: "If you have any questions about this policy or your personal data, please contact us at hello@smartlinkbahamas.com.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="sl-page min-h-screen px-6 py-8 text-[#111827]">
      <div className="mx-auto w-full max-w-3xl">
        <InnerNav breadcrumb="Privacy Policy" />

        <div className="mt-8 rounded-[28px] border border-[#D9E3F3] bg-white p-8 shadow-[0_16px_36px_rgba(56,75,107,0.07)]">
          <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">Privacy Policy</h1>
          <p className="mt-2 text-sm text-[#5D6B85]">
            Last updated: January 2025
          </p>

          <div className="mt-8 space-y-7">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-base font-semibold text-[#111827]">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#5D6B85]">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[#D9E3F3] pt-6">
            <Link
              href="/"
              className="text-sm font-medium text-[#356AF6] hover:underline"
            >
              ← Back to SmartLink Bahamas
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
