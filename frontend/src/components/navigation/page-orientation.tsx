"use client";

import Link from "next/link";
import { Home, MoveRight } from "lucide-react";

import { BackButton } from "@/components/navigation/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PageOrientationProps {
  fallbackHref: string;
  eyebrow: string;
  title: string;
  description: string;
  currentView: string;
  stepLabel: string;
  nextLabel: string;
  className?: string;
}

export function PageOrientation({
  fallbackHref,
  eyebrow,
  title,
  description,
  currentView,
  stepLabel,
  nextLabel,
  className,
}: PageOrientationProps) {
  return (
    <section
      className={`rounded-[30px] border border-[#D9E3F3] bg-white p-5 shadow-[0_14px_34px_rgba(56,75,107,0.08)] sm:p-6 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton fallbackHref={fallbackHref} />
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-[#D9E3F3] bg-white text-[#111827] shadow-sm hover:bg-[#F7FAFF]"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="h-auto rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#356AF6]">
            {currentView}
          </Badge>
          <Badge
            variant="outline"
            className="h-auto rounded-full border-[#D9E3F3] bg-[#FCFDFF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#5D6B85]"
          >
            {stepLabel}
          </Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#356AF6]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5D6B85] sm:text-base">
            {description}
          </p>
        </div>

        <div className="rounded-[24px] border border-[#D9E3F3] bg-[#F7FAFF] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7B89A2]">
            What comes next
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
            <MoveRight className="h-4 w-4 text-[#356AF6]" />
            {nextLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
