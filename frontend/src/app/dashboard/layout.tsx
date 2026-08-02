/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
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
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { getSessionMe, clearAdminSession } from "@/lib/admin-session";
import { canUseClientFlows } from "@/lib/role-guard";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Assessments", href: "/dashboard/projects", icon: ClipboardList },
  { name: "Expert Connections", href: "/dashboard/connections", icon: Users },
  { name: "My Reviews", href: "/dashboard/reviews", icon: Star },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

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
          router.replace("/login");
          return;
        }
        setUser(session);
      } catch (err) {
        console.error("Auth check failed", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    clearAdminSession();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu trigger */}
      <div className="md:hidden fixed top-[18px] right-24 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex md:flex-col shrink-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Client Space
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">SmartLink Bahamas</p>
        </div>

        <div className="flex-1 px-3 py-4 overflow-y-auto flex flex-col justify-between">
          <ul className="space-y-1.5 font-medium">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-2.5 rounded-xl group transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 transition-colors ${
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200"
                      }`}
                    />
                    <span className="ml-3 text-[0.92rem]">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link
              href="/quiz"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              New Assessment
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center p-2.5 rounded-xl w-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-all font-medium"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
              <span className="ml-3 text-[0.92rem]">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 pt-5 pb-4 px-4 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-black text-blue-600 dark:text-blue-400">Client Space</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mt-4 flex-1 h-0 overflow-y-auto flex flex-col justify-between">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center p-2.5 rounded-xl ${
                          isActive
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href="/quiz"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 text-white font-semibold text-sm rounded-xl"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Assessment
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center p-2.5 rounded-xl w-full text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="ml-3">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
