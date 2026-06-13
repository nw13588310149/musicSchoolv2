"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { FileAudio2, FileImage, Layers3, PencilLine, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createResource, deleteResource, fetchResourceList, updateResource } from "@/lib/api/business";
import { FileUploadField } from "@/components/dashboard/file-upload-field";
import { EmptyPanel, MetricCard, ModuleHero, PanelCard, SectionHeading, StatusBadge } from "@/components/dashboard/module-kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, normalizeMediaValue } from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type SelectOption = {
  label: string;
  value: string;
};

interface ResourceFeatures {
  subtitle?: boolean;
  seriesTitle?: boolean;
  secondCategory?: boolean;
  audio?: boolean;
  image1?: boolean;
  image2?: boolean;
  richText?: boolean;
}

export interface ResourceModuleConfig {
  title: string;
  description: string;
  eyebrow?: string;
  type: number;
  listLabel: string;
  categoryLabel: string;
  firstMenuOptions: SelectOption[];
  secondMenuOptions?: Record<string, SelectOption[]>;
  features: ResourceFeatures;
  image1Label?: string;
  image2Label?: string;
  audioLabel?: string;
  listPath: string;
  createPath: string;
  updatePath: string;
  deletePath: string;
}

interface ResourceFormState {
  title: string;
  shortText1: string;
  shortText2: string;
  firstMenu: string;
  secondMenu: string;
  longText1: string;
  file1: string[];
  img1: string[];
  img2: string[];
}

const EMPTY_FORM: ResourceFormState = {
  title: "",
  shortText1: "",
  shortText2: "",
  firstMenu: "",
  secondMenu: "",
  longText1: "",
  file1: [],
  img1: [],
  img2: [],
};

function stripHtml(value?: string) {
  if (!value) return "暂无内容";
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() || "暂无内容";
}

function toFormState(record?: Record<string, unknown> | null): ResourceFormState {
  if (!record) return EMPTY_FORM;

  return {
    title: String(record.title ?? ""),
    shortText1: String(record.shortText1 ?? ""),
    shortText2: String(record.shortText2 ?? ""),
    firstMenu: record.firstMenu ? String(record.firstMenu) : "",
    secondMenu: record.secondMenu ? String(record.secondMenu) : "",
    longText1: String(record.longText1 ?? ""),
    file1: normalizeMediaValue(record.file1),
    img1: normalizeMediaValue(record.img1),
    img2: normalizeMediaValue(record.img2),
  };
}

function getOptionLabel(options: SelectOption[], value?: string | number) {
  return options.find((item) => item.value === String(value))?.label || "未设置";
}

export function ResourceManager({ config }: { config: ResourceModuleConfig }) {
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ title: "", firstMenu: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [formState, setFormState] = useState<ResourceFormState>(EMPTY_FORM);

  const secondMenuOptions = useMemo(() => {
    return config.secondMenuOptions?.[formState.firstMenu] ?? [];
  }, [config.secondMenuOptions, formState.firstMenu]);

  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetchResourceList(
        config.listPath,
        {
          current: page,
          size: pageSize,
          title: filters.title || undefined,
          firstMenu: filters.firstMenu || undefined,
        },
        token,
      );
      setItems(response.records ?? []);
      setTotal(Number(response.total ?? 0));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${config.title}加载失败。`);
    } finally {
      setLoading(false);
    }
  }, [config.listPath, config.title, filters.firstMenu, filters.title, page, pageSize, token]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const metrics = useMemo(() => {
    const audioCount = items.filter((item) => normalizeMediaValue(item.file1).length > 0).length;
    const visualCount = items.filter(
      (item) => normalizeMediaValue(item.img1).length > 0 || normalizeMediaValue(item.img2).length > 0,
    ).length;
    const categoryCount = new Set(items.map((item) => item.firstMenu).filter(Boolean)).size;

    return [
      { icon: Layers3, label: "资源总量", value: String(total || items.length), hint: "当前筛选结果中的内容条目" },
      { icon: Sparkles, label: "已用分类", value: String(categoryCount), hint: "按当前结果集自动统计分类数量" },
      {
        icon: FileAudio2,
        label: "音频内容",
        value: String(audioCount),
        hint: config.features.audio ? "包含可直接试听的音频资源" : "当前模块以图文内容为主",
      },
      { icon: FileImage, label: "图像素材", value: String(visualCount), hint: "统计已上传的谱面、配图与答案图" },
    ];
  }, [config.features.audio, items, total]);

  const openCreate = () => {
    setEditingRecord(null);
    setFormState(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingRecord(record);
    setFormState(toFormState(record));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
    setFormState(EMPTY_FORM);
  };

  const buildPayload = () => {
    return {
      file1: formState.file1.length ? JSON.stringify(formState.file1) : "",
      file2: "",
      file3: "",
      firstMenu: formState.firstMenu ? Number(formState.firstMenu) : "",
      img1: formState.img1.length ? JSON.stringify(formState.img1) : "",
      img2: formState.img2.length ? JSON.stringify(formState.img2) : "",
      img3: "",
      longText1: formState.longText1 || "",
      longText2: "",
      longText3: "",
      provinces: "甘肃",
      vip: 1,
      secondMenu: formState.secondMenu ? Number(formState.secondMenu) : "",
      shortText1: formState.shortText1 || "",
      shortText2: formState.shortText2 || "",
      shortText3: "",
      sort: 1000,
      status: true,
      subTitle: "",
      subType: 0,
      title: formState.title.trim(),
      type: config.type,
    };
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("登录状态已失效，请重新登录。");
      return;
    }

    if (!formState.title.trim()) {
      toast.error("请先填写标题。");
      return;
    }

    if (!formState.firstMenu) {
      toast.error(`请选择${config.categoryLabel}。`);
      return;
    }

    if (config.features.secondCategory && secondMenuOptions.length > 0 && !formState.secondMenu) {
      toast.error("请选择子分类。");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingRecord) {
        await updateResource(config.updatePath, { ...payload, id: editingRecord.id }, token);
        toast.success(`${config.title}已更新。`);
      } else {
        await createResource(config.createPath, payload, token);
        toast.success(`${config.title}已新增。`);
      }
      closeDialog();
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: Record<string, unknown>) => {
    if (!token) return;
    const confirmed = window.confirm(`确认删除“${String(record.title ?? "")}”吗？`);
    if (!confirmed) return;

    try {
      await deleteResource(config.deletePath, String(record.id), token);
      toast.success("删除成功。");
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败，请稍后重试。");
    }
  };

  const latestUpdate = items
    .map((item) => item.updateTime)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return (
    <div className="space-y-6">
      <ModuleHero
        title={config.title}
        description={config.description}
        eyebrow={config.eyebrow}
        actions={
          <>
            <Button variant="outline" className="rounded-full border-white/80 bg-white/82" onClick={() => void fetchItems()}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              刷新
            </Button>
            <Button className="rounded-full px-5 shadow-[0_16px_32px_rgba(109,83,219,0.24)]" onClick={openCreate}>
              <Plus className="size-4" />
              新增资源
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <PanelCard>
        <SectionHeading
          title={config.listLabel}
          description={latestUpdate ? `最近更新：${formatDateTime(String(latestUpdate))}` : "支持标题与分类筛选，可在列表中直接进入编辑。"}
        />

        <div className="mb-5 grid gap-3 rounded-[1.5rem] bg-[#f7f4ff] p-4 md:grid-cols-[1fr_220px_auto]">
          <Input
            value={filters.title}
            onChange={(event) => setFilters((current) => ({ ...current, title: event.target.value }))}
            placeholder="按标题搜索"
            className="h-11 rounded-full border-white bg-white/90"
          />
          <select
            value={filters.firstMenu}
            onChange={(event) => setFilters((current) => ({ ...current, firstMenu: event.target.value }))}
            className="h-11 rounded-full border border-white bg-white/90 px-4 text-sm text-foreground outline-none"
          >
            <option value="">全部分类</option>
            {config.firstMenuOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-full px-5"
              onClick={() => {
                setPage(1);
                void fetchItems();
              }}
            >
              查询
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/80 bg-white/90"
              onClick={() => {
                setFilters({ title: "", firstMenu: "" });
                setPage(1);
              }}
            >
              重置
            </Button>
          </div>
        </div>

        {!items.length && !loading ? (
          <EmptyPanel title="当前暂无资源" description="你可以先新建一条内容，或调整搜索条件后重新查询。" />
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/88">
            <Table>
              <TableHeader className="bg-[#faf8ff]">
                <TableRow className="border-white/70 hover:bg-transparent">
                  <TableHead className="px-4">标题</TableHead>
                  <TableHead>分类</TableHead>
                  {config.features.secondCategory ? <TableHead>子分类</TableHead> : null}
                  {config.features.seriesTitle ? <TableHead>系列标题</TableHead> : null}
                  {config.features.subtitle ? <TableHead>副标题</TableHead> : null}
                  {config.features.audio ? <TableHead>音频</TableHead> : null}
                  {config.features.image1 ? <TableHead>{config.image1Label ?? "图片一"}</TableHead> : null}
                  {config.features.image2 ? <TableHead>{config.image2Label ?? "图片二"}</TableHead> : null}
                  {config.features.richText ? <TableHead className="max-w-[260px]">内容</TableHead> : null}
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const audioList = normalizeMediaValue(item.file1);
                  const image1 = normalizeMediaValue(item.img1)[0];
                  const image2 = normalizeMediaValue(item.img2)[0];

                  return (
                    <TableRow key={String(item.id)} className="border-white/70">
                      <TableCell className="px-4">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{String(item.title ?? "")}</p>
                          <StatusBadge tone="brand">ID {String(item.id ?? "")}</StatusBadge>
                        </div>
                      </TableCell>
                      <TableCell>{getOptionLabel(config.firstMenuOptions, item.firstMenu as string | number | undefined)}</TableCell>
                      {config.features.secondCategory ? (
                        <TableCell>
                          {getOptionLabel(config.secondMenuOptions?.[String(item.firstMenu)] ?? [], item.secondMenu as string | number | undefined)}
                        </TableCell>
                      ) : null}
                      {config.features.seriesTitle ? <TableCell className="max-w-[180px] truncate">{String(item.shortText1 ?? "暂无")}</TableCell> : null}
                      {config.features.subtitle ? <TableCell className="max-w-[180px] truncate">{String(item.shortText2 ?? "暂无")}</TableCell> : null}
                      {config.features.audio ? (
                        <TableCell>{audioList[0] ? <audio controls className="max-w-[220px]" src={audioList[0]} /> : "暂无"}</TableCell>
                      ) : null}
                      {config.features.image1 ? (
                        <TableCell>
                          {image1 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image1} alt={String(item.title ?? "")} className="h-16 w-16 rounded-2xl object-cover" />
                          ) : (
                            "暂无"
                          )}
                        </TableCell>
                      ) : null}
                      {config.features.image2 ? (
                        <TableCell>
                          {image2 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image2} alt={String(item.title ?? "")} className="h-16 w-16 rounded-2xl object-cover" />
                          ) : (
                            "暂无"
                          )}
                        </TableCell>
                      ) : null}
                      {config.features.richText ? (
                        <TableCell className="max-w-[260px]">
                          <p className="line-clamp-3 whitespace-normal text-sm text-muted-foreground">{stripHtml(String(item.longText1 ?? ""))}</p>
                        </TableCell>
                      ) : null}
                      <TableCell>{formatDateTime(typeof item.updateTime === "string" ? item.updateTime : undefined)}</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">共 {total} 条记录，每页 {pageSize} 条</p>
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
        <DialogContent className="max-w-5xl rounded-[2rem] border-white/80 bg-white/96 p-0">
          <DialogHeader className="border-b border-white/80 px-6 py-5">
            <DialogTitle>{editingRecord ? `编辑${config.title}` : `新增${config.title}`}</DialogTitle>
            <DialogDescription>支持在同一张表单里维护分类、素材、音频与内容详情，保存后会直接进入当前模块列表。</DialogDescription>
          </DialogHeader>

          <div className="max-h-[78vh] overflow-y-auto px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">标题</span>
                <Input
                  value={formState.title}
                  onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                  placeholder="请输入标题"
                  className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{config.categoryLabel}</span>
                <select
                  value={formState.firstMenu}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      firstMenu: event.target.value,
                      secondMenu: "",
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-white/80 bg-[#faf8ff] px-4 text-sm outline-none"
                >
                  <option value="">请选择</option>
                  {config.firstMenuOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {config.features.secondCategory ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">子分类</span>
                  <select
                    value={formState.secondMenu}
                    onChange={(event) => setFormState((current) => ({ ...current, secondMenu: event.target.value }))}
                    className="h-11 w-full rounded-2xl border border-white/80 bg-[#faf8ff] px-4 text-sm outline-none"
                  >
                    <option value="">请选择</option>
                    {secondMenuOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {config.features.seriesTitle ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">系列标题</span>
                  <Input
                    value={formState.shortText1}
                    onChange={(event) => setFormState((current) => ({ ...current, shortText1: event.target.value }))}
                    placeholder="请输入系列标题"
                    className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
                  />
                </label>
              ) : null}

              {config.features.subtitle ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">副标题</span>
                  <Input
                    value={formState.shortText2}
                    onChange={(event) => setFormState((current) => ({ ...current, shortText2: event.target.value }))}
                    placeholder="请输入副标题"
                    className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
                  />
                </label>
              ) : null}
            </div>

            <div className="mt-5 space-y-5">
              {config.features.audio ? (
                <FileUploadField
                  label={config.audioLabel ?? "音频文件"}
                  hint="支持上传后直接试听。"
                  value={formState.file1}
                  accept=".mp3,audio/*"
                  token={token}
                  kind="audio"
                  multiple
                  onChange={(value) => setFormState((current) => ({ ...current, file1: value }))}
                />
              ) : null}

              {config.features.image1 ? (
                <FileUploadField
                  label={config.image1Label ?? "图片一"}
                  hint="支持 jpg、png 等常见图片格式。"
                  value={formState.img1}
                  accept="image/*"
                  token={token}
                  kind="image"
                  multiple
                  onChange={(value) => setFormState((current) => ({ ...current, img1: value }))}
                />
              ) : null}

              {config.features.image2 ? (
                <FileUploadField
                  label={config.image2Label ?? "图片二"}
                  hint="可上传补充配图、答案图或简谱图。"
                  value={formState.img2}
                  accept="image/*"
                  token={token}
                  kind="image"
                  multiple
                  onChange={(value) => setFormState((current) => ({ ...current, img2: value }))}
                />
              ) : null}

              {config.features.richText ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">内容详情</span>
                  <Textarea
                    value={formState.longText1}
                    onChange={(event) => setFormState((current) => ({ ...current, longText1: event.target.value }))}
                    placeholder="支持粘贴 HTML 或输入图文内容描述。"
                    className="min-h-[180px] rounded-[1.6rem] border-white/80 bg-[#faf8ff] px-4 py-3"
                  />
                </label>
              ) : null}
            </div>
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
