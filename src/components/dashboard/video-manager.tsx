"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Clapperboard, Film, MonitorPlay, PencilLine, Plus, Rows3, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FileUploadField } from "@/components/dashboard/file-upload-field";
import { MetricCard, ModuleHero, PanelCard, SectionHeading, StatusBadge } from "@/components/dashboard/module-kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createVideoSeries,
  createVideoTutorial,
  deleteVideoSeries,
  deleteVideoTutorial,
  fetchVideoMenuTree,
  fetchVideoSeriesList,
  fetchVideoTutorialList,
  updateVideoSeries,
  updateVideoTutorial,
} from "@/lib/api/business";
import type { MenuNode, VideoSeriesRecord, VideoTutorialRecord } from "@/lib/api/contracts";
import { formatDateTime, normalizeMediaValue } from "@/lib/dashboard-utils";
import { useAuthStore } from "@/stores/auth-store";

interface SeriesFormState {
  name: string;
}

interface TutorialFormState {
  name: string;
  firstMenu: string;
  secondMenu: string;
  seriesId: string;
  vip: string;
  showIndex: string;
  param3: string;
  url: string[];
  coverImg: string[];
  param1: string[];
  param2: string[];
}

const EMPTY_SERIES_FORM: SeriesFormState = { name: "" };
const EMPTY_TUTORIAL_FORM: TutorialFormState = {
  name: "",
  firstMenu: "",
  secondMenu: "",
  seriesId: "",
  vip: "1",
  showIndex: "0",
  param3: "",
  url: [],
  coverImg: [],
  param1: [],
  param2: [],
};

function buildMenuOptions(tree: MenuNode[]) {
  const firstMenuOptions = tree.map((item) => ({ label: item.name, value: String(item.id) }));
  const secondMenuMap: Record<string, Array<{ label: string; value: string }>> = {};
  tree.forEach((item) => {
    secondMenuMap[String(item.id)] = (item.children ?? []).map((child) => ({
      label: child.name,
      value: String(child.id),
    }));
  });
  return { firstMenuOptions, secondMenuMap };
}

async function readVideoDuration(url: string) {
  return new Promise<string>((resolve) => {
    const video = document.createElement("video");
    video.src = url;
    video.addEventListener("loadedmetadata", () => {
      const minutes = Math.floor(video.duration / 60);
      const seconds = Math.floor(video.duration % 60);
      resolve(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    });
    video.addEventListener("error", () => resolve("00:00"));
  });
}

export function VideoManager() {
  const token = useAuthStore((state) => state.token);
  const [seriesItems, setSeriesItems] = useState<VideoSeriesRecord[]>([]);
  const [tutorialItems, setTutorialItems] = useState<VideoTutorialRecord[]>([]);
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const [savingSeries, setSavingSeries] = useState(false);
  const [savingTutorial, setSavingTutorial] = useState(false);
  const [editingSeries, setEditingSeries] = useState<VideoSeriesRecord | null>(null);
  const [editingTutorial, setEditingTutorial] = useState<VideoTutorialRecord | null>(null);
  const [seriesForm, setSeriesForm] = useState<SeriesFormState>(EMPTY_SERIES_FORM);
  const [tutorialForm, setTutorialForm] = useState<TutorialFormState>(EMPTY_TUTORIAL_FORM);
  const [searchName, setSearchName] = useState("");
  const [searchFirstMenu, setSearchFirstMenu] = useState("");

  const { firstMenuOptions, secondMenuMap } = useMemo(() => buildMenuOptions(menuTree), [menuTree]);
  const currentSecondOptions = secondMenuMap[tutorialForm.firstMenu] ?? [];

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [seriesResponse, tutorialResponse, menuResponse] = await Promise.all([
        fetchVideoSeriesList({ current: 1, size: 1000 }, token),
        fetchVideoTutorialList(
          {
            current: 1,
            size: 1000,
            name: searchName || undefined,
            firstMenu: searchFirstMenu || undefined,
          },
          token,
        ),
        fetchVideoMenuTree(token),
      ]);
      setSeriesItems(seriesResponse.records ?? []);
      setTutorialItems(tutorialResponse.records ?? []);
      setMenuTree(menuResponse ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "视频数据加载失败。");
    } finally {
      setLoading(false);
    }
  }, [searchFirstMenu, searchName, token]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const metrics = useMemo(() => {
    const homepageCount = tutorialItems.filter((item) => Number(item.showIndex ?? 0) === 1).length;

    return [
      { icon: Rows3, label: "系列数量", value: String(seriesItems.length), hint: "用于承接课程或栏目归类" },
      { icon: Film, label: "视频教程", value: String(tutorialItems.length), hint: "当前学校账号下的视频内容总数" },
      { icon: MonitorPlay, label: "首页展示", value: String(homepageCount), hint: "已设为首页推荐的视频数量" },
    ];
  }, [seriesItems.length, tutorialItems]);

  const openSeriesCreate = () => {
    setEditingSeries(null);
    setSeriesForm(EMPTY_SERIES_FORM);
    setSeriesDialogOpen(true);
  };

  const openSeriesEdit = (record: VideoSeriesRecord) => {
    setEditingSeries(record);
    setSeriesForm({ name: record.name || "" });
    setSeriesDialogOpen(true);
  };

  const openTutorialCreate = () => {
    setEditingTutorial(null);
    setTutorialForm(EMPTY_TUTORIAL_FORM);
    setTutorialDialogOpen(true);
  };

  const openTutorialEdit = (record: VideoTutorialRecord) => {
    setEditingTutorial(record);
    setTutorialForm({
      name: String(record.name || ""),
      firstMenu: record.firstMenu ? String(record.firstMenu) : "",
      secondMenu: record.secondMenu ? String(record.secondMenu) : "",
      seriesId: record.seriesId ? String(record.seriesId) : "",
      vip: String(record.vip ?? 1),
      showIndex: String(record.showIndex ?? 0),
      param3: String(record.param3 ?? ""),
      url: normalizeMediaValue(record.url),
      coverImg: normalizeMediaValue(record.coverImg),
      param1: normalizeMediaValue(record.param1),
      param2: normalizeMediaValue(record.param2),
    });
    setTutorialDialogOpen(true);
  };

  const handleSaveSeries = async () => {
    if (!token) return;
    if (!seriesForm.name.trim()) {
      toast.error("请先填写系列名称。");
      return;
    }

    setSavingSeries(true);
    try {
      if (editingSeries) {
        await updateVideoSeries({ id: editingSeries.id, name: seriesForm.name.trim() }, token);
        toast.success("视频系列已更新。");
      } else {
        await createVideoSeries({ name: seriesForm.name.trim() }, token);
        toast.success("视频系列已新增。");
      }
      setSeriesDialogOpen(false);
      setEditingSeries(null);
      setSeriesForm(EMPTY_SERIES_FORM);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "系列保存失败，请稍后重试。");
    } finally {
      setSavingSeries(false);
    }
  };

  const handleDeleteSeries = async (record: VideoSeriesRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`确认删除系列“${record.name}”吗？`);
    if (!confirmed) return;

    try {
      await deleteVideoSeries(record.id, token);
      toast.success("视频系列已删除。");
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败，请稍后重试。");
    }
  };

  const handleSaveTutorial = async () => {
    if (!token) return;
    if (!tutorialForm.name.trim()) {
      toast.error("请先填写视频标题。");
      return;
    }
    if (!tutorialForm.firstMenu) {
      toast.error("请选择所属分类。");
      return;
    }

    setSavingTutorial(true);
    try {
      const duration = tutorialForm.url[0] ? await readVideoDuration(tutorialForm.url[0]) : editingTutorial?.duration || "00:00";
      const payload = {
        coverImg: tutorialForm.coverImg[0] || "",
        duration,
        firstMenu: tutorialForm.firstMenu ? Number(tutorialForm.firstMenu) : "",
        name: tutorialForm.name.trim(),
        param1: tutorialForm.param1.length ? JSON.stringify(tutorialForm.param1) : "",
        param2: tutorialForm.param2.length ? JSON.stringify(tutorialForm.param2) : "",
        param3: tutorialForm.param3 || "",
        secondMenu: tutorialForm.secondMenu ? Number(tutorialForm.secondMenu) : 0,
        seriesId: tutorialForm.seriesId ? Number(tutorialForm.seriesId) : "",
        showIndex: Number(tutorialForm.showIndex || 0),
        sort: 1000,
        url: tutorialForm.url[0] || "",
        vip: Number(tutorialForm.vip || 1),
      };

      if (editingTutorial) {
        await updateVideoTutorial({ ...payload, id: editingTutorial.id }, token);
        toast.success("视频教程已更新。");
      } else {
        await createVideoTutorial(payload, token);
        toast.success("视频教程已新增。");
      }

      setTutorialDialogOpen(false);
      setEditingTutorial(null);
      setTutorialForm(EMPTY_TUTORIAL_FORM);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "视频保存失败，请稍后重试。");
    } finally {
      setSavingTutorial(false);
    }
  };

  const handleDeleteTutorial = async (record: VideoTutorialRecord) => {
    if (!token) return;
    const confirmed = window.confirm(`确认删除视频“${record.name}”吗？`);
    if (!confirmed) return;

    try {
      await deleteVideoTutorial(record.id, token);
      toast.success("视频教程已删除。");
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败，请稍后重试。");
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHero
        title="视频管理"
        eyebrow="媒体工作台"
        description="将视频系列和视频教程集中到同一张媒体工作台中管理，支持封面、视频文件、谱面图、简谱图和首页展示状态的统一维护。"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <Tabs defaultValue="tutorials" className="gap-5">
        <TabsList variant="line" className="rounded-full bg-white/80 p-1">
          <TabsTrigger value="tutorials" className="rounded-full px-4">
            视频教程
          </TabsTrigger>
          <TabsTrigger value="series" className="rounded-full px-4">
            视频系列
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorials">
          <PanelCard>
            <SectionHeading
              title="视频教程列表"
              description="支持分类检索、系列归属、封面与视频文件上传，以及首页展示状态控制。"
              action={
                <Button className="rounded-full px-5 shadow-[0_16px_32px_rgba(109,83,219,0.24)]" onClick={openTutorialCreate}>
                  <Plus className="size-4" />
                  新增视频
                </Button>
              }
            />

            <div className="mb-5 grid gap-3 rounded-[1.5rem] bg-[#f7f4ff] p-4 md:grid-cols-[1fr_220px_auto]">
              <Input
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
                placeholder="按视频标题搜索"
                className="h-11 rounded-full border-white bg-white/90"
              />
              <select
                value={searchFirstMenu}
                onChange={(event) => setSearchFirstMenu(event.target.value)}
                className="h-11 rounded-full border border-white bg-white/90 px-4 text-sm outline-none"
              >
                <option value="">全部分类</option>
                {firstMenuOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button className="rounded-full px-5" onClick={() => void fetchData()}>
                查询
              </Button>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/88">
              <Table>
                <TableHeader className="bg-[#faf8ff]">
                  <TableRow className="border-white/70 hover:bg-transparent">
                    <TableHead className="px-4">视频</TableHead>
                    <TableHead>系列</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>首页展示</TableHead>
                    <TableHead>时长</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorialItems.map((item) => (
                    <TableRow key={item.id} className="border-white/70">
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-24 overflow-hidden rounded-2xl bg-primary/10">
                            {item.coverImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.coverImg} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-primary">
                                <Clapperboard className="size-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{item.name}</p>
                            <p className="mt-1 line-clamp-2 max-w-[280px] text-sm text-muted-foreground">
                              {item.param3 || "暂无简介"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{seriesItems.find((series) => String(series.id) === String(item.seriesId))?.name || "未归属"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{item.firstMenuName || firstMenuOptions.find((option) => option.value === String(item.firstMenu))?.label || "暂无"}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.secondMenuName ||
                              secondMenuMap[String(item.firstMenu)]?.find((option) => option.value === String(item.secondMenu))?.label ||
                              "无子类"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={Number(item.showIndex ?? 0) === 1 ? "success" : "neutral"}>
                          {Number(item.showIndex ?? 0) === 1 ? "已展示" : "未展示"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{item.duration || "00:00"}</TableCell>
                      <TableCell>{formatDateTime(item.updateTime)}</TableCell>
                      <TableCell className="px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-white/80 bg-white"
                            onClick={() => openTutorialEdit(item)}
                          >
                            <PencilLine className="size-3.5" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => void handleDeleteTutorial(item)}
                          >
                            <Trash2 className="size-3.5" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!tutorialItems.length && !loading ? (
                    <TableRow className="border-white/70">
                      <TableCell colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        当前暂无视频教程，先新增一条内容吧。
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </PanelCard>
        </TabsContent>

        <TabsContent value="series">
          <PanelCard>
            <SectionHeading
              title="视频系列"
              description="维护系列名称后，视频教程即可挂载到对应栏目中。"
              action={
                <Button className="rounded-full px-5 shadow-[0_16px_32px_rgba(109,83,219,0.24)]" onClick={openSeriesCreate}>
                  <Plus className="size-4" />
                  新增系列
                </Button>
              }
            />

            <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/88">
              <Table>
                <TableHeader className="bg-[#faf8ff]">
                  <TableRow className="border-white/70 hover:bg-transparent">
                    <TableHead className="px-4">系列名称</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seriesItems.map((item) => (
                    <TableRow key={item.id} className="border-white/70">
                      <TableCell className="px-4">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <StatusBadge tone="brand">ID {String(item.id)}</StatusBadge>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(item.createTime)}</TableCell>
                      <TableCell className="px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-white/80 bg-white"
                            onClick={() => openSeriesEdit(item)}
                          >
                            <PencilLine className="size-3.5" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => void handleDeleteSeries(item)}
                          >
                            <Trash2 className="size-3.5" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!seriesItems.length && !loading ? (
                    <TableRow className="border-white/70">
                      <TableCell colSpan={3} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        当前还没有视频系列，先创建一个系列吧。
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </PanelCard>
        </TabsContent>
      </Tabs>

      <Dialog open={seriesDialogOpen} onOpenChange={setSeriesDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2rem] border-white/80 bg-white/96 p-0">
          <DialogHeader className="border-b border-white/80 px-6 py-5">
            <DialogTitle>{editingSeries ? "编辑视频系列" : "新增视频系列"}</DialogTitle>
            <DialogDescription>系列将作为视频教程的栏目归属，便于后续按课程或专题集中管理。</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">系列名称</span>
              <Input
                value={seriesForm.name}
                onChange={(event) => setSeriesForm({ name: event.target.value })}
                placeholder="请输入系列名称"
                className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
              />
            </label>
          </div>
          <DialogFooter className="rounded-b-[2rem] border-white/80 bg-[#faf8ff]">
            <Button variant="outline" className="rounded-full border-white bg-white" onClick={() => setSeriesDialogOpen(false)}>
              取消
            </Button>
            <Button className="rounded-full px-6" onClick={() => void handleSaveSeries()} disabled={savingSeries}>
              {savingSeries ? "保存中..." : editingSeries ? "保存修改" : "确认新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tutorialDialogOpen} onOpenChange={setTutorialDialogOpen}>
        <DialogContent className="max-w-5xl rounded-[2rem] border-white/80 bg-white/96 p-0">
          <DialogHeader className="border-b border-white/80 px-6 py-5">
            <DialogTitle>{editingTutorial ? "编辑视频教程" : "新增视频教程"}</DialogTitle>
            <DialogDescription>统一维护视频文件、封面、谱面素材、简介和展示状态，适合直接作为内容工作台使用。</DialogDescription>
          </DialogHeader>
          <div className="max-h-[78vh] overflow-y-auto px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">视频标题</span>
                <Input
                  value={tutorialForm.name}
                  onChange={(event) => setTutorialForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="请输入视频标题"
                  className="h-11 rounded-2xl border-white/80 bg-[#faf8ff]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">所属分类</span>
                <select
                  value={tutorialForm.firstMenu}
                  onChange={(event) =>
                    setTutorialForm((current) => ({
                      ...current,
                      firstMenu: event.target.value,
                      secondMenu: "",
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-white/80 bg-[#faf8ff] px-4 text-sm outline-none"
                >
                  <option value="">请选择</option>
                  {firstMenuOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">子分类</span>
                <select
                  value={tutorialForm.secondMenu}
                  onChange={(event) => setTutorialForm((current) => ({ ...current, secondMenu: event.target.value }))}
                  className="h-11 w-full rounded-2xl border border-white/80 bg-[#faf8ff] px-4 text-sm outline-none"
                >
                  <option value="">请选择</option>
                  {currentSecondOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">所属系列</span>
                <select
                  value={tutorialForm.seriesId}
                  onChange={(event) => setTutorialForm((current) => ({ ...current, seriesId: event.target.value }))}
                  className="h-11 w-full rounded-2xl border border-white/80 bg-[#faf8ff] px-4 text-sm outline-none"
                >
                  <option value="">不归属系列</option>
                  {seriesItems.map((series) => (
                    <option key={series.id} value={String(series.id)}>
                      {series.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">会员属性</span>
                <select
                  value={tutorialForm.vip}
                  onChange={(event) => setTutorialForm((current) => ({ ...current, vip: event.target.value }))}
                  className="h-11 w-full rounded-2xl border border-white/80 bg-[#faf8ff] px-4 text-sm outline-none"
                >
                  <option value="0">免费</option>
                  <option value="1">会员</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">首页展示</span>
                <select
                  value={tutorialForm.showIndex}
                  onChange={(event) => setTutorialForm((current) => ({ ...current, showIndex: event.target.value }))}
                  className="h-11 w-full rounded-2xl border border-white/80 bg-[#faf8ff] px-4 text-sm outline-none"
                >
                  <option value="0">否</option>
                  <option value="1">是</option>
                </select>
              </label>
            </div>

            <div className="mt-5 space-y-5">
              <FileUploadField
                label="视频文件"
                hint="支持上传 mp4 等常见视频格式，保存时会自动读取时长。"
                value={tutorialForm.url}
                accept="video/*,.mp4,.avi,.rmvb"
                token={token}
                kind="video"
                onChange={(value) => setTutorialForm((current) => ({ ...current, url: value.slice(0, 1) }))}
              />

              <FileUploadField
                label="封面图"
                hint="推荐上传横版封面图，便于卡片和列表展示。"
                value={tutorialForm.coverImg}
                accept="image/*"
                token={token}
                kind="image"
                onChange={(value) => setTutorialForm((current) => ({ ...current, coverImg: value.slice(0, 1) }))}
              />

              <FileUploadField
                label="简谱"
                hint="可上传多张简谱图。"
                value={tutorialForm.param1}
                accept="image/*"
                token={token}
                kind="image"
                multiple
                onChange={(value) => setTutorialForm((current) => ({ ...current, param1: value }))}
              />

              <FileUploadField
                label="五线谱"
                hint="可上传多张五线谱图。"
                value={tutorialForm.param2}
                accept="image/*"
                token={token}
                kind="image"
                multiple
                onChange={(value) => setTutorialForm((current) => ({ ...current, param2: value }))}
              />

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">视频简介</span>
                <Textarea
                  value={tutorialForm.param3}
                  onChange={(event) => setTutorialForm((current) => ({ ...current, param3: event.target.value }))}
                  placeholder="请输入视频简介"
                  className="min-h-[140px] rounded-[1.6rem] border-white/80 bg-[#faf8ff] px-4 py-3"
                />
              </label>
            </div>
          </div>
          <DialogFooter className="rounded-b-[2rem] border-white/80 bg-[#faf8ff]">
            <Button variant="outline" className="rounded-full border-white bg-white" onClick={() => setTutorialDialogOpen(false)}>
              取消
            </Button>
            <Button className="rounded-full px-6" onClick={() => void handleSaveTutorial()} disabled={savingTutorial}>
              {savingTutorial ? "保存中..." : editingTutorial ? "保存修改" : "确认新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
