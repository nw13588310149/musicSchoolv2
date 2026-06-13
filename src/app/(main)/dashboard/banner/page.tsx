"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowUpRight,
  Eye,
  Image as ImageIcon,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import type { SchoolBannerRecord } from "@/lib/api/contracts";
import { createBanner, deleteBanner, fetchBannerDetail, fetchBannerList, updateBanner } from "@/lib/api/business";
import { formatDateTime, normalizeMediaValue } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const CONTENT_TYPE_OPTIONS = [
  { value: "0", label: "首页" },
  { value: "1", label: "视频教程" },
];

const JUMP_TYPE_OPTIONS = [
  { value: "0", label: "跳转网页" },
  { value: "1", label: "跳转内部" },
];

type BannerForm = {
  id?: string | number;
  title: string;
  contentType: string;
  type: string;
  link: string;
  sort: string;
  status: string;
  img: string[];
  param3: string;
};

const PAGE_SIZE = 10;

const EMPTY_FORM: BannerForm = {
  title: "",
  contentType: "0",
  type: "0",
  link: "",
  sort: "0",
  status: "1",
  img: [],
  param3: "",
};

function getRecordTitle(record: SchoolBannerRecord) {
  return record.title || String(record.name ?? "未命名 Banner");
}

function getRecordImage(record: SchoolBannerRecord) {
  return (
    normalizeMediaValue(record.img)[0] ||
    normalizeMediaValue(record.image)[0] ||
    normalizeMediaValue(record.imageUrl)[0] ||
    normalizeMediaValue(record.bannerUrl)[0] ||
    ""
  );
}

function getRecordLink(record: SchoolBannerRecord) {
  return String(record.param2 ?? record.param1 ?? record.url ?? "");
}

function getOptionLabel(options: Array<{ value: string; label: string }>, value: unknown) {
  return options.find((option) => option.value === String(value ?? ""))?.label ?? "未设置";
}

function isEnabled(record: SchoolBannerRecord) {
  return record.status === true || Number(record.status ?? 1) === 1;
}

function buildForm(record?: SchoolBannerRecord | null): BannerForm {
  if (!record) return { ...EMPTY_FORM };

  return {
    id: record.id,
    title: getRecordTitle(record),
    contentType: String(record.contentType ?? 0),
    type: String(record.type ?? 0),
    link: getRecordLink(record),
    sort: String(record.sort ?? 0),
    status: isEnabled(record) ? "1" : "0",
    img: getRecordImage(record) ? [getRecordImage(record)] : [],
    param3: String(record.param3 ?? ""),
  };
}

function buildPayload(form: BannerForm) {
  const image = form.img[0] ?? "";
  const link = form.link.trim();
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    contentType: Number(form.contentType),
    type: Number(form.type),
    param1: link,
    param2: link,
    param3: form.param3.trim(),
    provinces: "",
    sort: Number(form.sort || 0),
    status: Number(form.status),
    img: image,
  };

  if (form.id !== undefined) payload.id = form.id;
  return payload;
}

function BannerEditor({
  open,
  record,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  record: SchoolBannerRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const token = useAuthStore((state) => state.token);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(buildForm(record));
  }, [open, record]);

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("请填写 Banner 标题");
      return;
    }

    if (!form.img.length) {
      toast.error("请上传 Banner 图片");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(buildPayload(form));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner 保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-[1.5rem] border-[#eeeaf7] bg-white p-0 shadow-[0_22px_70px_rgba(64,52,106,0.14)]">
        <DialogHeader className="border-b border-[#f0edf8] px-6 py-5">
          <DialogTitle>{record ? "编辑 Banner" : "新增 Banner"}</DialogTitle>
          <DialogDescription>填写展示图、跳转信息和排序状态后保存。</DialogDescription>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <Label>标题</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="请输入 Banner 标题"
                  className="h-11 rounded-xl border-[#e8e4f3] bg-white"
                />
              </label>
              <label className="space-y-2">
                <Label>展示位置</Label>
                <CinematicSelect
                  value={form.contentType}
                  onValueChange={(value) => setForm((current) => ({ ...current, contentType: value || "0" }))}
                  options={CONTENT_TYPE_OPTIONS}
                  placeholder="选择展示位置"
                />
              </label>
              <label className="space-y-2">
                <Label>跳转类型</Label>
                <CinematicSelect
                  value={form.type}
                  onValueChange={(value) => setForm((current) => ({ ...current, type: value || "0" }))}
                  options={JUMP_TYPE_OPTIONS}
                  placeholder="选择跳转类型"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <Label>跳转链接</Label>
                <Input
                  value={form.link}
                  onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
                  placeholder="https:// 或内部页面参数"
                  className="h-11 rounded-xl border-[#e8e4f3] bg-white"
                />
              </label>
              <label className="space-y-2">
                <Label>排序</Label>
                <Input
                  type="number"
                  value={form.sort}
                  onChange={(event) => setForm((current) => ({ ...current, sort: event.target.value }))}
                  className="h-11 rounded-xl border-[#e8e4f3] bg-white"
                />
              </label>
              <div className="space-y-2">
                <Label>状态</Label>
                <div className="flex h-11 items-center justify-between rounded-xl border border-[#e8e4f3] bg-white px-4">
                  <span className="text-sm text-slate-600">{Number(form.status) === 1 ? "正常展示" : "已下架"}</span>
                  <Switch checked={Number(form.status) === 1} onCheckedChange={(checked) => setForm((current) => ({ ...current, status: checked ? "1" : "0" }))} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#f0edf8] bg-[#fbfaff] p-4">
              <FileUploadField
                label="Banner 图片"
                hint="建议使用横向大图，适配 iPad 与小程序移动端展示。"
                value={form.img}
                accept="image/*"
                token={token}
                kind="image"
                onChange={(value) => setForm((current) => ({ ...current, img: value.slice(0, 1) }))}
              />
            </div>

            <label className="block space-y-2">
              <Label>参数3 / 备注</Label>
              <Textarea
                value={form.param3}
                onChange={(event) => setForm((current) => ({ ...current, param3: event.target.value }))}
                placeholder="可选"
                className="min-h-20 rounded-xl border-[#e8e4f3] bg-white"
              />
            </label>
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

function BannerDetailDialog({
  open,
  record,
  onOpenChange,
}: {
  open: boolean;
  record: SchoolBannerRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const image = record ? getRecordImage(record) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-[2rem] border-white/80 bg-white/96 p-0">
        <DialogHeader className="border-b border-[#f0edf8] px-6 py-5">
          <DialogTitle>Banner 详情</DialogTitle>
          <DialogDescription>查看接口详情返回的数据与展示效果。</DialogDescription>
        </DialogHeader>
        {record ? (
          <div className="px-6 py-6">
            <div className="overflow-hidden rounded-[1.6rem] border border-[#f0edf8] bg-[#fbfaff]">
              <div className="aspect-[20/7] bg-linear-to-br from-primary/12 via-white to-[#f2eaff]">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={getRecordTitle(record)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">暂无图片</div>
                )}
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {[
                  ["标题", getRecordTitle(record)],
                  ["展示位置", getOptionLabel(CONTENT_TYPE_OPTIONS, record.contentType)],
                  ["跳转类型", getOptionLabel(JUMP_TYPE_OPTIONS, record.type)],
                  ["跳转链接", getRecordLink(record) || "-"],
                  ["排序", String(record.sort ?? 0)],
                  ["状态", isEnabled(record) ? "启用" : "停用"],
                  ["更新时间", formatDateTime(String(record.updateTime ?? ""))],
                  ["创建时间", formatDateTime(String(record.createTime ?? ""))],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function BannerPage() {
  const token = useAuthStore((state) => state.token);
  const [records, setRecords] = useState<SchoolBannerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ title: "", contentType: "" });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SchoolBannerRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<SchoolBannerRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolBannerRecord | null>(null);

  const loadBanners = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await fetchBannerList(
        {
          current: page,
          size: PAGE_SIZE,
          title: filters.title || undefined,
          contentType: filters.contentType === "" ? undefined : Number(filters.contentType),
        },
        token,
      );
      setRecords(result.records ?? []);
      setTotal(Number(result.total ?? 0));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner 列表加载失败");
    } finally {
      setLoading(false);
    }
  }, [filters.contentType, filters.title, page, token]);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  const stats = useMemo(() => {
    const enabled = records.filter(isEnabled).length;
    const homepage = records.filter((item) => Number(item.contentType ?? 0) === 0).length;
    const internal = records.filter((item) => Number(item.type ?? 0) === 1).length;

    return { total: total || records.length, enabled, homepage, internal };
  }, [records, total]);

  const openCreate = () => {
    setEditingRecord(null);
    setEditorOpen(true);
  };

  const openEdit = async (record: SchoolBannerRecord) => {
    if (!token) return;
    setEditingRecord(record);
    setEditorOpen(true);
    try {
      const detail = await fetchBannerDetail(record.id, token);
      setEditingRecord({ ...record, ...detail });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner 详情加载失败");
    }
  };

  const openDetail = async (record: SchoolBannerRecord) => {
    if (!token) return;
    setDetailRecord(record);
    setDetailOpen(true);
    try {
      const detail = await fetchBannerDetail(record.id, token);
      setDetailRecord({ ...record, ...detail });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner 详情加载失败");
    }
  };

  const submitBanner = async (payload: Record<string, unknown>) => {
    if (!token) return;
    if ("id" in payload) {
      await updateBanner(payload, token);
      toast.success("Banner 已更新");
    } else {
      await createBanner(payload, token);
      toast.success("Banner 已新增");
    }
    await loadBanners();
  };

  const toggleStatus = async (record: SchoolBannerRecord) => {
    if (!token) return;
    try {
      await updateBanner(
        buildPayload({
          ...buildForm(record),
          status: isEnabled(record) ? "0" : "1",
        }),
        token,
      );
      toast.success(isEnabled(record) ? "Banner 已停用" : "Banner 已启用");
      await loadBanners();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "状态更新失败");
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;
    try {
      await deleteBanner(deleteTarget.id, token);
      toast.success("Banner 已删除");
      setDeleteTarget(null);
      await loadBanners();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner 删除失败");
    }
  };

  return (
    <div className="space-y-4 pb-4 lg:space-y-5 lg:pb-5">
      <section className="relative overflow-hidden rounded-[2.1rem] border border-white/80 bg-white/88 px-5 py-5 shadow-[0_22px_60px_rgba(105,82,198,0.08)] lg:px-6 lg:py-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">Banner管理</Badge>
              <Badge className="rounded-full border border-[#f0eef8] bg-white/80 px-3 py-1 text-foreground hover:bg-white">School Banner</Badge>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">校园视觉入口管理</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              管理 APP 首页与内容入口的 Banner 素材、跳转链接和排序状态，保持浅色工作台下的一致运营节奏。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-10 rounded-full border-white/80 bg-white/86" onClick={() => void loadBanners()} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              刷新
            </Button>
            <Button className="h-10 rounded-full px-5 shadow-[0_18px_36px_rgba(119,79,240,0.24)]" onClick={openCreate}>
              <Plus className="size-4" />
              新增 Banner
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ImageIcon} label="Banner 总数" value={String(stats.total)} hint="来自 banner/list" />
        <MetricCard icon={Sparkles} label="启用中" value={String(stats.enabled)} hint="可在前台展示" />
        <MetricCard icon={Eye} label="首页 Banner" value={String(stats.homepage)} hint="contentType = 首页" />
        <MetricCard icon={ArrowUpRight} label="内部跳转" value={String(stats.internal)} hint="type = 跳转内部" />
      </section>

      <PanelCard className="p-0">
        <div className="border-b border-[#f0edf8] px-5 py-5">
          <SectionHeading
            title="Banner 列表"
            description="支持按标题与展示位置筛选，新增、编辑、删除会直接同步智慧校园 v2 Banner 接口。"
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
              value={filters.contentType}
              onValueChange={(value) => setFilters((current) => ({ ...current, contentType: value }))}
              options={CONTENT_TYPE_OPTIONS}
              placeholder="全部位置"
            />
            <div className="flex gap-2">
              <Button
                className="h-11 rounded-full px-5"
                onClick={() => {
                  setPage(1);
                  void loadBanners();
                }}
              >
                查询
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-full border-white/80 bg-white/90"
                onClick={() => {
                  setFilters({ title: "", contentType: "" });
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
                <TableHead className="min-w-[300px] px-5 py-4">Banner</TableHead>
                <TableHead className="min-w-[120px] px-5 py-4">展示位置</TableHead>
                <TableHead className="min-w-[120px] px-5 py-4">跳转类型</TableHead>
                <TableHead className="min-w-[220px] px-5 py-4">跳转链接</TableHead>
                <TableHead className="min-w-[110px] px-5 py-4">状态</TableHead>
                <TableHead className="min-w-[100px] px-5 py-4">排序</TableHead>
                <TableHead className="min-w-[150px] px-5 py-4">更新时间</TableHead>
                <TableHead className="min-w-[230px] px-5 py-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    正在加载 Banner
                  </TableCell>
                </TableRow>
              ) : records.length ? (
                records.map((record) => {
                  const image = getRecordImage(record);
                  const enabled = isEnabled(record);
                  return (
                    <TableRow key={String(record.id)} className="border-[#f0edf7] hover:bg-[#fbfaff]/70">
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-36 shrink-0 overflow-hidden rounded-2xl border border-[#eeeaf7] bg-[#f8f5ff]">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={image} alt={getRecordTitle(record)} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">暂无图片</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-950">{getRecordTitle(record)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">ID {record.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <StatusBadge tone="brand">{getOptionLabel(CONTENT_TYPE_OPTIONS, record.contentType)}</StatusBadge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-slate-700">{getOptionLabel(JUMP_TYPE_OPTIONS, record.type)}</TableCell>
                      <TableCell className="max-w-[260px] truncate px-5 py-4 text-sm text-muted-foreground">{getRecordLink(record) || "-"}</TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex w-fit items-center gap-2 rounded-xl border border-[#e8e4f3] bg-white px-3 py-2">
                          <Switch checked={enabled} onCheckedChange={() => void toggleStatus(record)} />
                          <span className={cn("text-xs font-medium", enabled ? "text-primary" : "text-muted-foreground")}>{enabled ? "启用" : "停用"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-slate-700">{String(record.sort ?? 0)}</TableCell>
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
                  <TableCell colSpan={8} className="p-5">
                    <EmptyPanel title="暂无 Banner" description="当前没有返回 Banner 数据，可以先新增一张运营海报。" />
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

      <BannerEditor open={editorOpen} record={editingRecord} onOpenChange={setEditorOpen} onSubmit={submitBanner} />
      <BannerDetailDialog open={detailOpen} record={detailRecord} onOpenChange={setDetailOpen} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[1.8rem] border-white/80 bg-white/96">
          <AlertDialogHeader>
            <AlertDialogTitle>删除 Banner</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除“{deleteTarget ? getRecordTitle(deleteTarget) : ""}”吗？该操作会直接调用 Banner 删除接口。
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
