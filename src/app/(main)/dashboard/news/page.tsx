"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Eye,
  FileAudio2,
  Image as ImageIcon,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { CinematicSelect } from "@/components/dashboard/cinematic-select";
import { FileUploadField } from "@/components/dashboard/file-upload-field";
import { EmptyPanel, MetricCard, PanelCard, SectionHeading, StatusBadge } from "@/components/dashboard/module-kit";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SchoolNewsRecord } from "@/lib/api/contracts";
import { createNews, deleteNews, fetchNewsDetail, fetchNewsList, updateNews } from "@/lib/api/business";
import { formatDateTime, normalizeMediaValue } from "@/lib/dashboard-utils";
import { stripHtml } from "@/lib/html-utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const PAGE_SIZE = 10;
const NEWS_TYPE = 9;

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "true", label: "正常展示" },
  { value: "false", label: "已下架" },
];

type NewsForm = {
  id?: string | number;
  title: string;
  subTitle: string;
  shortText1: string;
  shortText2: string;
  shortText3: string;
  longText1: string;
  firstMenu: string;
  secondMenu: string;
  subType: string;
  sort: string;
  status: boolean;
  vip: string;
  img1: string[];
  img2: string[];
  img3: string[];
  file1: string[];
  file2: string[];
  file3: string[];
};

const EMPTY_FORM: NewsForm = {
  title: "",
  subTitle: "",
  shortText1: "",
  shortText2: "",
  shortText3: "",
  longText1: "",
  firstMenu: "0",
  secondMenu: "0",
  subType: "0",
  sort: "1000",
  status: true,
  vip: "0",
  img1: [],
  img2: [],
  img3: [],
  file1: [],
  file2: [],
  file3: [],
};

function isEnabled(record: SchoolNewsRecord) {
  if (typeof record.status === "boolean") return record.status;
  return Number(record.status ?? 1) === 1;
}

function getCover(record: SchoolNewsRecord) {
  return normalizeMediaValue(record.img1)[0] || normalizeMediaValue(record.img2)[0] || normalizeMediaValue(record.img3)[0] || "";
}

function getTitle(record: SchoolNewsRecord) {
  return record.title || String(record.name ?? "未命名资讯");
}

function buildForm(record?: SchoolNewsRecord | null): NewsForm {
  if (!record) return { ...EMPTY_FORM };

  return {
    id: record.id,
    title: getTitle(record),
    subTitle: String(record.subTitle ?? ""),
    shortText1: String(record.shortText1 ?? ""),
    shortText2: String(record.shortText2 ?? ""),
    shortText3: String(record.shortText3 ?? ""),
    longText1: String(record.longText1 ?? ""),
    firstMenu: String(record.firstMenu ?? 0),
    secondMenu: String(record.secondMenu ?? 0),
    subType: String(record.subType ?? 0),
    sort: String(record.sort ?? 1000),
    status: isEnabled(record),
    vip: String(record.vip ?? 0),
    img1: normalizeMediaValue(record.img1),
    img2: normalizeMediaValue(record.img2),
    img3: normalizeMediaValue(record.img3),
    file1: normalizeMediaValue(record.file1),
    file2: normalizeMediaValue(record.file2),
    file3: normalizeMediaValue(record.file3),
  };
}

function firstUrl(value: string[]) {
  return value[0] ?? "";
}

function toInt(value: string, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function buildPayload(form: NewsForm) {
  const payload: Record<string, unknown> = {
    file1: firstUrl(form.file1),
    file2: firstUrl(form.file2),
    file3: firstUrl(form.file3),
    firstMenu: toInt(form.firstMenu, 0),
    img1: firstUrl(form.img1),
    img2: firstUrl(form.img2),
    img3: firstUrl(form.img3),
    longText1: form.longText1,
    longText2: "",
    longText3: "",
    provinces: "",
    secondMenu: toInt(form.secondMenu, 0),
    shortText1: form.shortText1.trim(),
    shortText2: form.shortText2.trim(),
    shortText3: form.shortText3.trim(),
    sort: toInt(form.sort, 1000),
    status: form.status,
    subTitle: form.subTitle.trim(),
    subType: toInt(form.subType, 0),
    title: form.title.trim(),
    type: NEWS_TYPE,
    vip: toInt(form.vip, 0),
  };

  if (form.id !== undefined) payload.id = form.id;
  return payload;
}

function NewsEditor({
  open,
  record,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  record: SchoolNewsRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const token = useAuthStore((state) => state.token);
  const [form, setForm] = useState<NewsForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setForm(buildForm(record));
    setEditorKey((key) => key + 1);
  }, [open, record]);

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("请填写资讯标题");
      return;
    }

    if (!stripHtml(form.longText1)) {
      toast.error("请填写资讯正文");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(buildPayload(form));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "资讯保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-[960px] flex-col gap-0 overflow-hidden rounded-[1.5rem] border-[#eeeaf7] bg-white p-0 shadow-[0_22px_70px_rgba(64,52,106,0.14)]">
        <DialogHeader className="border-b border-[#f0edf8] px-6 py-5">
          <DialogTitle>{record ? "编辑资讯" : "新增资讯"}</DialogTitle>
          <DialogDescription>按照 1.0 上传内容页的表单方式维护标题、封面与富文本内容。</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <Label>标题</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="请输入资讯标题"
                  className="h-11 rounded-xl border-[#e8e4f3] bg-white"
                />
              </label>
              <label className="space-y-2">
                <Label>短文本1</Label>
                <Input
                  value={form.shortText1}
                  onChange={(event) => setForm((current) => ({ ...current, shortText1: event.target.value }))}
                  placeholder="例如：教学资讯"
                  className="h-11 rounded-xl border-[#e8e4f3] bg-white"
                />
              </label>
              <label className="space-y-2">
                <Label>短文本2</Label>
                <Input
                  value={form.shortText2}
                  onChange={(event) => setForm((current) => ({ ...current, shortText2: event.target.value }))}
                  placeholder="用于列表摘要，可选"
                  className="h-11 rounded-xl border-[#e8e4f3] bg-white"
                />
              </label>
            </section>

            <section className="rounded-2xl border border-[#f0edf8] bg-[#fbfaff] p-4">
              <FileUploadField
                label="图片"
                hint="对应 1.0 表单中的上传图片，保存到 img1。"
                value={form.img1}
                accept="image/*"
                token={token}
                kind="image"
                onChange={(value) => setForm((current) => ({ ...current, img1: value.slice(0, 1) }))}
              />
            </section>

            <section className="space-y-4" key={editorKey}>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-semibold text-slate-900">内容</Label>
                <span className="text-xs text-muted-foreground">对应 longText1，支持图文、表格和粘贴图片</span>
              </div>
              <RichTextEditor id="news-rich-text" value={form.longText1} onChange={(html) => setForm((current) => ({ ...current, longText1: html }))} placeholder="请输入资讯正文..." minHeight="420px" className="rounded-xl border-[#e8e4f3]" />
            </section>
          </div>
        </div>

        <DialogFooter className="border-t border-[#f0edf8] bg-white px-6 py-4">
          <Button variant="outline" className="rounded-full border-[#e8e4f3] bg-white" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button className="rounded-full px-6" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewsDetailDialog({
  open,
  record,
  onOpenChange,
}: {
  open: boolean;
  record: SchoolNewsRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const cover = record ? getCover(record) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden rounded-[2rem] border-white/80 bg-white/96 p-0">
        <DialogHeader className="border-b border-[#f0edf8] px-6 py-5">
          <DialogTitle>资讯详情</DialogTitle>
          <DialogDescription>预览标题、封面、摘要和富文本正文。</DialogDescription>
        </DialogHeader>
        {record ? (
          <div className="max-h-[72vh] overflow-y-auto px-6 py-6">
            <article className="overflow-hidden rounded-[1.7rem] border border-[#f0edf8] bg-[#fbfaff]">
              <div className="aspect-[20/8] bg-linear-to-br from-primary/12 via-white to-[#f4efff]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={getTitle(record)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">暂无封面图</div>
                )}
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={isEnabled(record) ? "success" : "neutral"}>{isEnabled(record) ? "正常展示" : "已下架"}</StatusBadge>
                    <StatusBadge tone="brand">资讯 type=9</StatusBadge>
                    <StatusBadge tone={Number(record.vip ?? 0) === 1 ? "warning" : "neutral"}>
                      {Number(record.vip ?? 0) === 1 ? "VIP" : "免费"}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-foreground">{getTitle(record)}</h2>
                  {record.subTitle ? <p className="mt-2 text-sm text-muted-foreground">{record.subTitle}</p> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ["栏目", record.shortText1 || "-"],
                    ["摘要", record.shortText2 || "-"],
                    ["排序", String(record.sort ?? 1000)],
                    ["一级菜单", String(record.firstMenu ?? 0)],
                    ["二级菜单", String(record.secondMenu ?? 0)],
                    ["更新时间", formatDateTime(String(record.updateTime ?? record.createTime ?? ""))],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-[1.4rem] bg-white px-5 py-5">
                  <div
                    className="prose prose-sm max-w-none text-slate-700 [&_img]:rounded-2xl [&_img]:shadow-sm [&_p]:leading-7"
                    dangerouslySetInnerHTML={{ __html: record.longText1 || "<p>暂无正文</p>" }}
                  />
                </div>
              </div>
            </article>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function NewsPage() {
  const token = useAuthStore((state) => state.token);
  const [records, setRecords] = useState<SchoolNewsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ title: "", status: "" });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SchoolNewsRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<SchoolNewsRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolNewsRecord | null>(null);

  const loadNews = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await fetchNewsList(
        {
          current: page,
          size: PAGE_SIZE,
          title: filters.title || undefined,
          status: filters.status === "" ? undefined : filters.status === "true",
          type: NEWS_TYPE,
        },
        token,
      );
      setRecords(result.records ?? []);
      setTotal(Number(result.total ?? 0));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "资讯列表加载失败");
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.title, page, token]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const stats = useMemo(() => {
    const enabled = records.filter(isEnabled).length;
    const vip = records.filter((record) => Number(record.vip ?? 0) === 1).length;
    const withCover = records.filter((record) => Boolean(getCover(record))).length;
    return { total: total || records.length, enabled, vip, withCover };
  }, [records, total]);

  const openCreate = () => {
    setEditingRecord(null);
    setEditorOpen(true);
  };

  const openEdit = async (record: SchoolNewsRecord) => {
    if (!token) return;
    setEditingRecord(record);
    setEditorOpen(true);
    try {
      const detail = await fetchNewsDetail(record.id, token);
      setEditingRecord({ ...record, ...detail });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "资讯详情加载失败");
    }
  };

  const openDetail = async (record: SchoolNewsRecord) => {
    if (!token) return;
    setDetailRecord(record);
    setDetailOpen(true);
    try {
      const detail = await fetchNewsDetail(record.id, token);
      setDetailRecord({ ...record, ...detail });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "资讯详情加载失败");
    }
  };

  const submitNews = async (payload: Record<string, unknown>) => {
    if (!token) return;
    if ("id" in payload) {
      await updateNews(payload, token);
      toast.success("资讯已更新");
    } else {
      await createNews(payload, token);
      toast.success("资讯已新增");
    }
    await loadNews();
  };

  const toggleStatus = async (record: SchoolNewsRecord) => {
    if (!token) return;
    try {
      await updateNews(
        buildPayload({
          ...buildForm(record),
          status: !isEnabled(record),
        }),
        token,
      );
      toast.success(isEnabled(record) ? "资讯已下架" : "资讯已上架");
      await loadNews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "状态更新失败");
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;
    try {
      await deleteNews(deleteTarget.id, token);
      toast.success("资讯已删除");
      setDeleteTarget(null);
      await loadNews();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "资讯删除失败");
    }
  };

  return (
    <div className="space-y-4 pb-4 lg:space-y-5 lg:pb-5">
      <section className="relative overflow-hidden rounded-[2.1rem] border border-white/80 bg-white/88 px-5 py-5 shadow-[0_22px_60px_rgba(105,82,198,0.08)] lg:px-6 lg:py-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">资讯列表</Badge>
              <Badge className="rounded-full border border-[#f0eef8] bg-white/80 px-3 py-1 text-foreground hover:bg-white">zx-textbook</Badge>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">校园资讯内容中台</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              用富文本方式维护校园资讯、招生动态和教学内容，素材字段完全按 AppTextbookSaveBO 写入。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-10 rounded-full border-white/80 bg-white/86" onClick={() => void loadNews()} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              刷新
            </Button>
            <Button className="h-10 rounded-full px-5 shadow-[0_18px_36px_rgba(119,79,240,0.24)]" onClick={openCreate}>
              <Plus className="size-4" />
              新增资讯
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Newspaper} label="资讯总数" value={String(stats.total)} hint="来自 zx-textbook/list" />
        <MetricCard icon={Sparkles} label="正常展示" value={String(stats.enabled)} hint="status = true" />
        <MetricCard icon={ImageIcon} label="配置封面" value={String(stats.withCover)} hint="img1 / img2" />
        <MetricCard icon={FileAudio2} label="VIP 内容" value={String(stats.vip)} hint="vip = 1" />
      </section>

      <PanelCard className="p-0">
        <div className="border-b border-[#f0edf8] px-5 py-5">
          <SectionHeading
            title="资讯列表"
            description="支持按标题与状态筛选，新增、编辑、详情、删除均调用 zx-textbook 接口。"
            action={
              <Button className="rounded-full" onClick={openCreate}>
                <Plus className="size-4" />
                新增
              </Button>
            }
          />

          <div className="grid gap-3 rounded-[1.5rem] bg-[#f8f5ff] p-3 md:grid-cols-[1fr_220px_auto]">
            <Input
              value={filters.title}
              onChange={(event) => setFilters((current) => ({ ...current, title: event.target.value }))}
              placeholder="按标题搜索"
              className="h-11 rounded-full border-white/80 bg-white/90"
            />
            <CinematicSelect
              value={filters.status}
              onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
              options={STATUS_OPTIONS}
              placeholder="全部状态"
            />
            <div className="flex gap-2">
              <Button
                className="h-11 rounded-full px-5"
                onClick={() => {
                  setPage(1);
                  void loadNews();
                }}
              >
                查询
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-full border-white/80 bg-white/90"
                onClick={() => {
                  setFilters({ title: "", status: "" });
                  setPage(1);
                }}
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#eeeaf7] bg-[#fbfaff] hover:bg-[#fbfaff]">
                <TableHead className="min-w-[320px] px-5 py-4">资讯</TableHead>
                <TableHead className="min-w-[180px] px-5 py-4">栏目 / 摘要</TableHead>
                <TableHead className="min-w-[260px] px-5 py-4">正文预览</TableHead>
                <TableHead className="min-w-[120px] px-5 py-4">状态</TableHead>
                <TableHead className="min-w-[90px] px-5 py-4">排序</TableHead>
                <TableHead className="min-w-[150px] px-5 py-4">更新时间</TableHead>
                <TableHead className="min-w-[230px] px-5 py-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    正在加载资讯
                  </TableCell>
                </TableRow>
              ) : records.length ? (
                records.map((record) => {
                  const cover = getCover(record);
                  const enabled = isEnabled(record);
                  return (
                    <TableRow key={String(record.id)} className="border-[#f0edf7] hover:bg-[#fbfaff]/70">
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-32 shrink-0 overflow-hidden rounded-2xl border border-[#eeeaf7] bg-[#f8f5ff]">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt={getTitle(record)} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">暂无封面</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-semibold text-slate-950">{getTitle(record)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">ID {record.id}</p>
                            {record.subTitle ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{record.subTitle}</p> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">{record.shortText1 || "未设置栏目"}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{record.shortText2 || "-"}</p>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{stripHtml(String(record.longText1 ?? "")) || "暂无正文"}</p>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex w-fit items-center gap-2 rounded-xl border border-[#e8e4f3] bg-white px-3 py-2">
                          <Switch checked={enabled} onCheckedChange={() => void toggleStatus(record)} />
                          <span className={cn("text-xs font-medium", enabled ? "text-primary" : "text-muted-foreground")}>{enabled ? "正常" : "下架"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-slate-700">{String(record.sort ?? 1000)}</TableCell>
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">{formatDateTime(String(record.updateTime ?? record.createTime ?? ""))}</TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void openDetail(record)}>
                            <Eye className="size-4" />
                            详情
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void openEdit(record)}>
                            <Pencil className="size-4" />
                            编辑
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" onClick={() => setDeleteTarget(record)}>
                            <Trash2 className="size-4" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="p-5">
                    <EmptyPanel title="暂无资讯" description="当前没有返回资讯数据，可以先新增一篇富文本资讯。" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#f0edf8] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">共 {total} 条记录，每页 {PAGE_SIZE} 条</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full border-[#f0edf8] bg-white" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
              上一页
            </Button>
            <StatusBadge tone="neutral">第 {page} 页</StatusBadge>
            <Button variant="outline" className="rounded-full border-[#f0edf8] bg-white" onClick={() => setPage((current) => current + 1)} disabled={page * PAGE_SIZE >= total || loading}>
              下一页
            </Button>
          </div>
        </div>
      </PanelCard>

      <NewsEditor open={editorOpen} record={editingRecord} onOpenChange={setEditorOpen} onSubmit={submitNews} />
      <NewsDetailDialog open={detailOpen} record={detailRecord} onOpenChange={setDetailOpen} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[1.8rem] border-white/80 bg-white/96">
          <AlertDialogHeader>
            <AlertDialogTitle>删除资讯</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除“{deleteTarget ? getTitle(deleteTarget) : ""}”吗？该操作会直接调用 zx-textbook 删除接口。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-rose-500 text-white hover:bg-rose-600" onClick={() => void confirmDelete()}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
