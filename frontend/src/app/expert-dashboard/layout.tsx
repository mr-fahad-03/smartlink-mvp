"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  Star,
  BarChart3,
  User,
  ShieldCheck,
  CalendarDays,
  Settings,
  CreditCard,
  BadgeCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { clearAdminSession, logoutCurrentSession } from "@/lib/admin-session";

const navigation = [
  { name: "Dashboard", href: "/expert-dashboard", icon: LayoutDashboard },
  { name: "Opportunities", href: "/expert-dashboard/opportunities", icon: Briefcase },
  { name: "Clients", href: "/expert-dashboard/clients", icon: Users },
  { name: "Messages", href: "/expert-dashboard/messages", icon: MessageSquare },
  { name: "Reviews", href: "/expert-dashboard/reviews", icon: Star },
  { name: "Analytics", href: "/expert-dashboard/analytics", icon: BarChart3 },
  { name: "Profile", href: "/expert-dashboard/profile", icon: User },
  { name: "Verification", href: "/expert-dashboard/verification", icon: ShieldCheck },
  { name: "Availability", href: "/expert-dashboard/availability", icon: CalendarDays },
  { name: "Security Settings", href: "/expert-dashboard/security", icon: Settings },
  { name: "Billing", href: "/expert-dashboard/billing", icon: CreditCard },
];

function SidebarBody({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="px-5 pb-5 pt-6">
        <Link href="/" onClick={onNavigate} className="inline-flex items-center">
          <Image
            src="/logo.png"
            alt="SmartLinkBahamas logo"
            width={2103}
            height={748}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[#DDE7F5] px-4 py-2.5 dark:border-gray-700">
          <BadgeCheck className="h-4 w-4 shrink-0 text-[#2E67E8] dark:text-blue-400" />
          <span className="truncate text-[0.9rem] font-medium text-[#3D4F6B] dark:text-gray-300">Expert Account</span>
        </div>
      </div>

      <div className="h-px bg-[#E9EFF8] dark:bg-gray-700" />

      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`relative flex items-center gap-3 px-5 py-3.5 transition-colors ${
                isActive ? "bg-[#EEF3FF] dark:bg-blue-950/30" : "hover:bg-[#F6F9FE] dark:hover:bg-gray-700/40"
              }`}
            >
              <Icon
                className={`h-[1.15rem] w-[1.15rem] shrink-0 ${
                  isActive ? "text-[#1B4FC8] dark:text-blue-400" : "text-[#5A6C89] dark:text-gray-400"
                }`}
              />
              <span
                className={`flex-1 truncate text-[0.97rem] ${
                  isActive
                    ? "font-semibold text-[#1B4FC8] dark:text-blue-400"
                    : "font-medium text-[#3D4F6B] dark:text-gray-300"
                }`}
              >
                {item.name}
              </span>
              {isActive ? <span className="absolute inset-y-0 right-0 w-[3px] rounded-l-full bg-[#2E67E8]" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="h-px bg-[#E9EFF8] dark:bg-gray-700" />

      <div className="px-3 py-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[0.9rem] font-medium text-[#5A6C89] transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-gray-400 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
        >
          <LogOut className="h-[1.05rem] w-[1.05rem] shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function ExpertDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutCurrentSession();
    } catch {
      clearAdminSession();
    }
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] dark:bg-gray-900">
      {/* Mobile menu trigger */}
      <div className="fixed right-4 top-4 z-50 md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-xl border border-[#DDE7F5] bg-white p-2 text-[#3D4F6B] shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-[272px] shrink-0 flex-col border-r border-[#DDE7F5] bg-white md:flex dark:border-gray-700 dark:bg-gray-800">
        <SidebarBody pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex w-full max-w-[288px] flex-col bg-white shadow-xl dark:bg-gray-800">
            <SidebarBody
              pathname={pathname}
              onNavigate={() => setMobileMenuOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      ) : null}

      {/* Main content */}
      <main className="min-h-screen flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
