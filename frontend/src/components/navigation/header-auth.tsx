"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeaderAuth() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("smartlink_access_token");
    if (token) {
      const storedRole = localStorage.getItem("smartlink_role");
      setRole(storedRole);
    }
  }, []);

  return (
    <div className="flex items-center gap-6">
      <nav className="hidden items-center gap-6 text-sm font-medium text-[#5D6B85] md:flex">
        <a href="#how-it-works" className="transition hover:text-[#111827]">How It Works</a>
        <a href="#faq" className="transition hover:text-[#111827]">FAQ</a>
        {role !== "expert" && (
          <Link href="/expert-apply" className="transition hover:text-[#111827]">For Experts</Link>
        )}
      </nav>

      {role === "expert" ? (
        <Button
          asChild
          size="sm"
          className="h-9 rounded-xl bg-[#356AF6] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(53,106,246,0.22)] hover:bg-[#2C59D8]"
        >
          <Link href="/expert-dashboard">My Dashboard</Link>
        </Button>
      ) : role === "client" ? (
        <Button
          asChild
          size="sm"
          className="h-9 rounded-xl bg-[#356AF6] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(53,106,246,0.22)] hover:bg-[#2C59D8]"
        >
          <Link href="/dashboard">My Dashboard</Link>
        </Button>
      ) : ["super_admin", "admin", "moderator", "auditor"].includes(role || "") ? (
        <Button
          asChild
          size="sm"
          className="h-9 rounded-xl bg-[#356AF6] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(53,106,246,0.22)] hover:bg-[#2C59D8]"
        >
          <Link href="/admin">Admin Dashboard</Link>
        </Button>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-[#5D6B85] hover:text-[#111827] transition-colors">
            Sign In
          </Link>
          <Button
            asChild
            size="sm"
            className="h-9 rounded-xl bg-[#356AF6] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(53,106,246,0.22)] hover:bg-[#2C59D8]"
          >
            <a href="#who-is-this-for">Get Started</a>
          </Button>
        </div>
      )}
    </div>
  );
}
