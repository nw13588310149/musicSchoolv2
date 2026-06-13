"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/auth-store";

function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center rounded-[2rem] border border-white/60 bg-white/72 shadow-[0_24px_80px_rgba(107,76,196,0.08)] backdrop-blur-md">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/15 border-t-primary" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">正在进入音乐之路 2.0</p>
          <p className="text-muted-foreground text-sm">同步学校身份与品牌配置...</p>
        </div>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const fetchedRef = useRef(false);

  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const hydrateToken = useAuthStore((state) => state.hydrateToken);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    if (!hydrated) {
      hydrateToken();
    }
  }, [hydrateToken, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!user && !fetchedRef.current) {
      fetchedRef.current = true;
      void fetchProfile().catch(() => {
        router.replace("/login");
      });
    }
  }, [fetchProfile, hydrated, pathname, router, token, user]);

  if (!hydrated || !token || loading || !user) {
    return <LoadingScreen />;
  }

  return children;
}
