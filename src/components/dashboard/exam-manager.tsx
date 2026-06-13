"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArrowUpToLine, FileSpreadsheet, GraduationCap, PencilLine, Plus, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { MetricCard, ModuleHero, PanelCard, SectionHeading, StatusBadge } from "@/components/dashboard/module-kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createExam,
  deleteExam,
  fetchExamClasses,
  fetchExamList,
  fetchExamSubjects,
  getExamExportUrl,
  importExamScores,
  updateExam,
} from "@/lib/api/business";
import type { ExamRecord, NamedOption } from "@/lib/api/contracts";
import { formatDateTime } from "@/lib/dashboard-utils";
import { useAuthStore } from "@/stores/auth-store";

interface ExamFormState {
  name: string;
  subjects: string[];
  classIds: string[];
}

const EMPTY_FORM: ExamFormState = {
  name: "",
  subjects: [],
  classIds: [],
};

function parseValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function ExamManager() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<ExamRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchName, setSearchName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExamRecord | null>(null);
  const [formState, setFormState] = useState<ExamFormState>(EMPTY_FORM);
  const [subjectOptions, setSubjectOptions] = useState<NamedOption[]>([]);
  const [classOptions, setClassOptions] = useState<NamedOption[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] = useState<ExamRecord | null>(null);

  const fetchMeta = useCallback(async () => {
    if (!token) return;
    try {
      const [subjects, classes] = await Promise.all([fetchExamSubjects(token), fetchExamClasses(token)]);
      setSubjectOptions(subjects);
      setClassOptions(classes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "考试基础数据加载失败。");
    }
  }, [token]);

  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetchExamList({ current: page, size: pageSize, name: searchName || undefined }, token);
      setItems(response.records ?? []);
      setTotal(Number(response.total ?? 0));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "考试列表加载失败。");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchName, token]);

  useEffect(() => {
    void fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const metrics = useMemo(() => {
    const joinedSubjects = new Set(items.flatMap((item) => parseValues(item.subjects)).filter(Boolean));
    const joinedClasses = new Set(
      items.flatMap((item) => item.classList?.map((classItem) => classItem.name) ?? parseValues(item.classIds)),
    );
    const publishedCount = items.filter((item) => Number(item.status ?? 0) === 1).length;

    return [
      { icon: FileSpreadsheet, label: "考试场次", value: String(total || items.length), hint: "当前账号下全部考试记录" },
      { icon: GraduationCap, label: "覆盖科目", value: String(joinedSubjects.size), hint: "按当前结果集自动统计" },
      { icon: Send, label: "已发布场次", value: String(publishedCount), hint: "支持导入后直接完成发布" },
      { icon: ArrowUpToLine, label: "参与班级", value: String(joinedClasses.size), hint: "已绑定到考试的班级数量" },
    ];
  }, [items, total]);

  const openCreate = () => {
    setEditingRecord(null);
    setFormState(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (record: ExamRecord) => {
    setEditingRecord(record);
    setFormState({
      name: record.name || "",
      subjects: parseValues(record.subjects),
      classIds: record.classList?.length ? record.classList.map((item) => String(item.id)) : parseValues(record.classIds),
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

    if (!formState.name.trim()) {
      toast.error("请先填写考试名称。");
      return;
    }
    if (!formState.subjects.length) {
      toast.error("请至少选择一个考试科目。");
      return;
    }
    if (!formState.classIds.length) {
      toast.error("请至少选择一个参与班级。");
      return;
    }

    setSaving(true);
    const payload = {
      name: formState.name.trim(),
      subjects: formState.subjects.join(","),
      classIds: formState.classIds.join(","),
    };

    try {
      if (editingRecord) {
        await updateExam({ ...payload, id: editingRecord.id }, token);
        toast.success("考试已更新。");
      } else {
        await createExam(payload, token);
        toast.success("考试已创建。");
      }
      closeDialog();
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: ExamRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`确认删除考试“${record.name}”吗？`);
    if (!confirmed) return;

    try {
      await deleteExam(record.id, token);
      toast.success("考试已删除。");
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败，请稍后重试。");
    }
  };

  const handlePublish = async (record: ExamRecord) => {
    if (!token) return;

    try {
      await updateExam({ id: record.id, name: record.name, status: 1 }, token);
      toast.success("成绩已发布到应用端。");
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发布失败，请稍后重试。");
    }
  };

  const handleExport = (record: ExamRecord) => {
    if (!token) return;
    const exportUrl = getExamExportUrl(record.id, token);
    window.open(exportUrl, "_blank", "noopener,noreferrer");
  };

  const handleUploadClick = (record: ExamRecord) => {
    setUploadTarget(record);
    fileInputRef.current?.click();
  };

  const handleImportScores = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!token || !uploadTarget) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importExamScores(uploadTarget.id, file, token);
      toast.success("成绩导入成功。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "成绩导入失败。");
    } finally {
      event.target.value = "";
      setUploadTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHero
        title="考试管理"
        eyebrow="考试工作台"
        description="统一维护考试场次、参与班级和成绩流转。新增、编辑、导入模板、成绩导入与发布动作都集中在同一张浅色工作台里完成。"
        actions={
          <Button className="rounded-full px-5 shadow-[0_16px_32px_rgba(109,83,219,0.24)]" onClick={openCreate}>
            <Plus className="size-4" />
            新增考试
          </Button>
        }
      />

      <input ref={fileInputRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleImportScores} />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <PanelCard>
        <SectionHeading title="考试列表" description="支持按考试名称筛选，并在列表中直接完成模板下载、成绩导入与发布。" />

        <div className="mb-5 grid gap-3 rounded-[1.5rem] bg-[#f7f4ff] p-4 md:grid-cols-[1fr_auto]">
          <Input
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            placeholder="按考试名称搜索"
            className="h-11 rounded-full border-white bg-white/90"
          />
          <Button
            className="rounded-full px-5"
            onClick={() => {
              setPage(1);
              void fetchItems();
            }}
          >
            查询
          </Button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/88">
          <Table>
            <TableHeader className="bg-[#faf8ff]">
              <TableRow className="border-white/70 hover:bg-transparent">
                <TableHead className="px-4">考试名称</TableHead>
                <TableHead>考试科目</TableHead>
                <TableHead>参与班级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-white/70">
                  <TableCell className="px-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <StatusBadge tone="brand">ID {String(item.id)}</StatusBadge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[280px] whitespace-normal">{parseValues(item.subjects).join("、") || "暂无"}</TableCell>
                  <TableCell className="max-w-[280px] whitespace-normal">
                    {item.classList?.length
                      ? item.classList.map((classItem) => classItem.name).join("、")
                      : parseValues(item.classIds).join("、") || "暂无"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={Number(item.status ?? 0) === 1 ? "success" : "warning"}>
                      {Number(item.status ?? 0) === 1 ? "已发布" : "待发布"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{formatDateTime(item.createTime)}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-wrap justify-end gap-2">
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
                        variant="outline"
                        className="rounded-full border-white/80 bg-white"
                        onClick={() => handleExport(item)}
                      >
                        <ArrowUpToLine className="size-3.5" />
                        模板
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-white/80 bg-white"
                        onClick={() => handleUploadClick(item)}
                      >
                        <Upload className="size-3.5" />
                        导入成绩
                      </Button>
                      <Button size="sm" className="rounded-full bg-primary text-white" onClick={() => void handlePublish(item)}>
                        <Send className="size-3.5" />
                        发布
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
                  <TableCell colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    当前还没有考试数据，先创建一场考试吧。
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">共 {total} 场考试，每页 {pageSize} 条</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full border-white/80 bg-white/90"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              上一页
            </Button>
            <StatusBadge tone="neutral">第 {page} 页</StatusBadge>
            <Button
              variant="outline"
              className="rounded-full border-white/80 bg-white/90"
              onClick={() => setPage((current) => current + 1)}
              disabled={page * pageSize >= total}
            >
              下一页
            </Button>
          </div>
        </div>
      </PanelCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-white/80 bg-white/96 p-0">
          <DialogHeader className="border-b border-white/80 px-6 py-5">
            <DialogTitle>{editingRecord ? "编辑考试" : "新增考试"}</DialogTitle>
            <DialogDescription>填写考试名称、科目与参与班级后即可保存，后续可直接在列表中导入成绩和完成发布。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 px-6 py-6">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">考试名称</span>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="请输入考试名称"
                className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">考试科目</span>
              <select
                multiple
                value={formState.subjects}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    subjects: Array.from(event.target.selectedOptions).map((option) => option.value),
                  }))
                }
                className="min-h-[160px] w-full rounded-[1.6rem] border border-white/80 bg-[#faf8ff] px-4 py-3 text-sm outline-none"
              >
                {subjectOptions.map((option) => (
                  <option key={option.id} value={String(option.name)}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">参与班级</span>
              <select
                multiple
                value={formState.classIds}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    classIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                  }))
                }
                className="min-h-[180px] w-full rounded-[1.6rem] border border-white/80 bg-[#faf8ff] px-4 py-3 text-sm outline-none"
              >
                {classOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.name}
                  </option>
                ))}
              </select>
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
