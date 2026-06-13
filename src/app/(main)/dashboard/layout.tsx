import type { CSSProperties, ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MusicRoadSidebar } from "@/components/dashboard/music-road-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getTokenCookieName } from "@/lib/auth";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getTokenCookieName())?.value;
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  if (!token) {
    redirect("/login");
  }

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "15.75rem",
        } as CSSProperties
      }
    >
      <MusicRoadSidebar />
      <SidebarInset className="bg-transparent md:px-4 md:py-4 md:pl-0">
        <div className="min-h-[calc(100svh-2rem)] rounded-[2.2rem] border border-white/70 bg-white/34 px-4 py-4 shadow-[0_30px_80px_rgba(106,84,196,0.08)] backdrop-blur-[3px] md:px-7 md:py-6">
          <DashboardHeader />
          <AuthGuard>
            <div className="mx-auto w-full max-w-[1560px]">{children}</div>
          </AuthGuard>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
