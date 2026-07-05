"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  CreditCard 
} from "lucide-react";

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

export default function ExpertDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex md:flex-col shrink-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Expert Dashboard
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">SmartLink Platform</p>
        </div>
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-2 rounded-lg group transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-white"
                        : "text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 transition-colors ${
                        isActive
                          ? "text-blue-700 dark:text-white"
                          : "text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                      }`}
                    />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
