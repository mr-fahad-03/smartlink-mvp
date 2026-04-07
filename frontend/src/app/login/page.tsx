import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="sl-page flex min-h-screen items-center justify-center px-6 py-16 text-[#111827]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#356AF6] text-xl font-bold text-white">
            SL
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">Admin Sign In</h1>
          <p className="mt-1 text-sm text-[#5D6B85]">SmartLink Bahamas</p>
        </div>

        <div className="rounded-[28px] border border-[#D9E3F3] bg-white p-7 shadow-[0_16px_36px_rgba(56,75,107,0.08)]">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5D6B85]">
                Email address
              </label>
              <input
                type="email"
                defaultValue="admin@smartlinkbahamas.com"
                placeholder="admin@smartlinkbahamas.com"
                className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                readOnly
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#5D6B85]">
                Password
              </label>
              <input
                type="password"
                defaultValue="••••••••••"
                placeholder="Password"
                className="h-11 w-full rounded-2xl border border-[#D9E3F3] bg-[#FCFDFF] px-4 text-sm text-[#111827] outline-none transition focus:border-[#356AF6] focus:ring-2 focus:ring-[#356AF6]/15"
                readOnly
              />
            </div>

            <Button
              asChild
              className="mt-2 h-12 w-full rounded-xl bg-[#356AF6] text-[0.95rem] font-semibold text-white shadow-[0_4px_16px_rgba(53,106,246,0.28)] hover:bg-[#2C59D8]"
            >
              <Link href="/admin">
                <LockKeyhole className="mr-2 h-4 w-4" />
                Sign In to Admin Panel
              </Link>
            </Button>
          </div>

          <p className="mt-5 text-center text-xs text-[#A0AECB]">
            Authentication will be enabled before public launch.
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-[#5D6B85] hover:text-[#356AF6] transition">
            ← Back to SmartLink
          </Link>
        </p>
      </div>
    </main>
  );
}
