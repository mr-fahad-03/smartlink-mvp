"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if the current URL hash contains an auth access token from Supabase
    if (window.location.hash && window.location.hash.includes("access_token=")) {
      // Don't loop if already on /auth/callback
      if (!window.location.pathname.startsWith("/auth/callback")) {
        router.replace(`/auth/callback${window.location.hash}`);
      }
    }
  }, [router]);

  return null;
}
