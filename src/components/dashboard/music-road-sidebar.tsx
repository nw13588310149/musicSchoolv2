"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ChevronDown, ChevronRight, LayoutGrid, LogOut, Settings2 } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { getManagerPermissions, isSuperAdmin } from "@/lib/user-profile";
import { cn } from "@/lib/utils";
import { sidebarMainLinks, sidebarPrimarySection } from "@/navigation/sidebar/sidebar-items";
import { useAuthStore } from "@/stores/auth-store";

type PermissionOwner = {
  permission?: string | string[];
};

function canAccess(item: PermissionOwner, permissions: string[], superAdmin: boolean) {
  if (superAdmin || !item.permission) return true;
  const required = Array.isArray(item.permission) ? item.permission : [item.permission];
  return required.some((permission) => permissions.includes(permission));
}

export function MusicRoadSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const permissions = getManagerPermissions(user);
  const superAdmin = isSuperAdmin(user);

  const visibleSchoolItems = sidebarPrimarySection.items.filter((item) => canAccess(item, permissions, superAdmin));
  const visibleMainLinks = sidebarMainLinks.filter((item) => item.url === "/dashboard/overview" || canAccess(item, permissions, superAdmin));
  const schoolActive = visibleSchoolItems.some((item) => pathname === item.url || pathname.startsWith(`${item.url}/`));
  const [schoolExpanded, setSchoolExpanded] = useState(schoolActive);

  useEffect(() => {
    setSchoolExpanded(schoolActive);
  }, [schoolActive]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <Sidebar {...props} className="bottom-4 top-4 h-[calc(100svh-2rem)] border-none bg-transparent" variant="floating" collapsible="offcanvas">
      <SidebarHeader className="px-3 pb-2 pt-3">
        <div className="flex items-center gap-3 rounded-[1.85rem] border border-white/80 bg-white/88 px-4 py-4 shadow-[0_18px_44px_rgba(95,75,182,0.08)] backdrop-blur-2xl">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-primary/10">
            <Image src="/brand/logo.png" alt={APP_CONFIG.name} fill className="object-contain p-2.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[1.15rem] leading-none text-foreground">{APP_CONFIG.name}</span>
            <span className="mt-1 block truncate text-[0.74rem] text-muted-foreground">{APP_CONFIG.subtitle}</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-3 pt-2">
        <nav className="space-y-1">
          <Link
            prefetch={false}
            href="/dashboard/overview"
            className={cn(
              "flex h-11 items-center gap-3 rounded-[1.2rem] px-3.5 transition-all duration-300",
              pathname === "/dashboard/overview" ? "bg-white text-foreground shadow-[0_14px_30px_rgba(101,76,196,0.08)]" : "text-[#727b91] hover:bg-white/72 hover:text-foreground",
            )}
          >
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", pathname === "/dashboard/overview" ? "bg-primary/10 text-primary" : "bg-transparent text-[#7f889f]")}>
              <LayoutGrid className="size-4" />
            </span>
            <span className="flex-1 font-medium text-[0.92rem]">工作台</span>
            {pathname === "/dashboard/overview" ? <ChevronRight className="size-4 text-primary/60" /> : null}
          </Link>
        </nav>

        {visibleSchoolItems.length ? (
          <section className="mt-4">
            <button
              type="button"
              onClick={() => setSchoolExpanded((value) => !value)}
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-[1.2rem] px-3.5 text-[0.92rem] transition-all duration-300",
                schoolActive ? "bg-white text-foreground shadow-[0_14px_30px_rgba(101,76,196,0.08)]" : "text-[#727b91] hover:bg-white/72 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-3 font-medium">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", schoolActive ? "bg-primary/10 text-primary" : "bg-transparent text-[#7f889f]")}>
                  <sidebarPrimarySection.icon className="size-4" />
                </span>
                <span>校园管理</span>
              </span>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", schoolExpanded && "rotate-180")} />
            </button>

            {schoolExpanded ? (
              <div className="mt-2 space-y-1.5 rounded-[1.7rem] border border-white/80 bg-white/84 p-2.5 shadow-[0_18px_46px_rgba(101,76,196,0.07)] backdrop-blur-xl">
                {visibleSchoolItems.map((subItem) => {
                  const active = pathname === subItem.url || pathname.startsWith(`${subItem.url}/`);
                  return (
                    <Link
                      key={subItem.url}
                      href={subItem.url}
                      prefetch={false}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-[1.15rem] px-3.5 transition-all duration-300",
                        active ? "bg-linear-to-r from-primary to-[#ba82ff] text-white shadow-[0_18px_38px_rgba(120,83,240,0.28)]" : "text-[#6c748d] hover:bg-[#f6f2ff] hover:text-foreground",
                      )}
                    >
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", active ? "bg-white/18 text-white" : "bg-[#f0e9ff] text-primary")}>
                        <subItem.icon className="size-3.5" />
                      </span>
                      <span className="font-medium text-[0.92rem]">{subItem.title}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}

        <nav className="mt-4 space-y-1">
          {visibleMainLinks.filter((item) => item.url !== "/dashboard/overview").map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
            return (
              <Link
                key={item.url}
                href={item.url}
                prefetch={false}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-[1.2rem] px-3.5 transition-all duration-300",
                  isActive ? "bg-white text-foreground shadow-[0_14px_30px_rgba(101,76,196,0.08)]" : "text-[#727b91] hover:bg-white/72 hover:text-foreground",
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", isActive ? "bg-primary/10 text-primary" : "bg-transparent text-[#7f889f]")}>
                  <item.icon className="size-4" />
                </span>
                <span className="flex-1 font-medium text-[0.92rem]">{item.title}</span>
                {isActive ? <ChevronRight className="size-4 text-primary/60" /> : null}
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3 pt-2">
        <button
          type="button"
          className="flex h-12 w-full items-center justify-between rounded-[1.45rem] border border-white/80 bg-white/84 px-4 text-left shadow-[0_14px_34px_rgba(101,76,196,0.06)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/8 text-primary">
              <Settings2 className="size-4" />
            </span>
            <span className="font-medium text-[0.92rem] text-foreground">系统设置</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>

        <button type="button" onClick={handleLogout} className="mt-2 flex h-11 w-full items-center gap-3 rounded-[1.2rem] px-3.5 text-left text-[#7c859c] transition-colors hover:bg-white/70 hover:text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[#7f889f]">
            <LogOut className="size-4" />
          </span>
          <span className="font-medium text-[0.92rem]">退出系统</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
