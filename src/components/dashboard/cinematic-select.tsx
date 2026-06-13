"use client";

import { ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CinematicSelectOption = {
  value: string;
  label: string;
};

const triggerClass =
  "h-11 w-full rounded-xl border-[#e8e4f3] bg-white/82 px-3 text-sm text-slate-800 shadow-[0_1px_0_rgba(255,255,255,0.78)_inset,0_8px_22px_rgba(82,62,145,0.04)] transition-all hover:border-primary/25 hover:bg-white focus-visible:border-primary/45 focus-visible:ring-primary/15";

const contentClass =
  "max-h-80 w-[--radix-popover-trigger-width] overflow-hidden rounded-2xl border-white/80 bg-white/96 p-2 shadow-[0_18px_52px_rgba(66,48,126,0.16),0_1px_0_rgba(255,255,255,0.78)_inset] ring-1 ring-primary/8 backdrop-blur-2xl";

export function getSelectedOptionLabels(value: string, options: CinematicSelectOption[], placeholder = "请选择") {
  const selected = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!selected.length) return placeholder;

  return selected.map((item) => options.find((option) => option.value === item)?.label ?? item).join("、");
}

export function CinematicSelect({
  value,
  onValueChange,
  options,
  placeholder = "请选择",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: CinematicSelectOption[];
  placeholder?: string;
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn(triggerClass, "justify-between text-left font-normal hover:text-slate-950")}>
          <span className={cn("min-w-0 truncate", !value && "text-slate-400")}>{value ? selectedLabel : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={contentClass}>
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onValueChange("")}
            className={cn(
              "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
              !value ? "bg-primary/[0.08] text-primary" : "text-slate-500 hover:bg-primary/[0.06]",
            )}
          >
            {placeholder}
          </button>
          {value && !options.some((option) => option.value === value) ? (
            <button
              type="button"
              onClick={() => onValueChange(value)}
              className="flex w-full items-center rounded-xl bg-primary/[0.08] px-3 py-2 text-left text-sm text-primary"
            >
              当前值：{value}
            </button>
          ) : null}
          {options.map((option) => {
            const checked = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onValueChange(option.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  checked ? "bg-primary/[0.08] text-primary" : "text-slate-700 hover:bg-primary/[0.06]",
                )}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {checked ? <span className="size-2 rounded-full bg-primary" /> : null}
              </button>
            );
          })}
          {!options.length ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">暂无可选项</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function CinematicMultiSelect({
  value,
  onValueChange,
  options,
  placeholder = "请选择",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: CinematicSelectOption[];
  placeholder?: string;
}) {
  const selected = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn(triggerClass, "justify-between text-left font-normal hover:text-slate-950")}>
          <span className={cn("min-w-0 truncate", !selected.length && "text-slate-400")}>
            {getSelectedOptionLabels(value, options, placeholder)}
          </span>
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={contentClass}>
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input readOnly value={selected.length ? `${selected.length} selected` : ""} placeholder={placeholder} className="h-9 rounded-xl border-[#ece8f8] bg-[#fbfaff] pl-9 text-xs" />
        </div>
        <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
          {options.length ? (
            options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                    checked ? "bg-primary/[0.08] text-primary" : "text-slate-700 hover:bg-primary/[0.06]",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => {
                      const next = checked ? selected.filter((item) => item !== option.value) : [...selected, option.value];
                      onValueChange(next.join(","));
                    }}
                  />
                  <span className="min-w-0 truncate">{option.label}</span>
                </label>
              );
            })
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">暂无可选项</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
