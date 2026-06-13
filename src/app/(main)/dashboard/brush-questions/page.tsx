"use client";

import { useCallback, useMemo, useState } from "react";

import { Columns3, PencilLine, Plus, RefreshCw, Settings2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PanelCard } from "@/components/dashboard/module-kit";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isEmptyRichText, stripHtml } from "@/lib/html-utils";
import { cn } from "@/lib/utils";

type BrushQuestion = {
  id: string;
  stemHtml: string;
  optionAHtml: string;
  optionBHtml: string;
  optionCHtml: string;
  optionDHtml: string;
  analysisHtml: string;
  correctOption: "A" | "B" | "C" | "D";
  belongTo: string;
  questionType: string;
};

const BELONG_OPTIONS = [
  { label: "全部", value: "__all" },
  { label: "乐理", value: "乐理" },
  { label: "听写", value: "听写" },
  { label: "视唱", value: "视唱" },
];

const TYPE_OPTIONS = [
  { label: "全部", value: "__all" },
  { label: "普通试题", value: "普通试题" },
  { label: "阶段测试题", value: "阶段测试题" },
  { label: "模拟试题", value: "模拟试题" },
];

const STEM_SAMPLES = [
  "G大调的七和弦解决正确的是？",
  "下列和弦中，哪个是小三和弦？",
  "升F小调的关系大调是？",
  "下列音程中，几度为大七度？",
  "和声小调的特征音级出现在第几级？",
];

const OPTION_TEXT = ["F大调", "d小调", "E大调", "B大调", "A大调", "g小调", "C大调", "升f小调"];

function toParagraph(text: string) {
  return `<p>${text}</p>`;
}

function buildInitialQuestions(): BrushQuestion[] {
  const total = 876;
  const out: BrushQuestion[] = [];
  for (let i = 0; i < total; i++) {
    const n = i + 1;
    const belongs = ["乐理", "听写", "视唱"][i % 3];
    const qType = ["普通试题", "阶段测试题", "模拟试题"][i % 3];
    const staffRow = i % 6 === 2 || i % 11 === 0;
    const stemText = STEM_SAMPLES[i % STEM_SAMPLES.length];
    const stemHtml = staffRow ? `<p><mark>［五线谱图示］</mark></p>${toParagraph(stemText)}` : toParagraph(stemText);
    const correct = (["A", "B", "C", "D"] as const)[i % 4];
    const mkOpt = (j: number, img: boolean) =>
      img
        ? `<p><em>［谱例］</em></p>${toParagraph(OPTION_TEXT[(i + j) % OPTION_TEXT.length])}`
        : toParagraph(OPTION_TEXT[(i + j) % OPTION_TEXT.length]);

    out.push({
      id: `bq-${n}`,
      stemHtml,
      optionAHtml: mkOpt(0, i % 7 === 1),
      optionBHtml: mkOpt(3, i % 5 === 0),
      optionCHtml: mkOpt(5, false),
      optionDHtml: mkOpt(1, i % 8 === 3),
      analysisHtml: toParagraph("略"),
      correctOption: correct,
      belongTo: belongs,
      questionType: qType,
    });
  }
  return out;
}

function CellPreview({ html, className }: { html: string; className?: string }) {
  const plain = stripHtml(html);
  const short = plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
  return (
    <div className={cn("line-clamp-3 text-sm leading-snug text-foreground", className)} title={plain}>
      {plain ? short : <span className="text-muted-foreground">（空）</span>}
    </div>
  );
}

function PageNumbers({
  current,
  totalPages,
  onChange,
}: {
  current: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, current - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const nums: (number | "ellipsis")[] = [];
  if (start > 1) {
    nums.push(1);
    if (start > 2) nums.push("ellipsis");
  }
  for (let p = start; p <= end; p++) nums.push(p);
  if (end < totalPages) {
    if (end < totalPages - 1) nums.push("ellipsis");
    nums.push(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 min-w-8 px-0"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        ‹
      </Button>
      {nums.map((item, idx) =>
        item === "ellipsis" ? (
          <span key={`e-${idx}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === current ? "default" : "outline"}
            size="sm"
            className={cn("h-8 min-w-8 px-2", item === current && "pointer-events-none")}
            onClick={() => onChange(item)}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 min-w-8 px-0"
        disabled={current >= totalPages}
        onClick={() => onChange(current + 1)}
      >
        ›
      </Button>
    </div>
  );
}

type FormState = {
  stemHtml: string;
  optionAHtml: string;
  optionBHtml: string;
  optionCHtml: string;
  optionDHtml: string;
  analysisHtml: string;
  correctOption: "A" | "B" | "C" | "D";
  belongTo: string;
  questionType: string;
};

const EMPTY_FORM: FormState = {
  stemHtml: "<p></p>",
  optionAHtml: "<p></p>",
  optionBHtml: "<p></p>",
  optionCHtml: "<p></p>",
  optionDHtml: "<p></p>",
  analysisHtml: "<p>略</p>",
  correctOption: "A",
  belongTo: "乐理",
  questionType: "普通试题",
};

function toForm(q: BrushQuestion): FormState {
  return {
    stemHtml: q.stemHtml,
    optionAHtml: q.optionAHtml,
    optionBHtml: q.optionBHtml,
    optionCHtml: q.optionCHtml,
    optionDHtml: q.optionDHtml,
    analysisHtml: q.analysisHtml,
    correctOption: q.correctOption,
    belongTo: q.belongTo,
    questionType: q.questionType,
  };
}

export default function BrushQuestionsPage() {
  const [allRows, setAllRows] = useState<BrushQuestion[]>(() => buildInitialQuestions());
  const [stemKeyword, setStemKeyword] = useState("");
  const [belongFilter, setBelongFilter] = useState("__all");
  const [typeFilter, setTypeFilter] = useState("__all");
  const [appliedStem, setAppliedStem] = useState("");
  const [appliedBelong, setAppliedBelong] = useState("__all");
  const [appliedType, setAppliedType] = useState("__all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpInput, setJumpInput] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrushQuestion | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editorMountKey, setEditorMountKey] = useState(0);

  const filtered = useMemo(() => {
    return allRows.filter((row) => {
      const stemPlain = stripHtml(row.stemHtml);
      const stemOk = !appliedStem.trim() || stemPlain.includes(appliedStem.trim());
      const belongOk = appliedBelong === "__all" || row.belongTo === appliedBelong;
      const typeOk = appliedType === "__all" || row.questionType === appliedType;
      return stemOk && belongOk && typeOk;
    });
  }, [allRows, appliedBelong, appliedStem, appliedType]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const resetFilters = () => {
    setStemKeyword("");
    setBelongFilter("__all");
    setTypeFilter("__all");
    setAppliedStem("");
    setAppliedBelong("__all");
    setAppliedType("__all");
    setPage(1);
  };

  const applySearch = () => {
    setAppliedStem(stemKeyword);
    setAppliedBelong(belongFilter);
    setAppliedType(typeFilter);
    setPage(1);
  };

  const bumpEditors = () => setEditorMountKey((k) => k + 1);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    bumpEditors();
    setDialogOpen(true);
  };

  const openEdit = (row: BrushQuestion) => {
    setEditing(row);
    setForm(toForm(row));
    bumpEditors();
    setDialogOpen(true);
  };

  const saveDialog = () => {
    if (isEmptyRichText(form.stemHtml)) {
      toast.error("请填写题干内容。");
      return;
    }
    const opts: (keyof Pick<FormState, "optionAHtml" | "optionBHtml" | "optionCHtml" | "optionDHtml">)[] = [
      "optionAHtml",
      "optionBHtml",
      "optionCHtml",
      "optionDHtml",
    ];
    for (const key of opts) {
      if (isEmptyRichText(form[key])) {
        toast.error("请完善四个选项的正文。");
        return;
      }
    }

    if (editing) {
      setAllRows((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                stemHtml: form.stemHtml,
                optionAHtml: form.optionAHtml,
                optionBHtml: form.optionBHtml,
                optionCHtml: form.optionCHtml,
                optionDHtml: form.optionDHtml,
                analysisHtml: form.analysisHtml.trim() ? form.analysisHtml : "<p>略</p>",
                correctOption: form.correctOption,
                belongTo: form.belongTo,
                questionType: form.questionType,
              }
            : r,
        ),
      );
      toast.success("题目已更新。");
    } else {
      const row: BrushQuestion = {
        id: `bq-new-${Date.now()}`,
        stemHtml: form.stemHtml,
        optionAHtml: form.optionAHtml,
        optionBHtml: form.optionBHtml,
        optionCHtml: form.optionCHtml,
        optionDHtml: form.optionDHtml,
        analysisHtml: form.analysisHtml.trim() ? form.analysisHtml : "<p>略</p>",
        correctOption: form.correctOption,
        belongTo: form.belongTo,
        questionType: form.questionType,
      };
      setAllRows((prev) => [row, ...prev]);
      toast.success("题目已新增。");
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = useCallback((row: BrushQuestion) => {
    const preview = stripHtml(row.stemHtml).slice(0, 24);
    const ok = window.confirm(`确认删除题目「${preview}${stripHtml(row.stemHtml).length > 24 ? "…" : ""}」吗？`);
    if (!ok) return;
    setAllRows((prev) => prev.filter((r) => r.id !== row.id));
    toast.success("已删除。");
  }, []);

  const handleJump = () => {
    const n = Number.parseInt(jumpInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > totalPages) {
      toast.error(`请输入 1～${totalPages} 之间的页码。`);
      return;
    }
    setPage(n);
    setJumpInput("");
  };

  const refreshList = () => {
    void applySearch();
    toast.success("列表已刷新。");
  };

  const editorKey = `${editorMountKey}-${editing?.id ?? "new"}`;

  return (
    <div className="space-y-4 pb-4">
      <PanelCard className="rounded-xl border border-border/80 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="grid min-w-[180px] flex-1 gap-2">
            <Label className="text-xs font-medium text-muted-foreground">题干</Label>
            <Input
              value={stemKeyword}
              onChange={(e) => setStemKeyword(e.target.value)}
              placeholder="请输入"
              className="h-9"
            />
          </div>
          <div className="grid min-w-[160px] gap-2">
            <Label className="text-xs font-medium text-muted-foreground">题目所属</Label>
            <Select value={belongFilter} onValueChange={setBelongFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                {BELONG_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-[160px] gap-2">
            <Label className="text-xs font-medium text-muted-foreground">题目类型</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <Button type="button" variant="outline" className="h-9 min-w-[72px]" onClick={resetFilters}>
              重置
            </Button>
            <Button type="button" className="h-9 min-w-[72px]" onClick={applySearch}>
              查询
            </Button>
          </div>
        </div>
      </PanelCard>

      <PanelCard className="rounded-xl border border-border/80 p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">刷题管理</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" className="h-9 gap-1 shadow-sm" onClick={openCreate}>
              <Plus className="size-4" />
              新增题目
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              title="刷新"
              onClick={refreshList}
            >
              <RefreshCw className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              title="列设置"
              onClick={() => toast.message("列显示设置可在接入接口后对接。")}
            >
              <Columns3 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              title="更多设置"
              onClick={() => toast.message("更多设置占位。")}
            >
              <Settings2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto px-1 pb-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-14 whitespace-nowrap px-2 text-center text-xs font-medium text-muted-foreground">
                  序号
                </TableHead>
                <TableHead className="min-w-[200px] px-2 text-xs font-medium text-muted-foreground">题干</TableHead>
                <TableHead className="w-14 whitespace-nowrap px-2 text-center text-xs font-medium text-muted-foreground">
                  正确选项
                </TableHead>
                <TableHead className="min-w-[120px] px-2 text-xs font-medium text-muted-foreground">答案 A</TableHead>
                <TableHead className="min-w-[120px] px-2 text-xs font-medium text-muted-foreground">答案 B</TableHead>
                <TableHead className="min-w-[120px] px-2 text-xs font-medium text-muted-foreground">答案 C</TableHead>
                <TableHead className="min-w-[120px] px-2 text-xs font-medium text-muted-foreground">答案 D</TableHead>
                <TableHead className="w-24 whitespace-nowrap px-2 text-xs font-medium text-muted-foreground">
                  答案解析
                </TableHead>
                <TableHead className="min-w-[100px] whitespace-nowrap px-2 text-xs font-medium text-muted-foreground">
                  题目类型
                </TableHead>
                <TableHead className="w-[100px] whitespace-nowrap px-2 text-center text-xs font-medium text-muted-foreground">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row, idx) => (
                <TableRow key={row.id} className="border-b border-border/60 hover:bg-muted/25">
                  <TableCell className="px-2 text-center text-sm text-muted-foreground">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </TableCell>
                  <TableCell className="max-w-[280px] px-2 align-top">
                    <CellPreview html={row.stemHtml} />
                  </TableCell>
                  <TableCell className="px-2 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                      {row.correctOption}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 align-top">
                    <CellPreview html={row.optionAHtml} />
                  </TableCell>
                  <TableCell className="px-2 align-top">
                    <CellPreview html={row.optionBHtml} />
                  </TableCell>
                  <TableCell className="px-2 align-top">
                    <CellPreview html={row.optionCHtml} />
                  </TableCell>
                  <TableCell className="px-2 align-top">
                    <CellPreview html={row.optionDHtml} />
                  </TableCell>
                  <TableCell className="px-2 align-top">
                    <CellPreview html={row.analysisHtml} className="line-clamp-2 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="px-2">
                    <span className="inline-flex rounded-full border border-border/80 bg-muted/30 px-2 py-0.5 text-xs">
                      {row.questionType}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        title="编辑"
                        onClick={() => openEdit(row)}
                      >
                        <PencilLine className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title="删除"
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            共 <span className="font-medium text-foreground">{totalFiltered}</span> 条数据
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <PageNumbers current={currentPage} totalPages={totalPages} onChange={setPage} />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} 条/页
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                跳至
                <Input
                  className="h-8 w-14 px-2 text-center"
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  placeholder="页"
                />
                <span>页</span>
                <Button type="button" variant="secondary" size="sm" className="h-8" onClick={handleJump}>
                  确定
                </Button>
              </span>
            </div>
          </div>
        </div>
      </PanelCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-xl sm:max-w-3xl"
          showCloseButton
        >
          <div className="relative overflow-hidden border-b border-primary/10 bg-gradient-to-br from-primary/[0.08] via-background to-violet-500/[0.06] px-6 pb-5 pt-6">
            <div className="pointer-events-none absolute -right-20 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <DialogHeader className="relative gap-2 text-left">
              <div className="flex items-center gap-2 text-primary">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12">
                  <Sparkles className="size-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary/90">可视化编辑</span>
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {editing ? "编辑题目" : "新增题目"}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                题干与选项支持表格、图片、链接、列表等常见排版；保存为 HTML，便于后端存储与回显。
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div key={editorKey} className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold text-foreground">题干</Label>
                  <span className="text-xs text-muted-foreground">支持图文混排</span>
                </div>
                <RichTextEditor
                  id="brush-stem"
                  value={form.stemHtml}
                  onChange={(html) => setForm((f) => ({ ...f, stemHtml: html }))}
                  placeholder="输入题目题干，可使用工具栏设置格式…"
                  minHeight="160px"
                />
              </section>

              <Separator />

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">题目所属</Label>
                  <Select value={form.belongTo} onValueChange={(v) => setForm((f) => ({ ...f, belongTo: v }))}>
                    <SelectTrigger className="h-10 rounded-xl border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BELONG_OPTIONS.filter((o) => o.value !== "__all").map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">题目类型</Label>
                  <Select value={form.questionType} onValueChange={(v) => setForm((f) => ({ ...f, questionType: v }))}>
                    <SelectTrigger className="h-10 rounded-xl border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.filter((o) => o.value !== "__all").map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium">正确选项</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["A", "B", "C", "D"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, correctOption: k }))}
                        className={cn(
                          "flex h-10 min-w-10 items-center justify-center rounded-xl border text-sm font-semibold transition-all",
                          form.correctOption === k
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border/80 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-background",
                        )}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">选项内容</Label>
                  <span className="text-xs text-muted-foreground">A–D 均需填写</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      { key: "A", field: "optionAHtml" as const, ph: "选项 A 正文" },
                      { key: "B", field: "optionBHtml" as const, ph: "选项 B 正文" },
                      { key: "C", field: "optionCHtml" as const, ph: "选项 C 正文" },
                      { key: "D", field: "optionDHtml" as const, ph: "选项 D 正文" },
                    ] as const
                  ).map(({ key, field, ph }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        答案 {key}
                      </Label>
                      <RichTextEditor
                        id={`brush-opt-${key}`}
                        value={form[field]}
                        onChange={(html) => setForm((f) => ({ ...f, [field]: html }))}
                        placeholder={ph}
                        minHeight="120px"
                      />
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">答案解析</Label>
                <RichTextEditor
                  id="brush-analysis"
                  value={form.analysisHtml}
                  onChange={(html) => setForm((f) => ({ ...f, analysisHtml: html }))}
                  placeholder="解析说明（可选）…"
                  minHeight="100px"
                />
              </section>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border/60 bg-muted/20 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" className="rounded-xl px-6 shadow-sm" onClick={saveDialog}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
