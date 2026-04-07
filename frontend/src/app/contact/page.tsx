"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { InnerNav } from "@/components/navigation/inner-nav";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <main className="sl-page min-h-screen px-6 py-8 text-[#111827]">
      <div className="mx-auto w-full max-w-4xl">
        <InnerNav breadcrumb="Contact" />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Contact form */}
          <section className="rounded-[28px] border border-[#D9E3F3] bg-white p-7 shadow-[0_16px_36px_rgba(56,75,107,0.07)]">
            <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">Get in touch</h1>
            <p className="mt-2 text-sm text-[#5D6B85]">
              We typically respond within 1 business day.
            </p>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5D6B85]">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 text-sm outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5D6B85]">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 text-sm outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5D6B85]">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="How can we help?"
                  className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-white px-4 text-sm outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5D6B85]">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Tell us more about your question or inquiry..."
                  className="w-full resize-none rounded-2xl border border-[#D9E3F3] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button className="h-11 rounded-xl bg-[#356AF6] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(53,106,246,0.25)] hover:bg-[#2C59D8]">
                  Send Message
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-[#D9E3F3] px-5 text-sm text-[#5D6B85] hover:bg-[#F7FAFF]"
                >
                  <Link href="/quiz">Start Assessment Instead</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Sidebar info */}
          <aside className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: "hello@smartlinkbahamas.com" },
              { icon: Phone, label: "Phone", value: "+1 (242) 000-0000" },
              { icon: MapPin, label: "Location", value: "Nassau, Bahamas" },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-4 rounded-[22px] border border-[#D9E3F3] bg-white p-4 shadow-[0_8px_20px_rgba(56,75,107,0.05)]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF]">
                  <Icon className="h-4 w-4 text-[#356AF6]" />
                </span>
                <div>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[#111827]">{value}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}
