"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Gauge,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockQuizEnginePayload } from "@/data";
import { saveAssessmentSubmission } from "@/lib/assessment-storage";
import { cn } from "@/lib/utils";
import type {
  AssessmentSubmission,
  Option,
  Question,
  QuizCategory,
  RiskLevel as StoredRiskLevel,
} from "@/types";

interface QuizFlowProps {
  initialCategory?: string;
}

interface LeadCaptureFormValues {
  fullName: string;
  workEmail: string;
  phoneNumber: string;
  companyName: string;
  role: string;
  businessType: string;
  location: string;
  website: string;
  teamSize: string;
  consent: boolean;
}

interface CategoryInsight {
  category: QuizCategory;
  total: number;
  answered: number;
  riskPoints: number;
  maxRiskPoints: number;
}

type FlowStep = "quiz" | "lead" | "loading";
type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

const QUIZ_CATEGORIES: QuizCategory[] = [
  "Network Security",
  "Identity & Access Management",
  "Endpoint Security",
  "Cloud Security",
  "Incident Response",
];

function toQuizCategory(value?: string): QuizCategory | undefined {
  if (!value) {
    return undefined;
  }

  return QUIZ_CATEGORIES.find((category) => category === value);
}

function flattenQuestions(): Question[] {
  return mockQuizEnginePayload.quiz.sections.flatMap((section) => section.questions);
}

function calculateRiskPoints(questions: Question[], answers: Record<string, string>): number {
  return questions.reduce((sum, question) => {
    const selectedOptionId = answers[question.id];
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);

    return sum + (selectedOption?.riskPoints ?? 0);
  }, 0);
}

function calculateMaxRiskPoints(questions: Question[]): number {
  return questions.reduce((sum, question) => {
    const highestRisk = question.options.reduce((max, option) => Math.max(max, option.riskPoints), 0);
    return sum + highestRisk;
  }, 0);
}

function toRiskLevel(percentage: number): RiskLevel {
  if (percentage >= 75) {
    return "Critical";
  }
  if (percentage >= 50) {
    return "High";
  }
  if (percentage >= 25) {
    return "Moderate";
  }
  return "Low";
}

function toStoredRiskLevel(percentage: number): StoredRiskLevel {
  if (percentage >= 75) {
    return "critical";
  }
  if (percentage >= 50) {
    return "high";
  }
  if (percentage >= 25) {
    return "moderate";
  }
  return "low";
}

function buildPriorityActions(categoryInsights: CategoryInsight[]): string[] {
  return categoryInsights.slice(0, 3).map((item, index) => {
    if (index === 0) {
      return `Prioritize immediate remediation in ${item.category} to reduce your highest-impact risk first.`;
    }
    if (index === 1) {
      return `Establish a 30-day hardening plan for ${item.category} controls and ownership.`;
    }
    return `Set measurable KPIs and monthly reviews to improve ${item.category} resilience.`;
  });
}

function getRiskLevelClasses(riskLevel: RiskLevel): string {
  if (riskLevel === "Critical") {
    return "border-rose-200 bg-rose-100/80 text-rose-700";
  }
  if (riskLevel === "High") {
    return "border-amber-200 bg-amber-100/80 text-amber-700";
  }
  if (riskLevel === "Moderate") {
    return "border-sky-200 bg-sky-100/80 text-sky-700";
  }
  return "border-emerald-200 bg-emerald-100/80 text-emerald-700";
}

function getOptionRiskMeta(points: number, maxPoints: number): { label: string; tone: string } {
  if (maxPoints <= 0) {
    return {
      label: "Risk impact",
      tone: "border-slate-200 bg-slate-100 text-slate-600",
    };
  }

  const ratio = points / maxPoints;

  if (ratio >= 0.67) {
    return {
      label: "Higher risk impact",
      tone: "border-rose-200 bg-rose-100 text-rose-700",
    };
  }

  if (ratio >= 0.34) {
    return {
      label: "Medium risk impact",
      tone: "border-amber-200 bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Lower risk impact",
    tone: "border-emerald-200 bg-emerald-100 text-emerald-700",
  };
}

function buildCategoryInsights(
  questions: Question[],
  answers: Record<string, string>,
): CategoryInsight[] {
  const grouped = new Map<QuizCategory, CategoryInsight>();

  for (const question of questions) {
    const selectedOptionId = answers[question.id];
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);
    const maxForQuestion = question.options.reduce((max, option) => Math.max(max, option.riskPoints), 0);
    const previous = grouped.get(question.category);

    if (previous) {
      previous.total += 1;
      previous.maxRiskPoints += maxForQuestion;
      if (selectedOption) {
        previous.answered += 1;
        previous.riskPoints += selectedOption.riskPoints;
      }
    } else {
      grouped.set(question.category, {
        category: question.category,
        total: 1,
        answered: selectedOption ? 1 : 0,
        riskPoints: selectedOption?.riskPoints ?? 0,
        maxRiskPoints: maxForQuestion,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const aPercent = a.maxRiskPoints === 0 ? 0 : a.riskPoints / a.maxRiskPoints;
    const bPercent = b.maxRiskPoints === 0 ? 0 : b.riskPoints / b.maxRiskPoints;
    return bPercent - aPercent;
  });
}

export function QuizFlow({ initialCategory }: QuizFlowProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const nextQuestionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedCategory = toQuizCategory(initialCategory);

  const orderedQuestions = useMemo(() => {
    const allQuestions = flattenQuestions();

    if (!selectedCategory) {
      return allQuestions;
    }

    const prioritized = allQuestions.filter((question) => question.category === selectedCategory);
    const remaining = allQuestions.filter((question) => question.category !== selectedCategory);
    return [...prioritized, ...remaining];
  }, [selectedCategory]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flowStep, setFlowStep] = useState<FlowStep>("quiz");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadCaptureFormValues>({
    defaultValues: {
      fullName: "",
      workEmail: "",
      phoneNumber: "",
      companyName: "",
      role: "",
      businessType: "",
      location: "",
      website: "",
      teamSize: "",
      consent: false,
    },
  });

  useEffect(() => {
    return () => {
      if (nextQuestionTimeout.current) {
        clearTimeout(nextQuestionTimeout.current);
      }
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (flowStep === "quiz" && currentIndex >= orderedQuestions.length) {
      setFlowStep("lead");
    }
  }, [currentIndex, flowStep, orderedQuestions.length]);

  const totalQuestions = orderedQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = orderedQuestions[currentIndex];
  const totalRiskPoints = useMemo(
    () => calculateRiskPoints(orderedQuestions, answers),
    [answers, orderedQuestions],
  );
  const maxRiskPoints = useMemo(() => calculateMaxRiskPoints(orderedQuestions), [orderedQuestions]);
  const riskPercentage = maxRiskPoints === 0 ? 0 : Math.round((totalRiskPoints / maxRiskPoints) * 100);
  const riskLevel = toRiskLevel(riskPercentage);
  const progressValue =
    flowStep === "quiz"
      ? totalQuestions === 0
        ? 0
        : Math.round((answeredCount / totalQuestions) * 100)
      : 100;
  const categoryInsights = useMemo(
    () => buildCategoryInsights(orderedQuestions, answers),
    [answers, orderedQuestions],
  );
  const highestRiskCategory = categoryInsights[0]?.category ?? orderedQuestions[0]?.category;
  const inputFieldClass =
    "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-11 pr-3 text-sm text-[#111827] outline-none transition focus:border-[#45B0A0]/70 focus:bg-white focus:ring-2 focus:ring-[#45B0A0]/25";
  const selectFieldClass =
    "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 text-sm text-[#111827] outline-none transition focus:border-[#45B0A0]/70 focus:bg-white focus:ring-2 focus:ring-[#45B0A0]/25";

  const handleOptionSelect = (questionId: string, option: Option) => {
    if (isTransitioning || flowStep !== "quiz") {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [questionId]: option.id,
    }));
    setIsTransitioning(true);

    if (nextQuestionTimeout.current) {
      clearTimeout(nextQuestionTimeout.current);
    }

    nextQuestionTimeout.current = setTimeout(() => {
      setCurrentIndex((previous) => previous + 1);
      setIsTransitioning(false);
    }, 260);
  };

  const handleLeadCaptureSubmit = (values: LeadCaptureFormValues) => {
    const submittedAt = new Date().toISOString();
    const responses = orderedQuestions
      .map((question) => {
        const selectedOptionId = answers[question.id];
        if (!selectedOptionId) {
          return null;
        }

        const selectedOption = question.options.find((option) => option.id === selectedOptionId);
        if (!selectedOption) {
          return null;
        }

        return {
          questionId: question.id,
          questionText: question.text,
          category: question.category,
          selectedOptionId: selectedOption.id,
          selectedOptionLabel: selectedOption.label,
          selectedOptionText: selectedOption.text,
          selectedOptionRiskPoints: selectedOption.riskPoints,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const categoryBreakdown = categoryInsights.map((item) => {
      const normalizedCategoryScore =
        item.maxRiskPoints === 0 ? 0 : Math.round((item.riskPoints / item.maxRiskPoints) * 100);

      return {
        category: item.category,
        riskPoints: item.riskPoints,
        maxRiskPoints: item.maxRiskPoints,
        riskLevel: toStoredRiskLevel(normalizedCategoryScore),
      };
    });

    const recommendedExpertIds = mockQuizEnginePayload.experts
      .filter((expert) => highestRiskCategory && expert.specialties.includes(highestRiskCategory))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map((expert) => expert.id);

    const payload: AssessmentSubmission = {
      assessmentId: `asmt_${Date.now()}`,
      submittedAt,
      totalQuestions,
      answeredQuestions: answeredCount,
      totalRiskPoints,
      maxRiskPoints,
      normalizedScore: riskPercentage,
      riskLevel: toStoredRiskLevel(riskPercentage),
      highestRiskCategory: highestRiskCategory ?? orderedQuestions[0].category,
      categoryBreakdown,
      priorityActions: buildPriorityActions(categoryInsights),
      recommendedExpertIds:
        recommendedExpertIds.length > 0
          ? recommendedExpertIds
          : mockQuizEnginePayload.sampleAssessmentResult.recommendedExpertIds,
      lead: {
        ...values,
        website: values.website?.trim() || undefined,
      },
      responses,
    };

    saveAssessmentSubmission(payload);
    void values;
    setFlowStep("loading");

    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }

    loadingTimeout.current = setTimeout(() => {
      router.push("/results");
    }, 2000);
  };

  if (totalQuestions === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-rose-200 bg-rose-50/90 p-8">
          <Badge className="bg-rose-200 text-rose-700">Quiz Unavailable</Badge>
          <h1 className="mt-4 text-2xl font-semibold text-[#111827]">
            No questions were found in the quiz dataset.
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Please check your mock quiz data and try again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#f9fcff_0%,#eef3f8_42%,#edf2f6_100%)] text-[#111827]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#cfd8e3_1px,transparent_1px),linear-gradient(90deg,#cfd8e3_1px,transparent_1px)] [background-size:34px_34px]" />
      </div>

      <section
        className={cn(
          "relative mx-auto w-full max-w-6xl px-6 pb-14 pt-14 transition duration-300",
          flowStep !== "quiz" && "pointer-events-none blur-[3px]",
        )}
      >
        <div className="grid gap-6 lg:grid-cols-[1.34fr_0.66fr]">
          <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-[0_16px_40px_rgba(31,41,55,0.1)] backdrop-blur-md sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="bg-[#45B0A0]/15 text-[#2f8f90]">Cybersecurity Assessment</Badge>
              <Badge variant="outline" className={cn("border text-xs", getRiskLevelClasses(riskLevel))}>
                {riskLevel} Risk
              </Badge>
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">
                  Assess your operational and security risk in minutes
                </h1>
                <p className="mt-2 text-sm leading-7 text-[#5f6b7b] sm:text-base">
                  Select the option that best matches your current reality. Your results are scored live.
                </p>
              </div>
              {selectedCategory ? (
                <Badge variant="outline" className="border-[#45B0A0]/35 bg-[#45B0A0]/10 text-[#2f8f90]">
                  Prioritized: {selectedCategory}
                </Badge>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">Progress</p>
                <p className="mt-1 text-lg font-semibold text-[#111827]">
                  {answeredCount}/{totalQuestions}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">Risk Score</p>
                <p className="mt-1 text-lg font-semibold text-[#111827]">{riskPercentage}/100</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">Top Risk Domain</p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{highestRiskCategory}</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-[#6B7280]">
                <span>Assessment progress</span>
                <span>{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-2.5 bg-white/60" />
            </div>

            <div className="mt-8">
              <AnimatePresence mode="wait" initial={false}>
                {flowStep === "quiz" && currentQuestion ? (
                  <motion.section
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: reducedMotion ? 0 : 36 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reducedMotion ? 0 : -36 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="space-y-5"
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white/75 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {currentQuestion.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Question {currentIndex + 1} of {totalQuestions}
                        </Badge>
                      </div>
                      <h2 className="mt-4 text-xl font-semibold leading-tight text-[#111827] sm:text-2xl">
                        {currentQuestion.text}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#5f6b7b]">{currentQuestion.objective}</p>
                    </div>

                    <div className="grid gap-3">
                      {currentQuestion.options.map((option) => {
                        const isSelected = answers[currentQuestion.id] === option.id;
                        const maxOptionRisk = currentQuestion.options.reduce(
                          (max, item) => Math.max(max, item.riskPoints),
                          0,
                        );
                        const riskMeta = getOptionRiskMeta(option.riskPoints, maxOptionRisk);

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleOptionSelect(currentQuestion.id, option)}
                            disabled={isTransitioning}
                            className={cn(
                              "group w-full rounded-2xl border border-slate-200 bg-white/85 p-5 text-left transition-all",
                              "hover:-translate-y-0.5 hover:border-[#45B0A0]/45 hover:shadow-[0_10px_24px_rgba(17,24,39,0.08)]",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45B0A0]/45 focus-visible:ring-offset-2",
                              "focus-visible:ring-offset-[#edf2f6]",
                              isSelected && "border-[#45B0A0]/55 bg-[#45B0A0]/10 ring-2 ring-[#45B0A0]/30",
                              isTransitioning && "pointer-events-none opacity-90",
                            )}
                            aria-label={`Select option ${option.label}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#45B0A0]/25 bg-[#45B0A0]/12 text-sm font-semibold text-[#2f8f90]">
                                  {option.label}
                                </span>
                                <div>
                                  <p className="text-base font-semibold text-[#111827]">{option.text}</p>
                                  <p className="mt-1.5 text-sm leading-6 text-[#5f6b7b]">{option.explanation}</p>
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "rounded-full border px-2.5 py-1 text-xs font-medium",
                                  riskMeta.tone,
                                )}
                              >
                                {riskMeta.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.section>
                ) : null}
                {flowStep !== "quiz" ? (
                  <motion.section
                    key="assessment-complete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-6"
                  >
                    <p className="text-sm uppercase tracking-[0.12em] text-[#2f8f90]">Assessment Complete</p>
                    <h2 className="mt-2 text-xl font-semibold text-[#111827]">
                      Preparing your personalized report
                    </h2>
                  </motion.section>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_16px_40px_rgba(31,41,55,0.1)] backdrop-blur-md">
              <div className="flex items-center gap-2 text-[#2f8f90]">
                <Gauge className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">Live Risk Meter</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-[#111827]">{riskPercentage}</p>
              <p className="text-sm text-[#6B7280]">Current score out of 100</p>
              <div className="mt-4 rounded-full bg-white/80 p-1">
                <Progress value={riskPercentage} className="h-2.5 bg-slate-200/70" />
              </div>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_16px_40px_rgba(31,41,55,0.1)] backdrop-blur-md">
              <div className="flex items-center gap-2 text-[#2f8f90]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">Category Heatmap</p>
              </div>
              <div className="mt-4 space-y-3">
                {categoryInsights.map((item) => {
                  const categoryProgress = item.total === 0 ? 0 : Math.round((item.answered / item.total) * 100);
                  const categoryRisk = item.maxRiskPoints === 0 ? 0 : Math.round((item.riskPoints / item.maxRiskPoints) * 100);

                  return (
                    <div key={item.category} className="rounded-xl border border-slate-200 bg-white/85 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-[#111827]">{item.category}</p>
                        <span className="text-xs text-[#6B7280]">{categoryRisk}% risk</span>
                      </div>
                      <div className="mt-2">
                        <Progress value={categoryProgress} className="h-1.5 bg-slate-200/70" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_16px_40px_rgba(31,41,55,0.1)] backdrop-blur-md">
              <div className="flex items-center gap-2 text-[#2f8f90]">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">What You Unlock</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[#5f6b7b]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Personalized risk score by category
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Prioritized remediation steps
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Expert matching based on your highest risk area
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <AnimatePresence>
        {flowStep === "lead" ? (
          <motion.div
            key="lead-capture-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 p-4 backdrop-blur-md sm:p-6"
          >
            <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: reducedMotion ? 0 : 24, scale: reducedMotion ? 1 : 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_24px_60px_rgba(17,24,39,0.32)] sm:p-8"
              >
                <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="space-y-4 rounded-2xl border border-[#45B0A0]/30 bg-[linear-gradient(145deg,rgba(69,176,160,0.14),rgba(126,165,217,0.08))] p-5 sm:p-6">
                    <Badge className="w-fit bg-emerald-500 text-white">Lead Capture</Badge>
                    <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                      Join 500+ Bahamian businesses securing their future
                    </h2>
                    <p className="text-sm leading-6 text-[#5f6b7b]">
                      Complete your details to unlock your full report, priority actions, and expert matches.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/80 bg-white/75 p-4">
                        <p className="text-xs uppercase tracking-wide text-[#6B7280]">Assessment Complete</p>
                        <p className="mt-1 text-lg font-semibold text-[#111827]">
                          {answeredCount} / {totalQuestions}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/80 bg-white/75 p-4">
                        <p className="text-xs uppercase tracking-wide text-[#6B7280]">Current Snapshot</p>
                        <p className="mt-1 text-lg font-semibold text-[#111827]">{riskLevel}</p>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit(handleLeadCaptureSubmit)}
                    className="space-y-5 rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-7"
                    noValidate
                  >
                    <div>
                      <Badge className="bg-[#45B0A0]/12 text-[#2f8f90]">Secure Form</Badge>
                      <h3 className="mt-3 text-xl font-semibold text-[#111827]">Unlock Your Full Results</h3>
                      <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                        We use this to personalize your report and follow up with relevant experts.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                        Contact Details
                      </p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="fullName" className="text-sm font-medium text-[#111827]">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="fullName"
                              type="text"
                              className={inputFieldClass}
                              {...register("fullName", {
                                required: "Full name is required.",
                                minLength: {
                                  value: 2,
                                  message: "Please enter at least 2 characters.",
                                },
                              })}
                            />
                          </div>
                          {errors.fullName ? <p className="text-xs text-rose-600">{errors.fullName.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="workEmail" className="text-sm font-medium text-[#111827]">
                            Work Email
                          </label>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="workEmail"
                              type="email"
                              className={inputFieldClass}
                              {...register("workEmail", {
                                required: "Work email is required.",
                                pattern: {
                                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                  message: "Please enter a valid email address.",
                                },
                              })}
                            />
                          </div>
                          {errors.workEmail ? <p className="text-xs text-rose-600">{errors.workEmail.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="phoneNumber" className="text-sm font-medium text-[#111827]">
                            Phone Number
                          </label>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="phoneNumber"
                              type="tel"
                              className={inputFieldClass}
                              {...register("phoneNumber", {
                                required: "Phone number is required.",
                                minLength: {
                                  value: 7,
                                  message: "Please enter a valid phone number.",
                                },
                              })}
                            />
                          </div>
                          {errors.phoneNumber ? <p className="text-xs text-rose-600">{errors.phoneNumber.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="role" className="text-sm font-medium text-[#111827]">
                            Primary Role
                          </label>
                          <div className="relative">
                            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="role"
                              type="text"
                              className={inputFieldClass}
                              {...register("role", {
                                required: "Primary role is required.",
                              })}
                            />
                          </div>
                          {errors.role ? <p className="text-xs text-rose-600">{errors.role.message}</p> : null}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                        Company Details
                      </p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="companyName" className="text-sm font-medium text-[#111827]">
                            Company Name
                          </label>
                          <div className="relative">
                            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="companyName"
                              type="text"
                              className={inputFieldClass}
                              {...register("companyName", {
                                required: "Company name is required.",
                              })}
                            />
                          </div>
                          {errors.companyName ? <p className="text-xs text-rose-600">{errors.companyName.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="businessType" className="text-sm font-medium text-[#111827]">
                            Business Type
                          </label>
                          <div className="relative">
                            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="businessType"
                              type="text"
                              className={inputFieldClass}
                              {...register("businessType", {
                                required: "Business type is required.",
                              })}
                            />
                          </div>
                          {errors.businessType ? <p className="text-xs text-rose-600">{errors.businessType.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="location" className="text-sm font-medium text-[#111827]">
                            Business Location
                          </label>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="location"
                              type="text"
                              className={inputFieldClass}
                              {...register("location", {
                                required: "Business location is required.",
                              })}
                            />
                          </div>
                          {errors.location ? <p className="text-xs text-rose-600">{errors.location.message}</p> : null}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="website" className="text-sm font-medium text-[#111827]">
                            Website (Optional)
                          </label>
                          <div className="relative">
                            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="website"
                              type="url"
                              placeholder="https://"
                              className={inputFieldClass}
                              {...register("website")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="teamSize" className="text-sm font-medium text-[#111827]">
                          Team Size
                        </label>
                        <div className="relative">
                          <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <select
                            id="teamSize"
                            className={cn(selectFieldClass, "pl-10")}
                            {...register("teamSize", {
                              required: "Please select your team size.",
                            })}
                          >
                            <option value="">Select team size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                          </select>
                        </div>
                        {errors.teamSize ? <p className="text-xs text-rose-600">{errors.teamSize.message}</p> : null}
                      </div>

                      <div className="rounded-2xl border border-[#45B0A0]/30 bg-[#45B0A0]/8 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2f8f90]">
                          Safe & Secure
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#5f6b7b]">
                          Your data is used only to generate your report and relevant expert matches.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        {...register("consent", {
                          validate: (value) => value || "You must agree before viewing results.",
                        })}
                      />
                      <span className="text-sm text-[#5f6b7b]">
                        I agree to receive my assessment report and cybersecurity insights.
                      </span>
                    </label>
                    {errors.consent ? <p className="text-xs text-rose-600">{errors.consent.message}</p> : null}

                    <Button type="submit" size="lg" className="h-12 w-full bg-[#45B0A0] text-white hover:bg-[#3ca293]">
                      View My Results
                    </Button>
                  </form>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}

        {flowStep === "loading" ? (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-md"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white/95 px-6 py-10 text-center shadow-[0_24px_60px_rgba(17,24,39,0.3)]">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#45B0A0]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#111827]">Loading Results</h2>
              <p className="mt-2 text-sm text-[#6B7280]">
                Building your personalized risk analysis and recommended next actions.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
