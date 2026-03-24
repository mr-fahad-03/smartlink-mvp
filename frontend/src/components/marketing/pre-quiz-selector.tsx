"use client";

import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CloudOff,
  Fingerprint,
  LaptopMinimalCheck,
  Network,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizCategory } from "@/types";

interface ConcernCard {
  id: string;
  title: string;
  painPoint: string;
  outcome: string;
  category: QuizCategory;
  icon: LucideIcon;
}

const concerns: ConcernCard[] = [
  {
    id: "network-blindspots",
    title: "Unknown Network Exposures",
    painPoint: "You are unsure where attackers can enter or move laterally.",
    outcome: "Surface your highest-risk network gaps first.",
    category: "Network Security",
    icon: Network,
  },
  {
    id: "privileged-access-sprawl",
    title: "Privilege Sprawl",
    painPoint: "Too many users have long-lived or excessive access rights.",
    outcome: "Identify where access controls are quietly failing.",
    category: "Identity & Access Management",
    icon: Fingerprint,
  },
  {
    id: "device-risk",
    title: "Unmanaged Endpoints",
    painPoint: "Laptops and workstations are inconsistent across teams.",
    outcome: "Pinpoint endpoint controls that need urgent hardening.",
    category: "Endpoint Security",
    icon: LaptopMinimalCheck,
  },
  {
    id: "cloud-drift",
    title: "Cloud Misconfiguration Drift",
    painPoint: "Cloud permissions and configs keep changing without visibility.",
    outcome: "Find your most costly cloud security blind spots quickly.",
    category: "Cloud Security",
    icon: CloudOff,
  },
  {
    id: "ir-readiness",
    title: "Slow Incident Response",
    painPoint: "When alerts hit, ownership and response steps are unclear.",
    outcome: "Expose response weaknesses before the next incident.",
    category: "Incident Response",
    icon: AlertTriangle,
  },
];

export function PreQuizSelector() {
  const router = useRouter();

  const handleSelect = (category: QuizCategory) => {
    const params = new URLSearchParams({ category });
    router.push(`/quiz?${params.toString()}`);
  };

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <Badge variant="secondary" className="bg-secondary/20 text-secondary">
          Pre-Quiz Selector
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          What is hurting your security posture right now?
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Pick your top concern. We will start the quiz with targeted questions
          for that risk area.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {concerns.map((concern) => {
          const Icon = concern.icon;

          return (
            <button
              key={concern.id}
              type="button"
              onClick={() => handleSelect(concern.category)}
              className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={`Start quiz with ${concern.category}`}
            >
              <Card className="h-full border-border/80 bg-card/80 transition hover:-translate-y-0.5 hover:border-secondary/70 hover:bg-card">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="border-border text-xs">
                      {concern.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{concern.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{concern.painPoint}</p>
                  <p className="font-medium text-foreground">{concern.outcome}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
