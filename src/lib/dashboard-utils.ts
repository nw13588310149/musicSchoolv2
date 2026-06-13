export interface OptionItem {
  label: string;
  value: string;
}

export function normalizeMediaValue(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeMediaValue(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return normalizeMediaValue(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  }

  if (typeof value === "object") {
    const objectValue = value as { url?: string; fileUrl?: string; [key: string]: unknown };
    if (typeof objectValue.url === "string" && objectValue.url) {
      return [objectValue.url];
    }
    if (typeof objectValue.fileUrl === "string" && objectValue.fileUrl) {
      return [objectValue.fileUrl];
    }
  }

  return [];
}

export function toSelectOptions(records: Array<{ id: string | number; name: string }>): OptionItem[] {
  return records.map((item) => ({
    label: item.name,
    value: String(item.id),
  }));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function pickFileName(url: string) {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "附件");
  } catch {
    return url.split("/").pop() || "附件";
  }
}

export function cnJoin(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
