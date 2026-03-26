import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Flag,
  Gauge,
  HardDrive,
  MessageCircleMore,
  Puzzle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const heroHighlights = [
  {
    icon: Users,
    title: "SmartMatch Quiz",
    description: "Quick questions that route you to the right solution path.",
    accent: "text-[#356AF6]",
    tone: "bg-[#EEF3FF]",
  },
  {
    icon: MessageCircleMore,
    title: "Guided Experience",
    description: "Simple steps built for non-technical business owners.",
    accent: "text-[#16A34A]",
    tone: "bg-[#EBF8EF]",
  },
  {
    icon: ShieldCheck,
    title: "Verified Experts",
    description: "Trusted providers matched to your business priorities.",
    accent: "text-[#8B5CF6]",
    tone: "bg-[#F3EDFF]",
  },
  {
    icon: BarChart3,
    title: "Actionable Results",
    description: "Clear next steps instead of vague recommendations.",
    accent: "text-[#F97316]",
    tone: "bg-[#FFF2E8]",
  },
];

const preQuizSituations = [
  {
    id: "situation_stuck",
    title: "My application is stuck",
    support: "You started, but now progress has slowed down or stopped.",
  },
  {
    id: "situation_start",
    title: "I don't know where to start",
    support: "You need clarity before taking the next step.",
  },
  {
    id: "situation_urgent",
    title: "I need help urgently",
    support: "Time matters and you need support fast.",
  },
  {
    id: "situation_failed",
    title: "I've already tried but failed",
    support: "You need a stronger path after an earlier failed attempt.",
  },
];

const problemItems = [
  {
    icon: ShieldAlert,
    title: "Weak cybersecurity leaving you exposed",
    support: "Critical gaps often stay invisible until they trigger downtime, loss, or customer distrust.",
    accent: "text-[#356AF6]",
    tone: "bg-[#EEF3FF]",
  },
  {
    icon: HardDrive,
    title: "No backup or recovery plan",
    support: "Without a clear recovery path, even a small incident can stall revenue and operations.",
    accent: "text-[#16A34A]",
    tone: "bg-[#EBF8EF]",
  },
  {
    icon: Workflow,
    title: "Inefficient systems costing time",
    support: "Disconnected tools and unclear workflows quietly drain productivity every week.",
    accent: "text-[#F97316]",
    tone: "bg-[#FFF2E8]",
  },
  {
    icon: TrendingUp,
    title: "No clear strategy for growth",
    support: "Growth decisions become slower and riskier when the real constraints are not visible.",
    accent: "text-[#8B5CF6]",
    tone: "bg-[#F3EDFF]",
  },
];

const solutionSteps = [
  {
    title: "Answer a few simple questions",
    support: "A short guided flow identifies your biggest business blind spots.",
  },
  {
    title: "Get your personalized risk score",
    support: "You instantly see the severity and urgency of your current exposure.",
  },
  {
    title: "See exactly where your gaps are",
    support: "The assessment highlights what needs attention first, not later.",
  },
  {
    title: "Get matched with trusted experts",
    support: "Relevant providers are surfaced based on your top-risk categories.",
  },
];

const resultItems = [
  {
    title: "Your overall risk level (Low / Medium / High)",
    support: "See your score at a glance with a clear confidence signal.",
    icon: Gauge,
  },
  {
    title: "Key gaps in your business",
    support: "Pinpoint the vulnerabilities or inefficiencies holding you back.",
    icon: Puzzle,
  },
  {
    title: "What needs attention first",
    support: "Know what to handle now for the fastest operational impact.",
    icon: Flag,
  },
  {
    title: "Recommended next steps",
    support: "Get practical direction you can execute without guesswork.",
    icon: ArrowUpRight,
  },
];

const trustItems = [
  {
    title: "Vetted experts only",
    support: "Every recommendation is filtered for capability, fit, and responsiveness.",
    icon: ShieldCheck,
    accent: "text-[#356AF6]",
    tone: "bg-[#EEF3FF]",
  },
  {
    title: "Practical, actionable insights",
    support: "You receive recommendations that support real execution, not generic theory.",
    icon: Sparkles,
    accent: "text-[#16A34A]",
    tone: "bg-[#EBF8EF]",
  },
  {
    title: "Designed for real business decisions",
    support: "Built for owners and teams who need clarity fast and need it to be usable.",
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

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-32">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl space-y-7">
            <Badge className="h-auto rounded-full border border-[#D4E1FF] bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#356AF6] shadow-sm">
              Business Risk Assessment
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-[clamp(3rem,6.2vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-[#111827]">
                <span className="block">
                  Stuck, delayed,
                </span>
                <span className="mt-1 block">
                  or unsure where{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">to start?</span>
                    <span className="absolute inset-x-0 bottom-[0.12em] z-0 h-[0.22em] rounded-full bg-[#DCE8FF]" />
                  </span>
                </span>
                <span className="mt-2 block text-[#356AF6]">Get clarity and the right help fast.</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[#5D6B85] sm:text-xl">
                If things feel stuck, delayed, urgent, or harder than they should be, this guided flow helps you pinpoint the issue fast and get matched to the right expert.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[#356AF6] px-7 text-base text-white shadow-[0_12px_24px_rgba(53,106,246,0.24)] hover:bg-[#2C59D8]"
              >
                <a href="#pre-quiz">
                  Get My Risk Score
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="text-sm font-medium text-[#5D6B85]">
              Choose what you&apos;re dealing with now. We&apos;ll tailor the quiz from there.
            </p>
          </div>

          <div className="sl-card rounded-[32px] p-4 sm:p-5">
            <div className="overflow-hidden rounded-[26px] bg-white">
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
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {heroHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="sl-card rounded-[26px] p-6 transition duration-300 hover:-translate-y-0.5"
              >
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone} ${item.accent}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <p className="mt-5 text-lg font-semibold text-[#111827]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#5D6B85]">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="pre-quiz" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-6xl px-6 py-6">
          <div className="rounded-[34px] border border-[#D9E3F3] bg-white/84 p-8 shadow-[0_18px_42px_rgba(56,75,107,0.08)] backdrop-blur-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                Start From Your Situation
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                What are you dealing with right now?
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5D6B85]">
                Pick the option that feels most true right now. We&apos;ll keep the quiz short and route you to the right help path automatically.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {preQuizSituations.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/quiz?situation=${item.id}`}
                  className="group rounded-[26px] border border-[#D9E3F3] bg-[#FCFDFF] p-6 shadow-[0_10px_24px_rgba(56,75,107,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#BFD0F8] hover:bg-white hover:shadow-[0_18px_34px_rgba(56,75,107,0.12)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                      0{index + 1}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#A0AECB] transition group-hover:translate-x-0.5 group-hover:text-[#356AF6]" />
                  </div>
                  <p className="mt-5 text-xl font-semibold leading-tight text-[#111827]">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{item.support}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="scroll-mt-28">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="rounded-[34px] border border-[#D9E3F3] bg-white/82 p-8 shadow-[0_18px_42px_rgba(56,75,107,0.08)] backdrop-blur-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                Risk Blind Spots
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                Most businesses don&apos;t see the risks until it&apos;s too late
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5D6B85]">
                The problem isn&apos;t just the risk. It&apos;s not knowing where the gaps are.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {problemItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[28px] border border-[#D9E3F3] bg-[#FCFDFF] p-6 shadow-[0_10px_24px_rgba(56,75,107,0.06)]"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.tone} ${item.accent}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A99B4]">
                          0{index + 1}
                        </p>
                        <p className="mt-2 text-xl font-semibold leading-tight text-[#111827]">
                          {item.title}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{item.support}</p>
                      </div>
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

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {solutionSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="relative rounded-[26px] border border-[#D9E3F3] bg-[#FCFDFF] p-6 shadow-[0_10px_24px_rgba(56,75,107,0.06)]"
                >
                  {index < solutionSteps.length - 1 ? (
                    <span className="absolute -right-3 top-12 hidden h-px w-6 bg-[#BFD0F8] xl:block" />
                  ) : null}
                  <span className="inline-flex rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#356AF6]">
                    Step {index + 1}
                  </span>
                  <p className="mt-4 text-xl font-semibold leading-tight text-[#111827]">
                    {step.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{step.support}</p>
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
          <div className="rounded-[34px] border border-[#D9E3F3] bg-white/82 p-8 shadow-[0_18px_42px_rgba(56,75,107,0.08)] sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
                Results Preview
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                Your results will show you:
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5D6B85]">
                A focused snapshot designed to help you decide confidently and act fast.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {resultItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[26px] border border-[#D9E3F3] bg-[#FCFDFF] p-6 shadow-[0_10px_24px_rgba(56,75,107,0.06)]"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#356AF6]">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xl font-semibold leading-tight text-[#111827]">
                            {item.title}
                          </p>
                          <span className="text-sm font-semibold tracking-[0.08em] text-[#A0AECB]">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#5D6B85]">{item.support}</p>
                      </div>
                    </div>
                    <Icon className="mt-5 h-8 w-8 text-[#B7C4DE]" />
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
              <p className="mt-4 text-base leading-7 text-[#5D6B85]">
                Vetted experts, practical insights, and a workflow built for decisions that need to move.
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
              Get your risk score now and take control with clearer priorities and faster expert matching.
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
