"use client";

import { type ChangeEvent, useRef, useState } from "react";

import { FileAudio2, FileVideo2, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadSchoolAsset } from "@/lib/api/business";
import { pickFileName } from "@/lib/dashboard-utils";

type UploadKind = "image" | "audio" | "video";

interface FileUploadFieldProps {
  label: string;
  hint?: string;
  value: string[];
  accept: string;
  token?: string | null;
  kind?: UploadKind;
  multiple?: boolean;
  onChange: (value: string[]) => void;
}

export function FileUploadField({
  label,
  hint,
  value,
  accept,
  token,
  kind = "image",
  multiple = false,
  onChange,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      toast.error("登录状态已失效，请重新登录后再上传。");
      return;
    }

    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadSchoolAsset(file, token);
        uploadedUrls.push(url);
      }
      onChange(multiple ? [...value, ...uploadedUrls] : uploadedUrls.slice(0, 1));
      toast.success(`${label}上传成功`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败，请稍后重试。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleSelectFiles}
        />

        <Button
          type="button"
          variant="outline"
          className="rounded-full border-white/80 bg-white/80"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          上传
        </Button>
      </div>

      {!value.length ? (
        <div className="rounded-[1.4rem] border border-dashed border-primary/20 bg-primary/5 px-4 py-5 text-sm text-muted-foreground">
          暂无已上传内容
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex items-center gap-4 rounded-[1.35rem] border border-white/80 bg-white/82 p-3"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/8 text-primary">
                {kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={label} className="h-full w-full object-cover" />
                ) : kind === "audio" ? (
                  <FileAudio2 className="size-5" />
                ) : (
                  <FileVideo2 className="size-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{pickFileName(url)}</p>
                <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-primary hover:underline">
                  查看资源
                </a>
              </div>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full text-muted-foreground"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {kind === "audio" && value[0] ? <audio controls className="w-full" src={value[0]} /> : null}
      {kind === "video" && value[0] ? <video controls className="max-h-72 w-full rounded-[1.4rem]" src={value[0]} /> : null}
    </div>
  );
}
