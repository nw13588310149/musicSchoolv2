"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Bell, ChevronDown, Search, Settings2, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getManagerName } from "@/lib/user-profile";
import { useAuthStore } from "@/stores/auth-store";

export function DashboardHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const schoolName = (user?.school?.name as string | undefined) || "\u97f3\u4e50\u4e4b\u8def";
  const userName = getManagerName(user);
  const avatar = user?.avatar as string | undefined;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="mb-9 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-between md:min-h-12">
        <SidebarTrigger className="h-11 w-11 rounded-full border border-white/80 bg-white/90 shadow-[0_12px_26px_rgba(100,76,192,0.08)] hover:bg-white md:hidden" />
        <div className="md:hidden">
          <p className="font-semibold text-base text-foreground">{schoolName}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <label className="relative min-w-[280px] flex-1 md:w-[340px] md:flex-none">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-full border-white/80 bg-white/92 pl-11 shadow-[0_12px_28px_rgba(100,76,192,0.05)] focus-visible:ring-primary/25"
            placeholder="\u641c\u7d22\u529f\u80fd\u6216\u5185\u5bb9..."
          />
        </label>

        <Button
          size="icon"
          variant="ghost"
          className="relative h-12 w-12 rounded-full border border-white/80 bg-white/88 shadow-[0_12px_28px_rgba(100,76,192,0.05)]"
        >
          <Bell className="size-4 text-foreground" />
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#ff5f8e]" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-12 w-12 rounded-full border border-white/80 bg-white/88 shadow-[0_12px_28px_rgba(100,76,192,0.05)]"
        >
          <Settings2 className="size-4 text-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-12 gap-3 rounded-full border border-white/80 bg-white/90 px-3 shadow-[0_12px_28px_rgba(100,76,192,0.05)]"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="size-5 text-primary" />
                )}
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-[108px] truncate font-medium text-sm text-foreground">{userName}</span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/70 bg-white/96 p-2">
            <DropdownMenuItem asChild className="rounded-xl">
              <Link href="/dashboard/brand/info" prefetch={false}>
                {"\u54c1\u724c\u4e0e\u5b66\u6821\u4fe1\u606f"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="rounded-xl text-red-500 focus:text-red-500">
              {"\u9000\u51fa\u7cfb\u7edf"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
