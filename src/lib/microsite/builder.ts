export type BlockType = "hero" | "features" | "gallery" | "cta" | "stats" | "text" | "split" | "quote";
export type BlockWidth = "full" | "wide" | "half";
export type BlockPadding = "compact" | "regular" | "spacious";

export interface GlobalConfig {
  siteTitle: string;
  siteSubtitle: string;
  themeColor: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl: string;
  contactInfo: string;
}

export interface BlockLayout {
  width: BlockWidth;
  minHeight: number;
  padding: BlockPadding;
}

interface BaseBlock {
  id: string;
  type: BlockType;
  layout: BlockLayout;
}

export interface HeroBlock extends BaseBlock {
  type: "hero";
  data: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    bgImageUrl: string;
    buttonText: string;
    buttonHref: string;
  };
}

export interface FeaturesBlock extends BaseBlock {
  type: "features";
  data: {
    sectionTitle: string;
    sectionDesc: string;
    columns: number;
    items: Array<{ icon: string; title: string; desc: string }>;
  };
}

export interface GalleryBlock extends BaseBlock {
  type: "gallery";
  data: {
    sectionTitle: string;
    sectionDesc: string;
    columns: number;
    images: string[];
  };
}

export interface CtaBlock extends BaseBlock {
  type: "cta";
  data: {
    title: string;
    body: string;
    buttonText: string;
    buttonHref: string;
    contactInfo: string;
  };
}

export interface StatsBlock extends BaseBlock {
  type: "stats";
  data: {
    sectionTitle: string;
    sectionDesc: string;
    columns: number;
    items: Array<{ value: string; label: string }>;
  };
}

export interface TextBlock extends BaseBlock {
  type: "text";
  data: {
    eyebrow: string;
    title: string;
    body: string;
    align: "left" | "center";
  };
}

export interface SplitBlock extends BaseBlock {
  type: "split";
  data: {
    eyebrow: string;
    title: string;
    body: string;
    mediaUrl: string;
    mediaPosition: "left" | "right";
    buttonText: string;
    buttonHref: string;
  };
}

export interface QuoteBlock extends BaseBlock {
  type: "quote";
  data: {
    quote: string;
    author: string;
    role: string;
  };
}

export type Block =
  | HeroBlock
  | FeaturesBlock
  | GalleryBlock
  | CtaBlock
  | StatsBlock
  | TextBlock
  | SplitBlock
  | QuoteBlock;

export interface MicrositeBuilderState {
  version: number;
  config: GlobalConfig;
  blocks: Block[];
}

export const MICROSITE_BUILDER_SCRIPT_ID = "music-road-microsite-builder-state";
const BUILDER_VERSION = 3;

function createId(prefix = "block") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeScriptJson(value: string) {
  return value.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createDefaultLayout(type: BlockType): BlockLayout {
  switch (type) {
    case "hero":
      return { width: "full", minHeight: 640, padding: "spacious" };
    case "split":
      return { width: "full", minHeight: 420, padding: "regular" };
    case "gallery":
      return { width: "wide", minHeight: 340, padding: "regular" };
    case "features":
      return { width: "wide", minHeight: 320, padding: "regular" };
    case "stats":
      return { width: "wide", minHeight: 240, padding: "regular" };
    case "text":
      return { width: "half", minHeight: 260, padding: "regular" };
    case "quote":
      return { width: "half", minHeight: 260, padding: "regular" };
    case "cta":
      return { width: "full", minHeight: 300, padding: "spacious" };
  }
}

export function createBlockTemplate(type: BlockType): Block {
  const id = createId(type);
  const layout = createDefaultLayout(type);

  switch (type) {
    case "hero":
      return {
        id,
        type,
        layout,
        data: {
          eyebrow: "Campus Microsite",
          headline: "重塑你的校园音乐品牌入口",
          subheadline: "用更自由的布局和更沉浸的视觉，展示学校课程、校园氛围与招生信息。",
          bgImageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1400&q=80&auto=format&fit=crop",
          buttonText: "立即咨询",
          buttonHref: "#contact",
        },
      };
    case "features":
      return {
        id,
        type,
        layout,
        data: {
          sectionTitle: "核心亮点",
          sectionDesc: "把课程优势、教学方法和校园气质拆成更容易被理解的内容卡片。",
          columns: 3,
          items: [
            { icon: "🎵", title: "沉浸式课程", desc: "通过更清晰的内容节奏，完整呈现校园音乐教育体验。" },
            { icon: "🎤", title: "艺术化表达", desc: "适合学校品牌、课程模块、活动内容与舞台成果展示。" },
            { icon: "📱", title: "双端适配", desc: "重点适配 iPad 与手机端浏览，也适合小程序内嵌。" },
          ],
        },
      };
    case "gallery":
      return {
        id,
        type,
        layout,
        data: {
          sectionTitle: "校园相册",
          sectionDesc: "让空间、课堂和活动照片一起构成更有温度的校园印象。",
          columns: 3,
          images: [
            "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=900&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&q=80&auto=format&fit=crop",
          ],
        },
      };
    case "cta":
      return {
        id,
        type,
        layout,
        data: {
          title: "开启你的校园品牌首页",
          body: "把学校课程、品牌气质和咨询入口，统一收进一张适合平板与移动端浏览的单页官网中。",
          buttonText: "联系学校",
          buttonHref: "#top",
          contactInfo: "咨询电话：400-800-2024",
        },
      };
    case "stats":
      return {
        id,
        type,
        layout,
        data: {
          sectionTitle: "校园数据",
          sectionDesc: "用更简洁的方式展示课程规模、活动次数或师资信息。",
          columns: 4,
          items: [
            { value: "12+", label: "课程模块" },
            { value: "30+", label: "校园活动" },
            { value: "8", label: "品牌栏目" },
            { value: "100%", label: "移动适配" },
          ],
        },
      };
    case "text":
      return {
        id,
        type,
        layout,
        data: {
          eyebrow: "Brand Story",
          title: "用一段完整的文字，讲清学校气质",
          body: "适合补充学校故事、教学理念、课程愿景或面向家长的介绍文案，让页面不只是图文堆叠，而是更有叙事感。",
          align: "left",
        },
      };
    case "split":
      return {
        id,
        type,
        layout,
        data: {
          eyebrow: "Campus Experience",
          title: "图文并排的重点叙事模块",
          body: "适合展示校区空间、课堂环境、品牌活动或课程体验。左文右图、右文左图都可以自由调整。",
          mediaUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=80&auto=format&fit=crop",
          mediaPosition: "right",
          buttonText: "了解更多",
          buttonHref: "#contact",
        },
      };
    case "quote":
      return {
        id,
        type,
        layout,
        data: {
          quote: "让校园音乐教育在更有温度、更有品牌感的入口里被真正看见。",
          author: "音乐之路",
          role: "校园品牌主张",
        },
      };
  }
}

export function cloneBlockWithNewId(block: Block): Block {
  return JSON.parse(
    JSON.stringify({
      ...block,
      id: createId(block.type),
    }),
  ) as Block;
}

export function createDefaultBuilderState(seed?: { schoolName?: string; logoUrl?: string }): MicrositeBuilderState {
  const schoolName = seed?.schoolName?.trim() || "音乐之路";

  return {
    version: BUILDER_VERSION,
    config: {
      siteTitle: `${schoolName} 校园微官网`,
      siteSubtitle: "沉浸式校园音乐与艺术品牌入口",
      themeColor: "#6b21a8",
      accentColor: "#ede9fe",
      backgroundColor: "#f7f7fb",
      logoUrl: seed?.logoUrl || "",
      contactInfo: "咨询电话：400-800-2024",
    },
    blocks: [
      createBlockTemplate("hero"),
      createBlockTemplate("stats"),
      createBlockTemplate("split"),
      createBlockTemplate("features"),
      createBlockTemplate("gallery"),
      createBlockTemplate("quote"),
      createBlockTemplate("cta"),
    ],
  };
}

function normalizeLayout(rawLayout: unknown, type: BlockType) {
  const defaults = createDefaultLayout(type);
  if (!isObject(rawLayout)) return defaults;

  const width = rawLayout.width;
  const padding = rawLayout.padding;
  const minHeight = rawLayout.minHeight;

  return {
    width: width === "full" || width === "wide" || width === "half" ? width : defaults.width,
    padding:
      padding === "compact" || padding === "regular" || padding === "spacious" ? padding : defaults.padding,
    minHeight:
      typeof minHeight === "number" ? clampNumber(Math.round(minHeight), 180, 920) : defaults.minHeight,
  };
}

function normalizeTextArray(rawItems: unknown, fallback: string[]) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return fallback;
  const nextItems = rawItems.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return nextItems.length ? nextItems : fallback;
}

function normalizeFeatureItems(rawItems: unknown) {
  const fallback = (createBlockTemplate("features") as FeaturesBlock).data.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) return fallback;

  return rawItems
    .filter(isObject)
    .map((item) => ({
      icon: typeof item.icon === "string" ? item.icon : "✨",
      title: typeof item.title === "string" ? item.title : "新的亮点",
      desc: typeof item.desc === "string" ? item.desc : "补充这一块的描述内容。",
    }));
}

function normalizeStatItems(rawItems: unknown) {
  const fallback = (createBlockTemplate("stats") as StatsBlock).data.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) return fallback;

  return rawItems
    .filter(isObject)
    .map((item) => ({
      value: typeof item.value === "string" ? item.value : "00",
      label: typeof item.label === "string" ? item.label : "新的数据",
    }));
}

function normalizeBlock(rawBlock: unknown, index: number): Block | null {
  if (!isObject(rawBlock) || typeof rawBlock.type !== "string") return null;

  const type = rawBlock.type as BlockType;
  const rawData = isObject(rawBlock.data) ? rawBlock.data : {};
  const id = typeof rawBlock.id === "string" ? rawBlock.id : `${type}-${index}-${createId("legacy")}`;
  const layout = normalizeLayout(rawBlock.layout, type);

  switch (type) {
    case "hero": {
      const defaults = createBlockTemplate("hero") as HeroBlock;
      return {
        id,
        type,
        layout,
        data: {
          eyebrow: typeof rawData.eyebrow === "string" ? rawData.eyebrow : defaults.data.eyebrow,
          headline: typeof rawData.headline === "string" ? rawData.headline : defaults.data.headline,
          subheadline: typeof rawData.subheadline === "string" ? rawData.subheadline : defaults.data.subheadline,
          bgImageUrl: typeof rawData.bgImageUrl === "string" ? rawData.bgImageUrl : defaults.data.bgImageUrl,
          buttonText: typeof rawData.buttonText === "string" ? rawData.buttonText : defaults.data.buttonText,
          buttonHref: typeof rawData.buttonHref === "string" ? rawData.buttonHref : defaults.data.buttonHref,
        },
      };
    }
    case "features": {
      return {
        id,
        type,
        layout,
        data: {
          sectionTitle: typeof rawData.sectionTitle === "string" ? rawData.sectionTitle : "核心亮点",
          sectionDesc: typeof rawData.sectionDesc === "string" ? rawData.sectionDesc : "补充这一组亮点的说明。",
          columns:
            typeof rawData.columns === "number" ? clampNumber(Math.round(rawData.columns), 2, 4) : 3,
          items: normalizeFeatureItems(rawData.items),
        },
      };
    }
    case "gallery": {
      return {
        id,
        type,
        layout,
        data: {
          sectionTitle: typeof rawData.sectionTitle === "string" ? rawData.sectionTitle : "校园相册",
          sectionDesc: typeof rawData.sectionDesc === "string" ? rawData.sectionDesc : "补充图片区说明。",
          columns:
            typeof rawData.columns === "number" ? clampNumber(Math.round(rawData.columns), 2, 4) : 3,
          images: normalizeTextArray(rawData.images, (createBlockTemplate("gallery") as GalleryBlock).data.images),
        },
      };
    }
    case "cta": {
      const defaults = createBlockTemplate("cta") as CtaBlock;
      return {
        id,
        type,
        layout,
        data: {
          title: typeof rawData.title === "string" ? rawData.title : defaults.data.title,
          body: typeof rawData.body === "string" ? rawData.body : defaults.data.body,
          buttonText: typeof rawData.buttonText === "string" ? rawData.buttonText : defaults.data.buttonText,
          buttonHref: typeof rawData.buttonHref === "string" ? rawData.buttonHref : defaults.data.buttonHref,
          contactInfo: typeof rawData.contactInfo === "string" ? rawData.contactInfo : defaults.data.contactInfo,
        },
      };
    }
    case "stats": {
      return {
        id,
        type,
        layout,
        data: {
          sectionTitle: typeof rawData.sectionTitle === "string" ? rawData.sectionTitle : "校园数据",
          sectionDesc: typeof rawData.sectionDesc === "string" ? rawData.sectionDesc : "补充数据说明。",
          columns:
            typeof rawData.columns === "number" ? clampNumber(Math.round(rawData.columns), 2, 4) : 4,
          items: normalizeStatItems(rawData.items),
        },
      };
    }
    case "text": {
      const defaults = createBlockTemplate("text") as TextBlock;
      return {
        id,
        type,
        layout,
        data: {
          eyebrow: typeof rawData.eyebrow === "string" ? rawData.eyebrow : defaults.data.eyebrow,
          title: typeof rawData.title === "string" ? rawData.title : defaults.data.title,
          body: typeof rawData.body === "string" ? rawData.body : defaults.data.body,
          align: rawData.align === "center" ? "center" : defaults.data.align,
        },
      };
    }
    case "split": {
      const defaults = createBlockTemplate("split") as SplitBlock;
      return {
        id,
        type,
        layout,
        data: {
          eyebrow: typeof rawData.eyebrow === "string" ? rawData.eyebrow : defaults.data.eyebrow,
          title: typeof rawData.title === "string" ? rawData.title : defaults.data.title,
          body: typeof rawData.body === "string" ? rawData.body : defaults.data.body,
          mediaUrl: typeof rawData.mediaUrl === "string" ? rawData.mediaUrl : defaults.data.mediaUrl,
          mediaPosition: rawData.mediaPosition === "left" ? "left" : defaults.data.mediaPosition,
          buttonText: typeof rawData.buttonText === "string" ? rawData.buttonText : defaults.data.buttonText,
          buttonHref: typeof rawData.buttonHref === "string" ? rawData.buttonHref : defaults.data.buttonHref,
        },
      };
    }
    case "quote": {
      const defaults = createBlockTemplate("quote") as QuoteBlock;
      return {
        id,
        type,
        layout,
        data: {
          quote: typeof rawData.quote === "string" ? rawData.quote : defaults.data.quote,
          author: typeof rawData.author === "string" ? rawData.author : defaults.data.author,
          role: typeof rawData.role === "string" ? rawData.role : defaults.data.role,
        },
      };
    }
    default:
      return null;
  }
}

export function normalizeBuilderState(raw: unknown, seed?: { schoolName?: string; logoUrl?: string }): MicrositeBuilderState {
  const defaults = createDefaultBuilderState(seed);
  if (!isObject(raw)) return defaults;

  const rawConfig = isObject(raw.config) ? raw.config : {};
  const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks : [];
  const normalizedBlocks = rawBlocks.map(normalizeBlock).filter((block): block is Block => Boolean(block));

  return {
    version: BUILDER_VERSION,
    config: {
      siteTitle: typeof rawConfig.siteTitle === "string" ? rawConfig.siteTitle : defaults.config.siteTitle,
      siteSubtitle: typeof rawConfig.siteSubtitle === "string" ? rawConfig.siteSubtitle : defaults.config.siteSubtitle,
      themeColor: typeof rawConfig.themeColor === "string" ? rawConfig.themeColor : defaults.config.themeColor,
      accentColor: typeof rawConfig.accentColor === "string" ? rawConfig.accentColor : defaults.config.accentColor,
      backgroundColor:
        typeof rawConfig.backgroundColor === "string" ? rawConfig.backgroundColor : defaults.config.backgroundColor,
      logoUrl: typeof rawConfig.logoUrl === "string" ? rawConfig.logoUrl : defaults.config.logoUrl,
      contactInfo: typeof rawConfig.contactInfo === "string" ? rawConfig.contactInfo : defaults.config.contactInfo,
    },
    blocks: normalizedBlocks.length ? normalizedBlocks : defaults.blocks,
  };
}

export function extractBuilderStateFromHtml(html: string) {
  const match = html.match(
    new RegExp(`<script[^>]+id=["']${MICROSITE_BUILDER_SCRIPT_ID}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i"),
  );
  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]) as MicrositeBuilderState;
  } catch {
    return null;
  }
}

function renderBlockShell(block: Block, innerHtml: string, className = "") {
  return `
    <section class="block-shell block-width-${block.layout.width}" id="${escapeHtml(block.id)}">
      <article class="panel block-card block-card--${block.layout.padding} ${className}" style="min-height:${block.layout.minHeight}px">
        ${innerHtml}
      </article>
    </section>
  `;
}

function renderHero(block: HeroBlock) {
  return renderBlockShell(
    block,
    `
      ${block.data.bgImageUrl ? `<img src="${escapeHtml(block.data.bgImageUrl)}" class="hero-bg" alt="" />` : ""}
      <div class="hero-copy">
        <span class="eyebrow">${escapeHtml(block.data.eyebrow)}</span>
        <h1>${escapeHtml(block.data.headline)}</h1>
        <p>${escapeHtml(block.data.subheadline)}</p>
        ${
          block.data.buttonText
            ? `<a href="${escapeHtml(block.data.buttonHref || "#contact")}" class="button button-primary">${escapeHtml(block.data.buttonText)}</a>`
            : ""
        }
      </div>
    `,
    "hero-card",
  );
}

function renderText(block: TextBlock) {
  return renderBlockShell(
    block,
    `
      <div class="text-card text-align-${block.data.align}">
        <span class="eyebrow">${escapeHtml(block.data.eyebrow)}</span>
        <h2>${escapeHtml(block.data.title)}</h2>
        <p>${escapeHtml(block.data.body)}</p>
      </div>
    `,
    "text-card-shell",
  );
}

function renderFeatures(block: FeaturesBlock) {
  return renderBlockShell(
    block,
    `
      <div class="section-heading">
        <span class="eyebrow">Highlights</span>
        <h2>${escapeHtml(block.data.sectionTitle)}</h2>
        <p>${escapeHtml(block.data.sectionDesc)}</p>
      </div>
      <div class="feature-grid" style="--grid-columns:${block.data.columns}">
        ${block.data.items
          .map(
            (item) => `
              <article class="feature-card">
                <div class="feature-icon">${escapeHtml(item.icon)}</div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.desc)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    `,
  );
}

function renderStats(block: StatsBlock) {
  return renderBlockShell(
    block,
    `
      <div class="section-heading">
        <span class="eyebrow">Metrics</span>
        <h2>${escapeHtml(block.data.sectionTitle)}</h2>
        <p>${escapeHtml(block.data.sectionDesc)}</p>
      </div>
      <div class="stats-grid" style="--grid-columns:${block.data.columns}">
        ${block.data.items
          .map(
            (item) => `
              <article class="stats-card">
                <strong>${escapeHtml(item.value)}</strong>
                <span>${escapeHtml(item.label)}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    `,
  );
}

function renderGallery(block: GalleryBlock) {
  const images = block.data.images.filter(Boolean);
  return renderBlockShell(
    block,
    `
      <div class="section-heading">
        <span class="eyebrow">Gallery</span>
        <h2>${escapeHtml(block.data.sectionTitle)}</h2>
        <p>${escapeHtml(block.data.sectionDesc)}</p>
      </div>
      <div class="gallery-grid" style="--grid-columns:${block.data.columns}">
        ${
          images.length
            ? images
                .map(
                  (imageUrl) => `
                    <figure class="gallery-card">
                      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(block.data.sectionTitle)}" />
                    </figure>
                  `,
                )
                .join("")
            : `<div class="gallery-empty">等待上传校园图片</div>`
        }
      </div>
    `,
  );
}

function renderSplit(block: SplitBlock) {
  return renderBlockShell(
    block,
    `
      <div class="split-card split-media-${block.data.mediaPosition}">
        <div class="split-copy">
          <span class="eyebrow">${escapeHtml(block.data.eyebrow)}</span>
          <h2>${escapeHtml(block.data.title)}</h2>
          <p>${escapeHtml(block.data.body)}</p>
          ${
            block.data.buttonText
              ? `<a href="${escapeHtml(block.data.buttonHref || "#contact")}" class="button button-primary">${escapeHtml(block.data.buttonText)}</a>`
              : ""
          }
        </div>
        <div class="split-media">
          ${
            block.data.mediaUrl
              ? `<img src="${escapeHtml(block.data.mediaUrl)}" alt="${escapeHtml(block.data.title)}" />`
              : `<div class="split-media-empty">等待上传图像素材</div>`
          }
        </div>
      </div>
    `,
  );
}

function renderQuote(block: QuoteBlock) {
  return renderBlockShell(
    block,
    `
      <div class="quote-card">
        <blockquote>${escapeHtml(block.data.quote)}</blockquote>
        <div class="quote-meta">${escapeHtml(block.data.author)} / ${escapeHtml(block.data.role)}</div>
      </div>
    `,
    "quote-card-shell",
  );
}

function renderCta(block: CtaBlock) {
  return renderBlockShell(
    block,
    `
      <div class="cta-card" id="contact">
        <span class="eyebrow">Contact</span>
        <h2>${escapeHtml(block.data.title)}</h2>
        <p>${escapeHtml(block.data.body)}</p>
        ${
          block.data.buttonText
            ? `<a href="${escapeHtml(block.data.buttonHref || "#top")}" class="button button-primary">${escapeHtml(block.data.buttonText)}</a>`
            : ""
        }
        <div class="cta-note">${escapeHtml(block.data.contactInfo)}</div>
      </div>
    `,
    "cta-card-shell",
  );
}

export function compileBuilderHtml(config: GlobalConfig, blocks: Block[]) {
  const builderState = safeScriptJson(JSON.stringify({ version: BUILDER_VERSION, config, blocks }));

  const sections = blocks
    .map((block) => {
      switch (block.type) {
        case "hero":
          return renderHero(block);
        case "features":
          return renderFeatures(block);
        case "gallery":
          return renderGallery(block);
        case "cta":
          return renderCta(block);
        case "stats":
          return renderStats(block);
        case "text":
          return renderText(block);
        case "split":
          return renderSplit(block);
        case "quote":
          return renderQuote(block);
        default:
          return "";
      }
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="format-detection" content="telephone=no" />
  <title>${escapeHtml(config.siteTitle)}</title>
  <meta name="description" content="${escapeHtml(config.siteSubtitle)}" />
  <style>
    :root {
      --theme: ${config.themeColor};
      --accent: ${config.accentColor};
      --bg: ${config.backgroundColor};
      --text: #17171c;
      --muted: #6d7080;
      --line: rgba(255,255,255,0.72);
      --shadow: 0 24px 60px rgba(63,34,133,0.08);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at 12% 10%, rgba(150,100,255,0.16), transparent 24%),
        radial-gradient(circle at 88% 4%, rgba(237,233,254,0.92), transparent 20%),
        linear-gradient(180deg, #fdfcff 0%, var(--bg) 100%);
      padding:
        calc(18px + env(safe-area-inset-top))
        max(16px, env(safe-area-inset-right))
        calc(24px + env(safe-area-inset-bottom))
        max(16px, env(safe-area-inset-left));
    }
    a { color: inherit; text-decoration: none; }
    h1, h2, h3, p, figure, blockquote { margin: 0; }
    .shell { width: min(100%, 1180px); margin: 0 auto; }
    .panel {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 32px;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78)),
        linear-gradient(135deg, rgba(245,238,255,0.84), rgba(255,255,255,0.32));
      box-shadow: var(--shadow);
      backdrop-filter: blur(22px);
    }
    .panel::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.46), rgba(255,255,255,0) 44%);
      pointer-events: none;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      margin-bottom: 18px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .logo-box {
      width: 46px;
      height: 46px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(107,33,168,0.18), rgba(255,255,255,0.92));
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 14px 36px rgba(107,33,168,0.12);
    }
    .logo-box img { width: 76%; height: 76%; object-fit: contain; }
    .logo-fallback {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--theme), rgba(255,255,255,0.7));
    }
    .brand-copy { min-width: 0; }
    .brand-copy strong {
      display: block;
      font-size: 15px;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .brand-copy span {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: var(--muted);
    }
    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.72);
      font-size: 13px;
      color: var(--text);
      box-shadow: 0 12px 28px rgba(103,79,194,0.04);
    }
    .canvas {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 20px;
    }
    .block-shell { min-width: 0; }
    .block-width-full { grid-column: span 12; }
    .block-width-wide { grid-column: span 8; }
    .block-width-half { grid-column: span 6; }
    .block-card {
      position: relative;
      height: 100%;
    }
    .block-card--compact { padding: 20px; }
    .block-card--regular { padding: 24px; }
    .block-card--spacious { padding: 32px; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.68);
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text);
    }
    .eyebrow::before {
      content: "";
      width: 24px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--theme));
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 52px;
      padding: 0 24px;
      border-radius: 999px;
      border: 1px solid transparent;
      font-size: 15px;
      font-weight: 600;
      transition: transform .25s ease, box-shadow .25s ease;
    }
    .button:active { transform: scale(0.98); }
    .button-primary {
      color: #fff;
      background: linear-gradient(135deg, var(--theme), color-mix(in srgb, var(--theme) 62%, white 38%));
      box-shadow: 0 18px 42px rgba(107,33,168,0.22);
    }
    .hero-card {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-radius: 38px;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.18;
      filter: blur(8px);
      transform: scale(1.06);
    }
    .hero-copy {
      position: relative;
      z-index: 1;
      max-width: 760px;
    }
    .hero-copy h1 {
      margin-top: 22px;
      font-family: ui-serif, Georgia, "Times New Roman", serif;
      font-size: clamp(42px, 7vw, 82px);
      line-height: 0.94;
      letter-spacing: -0.05em;
      color: #21192f;
    }
    .hero-copy p,
    .section-heading p,
    .text-card p,
    .split-copy p,
    .cta-card p {
      margin-top: 16px;
      font-size: clamp(15px, 2vw, 18px);
      line-height: 1.9;
      color: var(--muted);
    }
    .hero-copy .button,
    .split-copy .button,
    .cta-card .button { margin-top: 24px; }
    .section-heading {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .section-heading h2,
    .text-card h2,
    .split-copy h2,
    .cta-card h2 {
      font-size: clamp(28px, 4vw, 42px);
      line-height: 1.06;
      letter-spacing: -0.04em;
    }
    .text-card-shell,
    .quote-card-shell {
      display: flex;
      align-items: center;
    }
    .text-card {
      width: 100%;
    }
    .text-align-center { text-align: center; }
    .text-align-left { text-align: left; }
    .feature-grid,
    .stats-grid,
    .gallery-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(var(--grid-columns, 3), minmax(0, 1fr));
    }
    .feature-card,
    .stats-card,
    .gallery-card,
    .gallery-empty {
      border-radius: 24px;
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(255,255,255,0.82);
      box-shadow: 0 14px 30px rgba(103,79,194,0.06);
    }
    .feature-card { padding: 20px; }
    .feature-icon {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(107,33,168,0.1);
      font-size: 24px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
    }
    .feature-card h3 {
      margin-top: 16px;
      font-size: 21px;
      line-height: 1.18;
    }
    .feature-card p {
      margin-top: 10px;
      font-size: 14px;
      line-height: 1.82;
      color: var(--muted);
    }
    .stats-card {
      display: flex;
      min-height: 132px;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px;
    }
    .stats-card strong {
      font-size: clamp(28px, 4vw, 42px);
      line-height: 1;
      letter-spacing: -0.05em;
    }
    .stats-card span {
      display: block;
      margin-top: 14px;
      color: var(--muted);
      font-size: 14px;
    }
    .gallery-card,
    .gallery-empty { min-height: 240px; overflow: hidden; }
    .gallery-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .gallery-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      color: var(--muted);
      font-size: 14px;
    }
    .split-card {
      display: grid;
      gap: 20px;
      height: 100%;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: stretch;
    }
    .split-media-left .split-copy { order: 2; }
    .split-media-left .split-media { order: 1; }
    .split-media-right .split-copy { order: 1; }
    .split-media-right .split-media { order: 2; }
    .split-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      justify-content: center;
    }
    .split-media {
      overflow: hidden;
      border-radius: 28px;
      background: linear-gradient(145deg, rgba(238,230,255,0.86), rgba(255,255,255,0.76));
      min-height: 100%;
      box-shadow: 0 16px 36px rgba(103,79,194,0.08);
    }
    .split-media img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }
    .split-media-empty {
      display: flex;
      height: 100%;
      min-height: 260px;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 14px;
    }
    .quote-card {
      width: 100%;
      text-align: center;
    }
    .quote-card blockquote {
      font-family: ui-serif, Georgia, "Times New Roman", serif;
      font-size: clamp(28px, 4vw, 44px);
      line-height: 1.2;
      letter-spacing: -0.04em;
    }
    .quote-meta,
    .cta-note {
      margin-top: 18px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.8;
    }
    .cta-card {
      text-align: center;
    }
    footer {
      padding: 24px 8px 6px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.8;
    }
    @media (max-width: 1023px) {
      .block-width-wide,
      .block-width-half { grid-column: span 12; }
      .feature-grid,
      .stats-grid,
      .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .split-card { grid-template-columns: 1fr; }
      .split-media-left .split-copy,
      .split-media-left .split-media,
      .split-media-right .split-copy,
      .split-media-right .split-media { order: initial; }
    }
    @media (max-width: 767px) {
      .topbar {
        position: static;
        flex-direction: column;
        align-items: stretch;
      }
      .canvas { gap: 16px; }
      .feature-grid,
      .stats-grid,
      .gallery-grid { grid-template-columns: 1fr; }
      .block-card--spacious,
      .block-card--regular,
      .block-card--compact { padding: 20px; }
    }
  </style>
</head>
<body>
  <script id="${MICROSITE_BUILDER_SCRIPT_ID}" type="application/json">${builderState}</script>
  <div class="shell">
    <header class="panel topbar">
      <div class="brand">
        <div class="logo-box">
          ${
            config.logoUrl
              ? `<img src="${escapeHtml(config.logoUrl)}" alt="${escapeHtml(config.siteTitle)}" />`
              : `<div class="logo-fallback"></div>`
          }
        </div>
        <div class="brand-copy">
          <strong>${escapeHtml(config.siteTitle)}</strong>
          <span>${escapeHtml(config.siteSubtitle)}</span>
        </div>
      </div>
      <a class="pill" href="#contact">${escapeHtml(config.contactInfo)}</a>
    </header>
    <main class="canvas">${sections}</main>
    <footer>
      <div>${escapeHtml(config.siteTitle)}</div>
      <div>${escapeHtml(config.siteSubtitle)} / ${escapeHtml(config.contactInfo)}</div>
    </footer>
  </div>
</body>
</html>`;
}
