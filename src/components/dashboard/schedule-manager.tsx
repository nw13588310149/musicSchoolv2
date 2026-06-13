"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CalendarRange, Clock3, PencilLine, Plus, Rows3, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { MetricCard, ModuleHero, PanelCard, SectionHeading, StatusBadge } from "@/components/dashboard/module-kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCourseSchedule, deleteCourseSchedule, fetchCourseScheduleList, updateCourseSchedule } from "@/lib/api/business";
import type { SchoolCourseTimeRecord } from "@/lib/api/contracts";
import { useAuthStore } from "@/stores/auth-store";

const EMPTY_FORM = {
  lineNum: "",
  timeBegin: "",
  timeEnd: "",
};

export function ScheduleManager() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<SchoolCourseTimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SchoolCourseTimeRecord | null>(null);
  const [formState, setFormState] = useState(EMPTY_FORM);

  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetchCourseScheduleList({ current: 1, size: 50 }, token);
      const nextItems = [...(response.records ?? [])].sort(
        (left, right) => Number(left.lineNum ?? 0) - Number(right.lineNum ?? 0),
      );
      setItems(nextItems);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "时间表加载失败。");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const metrics = useMemo(() => {
    const firstLesson = items[0]?.timeBegin || "暂无";
    const lastLesson = items[items.length - 1]?.timeEnd || "暂无";

    return [
      { icon: Rows3, label: "课程节次", value: String(items.length), hint: "当前学校已配置的上课节次" },
      { icon: Clock3, label: "首节开始", value: firstLesson, hint: "用于前台课程时间展示" },
      { icon: CalendarRange, label: "末节结束", value: lastLesson, hint: "建议与学校作息保持一致" },
    ];
  }, [items]);

  const openCreate = () => {
    setEditingRecord(null);
    setFormState(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (record: SchoolCourseTimeRecord) => {
    setEditingRecord(record);
    setFormState({
      lineNum: String(record.lineNum ?? ""),
      timeBegin: String(record.timeBegin ?? ""),
      timeEnd: String(record.timeEnd ?? ""),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
    setFormState(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!token) return;

    if (!formState.lineNum || !formState.timeBegin || !formState.timeEnd) {
      toast.error("请先填写节次与起止时间。");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        lineNum: Number(formState.lineNum),
        timeBegin: formState.timeBegin,
        timeEnd: formState.timeEnd,
      };

      if (editingRecord) {
        await updateCourseSchedule({ ...payload, id: editingRecord.id }, token);
        toast.success("节次已更新。");
      } else {
        await createCourseSchedule(payload, token);
        toast.success("节次已新增。");
      }

      closeDialog();
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: SchoolCourseTimeRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`确认删除第 ${record.lineNum} 节课配置吗？`);
    if (!confirmed) return;

    try {
      await deleteCourseSchedule(record.id, token);
      toast.success("节次配置已删除。");
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败，请稍后重试。");
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHero
        title="时间表"
        eyebrow="课表配置"
        description="维护学校统一的上课节次与时间段，课程排布、前台展示和应用端作息都会基于这里的配置同步更新。"
        actions={
          <Button className="rounded-full px-5 shadow-[0_16px_32px_rgba(109,83,219,0.24)]" onClick={openCreate}>
            <Plus className="size-4" />
            新增节次
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <PanelCard>
        <SectionHeading title="上课时间表" description="建议按照校内真实作息维护，方便课程展示、排课联动和应用端时间同步。" />

        <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/88">
          <Table>
            <TableHeader className="bg-[#faf8ff]">
              <TableRow className="border-white/70 hover:bg-transparent">
                <TableHead className="px-4">节次</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>结束时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-white/70">
                  <TableCell className="px-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">第 {item.lineNum} 节课</p>
                      <StatusBadge tone="brand">ID {String(item.id)}</StatusBadge>
                    </div>
                  </TableCell>
                  <TableCell>{item.timeBegin}</TableCell>
                  <TableCell>{item.timeEnd}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-white/80 bg-white"
                        onClick={() => openEdit(item)}
                      >
                        <PencilLine className="size-3.5" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => void handleDelete(item)}
                      >
                        <Trash2 className="size-3.5" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length && !loading ? (
                <TableRow className="border-white/70">
                  <TableCell colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    当前还没有节次配置，先新增一条课表时间吧。
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </PanelCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2rem] border-white/80 bg-white/96 p-0">
          <DialogHeader className="border-b border-white/80 px-6 py-5">
            <DialogTitle>{editingRecord ? "编辑节次" : "新增节次"}</DialogTitle>
            <DialogDescription>填写节次编号和起止时间后即可保存，后续课程排布会直接引用这里的时间结构。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">第几节课</span>
              <Input
                value={formState.lineNum}
                onChange={(event) => setFormState((current) => ({ ...current, lineNum: event.target.value }))}
                placeholder="例如 1"
                className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">开始时间</span>
              <Input
                value={formState.timeBegin}
                onChange={(event) => setFormState((current) => ({ ...current, timeBegin: event.target.value }))}
                placeholder="例如 08:30"
                className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">结束时间</span>
              <Input
                value={formState.timeEnd}
                onChange={(event) => setFormState((current) => ({ ...current, timeEnd: event.target.value }))}
                placeholder="例如 09:15"
                className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
              />
            </label>
          </div>

          <DialogFooter className="rounded-b-[2rem] border-white/80 bg-[#faf8ff]">
            <Button variant="outline" className="rounded-full border-white bg-white" onClick={closeDialog}>
              取消
            </Button>
            <Button className="rounded-full px-6" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "保存中..." : editingRecord ? "保存修改" : "确认新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
