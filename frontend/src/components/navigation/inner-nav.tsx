import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface InnerNavProps {
  breadcrumb: string;
  stepLabel?: string;
}

export function InnerNav({ breadcrumb, stepLabel }: InnerNavProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="flex items-center justify-center rounded-xl border border-[#D9E3F3] bg-white px-2 py-1"
        >
          <Image
            src="/logo.png"
            alt="SmartLinkBahamas logo"
            width={2103}
            height={748}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>
        <ChevronRight className="h-4 w-4 text-[#C5D3E8]" />
        <span className="text-[0.88rem] font-semibold text-[#111827]">{breadcrumb}</span>
      </div>
      <div className="flex items-center gap-2">
        {stepLabel ? (
          <span className="rounded-full border border-[#D9E3F3] bg-[#F7FAFF] px-3 py-1 text-[0.75rem] font-semibold text-[#5D6B85]">
            {stepLabel}
          </span>
        ) : null}
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-[#D9E3F3] bg-white px-3 py-2 text-[0.82rem] font-medium text-[#5D6B85] transition hover:bg-[#F7FAFF] hover:text-[#111827]"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </div>
    </div>
  );
}
