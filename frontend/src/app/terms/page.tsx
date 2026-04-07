import Link from "next/link";

import { InnerNav } from "@/components/navigation/inner-nav";

const sections = [
  {
    title: "Use of the Platform",
    body: "SmartLink Bahamas provides an online assessment and expert matching service. By using this platform, you agree to provide accurate information during the assessment process and to use the service for lawful purposes only.",
  },
  {
    title: "Expert Matching",
    body: "Expert rankings and recommendations are generated based on your assessment responses and the information provided by our network of service providers. SmartLink Bahamas facilitates introductions only and is not responsible for the outcome of any engagement between you and a matched expert.",
  },
  {
    title: "Introduction Requests",
    body: "When you submit a request for introduction, your contact information may be shared with the selected expert for the purpose of arranging a consultation. Experts are obligated to handle your data in accordance with applicable privacy laws.",
  },
  {
    title: "Disclaimer",
    body: "SmartLink Bahamas does not guarantee specific outcomes from the assessment process or from engaging any matched service provider. All advice and services are provided by independent professionals.",
  },
  {
    title: "Contact",
    body: "For questions about these terms, please contact us at hello@smartlinkbahamas.com.",
  },
];

export default function TermsPage() {
  return (
    <main className="sl-page min-h-screen px-6 py-8 text-[#111827]">
      <div className="mx-auto w-full max-w-3xl">
        <InnerNav breadcrumb="Terms of Service" />

        <div className="mt-8 rounded-[28px] border border-[#D9E3F3] bg-white p-8 shadow-[0_16px_36px_rgba(56,75,107,0.07)]">
          <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">Terms of Service</h1>
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
