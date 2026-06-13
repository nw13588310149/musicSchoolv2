import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface FeaturePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: string;
  endpoints: string[];
}

export function FeaturePage({ title, description, icon: Icon, status, endpoints }: FeaturePageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-[0_24px_72px_rgba(108,83,214,0.08)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">{status}</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-linear-to-br from-primary to-[#bb84ff] text-white shadow-[0_18px_42px_rgba(117,81,232,0.3)]">
            <Icon className="size-9" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_20px_56px_rgba(108,83,214,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">模块概览</h2>
              <p className="text-sm text-muted-foreground">当前页面已经接入统一产品壳层，并保持与真实接口数据的协同。</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <p className="text-sm text-muted-foreground">设计语言</p>
              <strong className="mt-3 block text-2xl text-foreground">统一风格</strong>
            </div>
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <p className="text-sm text-muted-foreground">数据来源</p>
              <strong className="mt-3 block text-2xl text-foreground">实时接口</strong>
            </div>
            <div className="rounded-[1.5rem] bg-secondary/60 p-4">
              <p className="text-sm text-muted-foreground">当前状态</p>
              <strong className="mt-3 block text-2xl text-foreground">持续完善</strong>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_20px_56px_rgba(108,83,214,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">接口清单</h2>
            <ArrowUpRight className="size-4 text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {endpoints.map((endpoint) => (
              <div key={endpoint} className="rounded-[1.25rem] border border-primary/8 bg-primary/4 px-4 py-3 text-sm text-foreground">
                {endpoint}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
