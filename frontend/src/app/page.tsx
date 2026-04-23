import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleHelp,
  Clock,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

const audienceSegments = [
  {
    id: "business-owner",
    title: "I run a business",
    support: "Get help with setup, operations, IT, and growth.",
    icon: Building2,
    color: "text-[#356AF6]",
    bg: "bg-[#EEF3FF]",
  },
  {
    id: "personal-help",
    title: "I need personal help",
    support: "Get help with career, finances, legal, or tech issues.",
    icon: UserRound,
    color: "text-[#16A34A]",
    bg: "bg-[#EBF8EF]",
  },
  {
    id: "not-sure",
    title: "I'm not sure",
    support: "We'll guide you to the right path.",
    icon: CircleHelp,
    color: "text-[#8B5CF6]",
    bg: "bg-[#F3EDFF]",
  },
] as const;

const howItWorksSteps = [
  {
    step: "01",
    title: "Answer a few questions",
    support: "Takes about 60 seconds.",
  },
  {
    step: "02",
    title: "See your best matches",
    support: "Instant results based on your answers.",
  },
  {
    step: "03",
    title: "Choose who to connect with",
    support: "No cold outreach — we handle the introduction.",
  },
];

const trustSignals = [
  {
    icon: ShieldCheck,
    title: "Only verified professionals — no guesswork",
    support: "All experts are vetted before being listed.",
    color: "text-[#356AF6]",
    bg: "bg-[#EEF3FF]",
  },
  {
    icon: Zap,
    title: "Connect within 24–48 hours",
    support: "Most users hear back quickly after matching.",
    color: "text-[#16A34A]",
    bg: "bg-[#EBF8EF]",
  },
  {
    icon: Sparkles,
    title: "No obligation to hire",
    support: "Explore your matches before committing to anything.",
    color: "text-[#8B5CF6]",
    bg: "bg-[#F3EDFF]",
  },
];

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden text-[#111827]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-10rem] h-[26rem] w-[26rem] rounded-full bg-[#EEF3FF]/60 blur-3xl" />
        <div className="absolute right-[-6rem] top-20 h-[22rem] w-[22rem] rounded-full bg-[#DCE8FF]/50 blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#D9E3F3]/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="SmartLinkBahamas logo"
              width={2103}
              height={748}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#5D6B85] md:flex">
            <a href="#how-it-works" className="transition hover:text-[#111827]">How It Works</a>
            <a href="#faq" className="transition hover:text-[#111827]">FAQ</a>
            <Link href="/expert-apply" className="transition hover:text-[#111827]">For Experts</Link>
          </nav>

          <Button
            asChild
            size="sm"
            className="h-9 rounded-xl bg-[#356AF6] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(53,106,246,0.22)] hover:bg-[#2C59D8]"
          >
            <a href="#who-is-this-for">Get Started</a>
          </Button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-12 pt-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E3F3] bg-white px-4 py-1.5 text-[0.8rem] font-semibold text-[#356AF6] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#356AF6]" />
          Smart matching platform · The Bahamas
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-[clamp(2.2rem,4.5vw,3.8rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#111827]">
          Find the right expert for your{" "}
          <span className="text-[#356AF6]">problem in 60 seconds</span>
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-[1rem] leading-7 text-[#5D6B85]">
          Answer a few questions and get matched instantly — no searching, no guessing.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl bg-[#356AF6] px-7 text-[1rem] font-semibold text-white shadow-[0_12px_24px_rgba(53,106,246,0.26)] hover:bg-[#2C59D8]"
          >
            <a href="#who-is-this-for">
              Find My Expert
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <p className="mt-4 text-[0.84rem] text-[#8A99B4]">
          Takes 60 seconds · No commitment · Instant results
        </p>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section id="who-is-this-for" className="scroll-mt-24 pb-14">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="rounded-[28px] border border-[#D9E3F3] bg-white/90 p-7 shadow-[0_16px_36px_rgba(56,75,107,0.07)] sm:p-8">
            <div className="mb-6 text-center">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                Step 1 — Choose your path
              </p>
              <h2 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-[#111827]">
                Who is this for?
              </h2>
              <p className="mt-2 text-[0.94rem] text-[#5D6B85]">
                Select the option that best describes you to get a personalised experience.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {audienceSegments.map((segment) => {
                const Icon = segment.icon;
                return (
                  <Link
                    key={segment.id}
                    href={`/quiz?audience=${segment.id}`}
                    className="group flex flex-col gap-4 rounded-[20px] border border-[#D9E3F3] bg-[#FAFCFF] p-5 transition hover:-translate-y-0.5 hover:border-[#7EA5FF] hover:shadow-[0_14px_28px_rgba(53,106,246,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356AF6] focus-visible:ring-offset-2"
                  >
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${segment.bg} ${segment.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[1rem] font-semibold text-[#111827]">{segment.title}</p>
                      <p className="mt-1 text-[0.88rem] leading-6 text-[#5D6B85]">{segment.support}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-1.5 text-[0.84rem] font-semibold text-[#356AF6]">
                      Start here
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <p className="mt-5 text-center text-[0.82rem] text-[#8A99B4]">
              Not sure? Choose &ldquo;I&apos;m not sure&rdquo; — we&apos;ll refine as we go. No commitment required.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="scroll-mt-24 pb-14">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="rounded-[28px] border border-[#D9E3F3] bg-white/90 p-7 shadow-[0_16px_36px_rgba(56,75,107,0.07)] sm:p-8">
            <div className="mb-8 max-w-xl">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                How It Works
              </p>
              <h2 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-[#111827]">
                Simple. Fast. Done.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {howItWorksSteps.map((item, index) => (
                <article
                  key={item.step}
                  className="relative rounded-[20px] border border-[#E8EEF8] bg-[#FAFCFF] p-5"
                >
                  {index < howItWorksSteps.length - 1 && (
                    <span className="absolute -right-2 top-8 hidden h-px w-4 bg-[#BFD0F8] lg:block" />
                  )}
                  <span className="text-[0.72rem] font-bold tracking-[0.14em] text-[#356AF6]">
                    {item.step}
                  </span>
                  <p className="mt-3 text-[1rem] font-semibold text-[#111827]">{item.title}</p>
                  <p className="mt-1.5 text-[0.88rem] leading-6 text-[#5D6B85]">{item.support}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between rounded-[18px] border border-[#D9E3F3] bg-[#F7FAFF] px-5 py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-[#356AF6]" />
                <p className="text-[0.9rem] font-medium text-[#5D6B85]">
                  <span className="font-semibold text-[#111827]">We only use your information</span>{" "}
                  to connect you with relevant experts. No spam.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ── */}
      <section className="pb-14">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {trustSignals.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-[20px] border border-[#D9E3F3] bg-white/90 p-5 shadow-[0_8px_20px_rgba(56,75,107,0.05)]"
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[0.97rem] font-semibold text-[#111827]">{item.title}</p>
                    <p className="mt-1 text-[0.86rem] leading-6 text-[#5D6B85]">{item.support}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[18px] border border-[#D9E3F3] bg-white/90 px-5 py-3.5 text-center shadow-[0_6px_16px_rgba(56,75,107,0.04)]">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                { icon: CheckCircle2, label: "Only verified professionals — no guesswork" },
                { icon: CheckCircle2, label: "Most users connect within 24–48 hours" },
                { icon: CheckCircle2, label: "No obligation to hire" },
              ].map((t) => (
                <span key={t.label} className="flex items-center gap-1.5 text-[0.84rem] font-medium text-[#5D6B85]">
                  <t.icon className="h-4 w-4 text-[#16A34A]" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="pb-14">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="rounded-[28px] bg-[#356AF6] p-8 text-center shadow-[0_20px_44px_rgba(53,106,246,0.28)] sm:p-10">
            <h2 className="text-[1.7rem] font-semibold tracking-tight text-white sm:text-[2rem]">
              Stop searching. Get matched in seconds.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[0.96rem] leading-7 text-white/80">
              Answer a few questions and get matched instantly.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-white px-7 text-[1rem] font-semibold text-[#356AF6] shadow-[0_8px_18px_rgba(0,0,0,0.12)] hover:bg-white/90"
              >
                <Link href="/quiz">
                  Find My Expert
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 rounded-xl border border-white/30 px-6 text-[1rem] font-semibold text-white hover:bg-white/10"
              >
                <Link href="/expert-apply">Join as an Expert</Link>
              </Button>
            </div>
            <p className="mt-5 text-[0.82rem] text-white/60">
              You are not locked in — explore options before contacting anyone.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-24 pb-16">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="rounded-[28px] border border-[#D9E3F3] bg-white/90 p-7 shadow-[0_16px_36px_rgba(56,75,107,0.07)] sm:p-8">
            <div className="mb-6 max-w-xl">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                FAQ
              </p>
              <h2 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-[#111827]">
                Common questions
              </h2>
            </div>

            {/* Key FAQ — visible immediately */}
            <div className="mb-6 rounded-[18px] border border-[#356AF6]/20 bg-[#EEF3FF] px-5 py-4">
              <p className="text-[0.97rem] font-semibold text-[#111827]">How does this work?</p>
              <p className="mt-1.5 text-[0.9rem] leading-7 text-[#5D6B85]">
                We match you with the right expert based on your answers, no searching required.
              </p>
            </div>

            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#D9E3F3] bg-white/90">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-[#5D6B85] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-[#111827]">SmartLinkBahamas</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition hover:text-[#111827]">Privacy</Link>
            <Link href="/terms" className="transition hover:text-[#111827]">Terms</Link>
            <Link href="/contact" className="transition hover:text-[#111827]">Contact</Link>
            <Link href="/expert-apply" className="transition hover:text-[#111827]">For Experts</Link>
          </div>
          <p>Built for smarter decisions.</p>
        </div>
      </footer>
    </main>
  );
}

