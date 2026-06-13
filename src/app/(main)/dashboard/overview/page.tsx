"use client";

import Link from "next/link";

import {
  ArrowRight,
  BellRing,
  BrainCircuit,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  LibraryBig,
  Music2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users2,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSchoolName } from "@/lib/user-profile";
import { useAuthStore } from "@/stores/auth-store";

const campusStats = [
  { label: "校区数量", value: "3", note: "当前接入校区", icon: LayoutGrid },
  { label: "教室数量", value: "42", note: "可用教学空间", icon: LibraryBig },
];

const studentStats = [
  { label: "总人数", value: "1,248", note: "男 618 / 女 630", icon: Users2, tone: "from-sky-400 via-cyan-400 to-sky-500" },
  { label: "已实名", value: "1,182", note: "已完成认证", icon: ShieldCheck, tone: "from-emerald-400 via-teal-400 to-emerald-500" },
  { label: "未实名", value: "66", note: "需要提醒处理", icon: ShieldAlert, tone: "from-rose-500 via-red-500 to-rose-600", danger: true },
];

const teacherStats = [
  { label: "总人数", value: "86", note: "任课 48 / 班主任 18 / 管理员 12 / 宿管 8", icon: GraduationCap, tone: "from-violet-400 via-purple-400 to-violet-500" },
  { label: "已实名", value: "78", note: "已完成认证", icon: ShieldCheck, tone: "from-emerald-400 via-teal-400 to-emerald-500" },
  { label: "未实名", value: "8", note: "需要提醒处理", icon: ShieldAlert, tone: "from-rose-500 via-red-500 to-rose-600", danger: true },
];

const resources = [
  { label: "视频", value: "126", icon: Video },
  { label: "听写", value: "58", icon: BellRing },
  { label: "乐理", value: "94", icon: BrainCircuit },
  { label: "器乐", value: "72", icon: Music2 },
  { label: "声乐", value: "65", icon: Sparkles },
  { label: "答题", value: "138", icon: ShieldCheck },
];

const notifications = [
  { title: "校区数据已同步", desc: "统计概览已更新到最新版本。", time: "2 分钟前" },
  { title: "未实名数量异常", desc: "学生与教师存在待实名记录，请及时处理。", time: "20 分钟前" },
  { title: "资源内容待补充", desc: "器乐与答题资源仍可继续完善。", time: "1 小时前" },
];

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-[0.8rem] font-medium uppercase tracking-[0.24em] text-foreground/90">{title}</h2>;
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
  danger,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof LayoutGrid;
  tone?: string;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "group rounded-[1.55rem] border p-4 shadow-[0_16px_44px_rgba(103,79,194,0.05)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5",
        danger ? "border-rose-200/80 bg-rose-50/80" : "border-[#f0eef8] bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              danger ? "bg-rose-500/10 text-rose-600" : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-4.5" />
          </span>
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground/80">{label}</p>
            <strong className={cn("mt-2 block text-[1.75rem] font-semibold leading-none", danger ? "text-rose-600" : "text-foreground")}>{value}</strong>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
          </div>
        </div>
        <ChevronRight className="mt-1 size-4 text-primary/35 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
      </div>
      {tone ? <div className={cn("mt-4 h-1.5 rounded-full bg-gradient-to-r", tone)} /> : null}
    </div>
  );
}

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function OverviewPage() {
  const user = useAuthStore((state) => state.user);
  const schoolName = getSchoolName(user);
  const coursewareEnabled = Boolean(user?.school?.coursewareSwitch);
  const todayLabel = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date());

  return (
    <div className="space-y-4 pb-4 lg:space-y-5 lg:pb-5">
      <section className="rounded-[2.1rem] border border-[#f0eef8] bg-white px-5 py-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:px-6 lg:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">数据工作台</Badge>
          <Badge className="rounded-full border border-[#f0eef8] bg-white px-3 py-1 text-foreground hover:bg-white">{todayLabel}</Badge>
          <Badge className="rounded-full border border-[#f0eef8] bg-white px-3 py-1 text-foreground hover:bg-white">
            {coursewareEnabled ? "课件联动已开启" : "课件联动待配置"}
          </Badge>
        </div>
      </section>

      <section className="rounded-[2.1rem] border border-[#f0eef8] bg-white p-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <SectionTitle title="校区资源" />
          <Button asChild className="h-10 rounded-full px-4 shadow-[0_18px_38px_rgba(111,83,219,0.12)]">
            <Link href="/dashboard/brand/info">
              校园管理
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {resources.map((item) => (
            <div key={item.label} className="rounded-[1.25rem] border border-[#f0eef8] bg-white p-4 shadow-[0_14px_40px_rgba(103,79,194,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="size-4" />
                </span>
                <strong className="text-[1.45rem] font-semibold leading-none text-foreground">{item.value}</strong>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2.1rem] border border-[#f0eef8] bg-white p-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:p-6">
          <SectionTitle title="校园概览" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {campusStats.map((item) => (
              <MetricCard key={item.label} label={item.label} value={item.value} note={item.note} icon={item.icon} />
            ))}
          </div>
        </div>

        <div className="rounded-[2.1rem] border border-[#f0eef8] bg-white p-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:p-6">
          <SectionTitle title="通知" />
          <div className="mt-4 space-y-2.5">
            {notifications.map((item, index) => (
              <div key={item.title} className="rounded-[1rem] border border-[#f0eef8] bg-[#fcfcfe] px-3.5 py-3.5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BellRing className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <span className="shrink-0 text-[0.68rem] text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="mt-1 text-[0.72rem] leading-5 text-muted-foreground">{item.desc}</p>
                  </div>
                  <span className="mt-1 text-[0.68rem] text-muted-foreground">0{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2.1rem] border border-[#f0eef8] bg-white p-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:p-6">
          <SectionTitle title="学生构成" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {studentStats.map((item) => (
              <MetricCard key={item.label} label={item.label} value={item.value} note={item.note} icon={item.icon} tone={item.tone} danger={item.danger} />
            ))}
          </div>
        </div>

        <div className="rounded-[2.1rem] border border-[#f0eef8] bg-white p-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:p-6">
          <SectionTitle title="教师构成" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {teacherStats.map((item) => (
              <MetricCard key={item.label} label={item.label} value={item.value} note={item.note} icon={item.icon} tone={item.tone} danger={item.danger} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
