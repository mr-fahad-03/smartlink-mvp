/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Star,
  Settings,
  PlusCircle,
  LogOut,
  UserRound,
  Menu,
  X,
} from "lucide-react";
import { getSessionMe, clearAdminSession, logoutCurrentSession } from "@/lib/admin-session";
import { canUseClientFlows } from "@/lib/role-guard";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Assessments", href: "/dashboard/projects", icon: ClipboardList },
  { name: "Expert Connections", href: "/dashboard/connections", icon: Users },
  { name: "My Reviews", href: "/dashboard/reviews", icon: Star },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function SidebarBody({
  pathname,
  email,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  email?: string | null;
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
          <UserRound className="h-4 w-4 shrink-0 text-[#2E67E8] dark:text-blue-400" />
          <span className="truncate text-[0.9rem] font-medium text-[#3D4F6B] dark:text-gray-300">Client Account</span>
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
        {email ? (
          <div className="min-w-0 px-2 pb-3">
            <p className="truncate text-[0.85rem] font-medium text-[#3D4F6B] dark:text-gray-300">{email}</p>
            <p className="mt-0.5 text-xs text-[#8FA0BC] dark:text-gray-500">Client workspace</p>
          </div>
        ) : null}

        <Link
          href="/quiz"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-[0.9rem] font-medium text-[#3D4F6B] transition-colors hover:bg-[#F6F9FE] hover:text-[#1B4FC8] dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:text-blue-400"
        >
          <PlusCircle className="h-[1.05rem] w-[1.05rem] shrink-0 text-[#5A6C89] dark:text-gray-400" />
          New Assessment
        </Link>

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

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSessionMe();
        if (!session || !canUseClientFlows(session.role)) {
          clearAdminSession();
          router.replace("/login?expired=true");
          return;
        }
        setUser(session);
      } catch (err) {
        console.error("Auth check failed", err);
        clearAdminSession();
        router.replace("/login?expired=true");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logoutCurrentSession();
    } catch {
      clearAdminSession();
    }
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
        <SidebarBody pathname={pathname} email={user?.email} onLogout={handleLogout} />
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
              email={user?.email}
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
