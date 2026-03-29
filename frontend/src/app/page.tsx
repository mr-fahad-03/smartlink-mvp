import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
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
  UserRound,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const preQuizSituations = [
  {
    id: "situation_stuck",
    title: "My application is stuck",
    support: "Progress has slowed or stopped.",
  },
  {
    id: "situation_start",
    title: "I don't know where to start",
    support: "You need clarity on the next step.",
  },
  {
    id: "situation_urgent",
    title: "I need help urgently",
    support: "You need support fast.",
  },
  {
    id: "situation_failed",
    title: "I've already tried but failed",
    support: "You need a stronger path now.",
  },
  {
    id: "situation_not_working",
    title: "Something isn't working but I'm not sure why",
    support: "You need clarity before things get worse.",
  },
  {
    id: "situation_need_advice",
    title: "I need expert advice before making a decision",
    support: "You want confidence before the next move.",
  },
];

const audienceSegments = [
  {
    id: "business-owner",
    title: "I'm a business owner",
    support: "Stay on the business-focused path.",
    icon: Building2,
  },
  {
    id: "personal-help",
    title: "I need personal help",
    support: "Start with a simpler guided support path.",
    icon: UserRound,
  },
  {
    id: "not-sure",
    title: "I'm not sure",
    support: "We will guide you to the best fit.",
    icon: CircleHelp,
  },
] as const;

const problemItems = [
  {
    icon: ShieldAlert,
    title: "Weak cybersecurity leaving you exposed",
    support: "Hidden gaps can turn into downtime and loss.",
    tag: "Security",
    impact: "Higher downtime and trust-loss risk",
    accent: "text-[#356AF6]",
    tone: "bg-[#EEF3FF]",
  },
  {
    icon: HardDrive,
    title: "No backup or recovery plan",
    support: "Small incidents can stall operations fast.",
    tag: "Resilience",
    impact: "Longer recovery time when issues hit",
    accent: "text-[#16A34A]",
    tone: "bg-[#EBF8EF]",
  },
  {
    icon: Workflow,
    title: "Inefficient systems costing time",
    support: "Poor systems quietly drain time every week.",
    tag: "Operations",
    impact: "More delays and wasted team capacity",
    accent: "text-[#F97316]",
    tone: "bg-[#FFF2E8]",
  },
  {
    icon: TrendingUp,
    title: "No clear strategy for growth",
    support: "Unclear priorities slow growth decisions.",
    tag: "Growth",
    impact: "Slower execution and weaker decisions",
    accent: "text-[#8B5CF6]",
    tone: "bg-[#F3EDFF]",
  },
];

const solutionSteps = [
  {
    title: "Answer a few simple questions",
    support: "A short guided flow finds the key issue.",
  },
  {
    title: "Get your personalized risk score",
    support: "See your urgency and exposure instantly.",
  },
  {
    title: "See exactly where your gaps are",
    support: "See what needs attention first.",
  },
  {
    title: "Get matched with trusted experts",
    support: "Get matched to the right help fast.",
  },
];

const resultItems = [
  {
    title: "Your overall risk level (Low / Medium / High)",
    support: "See your score at a glance.",
    icon: Gauge,
  },
  {
    title: "Key gaps in your business",
    support: "See what is holding you back.",
    icon: Puzzle,
  },
  {
    title: "What needs attention first",
    support: "Know what to handle first.",
    icon: Flag,
  },
  {
    title: "Recommended next steps",
    support: "Get a clear next move.",
    icon: ArrowUpRight,
  },
];

const trustItems = [
  {
    title: "Vetted experts only",
    support: "Trusted providers only.",
    icon: ShieldCheck,
    accent: "text-[#356AF6]",
    tone: "bg-[#EEF3FF]",
  },
  {
    title: "Practical, actionable insights",
    support: "Clear next steps, not theory.",
    icon: Sparkles,
    accent: "text-[#16A34A]",
    tone: "bg-[#EBF8EF]",
  },
  {
    title: "Designed for real business decisions",
    support: "Built for fast, usable decisions.",
    icon: CircleHelp,
    accent: "text-[#8B5CF6]",
    tone: "bg-[#F3EDFF]",
  },
];

export default function Home() {
  return (
    <main className="sl-page relative isolate min-h-screen overflow-hidden text-[#111827]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="sl-grid absolute inset-0 opacity-70" />
        <div className="absolute left-[-10rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-[-8rem] top-32 h-[24rem] w-[24rem] rounded-full bg-[#DCE8FF]/80 blur-3xl" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#D9E3F3]/90 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF3FF] text-sm font-semibold text-[#356AF6]">
              SL
            </div>
            <div>
              <p className="text-base font-semibold text-[#111827]">SmartLinkBahamas</p>
              <p className="text-xs text-[#5D6B85]">Business Risk Assessment</p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#5D6B85] md:flex">
            <a href="#problem" className="transition hover:text-[#111827]">
              Problem
            </a>
            <a href="#solution" className="transition hover:text-[#111827]">
              How It Works
            </a>
            <a href="#results" className="transition hover:text-[#111827]">
              Results
            </a>
            <a href="#trust" className="transition hover:text-[#111827]">
              Trust
            </a>
          </nav>

          <Button
            asChild
            size="sm"
            className="h-10 rounded-xl bg-[#356AF6] px-4 text-white shadow-[0_10px_22px_rgba(53,106,246,0.22)] hover:bg-[#2C59D8]"
          >
            <a href="#pre-quiz">Get My Risk Score</a>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-24">
        <div className="mx-auto flex max-w-[78rem] flex-col items-center space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="mx-auto max-w-[70rem] text-[clamp(2.5rem,5vw,4.7rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-[#111827]">
                <span className="block">
                  Stuck, delayed,
                </span>
                <span className="mt-2 block">
                  for your situation
                </span>
                <span className="mt-3 block text-[#356AF6]">Get clarity and the right help.</span>
              </h1>
              <p className="mx-auto max-w-xl text-[1rem] leading-7 text-[#5D6B85]">
                For business owners and individuals who need answers fast.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[#356AF6] px-7 text-[1rem] font-semibold text-white shadow-[0_12px_24px_rgba(53,106,246,0.24)] hover:bg-[#2C59D8]"
              >
                <a href="#pre-quiz">
                  Get My Risk Score
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="text-sm font-medium text-[#5D6B85]">
              Choose your situation to begin.
            </p>
        </div>

        <div className="mx-auto mt-8 max-w-5xl rounded-[30px] border border-[#D9E3F3] bg-white/86 p-5 shadow-[0_16px_38px_rgba(56,75,107,0.08)] backdrop-blur-sm sm:p-6">
          <div className="max-w-2xl">
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
              Who Is This For?
            </p>
            <h2 className="mt-2 text-[1.6rem] font-semibold tracking-tight text-[#111827] sm:text-[1.9rem]">
              Choose the path that fits you best.
            </h2>
            <p className="mt-2 text-[0.96rem] leading-7 text-[#5D6B85]">
              This keeps the homepage business-focused while still supporting individual help needs.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {audienceSegments.map((segment) => {
              const Icon = segment.icon;

              return (
                <Link
                  key={segment.id}
                  href={`/quiz?audience=${segment.id}`}
                  className="group rounded-[24px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)] transition hover:-translate-y-1 hover:border-[#7EA5FF] hover:shadow-[0_18px_34px_rgba(53,106,246,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356AF6] focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#356AF6]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D9E3F3] bg-white text-[#A0AECB] transition group-hover:border-[#BFD0F8] group-hover:bg-[#EEF3FF] group-hover:text-[#356AF6]">
                      <ArrowRight className="h-4.5 w-4.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <p className="mt-4 text-[1.02rem] font-semibold leading-snug text-[#111827]">
                    {segment.title}
                  </p>
                  <p className="mt-2 text-[0.92rem] leading-6 text-[#5D6B85]">{segment.support}</p>
                  <div className="mt-4 border-t border-[#EEF2FA] pt-3">
                    <span className="inline-flex rounded-full bg-[#F7FAFF] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                      Start here
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div id="pre-quiz" className="mt-8 scroll-mt-28 rounded-[34px] border border-[#D9E3F3] bg-white/84 p-6 shadow-[0_18px_42px_rgba(56,75,107,0.08)] backdrop-blur-sm sm:p-8">
            <div className="max-w-[56rem]">
              <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                Start From Your Situation
              </p>
              <h2 className="mt-3 text-[clamp(2rem,3.3vw,3rem)] font-semibold tracking-tight text-[#111827]">
                What are you dealing with right now?
              </h2>
              <p className="mt-3 max-w-[40rem] text-[0.98rem] leading-7 text-[#5D6B85]">
                Pick the best fit. We&apos;ll route you to the right help path.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D9E3F3] bg-[#F7FAFF] px-3.5 py-1.5 text-[0.92rem] font-medium text-[#356AF6] shadow-sm">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#356AF6] text-[0.75rem] font-semibold text-white">
                  1
                </span>
                Choose one card to begin
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {preQuizSituations.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/quiz?situation=${item.id}`}
                  className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[26px] border border-[#D9E3F3] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_12px_26px_rgba(56,75,107,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#7EA5FF] hover:bg-white hover:shadow-[0_24px_40px_rgba(53,106,246,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356AF6] focus-visible:ring-offset-2"
                  aria-label={`Choose ${item.title} to start the quiz`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-[26px] bg-[#E8EEFF] transition group-hover:bg-[#356AF6]" />
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full bg-[#EEF3FF] px-4 py-1.5 text-[0.88rem] font-semibold uppercase tracking-[0.08em] text-[#356AF6]">
                      0{index + 1}
                    </span>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D9E3F3] bg-white text-[#A0AECB] shadow-sm transition group-hover:border-[#BFD0F8] group-hover:bg-[#EEF3FF] group-hover:text-[#356AF6]">
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <div className="mt-4 inline-flex rounded-full border border-[#D9E3F3] bg-[#F7FAFF] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#7B89A2] transition group-hover:border-[#BFD0F8] group-hover:bg-[#EEF3FF] group-hover:text-[#356AF6]">
                    Select this option
                  </div>
                  <p className="mt-4 text-[1.06rem] font-semibold leading-snug text-[#111827] sm:text-[1.12rem]">
                    {item.title}
                  </p>
                  <div className="mt-auto pt-6">
                    <div className="border-t border-[#EEF2FA] pt-4">
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EEF3FF] px-4 py-3 text-[0.86rem] font-semibold text-[#356AF6] transition group-hover:bg-[#356AF6] group-hover:text-white">
                        Choose this path
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
        </div>
      </section>

      <section id="problem" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="relative overflow-hidden rounded-[34px] border border-[#D9E3F3] bg-white/84 p-6 shadow-[0_18px_42px_rgba(56,75,107,0.08)] backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(53,106,246,0.12),transparent_58%)]" />

            <div className="relative">
              <div className="max-w-3xl">
                <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                  Risk Blind Spots
                </p>
                <h2 className="mt-2 max-w-4xl text-[1.9rem] font-semibold tracking-tight text-[#111827] sm:text-[2.2rem]">
                  Most businesses don&apos;t see the risks until it&apos;s too late
                </h2>
                <p className="mt-3 max-w-xl text-[0.96rem] leading-7 text-[#5D6B85]">
                  The real problem is not knowing where the gaps are.
                </p>
              </div>
            </div>

            <div className="relative mt-6 grid gap-3 lg:grid-cols-4">
              {problemItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="group relative min-w-0 overflow-hidden rounded-[24px] border border-[#D9E3F3] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(246,249,255,0.94))] p-4 shadow-[0_12px_28px_rgba(56,75,107,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(56,75,107,0.1)]"
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-1.5 opacity-80 transition group-hover:opacity-100 ${item.tone}`}
                    />
                    <div className="flex flex-wrap items-start justify-between gap-2.5">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.tone} ${item.accent}`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <div className="flex min-w-0 flex-wrap items-center gap-2 pt-1">
                          <span className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#8A99B4]">
                            0{index + 1}
                          </span>
                          <span className="rounded-full border border-[#DDE6F5] bg-white/80 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#6D7C97]">
                            {item.tag}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#DDE6F5] bg-white/90 px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                        Business risk
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-[1.04rem] font-semibold leading-tight text-[#111827]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-[0.88rem] leading-6 text-[#5D6B85]">
                        {item.support}
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#E7EDF8] bg-white/82 px-3 py-2.5">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#8A99B4]">
                        Likely impact
                      </p>
                      <p className="mt-1 text-[0.84rem] font-medium leading-5 text-[#111827]">{item.impact}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="solution" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="rounded-[34px] border border-[#D9E3F3] bg-white/80 p-8 shadow-[0_18px_42px_rgba(56,75,107,0.08)] sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                How It Works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                Get clarity in minutes, not months
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {solutionSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="relative rounded-[26px] border border-[#D9E3F3] bg-[#FCFDFF] p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)]"
                >
                  {index < solutionSteps.length - 1 ? (
                    <span className="absolute -right-2 top-11 hidden h-px w-4 bg-[#BFD0F8] lg:block" />
                  ) : null}
                  <span className="inline-flex rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                    Step {index + 1}
                  </span>
                  <p className="mt-4 text-[1.08rem] font-semibold leading-tight text-[#111827]">
                    {step.title}
                  </p>
                  <p className="mt-2 text-[0.92rem] leading-6 text-[#5D6B85]">{step.support}</p>
                </article>
              ))}
            </div>

            <Button
              asChild
              size="lg"
              className="mt-8 h-12 rounded-xl bg-[#356AF6] px-7 text-base text-white shadow-[0_12px_24px_rgba(53,106,246,0.24)] hover:bg-[#2C59D8]"
            >
              <Link href="/quiz">Start My Assessment</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="results" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="rounded-[34px] border border-[#D9E3F3] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,249,255,0.88))] p-8 shadow-[0_18px_42px_rgba(56,75,107,0.08)] sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                Results Preview
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                Your results will show you:
              </h2>
              <p className="mt-3 text-[0.98rem] leading-7 text-[#5D6B85]">
                A fast snapshot of what matters most.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {resultItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="group relative overflow-hidden rounded-[24px] border border-[#D9E3F3] bg-white/92 p-5 shadow-[0_10px_24px_rgba(56,75,107,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_32px_rgba(56,75,107,0.1)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#356AF6_0%,#A9C2FF_100%)]" />
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#356AF6]">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-[#F4F7FD] px-2.5 py-1 text-[0.74rem] font-semibold tracking-[0.08em] text-[#A0AECB]">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-[1.06rem] font-semibold leading-tight text-[#111827]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-[0.92rem] leading-6 text-[#5D6B85]">{item.support}</p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#EEF2FA] pt-4">
                      <span className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#8A99B4]">
                        Included in results
                      </span>
                      <Icon className="h-6 w-6 text-[#B7C4DE] transition group-hover:text-[#356AF6]" />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="rounded-[34px] border border-[#D9E3F3] bg-white/82 p-8 shadow-[0_18px_42px_rgba(56,75,107,0.08)] sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                Trust Layer
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                Built for businesses that want to operate smarter
              </h2>
              <p className="mt-3 text-[0.98rem] leading-7 text-[#5D6B85]">
                Trusted experts and practical direction.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {trustItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[26px] border border-[#D9E3F3] bg-[#FCFDFF] p-6 shadow-[0_10px_24px_rgba(56,75,107,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone} ${item.accent}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold tracking-[0.08em] text-[#A0AECB]">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-5 text-xl font-semibold leading-tight text-[#111827]">
                      {item.title}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{item.support}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="rounded-[34px] border border-[#D9E3F3] bg-white/90 p-8 text-center shadow-[0_18px_42px_rgba(56,75,107,0.08)] sm:p-10">
            <p className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
              Don&apos;t wait until a small issue becomes a major problem.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#5D6B85]">
              Get your risk score and take the next step.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 rounded-xl bg-[#356AF6] px-7 text-base text-white shadow-[0_12px_24px_rgba(53,106,246,0.24)] hover:bg-[#2C59D8]"
            >
              <Link href="/quiz">
                Get My Risk Score
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#D9E3F3] bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-[#5D6B85] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[#111827]">SmartLinkBahamas</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition hover:text-[#111827]">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-[#111827]">
              Terms
            </Link>
            <Link href="/contact" className="transition hover:text-[#111827]">
              Contact
            </Link>
          </div>
          <p>Built for smarter business decisions.</p>
        </div>
      </footer>
    </main>
  );
}
