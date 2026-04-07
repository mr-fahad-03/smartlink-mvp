"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "How does matching work?",
    answer:
      "We analyze your answers, urgency, location, and budget to identify the most relevant experts for your situation.",
  },
  {
    question: "Do I have to pay to see matches?",
    answer:
      "No. You can review your matches before deciding to contact any expert.",
  },
  {
    question: "Are the experts verified?",
    answer:
      "Yes. All experts go through a vetting process before being listed.",
  },
  {
    question: "How quickly will someone respond?",
    answer:
      "Most users receive responses within 24–48 hours depending on urgency.",
  },
  {
    question: "Why do you need my email?",
    answer:
      "We use your email only to send your results and connect you with relevant experts. We do not spam or sell your information.",
  },
  {
    question: "What if I'm not sure about my answers?",
    answer:
      "That's okay. Choose the closest option — the system is designed to guide you even if you're unsure.",
  },
  {
    question: "What if no experts match my needs?",
    answer:
      "We will still guide you and may follow up to assist manually if needed.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-[#E8EEF8]">
      {faqs.map((item, index) => (
        <div key={index}>
          <button
            type="button"
            onClick={() => setOpen(open === index ? null : index)}
            className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356AF6] focus-visible:ring-offset-2 rounded-sm"
            aria-expanded={open === index}
          >
            <span className="text-[0.98rem] font-semibold text-[#111827]">
              {item.question}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-[#5D6B85] transition-transform duration-200",
                open === index && "rotate-180",
              )}
            />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              open === index ? "max-h-48 pb-5" : "max-h-0",
            )}
          >
            <p className="text-[0.94rem] leading-7 text-[#5D6B85]">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
