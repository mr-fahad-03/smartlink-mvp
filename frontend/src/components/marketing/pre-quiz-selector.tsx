"use client";

import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CircleHelp,
  Clock3,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SituationCard {
  id: string;
  title: string;
  painPoint: string;
  outcome: string;
  icon: LucideIcon;
}

const situations: SituationCard[] = [
  {
    id: "situation_stuck",
    title: "My application is stuck",
    painPoint: "You started the process, but progress has slowed or stopped.",
    outcome: "Start with the questions most likely to unblock you.",
    icon: AlertTriangle,
  },
  {
    id: "situation_start",
    title: "I don't know where to start",
    painPoint: "You need clarity before taking the next step.",
    outcome: "Get a simpler path forward with guided matching.",
    icon: CircleHelp,
  },
  {
    id: "situation_urgent",
    title: "I need help urgently",
    painPoint: "Time matters and you need support quickly.",
    outcome: "Prioritize fast-response experts and urgent next steps.",
    icon: Clock3,
  },
  {
    id: "situation_failed",
    title: "I've already tried but failed",
    painPoint: "An earlier attempt did not work and you need a better route.",
    outcome: "Surface stronger-fit experts and a more practical action plan.",
    icon: RotateCcw,
  },
];

export function PreQuizSelector() {
  const router = useRouter();

  const handleSelect = (situationId: string) => {
    const params = new URLSearchParams({ situation: situationId });
    router.push(`/quiz?${params.toString()}`);
  };

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <Badge className="bg-[#EEF3FF] text-[#356AF6]">Pre-Quiz Selector</Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">
          What are you dealing with right now?
        </h2>
        <p className="max-w-3xl text-sm text-[#5D6B85] sm:text-base">
          Pick the option that feels closest to your current situation and we&apos;ll
          keep the rest of the quiz focused and simple.
        </p>
      </div> 
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {situations.map((situation, index) => {
          const Icon = situation.icon;

          return (
            <button
              key={situation.id}
              type="button"
              onClick={() => handleSelect(situation.id)}
              className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#356AF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F8FF]"
              aria-label={`Start quiz with ${situation.title}`}
            >
              <Card className="h-full rounded-[26px] border border-[#D9E3F3] bg-white shadow-[0_12px_28px_rgba(56,75,107,0.06)] transition hover:-translate-y-0.5 hover:border-[#BFD0F8] hover:shadow-[0_18px_34px_rgba(56,75,107,0.1)]">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#356AF6]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="border-[#D9E3F3] text-xs text-[#7B89A2]">
                      0{index + 1}
                    </Badge>
                  </div>   
                  <CardTitle className="text-lg text-[#111827]">{situation.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-[#5D6B85]">{situation.painPoint}</p>
                  <p className="font-medium text-[#111827]">{situation.outcome}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
