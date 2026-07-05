"use client";

import React from "react";
import { CreditCard, Lock, Clock } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Payments</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your earnings, payouts, and invoices.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-blue-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Coming Soon</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8">
          We are currently working on a fully integrated billing system to manage your payouts automatically. This feature will be available in a future update.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
          <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg flex gap-4 text-left">
            <CreditCard className="w-6 h-6 text-indigo-500 shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Secure Payouts</h4>
              <p className="text-sm text-gray-500">Directly connect your bank account for seamless withdrawals.</p>
            </div>
          </div>
          <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg flex gap-4 text-left">
            <Lock className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Escrow Protection</h4>
              <p className="text-sm text-gray-500">Funds are held safely until the milestone is approved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
