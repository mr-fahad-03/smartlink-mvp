import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  Flag,
  Gauge,
  HardDrive,
  Puzzle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const problemItems = [
  {
    icon: ShieldAlert,
    text: "Weak cybersecurity leaving you exposed",
  },
  {
    icon: HardDrive,
    text: "No backup or recovery plan",
  },
  {
    icon: Workflow,
    text: "Inefficient systems costing time",
  },
  {
    icon: TrendingUp,
    text: "No clear strategy for growth",
  },
];

const solutionSteps = [
  {
    title: "Answer a few simple questions",
    support: "No technical setup required.",
  },
  {
    title: "Get your personalized risk score",
    support: "Instant scoring from your responses.",
  },
  {
    title: "See exactly where your gaps are",
    support: "Prioritized by business impact.",
  },
  {
    title: "Get matched with trusted experts",
    support: "Actionable help within 48 hours.",
  },
];

const resultItems = [
  "Your overall risk level (Low / Medium / High)",
  "Key gaps in your business",
  "What needs attention first",
  "Recommended next steps",
];

const resultSupport = [
  "See your score at a glance with clear risk confidence.",
  "Pinpoint where vulnerabilities or inefficiencies are holding you back.",
  "Know exactly what to handle first for immediate impact.",
  "Get practical direction you can execute without guesswork.",
];

const resultDecorIcons = [Gauge, Puzzle, Flag, ArrowUpRight];

const trustItems = [
  "Vetted experts only",
  "Practical, actionable insights",
  "Designed for real business decisions",
];

const trustSupport = [
  "Every expert is pre-screened for capability, reliability, and delivery standards.",
  "Clear recommendations focused on execution, not generic theory.",
  "Built for owners and teams making real operational and growth choices.",
];

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#f9fcff_0%,#eef3f8_42%,#edf2f6_100%)] text-[#111827]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#cfd8e3_1px,transparent_1px),linear-gradient(90deg,#cfd8e3_1px,transparent_1px)] [background-size:36px_36px]" />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1440 2600"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="siteFlow1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#45B0A0" stopOpacity="0.04" />
              <stop offset="45%" stopColor="#3DBDD7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7EA5D9" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="siteFlow2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#45B0A0" stopOpacity="0.02" />
              <stop offset="50%" stopColor="#58C3E0" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#7EA5D9" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d="M-140 560 C 160 430, 360 640, 610 540 C 860 430, 1110 720, 1580 590"
            stroke="url(#siteFlow1)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M-120 980 C 190 840, 440 1110, 700 995 C 940 890, 1180 1180, 1580 1060"
            stroke="url(#siteFlow2)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M-100 1620 C 180 1490, 460 1730, 720 1620 C 960 1510, 1210 1790, 1600 1670"
            stroke="url(#siteFlow1)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="420" cy="620" r="6" fill="#7EE6E0" />
          <circle cx="840" cy="990" r="6" fill="#7EE6E0" />
          <circle cx="1060" cy="1660" r="6" fill="#7EE6E0" />
        </svg>
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <p className="text-2xl font-semibold tracking-tight text-[#111827]">
            SmartLinkBahamas
          </p>
          <nav className="hidden items-center gap-7 text-sm text-[#6B7280] md:flex">
            <a href="#problem" className="hover:text-[#111827]">
              Problem
            </a>
            <a href="#solution" className="hover:text-[#111827]">
              How it Works
            </a>
            <a href="#results" className="hover:text-[#111827]">
              Results
            </a>
            <a href="#trust" className="hover:text-[#111827]">
              Trust
            </a>
          </nav>
          <Button asChild size="sm" className="bg-[#45B0A0] text-white hover:bg-[#3ca293]">
            <Link href="/quiz">Get My Risk Score</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto mt-[76px] grid w-full max-w-6xl gap-12 px-2 pb-20 pt-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-7">
          <Badge className="border border-[#45B0A0]/30 bg-[#45B0A0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f8f90]">
            Business Risk Assessment
          </Badge>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-0.02em] text-[#111827] sm:text-6xl">
            Uncover the{" "}
            <span className="bg-[linear-gradient(90deg,#111827_0%,#2563eb_34%,#45B0A0_66%,#111827_100%)] bg-clip-text text-transparent">
              Hidden Risks
            </span>{" "}
            in Your Business Before They Become Costly.
          </h1>
          <p className="max-w-xl text-xl leading-8 text-[#6B7280]">
            In just 2 minutes, discover your business risk score and get matched
            with trusted experts to fix gaps in security, operations, and growth.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 bg-[#45B0A0] px-7 text-base text-white hover:bg-[#3ca293]"
            >
              <Link href="/quiz">
                Get My Risk Score
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-sm font-medium text-[#6B7280]">
            No technical knowledge required. Instant results.
          </p>
        </div>

        <div className="rounded-3xl  p-5 ">
          <div className="overflow-hidden rounded-2xl ">
            <Image
              src="/hero-clean.png"
              alt="SmartLinkBahamas platform hero preview"
              width={1200}
              height={900}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </section>

      <div className="bg-transparent">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 pb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-slate-300" />
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
            Risk Blind Spots
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-300 to-slate-300" />
        </div>
      </div>

      <section id="problem" className="scroll-mt-28 bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#45B0A0]">
              Risk Blind Spots
            </p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">
              Most businesses don&apos;t see the risks until it&apos;s too late
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {problemItems.map((item, idx) => {
              const Icon = item.icon;
              const accent =
                idx === 0
                  ? "border-l-[#45B0A0] bg-[#45B0A0]/12 text-[#45B0A0]"
                  : idx === 1
                    ? "border-l-[#769CD8] bg-[#769CD8]/16 text-[#769CD8]"
                    : idx === 2
                      ? "border-l-[#C89B3C] bg-[#C89B3C]/16 text-[#C89B3C]"
                      : "border-l-[#8B7BC6] bg-[#8B7BC6]/16 text-[#8B7BC6]";

              return (
                <article
                  key={item.text}
                  className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_8px_20px_rgba(17,24,39,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(17,24,39,0.1)]"
                >
                  <div className={`mb-5 inline-flex rounded-xl border-l-4 p-3 ${accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-semibold leading-none text-[#111827]">
                    {`0${idx + 1}`}
                  </p>
                  <p className="mt-4 text-2xl font-semibold leading-tight text-[#111827]">
                    {item.text}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                    Identify this gap early to avoid operational and financial exposure.
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <p className="text-lg font-medium leading-8 text-[#111827]">
              The problem isn&apos;t just the risk-it&apos;s not knowing where the gaps are.
            </p>
          </div>
        </div>
      </section>

      <div className="bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>
      </div>

      <section id="solution" className="scroll-mt-28 bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#45B0A0]">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
              Get clarity in minutes-not months
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {solutionSteps.map((step, index) => (
              <article
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_20px_rgba(17,24,39,0.06)]"
              >
                {index < solutionSteps.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute -right-3 top-9 hidden h-px w-6 bg-[#45B0A0]/40 xl:block"
                  />
                ) : null}
                <span className="inline-flex rounded-full border border-[#45B0A0]/35 bg-[#45B0A0]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#45B0A0]">
                  Step {index + 1}
                </span>
                <p className="mt-4 text-xl font-semibold leading-snug text-[#111827]">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  {step.support}
                </p>
              </article>
            ))}
          </div>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 bg-[#45B0A0] px-7 text-base text-white hover:bg-[#3ca293]"
          >
            <Link href="/quiz">Start My Assessment</Link>
          </Button>
        </div>
      </section>

      <section id="results" className="relative scroll-mt-28 py-24">
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f8f90]">
              Results Preview
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#111827] sm:text-2xl lg:text-3xl">
              Your results will show you:
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#5f6b7b] sm:text-base">
              A focused snapshot designed to help you decide confidently and act fast.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {resultItems.map((item, index) => {
              const DecorIcon = resultDecorIcons[index];

              return (
                <article
                  key={item}
                  className="group relative overflow-hidden rounded-[28px] border border-[#c7d4df] bg-white/78 p-6 shadow-[0_20px_38px_rgba(43,59,79,0.2)] backdrop-blur-md sm:p-7"
                >
                  <div className="pointer-events-none absolute inset-1 rounded-[24px] border border-white/80" />
                  <div className="pointer-events-none absolute right-5 top-4 text-base font-semibold leading-none text-[#b8c3cf] sm:right-6 sm:top-5 sm:text-lg">
                    0{index + 1}
                  </div>
                  <div className="relative flex items-start gap-4 sm:gap-5">
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#b7ced9] bg-[radial-gradient(circle_at_28%_25%,#f8fbff_0%,#e3ecf2_55%,#d5e1ea_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_10px_rgba(96,111,129,0.2)] sm:h-16 sm:w-16">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#49b2a1] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] sm:h-10 sm:w-10">
                        <CheckCircle2 className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                      </span>
                    </span>
                    <div className="pr-8 sm:pr-12">
                      <p className="text-lg font-semibold leading-tight text-[#111827] sm:text-xl">
                        {item}
                      </p>
                      <p className="mt-3 text-xs leading-6 text-[#5f6b7b] sm:text-sm">
                        {resultSupport[index]}
                      </p>
                    </div>
                  </div>
                  <DecorIcon className="pointer-events-none absolute bottom-5 right-5 h-9 w-9 text-[#b7c3cf] sm:bottom-6 sm:right-6 sm:h-10 sm:w-10" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="trust" className="scroll-mt-28 bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#45B0A0]">
              Trust Layer
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
              Built for businesses that want to operate smarter
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6B7280] sm:text-base">
              Decision-ready guidance, vetted operators, and practical execution support.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {trustItems.map((item, index) => (
              <article
                key={item}
                className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/72 p-6 shadow-[0_14px_30px_rgba(17,24,39,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(17,24,39,0.12)] sm:p-7"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(69,176,160,0.08)_0%,rgba(255,255,255,0)_40%)]" />
                <div className="pointer-events-none absolute inset-1 rounded-[20px] border border-white/70" />
                <div className="relative flex items-start justify-between">
                  <span
                    className={`inline-flex rounded-xl border p-2.5 ${
                      index === 0
                        ? "border-[#45B0A0]/30 bg-[#45B0A0]/12 text-[#45B0A0]"
                        : index === 1
                          ? "border-[#769CD8]/30 bg-[#769CD8]/14 text-[#769CD8]"
                          : "border-[#8B7BC6]/30 bg-[#8B7BC6]/14 text-[#8B7BC6]"
                    }`}
                  >
                    {index === 0 ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : index === 1 ? (
                      <Sparkles className="h-5 w-5" />
                    ) : (
                      <CircleHelp className="h-5 w-5" />
                    )}
                  </span>
                  <span className="text-sm font-semibold tracking-[0.08em] text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <p className="relative mt-5 text-lg font-semibold leading-7 text-[#111827]">
                  {item}
                </p>
                <p className="relative mt-3 text-sm leading-6 text-[#6B7280]">
                  {trustSupport[index]}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 h-px bg-gradient-to-r from-transparent via-slate-300/90 to-transparent" />
        </div>
      </section>

      <section className="bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="rounded-3xl bg-[#111827] px-8 py-12 text-center text-white">
            <p className="text-3xl font-semibold tracking-tight">
              Don&apos;t wait until a small issue becomes a major problem.
            </p>
            <p className="mt-3 text-lg text-slate-300">
              Get your risk score now and take control.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 bg-[#45B0A0] px-7 text-base text-white hover:bg-[#3ca293]"
            >
              <Link href="/quiz">
                Get My Risk Score
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/80 bg-white/65 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[#111827]">SmartLinkBahamas</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-[#111827]">
              Privacy
            </a>
            <a href="#" className="hover:text-[#111827]">
              Terms
            </a>
            <a href="#" className="hover:text-[#111827]">
              Contact
            </a>
          </div>
          <p>Built for smarter decisions.</p>
        </div>
      </footer>
    </main>
  );
}
