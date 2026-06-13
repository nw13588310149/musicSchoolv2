"use client";

import { type CSSProperties, useCallback, useId, useMemo, useRef } from "react";

import dynamic from "next/dynamic";

import type { IAllProps } from "@tinymce/tinymce-react";
import { toast } from "sonner";

import { uploadFile } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type TinyInit = NonNullable<IAllProps["init"]>;

/** Keep in sync with `tinymce` in package.json (self-hosted script + skins from jsDelivr). */
const TINYMCE_VERSION = "7.9.2";
const TINYMCE_BASE = `https://cdn.jsdelivr.net/npm/tinymce@${TINYMCE_VERSION}`;
const TINYMCE_SCRIPT = `${TINYMCE_BASE}/tinymce.min.js`;
/** Community UI pack for TinyMCE 7 (langs7). */
const LANG_ZH_CN = "https://cdn.jsdelivr.net/npm/tinymce-i18n@26.4.6/langs7/zh_CN.js";

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="min-h-[7rem] animate-pulse rounded-xl bg-muted/40" aria-hidden />,
});

function parseMinHeightPx(s: string): number {
  const m = /^(\d+)(px)?$/i.exec(String(s).trim());
  return m ? Number(m[1]) : 140;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  className,
  minHeight = "140px",
}: {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}) {
  const reactId = useId();
  const editorId = id ?? `rte-${reactId.replace(/:/g, "")}`;
  const token = useAuthStore((s) => s.token);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const minH = parseMinHeightPx(minHeight);
  const maxAutoresize = Math.max(680, minH + 120);

  const imagesUploadHandler = useCallback(
    (blobInfo: { blob: () => Blob; filename: () => string }, progress: (n: number) => void) => {
      const t = tokenRef.current;
      if (!t) {
        toast.error("请先登录后再上传图片。");
        return Promise.reject(new Error("请先登录后再上传图片。"));
      }
      const blob = blobInfo.blob();
      const file = new File([blob], blobInfo.filename(), {
        type: blob.type || "image/png",
      });
      progress(0);
      return uploadFile(file, t)
        .then((url) => {
          progress(100);
          return url;
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "图片上传失败，请稍后重试。";
          toast.error(message);
          return Promise.reject(new Error(message));
        });
    },
    [],
  );

  const init = useMemo<TinyInit>(
    () => ({
      min_height: minH,
      max_height: maxAutoresize,
      menubar: "file edit insert view format table",
      branding: false,
      promotion: false,
      language: "zh_CN",
      language_url: LANG_ZH_CN,
      skin_url: `${TINYMCE_BASE}/skins/ui/oxide`,
      content_css: `${TINYMCE_BASE}/skins/content/default/content.min.css`,
      resize: true,
      fontsize_formats:
        "6pt 7pt 8pt 9pt 10pt 11pt 12pt 13pt 14pt 15pt 16pt 17pt 18pt 19pt 20pt 21pt 22pt 23pt 24pt 36pt",
      font_family_formats:
        "微软雅黑=Microsoft YaHei,微软雅黑,sans-serif;宋体=SimSun,宋体,serif;黑体=SimHei,黑体,sans-serif;仿宋=FangSong,仿宋,serif;楷体=KaiTi,楷体,serif;Arial=arial,helvetica,sans-serif;Georgia=georgia,palatino,serif;Times New Roman=times new roman,times,serif;Verdana=verdana,geneva,sans-serif",
      plugins: "lists link image autoresize autolink code table preview fullscreen media wordcount searchreplace visualblocks",
      toolbar:
        "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist | link image media table | preview fullscreen | removeformat code",
      block_formats: "段落=p;标题 2=h2;标题 3=h3",
      placeholder: placeholder ?? "",
      relative_urls: false,
      convert_urls: true,
      automatic_uploads: true,
      images_upload_handler: imagesUploadHandler,
      paste_data_images: true,
      image_advtab: true,
      object_resizing: true,
      link_title: false,
      autoresize_bottom_margin: 20,
      autoresize_on_init: true,
      autoresize_overflow_padding: 16,
      browser_spellcheck: true,
      content_style: `
        body { font-family: "Microsoft YaHei", system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 14px; line-height: 1.65; color: #1f2433; }
        img { max-width: 100%; height: auto; vertical-align: middle; }
        p { margin: 0.35em 0; }
        table { border-collapse: collapse; width: 100%; }
        table td, table th { border: 1px solid #ccc; padding: 4px 8px; }
      `,
    }),
    [imagesUploadHandler, minH, placeholder],
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-background shadow-sm transition-shadow",
        "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/30",
        "[&_.tox-tinymce]:rounded-xl [&_.tox-tinymce]:border-0",
        "[&_.tox-editor-header]:rounded-t-xl [&_.tox-editor-header]:border-border/70 [&_.tox-editor-header]:border-b",
        className,
      )}
      style={{ minHeight } as CSSProperties}
    >
      <Editor
        id={editorId}
        licenseKey="gpl"
        tinymceScriptSrc={TINYMCE_SCRIPT}
        value={value || ""}
        onEditorChange={(html) => onChange(html)}
        init={init}
      />
    </div>
  );
}
