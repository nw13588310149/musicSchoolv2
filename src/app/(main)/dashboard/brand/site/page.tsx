"use client";

import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Columns2,
  Copy,
  Download,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  Palette,
  PanelTop,
  Plus,
  Quote,
  RefreshCcw,
  Rocket,
  Settings2,
  Smartphone,
  Tablet,
  Trash2,
  Type,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { Slider } from "@/components/ui/slider";
import { getMyInfo, updateHomepage, uploadBrandAsset } from "@/lib/api/school";
import {
  cloneBlockWithNewId,
  compileBuilderHtml,
  createBlockTemplate,
  createDefaultBuilderState,
  extractBuilderStateFromHtml,
  normalizeBuilderState,
  type Block,
  type BlockLayout,
  type BlockPadding,
  type BlockType,
  type GlobalConfig,
  type MicrositeBuilderState,
} from "@/lib/microsite/builder";
import { getSchoolName, getSchoolProfile } from "@/lib/user-profile";
import { useAuthStore } from "@/stores/auth-store";

const DRAFT_KEY = "music-road-microsite-builder-draft";

type DeviceMode = "ipad" | "mobile";
type LeftPanelMode = "library" | "layers" | "site";
type UploadTarget =
  | { type: "logo" }
  | { type: "hero-bg"; blockId: string }
  | { type: "gallery"; blockId: string; index: number }
  | { type: "split-media"; blockId: string };

const blockLabels: Record<BlockType, string> = {
  hero: "首屏海报",
  features: "图文网格",
  gallery: "校园相册",
  cta: "转化动作",
  stats: "数据指标",
  text: "文字段落",
  split: "图文分栏",
  quote: "品牌引言",
};

const blockHints: Record<BlockType, string> = {
  hero: "大标题与首屏主视觉",
  features: "亮点卡片和课程优势",
  gallery: "多图展示校园氛围",
  cta: "报名和联系引导",
  stats: "关键数据和成果表达",
  text: "品牌故事和文字叙事",
  split: "左右分栏的重点内容",
  quote: "一句话品牌主张",
};

const blockIcons: Record<BlockType, LucideIcon> = {
  hero: PanelTop,
  features: LayoutGrid,
  gallery: ImageIcon,
  cta: Rocket,
  stats: BarChart3,
  text: Type,
  split: Columns2,
  quote: Quote,
};

const widthOptions: Array<{ value: BlockLayout["width"]; label: string }> = [
  { value: "full", label: "全宽" },
  { value: "wide", label: "偏宽" },
  { value: "half", label: "半宽" },
];

const paddingOptions: Array<{ value: BlockPadding; label: string }> = [
  { value: "compact", label: "紧凑" },
  { value: "regular", label: "标准" },
  { value: "spacious", label: "宽松" },
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        {hint ? <span className="text-[11px] text-gray-400">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 ${
        props.className ?? ""
      }`}
    />
  );
}

function TextareaField(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 ${
        props.className ?? ""
      }`}
    />
  );
}

function PanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_10px_28px_rgba(24,24,32,0.04)]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SegmentedButtons<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className={`grid gap-2 rounded-xl border border-gray-200 bg-white p-1 ${
        options.length === 2 ? "grid-cols-2" : "grid-cols-3"
      }`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            value === option.value ? "bg-purple-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function LibraryCard({
  type,
  onAdd,
}: {
  type: BlockType;
  onAdd: () => void;
}) {
  const Icon = blockIcons[type];

  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left transition hover:border-purple-400 hover:shadow-md"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{blockLabels[type]}</p>
        <p className="text-[11px] text-gray-500">{blockHints[type]}</p>
      </div>
    </button>
  );
}

function BlockLayoutEditor({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (partial: Partial<BlockLayout>) => void;
}) {
  return (
    <PanelSection title="布局控制" description="参考凡科建站的思路，这里先控制模块宽度、留白和高度。">
      <Field label="模块宽度">
        <SegmentedButtons value={block.layout.width} options={widthOptions} onChange={(value) => onUpdate({ width: value })} />
      </Field>

      <Field label="留白密度">
        <SegmentedButtons value={block.layout.padding} options={paddingOptions} onChange={(value) => onUpdate({ padding: value })} />
      </Field>

      <Field label="模块高度" hint={`${block.layout.minHeight}px`}>
        <Slider
          min={180}
          max={920}
          step={10}
          value={[block.layout.minHeight]}
          onValueChange={(value) => onUpdate({ minHeight: value[0] ?? block.layout.minHeight })}
          className="py-3"
        />
      </Field>
    </PanelSection>
  );
}

function widthClassForPreview(width: BlockLayout["width"], device: DeviceMode) {
  if (device === "mobile") return "col-span-12";
  if (width === "full") return "col-span-12";
  if (width === "wide") return "col-span-8";
  return "col-span-6";
}

function paddingClassForPreview(padding: BlockPadding) {
  if (padding === "compact") return "p-5";
  if (padding === "spacious") return "p-8";
  return "p-6";
}

function PreviewBlock({
  block,
  device,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  block: Block;
  device: DeviceMode;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  const wrapperClass = widthClassForPreview(block.layout.width, device);
  const paddingClass = paddingClassForPreview(block.layout.padding);
  const columns = device === "mobile" ? 1 : "columns" in block.data ? block.data.columns : 1;

  return (
    <div ref={setNodeRef} style={style} className={`${wrapperClass} min-w-0 ${isDragging ? "opacity-70" : ""}`}>
      <div
        className={`group relative overflow-hidden rounded-[2rem] border bg-white/88 transition ${
          selected ? "border-purple-500 shadow-[0_18px_50px_rgba(108,83,214,0.18)]" : "border-white/80 hover:border-purple-300"
        }`}
        style={{ minHeight: block.layout.minHeight }}
        onClick={onSelect}
      >
        <div className="absolute left-4 top-4 z-20 rounded-full border border-white/70 bg-white/88 px-3 py-1 text-[11px] font-medium text-gray-700 shadow-sm">
          {blockLabels[block.type]}
        </div>

        <div
          className={`absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full border border-white/70 bg-white/88 p-1 shadow-sm transition ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-purple-50 hover:text-purple-700"
          >
            <GripVertical size={14} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-purple-50 hover:text-purple-700"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {block.type === "hero" ? (
          <div className={`relative flex h-full items-center justify-center overflow-hidden ${paddingClass}`}>
            {block.data.bgImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.data.bgImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 blur-[4px]" />
            ) : null}
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs uppercase tracking-[0.18em] text-gray-600">
                {block.data.eyebrow}
              </span>
              <h2 className="mt-5 text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#241b35]">
                {block.data.headline}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#66627a]">{block.data.subheadline}</p>
              {block.data.buttonText ? (
                <span className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white shadow-[0_18px_42px_rgba(107,33,168,0.22)]">
                  {block.data.buttonText}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {block.type === "features" ? (
          <div className={paddingClass}>
            <div className="mb-5">
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#241b35]">{block.data.sectionTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#66627a]">{block.data.sectionDesc}</p>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {block.data.items.map((item, index) => (
                <div key={`${block.id}-feature-preview-${index}`} className="rounded-[1.5rem] border border-white/80 bg-white/82 p-5 shadow-[0_10px_28px_rgba(24,24,32,0.04)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-xl">{item.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-[#241b35]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#66627a]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {block.type === "stats" ? (
          <div className={paddingClass}>
            <div className="mb-5">
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#241b35]">{block.data.sectionTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#66627a]">{block.data.sectionDesc}</p>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {block.data.items.map((item, index) => (
                <div key={`${block.id}-stat-preview-${index}`} className="rounded-[1.5rem] border border-white/80 bg-white/82 p-5 shadow-[0_10px_28px_rgba(24,24,32,0.04)]">
                  <strong className="block text-4xl font-semibold tracking-[-0.06em] text-[#241b35]">{item.value}</strong>
                  <span className="mt-3 block text-sm text-[#66627a]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {block.type === "gallery" ? (
          <div className={paddingClass}>
            <div className="mb-5">
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#241b35]">{block.data.sectionTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#66627a]">{block.data.sectionDesc}</p>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {block.data.images.map((imageUrl, index) => (
                <div key={`${block.id}-gallery-preview-${index}`} className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/82 shadow-[0_10px_28px_rgba(24,24,32,0.04)]">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={`Gallery ${index + 1}`} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gray-50 text-sm text-gray-400">等待上传图片</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {block.type === "text" ? (
          <div className={`${paddingClass} flex h-full items-center ${block.data.align === "center" ? "text-center" : "text-left"}`}>
            <div className={`w-full ${block.data.align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
              <span className="inline-flex rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs uppercase tracking-[0.18em] text-gray-600">
                {block.data.eyebrow}
              </span>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#241b35]">{block.data.title}</h2>
              <p className="mt-4 text-base leading-8 text-[#66627a]">{block.data.body}</p>
            </div>
          </div>
        ) : null}

        {block.type === "split" ? (
          <div className={`${paddingClass} grid h-full gap-5 ${device === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
            {block.data.mediaPosition === "left" && device !== "mobile" ? (
              <div className="overflow-hidden rounded-[1.7rem] bg-[#f1ebff]">
                {block.data.mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={block.data.mediaUrl} alt="" className="h-full min-h-[260px] w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center text-sm text-gray-400">等待上传图片</div>
                )}
              </div>
            ) : null}

            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs uppercase tracking-[0.18em] text-gray-600">
                {block.data.eyebrow}
              </span>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#241b35]">{block.data.title}</h2>
              <p className="mt-4 text-base leading-8 text-[#66627a]">{block.data.body}</p>
              {block.data.buttonText ? (
                <span className="mt-6 inline-flex w-fit rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white shadow-[0_18px_42px_rgba(107,33,168,0.22)]">
                  {block.data.buttonText}
                </span>
              ) : null}
            </div>

            {block.data.mediaPosition === "right" || device === "mobile" ? (
              <div className="overflow-hidden rounded-[1.7rem] bg-[#f1ebff]">
                {block.data.mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={block.data.mediaUrl} alt="" className="h-full min-h-[260px] w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center text-sm text-gray-400">等待上传图片</div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {block.type === "quote" ? (
          <div className={`${paddingClass} flex h-full items-center justify-center text-center`}>
            <div className="mx-auto max-w-2xl">
              <blockquote className="font-serif text-4xl leading-[1.2] tracking-[-0.05em] text-[#241b35]">
                “{block.data.quote}”
              </blockquote>
              <p className="mt-5 text-sm text-[#66627a]">
                {block.data.author} / {block.data.role}
              </p>
            </div>
          </div>
        ) : null}

        {block.type === "cta" ? (
          <div className={`${paddingClass} flex h-full items-center justify-center text-center`}>
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs uppercase tracking-[0.18em] text-gray-600">
                Contact
              </span>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#241b35]">{block.data.title}</h2>
              <p className="mt-4 text-base leading-8 text-[#66627a]">{block.data.body}</p>
              {block.data.buttonText ? (
                <span className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white shadow-[0_18px_42px_rgba(107,33,168,0.22)]">
                  {block.data.buttonText}
                </span>
              ) : null}
              <p className="mt-4 text-sm text-[#66627a]">{block.data.contactInfo}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CampusMicrositeBuilderPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const school = useMemo(() => getSchoolProfile(user), [user]);
  const schoolName = getSchoolName(user);
  const schoolLogo = typeof school.logo === "string" ? school.logo : "";

  const [device, setDevice] = useState<DeviceMode>("ipad");
  const [leftMode, setLeftMode] = useState<LeftPanelMode>("library");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(88);
  const [config, setConfig] = useState<GlobalConfig>(() => createDefaultBuilderState().config);
  const [blocks, setBlocks] = useState<Block[]>(() => createDefaultBuilderState().blocks);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const viewportWidth = device === "ipad" ? 1024 : 390;
  const viewportHeight = device === "ipad" ? 768 : 844;

  const builderState = useMemo<MicrositeBuilderState>(
    () => ({
      version: 3,
      config,
      blocks,
    }),
    [blocks, config],
  );
  const compiledHTML = useMemo(() => compileBuilderHtml(config, blocks), [blocks, config]);
  const currentSnapshot = useMemo(() => JSON.stringify(builderState), [builderState]);
  const selectedBlock = useMemo(() => blocks.find((block) => block.id === selectedBlockId) ?? null, [blocks, selectedBlockId]);
  const isDirty = savedSnapshot !== "" && currentSnapshot !== savedSnapshot;

  const updateConfigField = <K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateBlock = (blockId: string, updater: (block: Block) => Block) => {
    setBlocks((prev) => prev.map((block) => (block.id === blockId ? updater(block) : block)));
  };

  const updateBlockLayout = (blockId: string, partial: Partial<BlockLayout>) => {
    updateBlock(blockId, (block) => ({
      ...block,
      layout: {
        ...block.layout,
        ...partial,
      },
    }));
  };

  const loadMicrositeState = async (preferDraft = true) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await getMyInfo(token);
      setUser(profile);

      const nextSchool = getSchoolProfile(profile);
      const seed = {
        schoolName: getSchoolName(profile),
        logoUrl: typeof nextSchool.logo === "string" ? nextSchool.logo : "",
      };
      const defaults = createDefaultBuilderState(seed);
      const homepageHtml = typeof nextSchool.homepage === "string" ? nextSchool.homepage : "";
      const remoteState = homepageHtml ? extractBuilderStateFromHtml(homepageHtml) : null;

      let localDraft: MicrositeBuilderState | null = null;
      if (preferDraft && typeof window !== "undefined") {
        const rawDraft = window.localStorage.getItem(DRAFT_KEY);
        if (rawDraft) {
          try {
            localDraft = JSON.parse(rawDraft) as MicrositeBuilderState;
          } catch {
            localDraft = null;
          }
        }
      }

      const nextState = remoteState
        ? normalizeBuilderState(remoteState, seed)
        : localDraft
          ? normalizeBuilderState(localDraft, seed)
          : defaults;

      setConfig(nextState.config);
      setBlocks(nextState.blocks);
      setSelectedBlockId(nextState.blocks[0]?.id ?? null);
      setSavedSnapshot(JSON.stringify(nextState));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "校园微官网加载失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMicrositeState(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    if (currentSnapshot === savedSnapshot) {
      window.localStorage.removeItem(DRAFT_KEY);
      return;
    }
    window.localStorage.setItem(DRAFT_KEY, currentSnapshot);
  }, [currentSnapshot, loading, savedSnapshot]);

  const addBlock = (type: BlockType) => {
    const nextBlock = createBlockTemplate(type);
    setBlocks((prev) => [...prev, nextBlock]);
    setSelectedBlockId(nextBlock.id);
    setLeftMode("layers");
    toast.success(`${blockLabels[type]} 已添加。`);
  };

  const duplicateBlock = (blockId: string) => {
    setBlocks((prev) => {
      const targetIndex = prev.findIndex((block) => block.id === blockId);
      if (targetIndex < 0) return prev;
      const clone = cloneBlockWithNewId(prev[targetIndex]);
      const next = [...prev];
      next.splice(targetIndex + 1, 0, clone);
      setSelectedBlockId(clone.id);
      return next;
    });
    toast.success("模块已复制。");
  };

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) {
        toast.error("至少保留一个模块。");
        return prev;
      }
      const next = prev.filter((block) => block.id !== blockId);
      if (selectedBlockId === blockId) {
        setSelectedBlockId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((prev) => {
      const oldIndex = prev.findIndex((block) => block.id === active.id);
      const newIndex = prev.findIndex((block) => block.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const openUpload = (target: UploadTarget) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token || !uploadTarget) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片格式的素材文件。");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadBrandAsset(file, token);

      if (uploadTarget.type === "logo") {
        updateConfigField("logoUrl", imageUrl);
      }

      if (uploadTarget.type === "hero-bg") {
        updateBlock(uploadTarget.blockId, (block) =>
          block.type === "hero" ? { ...block, data: { ...block.data, bgImageUrl: imageUrl } } : block,
        );
      }

      if (uploadTarget.type === "gallery") {
        updateBlock(uploadTarget.blockId, (block) => {
          if (block.type !== "gallery") return block;
          const nextImages = [...block.data.images];
          nextImages[uploadTarget.index] = imageUrl;
          return {
            ...block,
            data: {
              ...block.data,
              images: nextImages,
            },
          };
        });
      }

      if (uploadTarget.type === "split-media") {
        updateBlock(uploadTarget.blockId, (block) =>
          block.type === "split" ? { ...block, data: { ...block.data, mediaUrl: imageUrl } } : block,
        );
      }

      toast.success("图片素材已更新。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "图片上传失败，请稍后重试。");
    } finally {
      setUploading(false);
      setUploadTarget(null);
      event.target.value = "";
    }
  };

  const handlePublish = async () => {
    if (!token) return;

    try {
      setPublishing(true);
      await updateHomepage(
        {
          htmlContent: compiledHTML,
          config: currentSnapshot,
        },
        token,
      );
      setSavedSnapshot(currentSnapshot);
      setPublishedAt(new Date().toISOString());
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
      }
      toast.success("校园微官网已发布。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发布失败，请稍后重试。");
    } finally {
      setPublishing(false);
    }
  };

  const handleDownload = () => {
    const safeName = (config.siteTitle || "campus-microsite").replace(/[\\/:*?"<>|]+/g, "-");
    const blob = new Blob([compiledHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("HTML 源码已导出。");
  };

  const handleReset = () => {
    const defaults = createDefaultBuilderState({
      schoolName,
      logoUrl: schoolLogo,
    });
    setConfig(defaults.config);
    setBlocks(defaults.blocks);
    setSelectedBlockId(defaults.blocks[0]?.id ?? null);
    toast.success("已恢复默认官网骨架。");
  };

  const publishedLabel = useMemo(() => {
    if (!publishedAt) return "未发布";
    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(publishedAt));
  }, [publishedAt]);

  const renderInspector = () => {
    if (!selectedBlock) {
      return (
        <PanelSection title="属性面板" description="先在中间画布里选中一个模块，再继续编辑内容和样式。">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            当前没有选中模块
          </div>
        </PanelSection>
      );
    }

    const shared = <BlockLayoutEditor block={selectedBlock} onUpdate={(partial) => updateBlockLayout(selectedBlock.id, partial)} />;

    if (selectedBlock.type === "hero") {
      return (
        <div className="space-y-4">
          {shared}
          <PanelSection title="内容设置" description="首屏通常承载品牌第一视觉，建议文案短而有力。">
            <Field label="眉题">
              <InputField
                value={selectedBlock.data.eyebrow}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "hero" ? { ...block, data: { ...block.data, eyebrow: event.target.value } } : block))}
              />
            </Field>
            <Field label="主标题">
              <InputField
                value={selectedBlock.data.headline}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "hero" ? { ...block, data: { ...block.data, headline: event.target.value } } : block))}
              />
            </Field>
            <Field label="副标题">
              <TextareaField
                rows={4}
                value={selectedBlock.data.subheadline}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "hero" ? { ...block, data: { ...block.data, subheadline: event.target.value } } : block))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="按钮文案">
                <InputField
                  value={selectedBlock.data.buttonText}
                  onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "hero" ? { ...block, data: { ...block.data, buttonText: event.target.value } } : block))}
                />
              </Field>
              <Field label="按钮链接">
                <InputField
                  value={selectedBlock.data.buttonHref}
                  onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "hero" ? { ...block, data: { ...block.data, buttonHref: event.target.value } } : block))}
                />
              </Field>
            </div>
            <Field label="背景图地址" hint="支持粘贴 URL 或直接上传">
              <InputField
                value={selectedBlock.data.bgImageUrl}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "hero" ? { ...block, data: { ...block.data, bgImageUrl: event.target.value } } : block))}
              />
            </Field>
            <button
              type="button"
              onClick={() => openUpload({ type: "hero-bg", blockId: selectedBlock.id })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
            >
              <UploadCloud size={15} />
              {uploading && uploadTarget?.type === "hero-bg" && uploadTarget.blockId === selectedBlock.id ? "上传中..." : "上传背景图"}
            </button>
          </PanelSection>
        </div>
      );
    }

    if (selectedBlock.type === "features") {
      return (
        <div className="space-y-4">
          {shared}
          <PanelSection title="内容设置" description="适合放课程亮点、教学优势和品牌卖点。">
            <Field label="模块标题">
              <InputField
                value={selectedBlock.data.sectionTitle}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "features" ? { ...block, data: { ...block.data, sectionTitle: event.target.value } } : block))}
              />
            </Field>
            <Field label="模块说明">
              <TextareaField
                rows={3}
                value={selectedBlock.data.sectionDesc}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "features" ? { ...block, data: { ...block.data, sectionDesc: event.target.value } } : block))}
              />
            </Field>
            <Field label="列数" hint={`${selectedBlock.data.columns} 列`}>
              <Slider
                min={2}
                max={4}
                step={1}
                value={[selectedBlock.data.columns]}
                onValueChange={(value) => updateBlock(selectedBlock.id, (block) => (block.type === "features" ? { ...block, data: { ...block.data, columns: value[0] ?? block.data.columns } } : block))}
                className="py-3"
              />
            </Field>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">亮点卡片</span>
                <button
                  type="button"
                  onClick={() => updateBlock(selectedBlock.id, (block) => (block.type === "features" ? { ...block, data: { ...block.data, items: [...block.data.items, { icon: "✨", title: "新的亮点", desc: "补充描述内容。" }] } } : block))}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
                >
                  <Plus size={13} />
                  新增
                </button>
              </div>
              {selectedBlock.data.items.map((item, index) => (
                <div key={`${selectedBlock.id}-feature-${index}`} className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <div className="grid grid-cols-[56px_1fr] gap-3">
                    <Field label="图标">
                      <InputField
                        value={item.icon}
                        onChange={(event) =>
                          updateBlock(selectedBlock.id, (block) => {
                            if (block.type !== "features") return block;
                            const nextItems = [...block.data.items];
                            nextItems[index] = { ...nextItems[index], icon: event.target.value };
                            return { ...block, data: { ...block.data, items: nextItems } };
                          })
                        }
                        className="text-center"
                      />
                    </Field>
                    <Field label="标题">
                      <InputField
                        value={item.title}
                        onChange={(event) =>
                          updateBlock(selectedBlock.id, (block) => {
                            if (block.type !== "features") return block;
                            const nextItems = [...block.data.items];
                            nextItems[index] = { ...nextItems[index], title: event.target.value };
                            return { ...block, data: { ...block.data, items: nextItems } };
                          })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="描述">
                    <TextareaField
                      rows={3}
                      value={item.desc}
                      onChange={(event) =>
                        updateBlock(selectedBlock.id, (block) => {
                          if (block.type !== "features") return block;
                          const nextItems = [...block.data.items];
                          nextItems[index] = { ...nextItems[index], desc: event.target.value };
                          return { ...block, data: { ...block.data, items: nextItems } };
                        })
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(selectedBlock.id, (block) => {
                        if (block.type !== "features") return block;
                        if (block.data.items.length <= 1) {
                          toast.error("至少保留一张卡片。");
                          return block;
                        }
                        return { ...block, data: { ...block.data, items: block.data.items.filter((_, itemIndex) => itemIndex !== index) } };
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                    删除
                  </button>
                </div>
              ))}
            </div>
          </PanelSection>
        </div>
      );
    }

    if (selectedBlock.type === "stats") {
      return (
        <div className="space-y-4">
          {shared}
          <PanelSection title="数据指标" description="适合展示课程数量、活动场次、师资规模等内容。">
            <Field label="模块标题">
              <InputField
                value={selectedBlock.data.sectionTitle}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "stats" ? { ...block, data: { ...block.data, sectionTitle: event.target.value } } : block))}
              />
            </Field>
            <Field label="模块说明">
              <TextareaField
                rows={3}
                value={selectedBlock.data.sectionDesc}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "stats" ? { ...block, data: { ...block.data, sectionDesc: event.target.value } } : block))}
              />
            </Field>
            <Field label="列数" hint={`${selectedBlock.data.columns} 列`}>
              <Slider
                min={2}
                max={4}
                step={1}
                value={[selectedBlock.data.columns]}
                onValueChange={(value) => updateBlock(selectedBlock.id, (block) => (block.type === "stats" ? { ...block, data: { ...block.data, columns: value[0] ?? block.data.columns } } : block))}
                className="py-3"
              />
            </Field>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">指标列表</span>
                <button
                  type="button"
                  onClick={() => updateBlock(selectedBlock.id, (block) => (block.type === "stats" ? { ...block, data: { ...block.data, items: [...block.data.items, { value: "00", label: "新的指标" }] } } : block))}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
                >
                  <Plus size={13} />
                  新增
                </button>
              </div>
              {selectedBlock.data.items.map((item, index) => (
                <div key={`${selectedBlock.id}-stat-${index}`} className="grid grid-cols-[90px_1fr_auto] gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <Field label="数值">
                    <InputField
                      value={item.value}
                      onChange={(event) =>
                        updateBlock(selectedBlock.id, (block) => {
                          if (block.type !== "stats") return block;
                          const nextItems = [...block.data.items];
                          nextItems[index] = { ...nextItems[index], value: event.target.value };
                          return { ...block, data: { ...block.data, items: nextItems } };
                        })
                      }
                    />
                  </Field>
                  <Field label="标签">
                    <InputField
                      value={item.label}
                      onChange={(event) =>
                        updateBlock(selectedBlock.id, (block) => {
                          if (block.type !== "stats") return block;
                          const nextItems = [...block.data.items];
                          nextItems[index] = { ...nextItems[index], label: event.target.value };
                          return { ...block, data: { ...block.data, items: nextItems } };
                        })
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(selectedBlock.id, (block) => {
                        if (block.type !== "stats") return block;
                        if (block.data.items.length <= 1) {
                          toast.error("至少保留一项数据。");
                          return block;
                        }
                        return { ...block, data: { ...block.data, items: block.data.items.filter((_, itemIndex) => itemIndex !== index) } };
                      })
                    }
                    className="mt-6 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </PanelSection>
        </div>
      );
    }

    if (selectedBlock.type === "gallery") {
      return (
        <div className="space-y-4">
          {shared}
          <PanelSection title="图片模块" description="更接近凡科建站的图片区块思路，可调列数和逐张上传。">
            <Field label="模块标题">
              <InputField
                value={selectedBlock.data.sectionTitle}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "gallery" ? { ...block, data: { ...block.data, sectionTitle: event.target.value } } : block))}
              />
            </Field>
            <Field label="模块说明">
              <TextareaField
                rows={3}
                value={selectedBlock.data.sectionDesc}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "gallery" ? { ...block, data: { ...block.data, sectionDesc: event.target.value } } : block))}
              />
            </Field>
            <Field label="列数" hint={`${selectedBlock.data.columns} 列`}>
              <Slider
                min={2}
                max={4}
                step={1}
                value={[selectedBlock.data.columns]}
                onValueChange={(value) => updateBlock(selectedBlock.id, (block) => (block.type === "gallery" ? { ...block, data: { ...block.data, columns: value[0] ?? block.data.columns } } : block))}
                className="py-3"
              />
            </Field>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">图片列表</span>
              <button
                type="button"
                onClick={() => updateBlock(selectedBlock.id, (block) => (block.type === "gallery" ? { ...block, data: { ...block.data, images: [...block.data.images, ""] } } : block))}
                className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
              >
                <Plus size={13} />
                新增图片
              </button>
            </div>
            <div className="space-y-3">
              {selectedBlock.data.images.map((imageUrl, index) => (
                <div key={`${selectedBlock.id}-gallery-${index}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <div className="flex h-32 items-center justify-center bg-white">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">等待上传图片</span>
                    )}
                  </div>
                  <div className="space-y-3 p-3">
                    <Field label={`图片 ${index + 1} 地址`} hint="支持粘贴 URL">
                      <InputField
                        value={imageUrl}
                        onChange={(event) =>
                          updateBlock(selectedBlock.id, (block) => {
                            if (block.type !== "gallery") return block;
                            const nextImages = [...block.data.images];
                            nextImages[index] = event.target.value;
                            return { ...block, data: { ...block.data, images: nextImages } };
                          })
                        }
                      />
                    </Field>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openUpload({ type: "gallery", blockId: selectedBlock.id, index })}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                      >
                        <UploadCloud size={15} />
                        {uploading && uploadTarget?.type === "gallery" && uploadTarget.blockId === selectedBlock.id && uploadTarget.index === index ? "上传中..." : "上传图片"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateBlock(selectedBlock.id, (block) => {
                            if (block.type !== "gallery") return block;
                            if (block.data.images.length <= 1) {
                              toast.error("至少保留一张图片位。");
                              return block;
                            }
                            return { ...block, data: { ...block.data, images: block.data.images.filter((_, imageIndex) => imageIndex !== index) } };
                          })
                        }
                        className="rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PanelSection>
        </div>
      );
    }

    if (selectedBlock.type === "text") {
      return (
        <div className="space-y-4">
          {shared}
          <PanelSection title="文字内容" description="适合做品牌故事、课程介绍、学校简介等长文段落。">
            <Field label="眉题">
              <InputField
                value={selectedBlock.data.eyebrow}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "text" ? { ...block, data: { ...block.data, eyebrow: event.target.value } } : block))}
              />
            </Field>
            <Field label="标题">
              <InputField
                value={selectedBlock.data.title}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "text" ? { ...block, data: { ...block.data, title: event.target.value } } : block))}
              />
            </Field>
            <Field label="正文">
              <TextareaField
                rows={6}
                value={selectedBlock.data.body}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "text" ? { ...block, data: { ...block.data, body: event.target.value } } : block))}
              />
            </Field>
            <Field label="文字对齐">
              <SegmentedButtons
                value={selectedBlock.data.align}
                options={[
                  { value: "left", label: "左对齐" },
                  { value: "center", label: "居中" },
                ]}
                onChange={(value) => updateBlock(selectedBlock.id, (block) => (block.type === "text" ? { ...block, data: { ...block.data, align: value } } : block))}
              />
            </Field>
          </PanelSection>
        </div>
      );
    }

    if (selectedBlock.type === "split") {
      return (
        <div className="space-y-4">
          {shared}
          <PanelSection title="图文分栏" description="这一类最接近凡科常见的图文模块，可以左右切换，也支持上传主图。">
            <Field label="眉题">
              <InputField
                value={selectedBlock.data.eyebrow}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "split" ? { ...block, data: { ...block.data, eyebrow: event.target.value } } : block))}
              />
            </Field>
            <Field label="标题">
              <InputField
                value={selectedBlock.data.title}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "split" ? { ...block, data: { ...block.data, title: event.target.value } } : block))}
              />
            </Field>
            <Field label="正文">
              <TextareaField
                rows={5}
                value={selectedBlock.data.body}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "split" ? { ...block, data: { ...block.data, body: event.target.value } } : block))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="按钮文案">
                <InputField
                  value={selectedBlock.data.buttonText}
                  onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "split" ? { ...block, data: { ...block.data, buttonText: event.target.value } } : block))}
                />
              </Field>
              <Field label="按钮链接">
                <InputField
                  value={selectedBlock.data.buttonHref}
                  onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "split" ? { ...block, data: { ...block.data, buttonHref: event.target.value } } : block))}
                />
              </Field>
            </div>
            <Field label="图文方向">
              <SegmentedButtons
                value={selectedBlock.data.mediaPosition}
                options={[
                  { value: "left", label: "图片在左" },
                  { value: "right", label: "图片在右" },
                ]}
                onChange={(value) => updateBlock(selectedBlock.id, (block) => (block.type === "split" ? { ...block, data: { ...block.data, mediaPosition: value } } : block))}
              />
            </Field>
            <Field label="图片地址" hint="支持粘贴 URL 或直接上传">
              <InputField
                value={selectedBlock.data.mediaUrl}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "split" ? { ...block, data: { ...block.data, mediaUrl: event.target.value } } : block))}
              />
            </Field>
            <button
              type="button"
              onClick={() => openUpload({ type: "split-media", blockId: selectedBlock.id })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
            >
              <UploadCloud size={15} />
              {uploading && uploadTarget?.type === "split-media" && uploadTarget.blockId === selectedBlock.id ? "上传中..." : "上传图像素材"}
            </button>
          </PanelSection>
        </div>
      );
    }

    if (selectedBlock.type === "quote") {
      return (
        <div className="space-y-4">
          {shared}
          <PanelSection title="品牌引言" description="适合强调一句品牌主张，或放一段校长寄语、课程理念。">
            <Field label="引言内容">
              <TextareaField
                rows={5}
                value={selectedBlock.data.quote}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "quote" ? { ...block, data: { ...block.data, quote: event.target.value } } : block))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="作者">
                <InputField
                  value={selectedBlock.data.author}
                  onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "quote" ? { ...block, data: { ...block.data, author: event.target.value } } : block))}
                />
              </Field>
              <Field label="角色">
                <InputField
                  value={selectedBlock.data.role}
                  onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "quote" ? { ...block, data: { ...block.data, role: event.target.value } } : block))}
                />
              </Field>
            </div>
          </PanelSection>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {shared}
        <PanelSection title="CTA 内容" description="一般放在页面尾部，用来承接报名、咨询和联系方式。">
          <Field label="标题">
            <InputField
              value={selectedBlock.data.title}
              onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "cta" ? { ...block, data: { ...block.data, title: event.target.value } } : block))}
            />
          </Field>
          <Field label="正文">
            <TextareaField
              rows={4}
              value={selectedBlock.data.body}
              onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "cta" ? { ...block, data: { ...block.data, body: event.target.value } } : block))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="按钮文案">
              <InputField
                value={selectedBlock.data.buttonText}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "cta" ? { ...block, data: { ...block.data, buttonText: event.target.value } } : block))}
              />
            </Field>
            <Field label="按钮链接">
              <InputField
                value={selectedBlock.data.buttonHref}
                onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "cta" ? { ...block, data: { ...block.data, buttonHref: event.target.value } } : block))}
              />
            </Field>
          </div>
          <Field label="联系方式">
            <InputField
              value={selectedBlock.data.contactInfo}
              onChange={(event) => updateBlock(selectedBlock.id, (block) => (block.type === "cta" ? { ...block, data: { ...block.data, contactInfo: event.target.value } } : block))}
            />
          </Field>
        </PanelSection>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[#eef1f5] shadow-[0_24px_80px_rgba(82,56,166,0.08)]">
      <div className="flex h-[calc(100vh-7.5rem)] min-h-[800px] flex-col">
        <header className="z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-900 text-white shadow-lg shadow-purple-900/15">
              <LayoutGrid size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-gray-900">校园微官网搭建器 2.0</h1>
              <p className="truncate text-[11px] text-gray-500">
                参考凡科建站的工作流 / 当前学校：{schoolName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadMicrositeState(false)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw size={14} />
              重新加载
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              <Settings2 size={14} />
              恢复默认
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              <Download size={14} />
              导出 HTML
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || loading}
              className="inline-flex items-center gap-2 rounded-full bg-purple-700 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-purple-700/20 transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Rocket size={14} />
              {publishing ? "发布中..." : "一键发布"}
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="z-10 flex w-[320px] shrink-0 flex-col border-r border-gray-200 bg-white">
            <div className="border-b border-gray-100 p-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "library", label: "模块库", icon: Plus },
                  { value: "layers", label: "结构", icon: LayoutGrid },
                  { value: "site", label: "站点", icon: Palette },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setLeftMode(item.value as LeftPanelMode)}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition ${
                      leftMode === item.value ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              {leftMode === "library" ? (
                <div className="space-y-4">
                  <PanelSection title="基础组件" description="像凡科一样先从模块库里搭建页面骨架。">
                    <div className="grid gap-3">
                      {(["hero", "features", "gallery", "stats", "text", "split", "quote", "cta"] as BlockType[]).map((type) => (
                        <LibraryCard key={type} type={type} onAdd={() => addBlock(type)} />
                      ))}
                    </div>
                  </PanelSection>
                </div>
              ) : null}

              {leftMode === "layers" ? (
                <div className="space-y-4">
                  <PanelSection title="页面结构" description="中间画布支持拖拽排序，这里用于快速定位和切换选中模块。">
                    <div className="space-y-2">
                      {blocks.map((block, index) => {
                        const Icon = blockIcons[block.type];
                        return (
                          <button
                            key={block.id}
                            type="button"
                            onClick={() => setSelectedBlockId(block.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                              selectedBlockId === block.id ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs font-semibold text-gray-500 shadow-sm">
                              {index + 1}
                            </span>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-purple-700 shadow-sm">
                              <Icon size={15} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">{blockLabels[block.type]}</p>
                              <p className="truncate text-[11px] text-gray-500">
                                {block.layout.width} / {block.layout.minHeight}px
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </PanelSection>
                </div>
              ) : null}

              {leftMode === "site" ? (
                <div className="space-y-4">
                  <PanelSection title="站点设置" description="用于控制顶部品牌区、主色和页面背景。">
                    <Field label="官网标题">
                      <InputField value={config.siteTitle} onChange={(event) => updateConfigField("siteTitle", event.target.value)} />
                    </Field>
                    <Field label="官网副标题">
                      <InputField value={config.siteSubtitle} onChange={(event) => updateConfigField("siteSubtitle", event.target.value)} />
                    </Field>
                    <Field label="联系方式">
                      <InputField value={config.contactInfo} onChange={(event) => updateConfigField("contactInfo", event.target.value)} />
                    </Field>
                    {[
                      { key: "themeColor", label: "主品牌色" },
                      { key: "accentColor", label: "辅助底色" },
                      { key: "backgroundColor", label: "页面背景" },
                    ].map((item) => (
                      <Field key={item.key} label={item.label}>
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5">
                          <input
                            type="color"
                            value={config[item.key as keyof GlobalConfig] as string}
                            onChange={(event) => updateConfigField(item.key as keyof GlobalConfig, event.target.value as never)}
                            className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                          />
                          <InputField
                            value={config[item.key as keyof GlobalConfig] as string}
                            onChange={(event) => updateConfigField(item.key as keyof GlobalConfig, event.target.value as never)}
                            className="border-0 bg-transparent px-2 py-1 font-mono uppercase focus:ring-0"
                          />
                        </div>
                      </Field>
                    ))}
                    <Field label="Logo 地址" hint="也可直接上传">
                      <InputField value={config.logoUrl} onChange={(event) => updateConfigField("logoUrl", event.target.value)} />
                    </Field>
                    <button
                      type="button"
                      onClick={() => openUpload({ type: "logo" })}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
                    >
                      <UploadCloud size={15} />
                      {uploading && uploadTarget?.type === "logo" ? "上传中..." : "上传 Logo"}
                    </button>
                  </PanelSection>
                </div>
              ) : null}
            </div>
          </aside>

          <section className="pattern-grid-lg relative flex min-w-0 flex-1 flex-col bg-[#edf0f4]">
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  .pattern-grid-lg {
                    background-image:
                      linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                  }
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                  }
                `,
              }}
            />

            <div className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/70 px-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-sm">
                  {loading ? "正在载入官网配置..." : isDirty ? "当前有未发布改动" : "当前内容已同步"}
                </div>
                <div className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-sm">
                  发布状态：{publishedLabel}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setDevice("ipad")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                      device === "ipad" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Tablet size={15} />
                    Pad
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice("mobile")}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                      device === "mobile" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Smartphone size={15} />
                    Mobile
                  </button>
                </div>

                <div className="flex w-[180px] items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
                  <span className="text-xs text-gray-500">缩放</span>
                  <Slider min={60} max={100} step={2} value={[canvasZoom]} onValueChange={(value) => setCanvasZoom(value[0] ?? 88)} />
                  <span className="w-10 text-right text-xs font-medium text-gray-700">{canvasZoom}%</span>
                </div>
              </div>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-auto px-10 py-8">
              <div className="mx-auto" style={{ width: viewportWidth * (canvasZoom / 100) }}>
                <div
                  className="origin-top-left rounded-[2.5rem] border border-white/80 bg-white shadow-[0_30px_80px_rgba(24,24,32,0.12)]"
                  style={{
                    width: viewportWidth,
                    minHeight: viewportHeight,
                    transform: `scale(${canvasZoom / 100})`,
                  }}
                >
                  <div className="border-b border-gray-100 px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3ecff]">
                          {config.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={config.logoUrl} alt="Logo" className="max-h-7 max-w-7 object-contain" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-purple-600" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-[#241b35]">{config.siteTitle}</h2>
                          <p className="mt-1 text-xs text-[#66627a]">{config.siteSubtitle}</p>
                        </div>
                      </div>

                      <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs text-gray-500 shadow-sm">
                        {config.contactInfo}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[linear-gradient(180deg,#fdfcff_0%,#f7f6fb_100%)] p-5">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={blocks.map((block) => block.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-12 gap-5">
                          {blocks.map((block) => (
                            <PreviewBlock
                              key={block.id}
                              block={block}
                              device={device}
                              selected={selectedBlockId === block.id}
                              onSelect={() => setSelectedBlockId(block.id)}
                              onDuplicate={() => duplicateBlock(block.id)}
                              onDelete={() => removeBlock(block.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="custom-scrollbar z-10 w-[380px] shrink-0 overflow-y-auto border-l border-gray-200 bg-[#f7f8fb] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">属性面板</h3>
                <p className="mt-1 text-xs text-gray-500">像建站器一样，选中中间画布模块后在这里编辑。</p>
              </div>
              {selectedBlock ? (
                <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 shadow-sm">
                  {blockLabels[selectedBlock.type]}
                </div>
              ) : null}
            </div>
            {renderInspector()}
          </aside>
        </main>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}
