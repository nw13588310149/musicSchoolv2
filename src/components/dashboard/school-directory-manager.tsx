"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  CheckCircle2,
  Eye,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyPanel, MetricCard, PanelCard, SectionHeading } from "@/components/dashboard/module-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CinematicMultiSelect, CinematicSelect } from "@/components/dashboard/cinematic-select";
import type { LegacyApiResponse, PaginatedResult } from "@/lib/api/contracts";
import {
  createSubject,
  fetchCampusList,
  fetchDormitoryBuildingList,
  fetchStudentDetail,
  fetchStudentList,
  fetchSubjectDetail,
  fetchSubjectList,
  fetchTeacherDetail,
  fetchTeacherList,
  updateStudent,
  updateStudentStatus,
  updateSubject,
  updateTeacher,
  updateTeacherStatus,
} from "@/lib/api/business";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

type DirectoryKind = "subject" | "teacher" | "student";

type OptionSource = "campuses" | "subjects" | "roles" | "dormitories" | "studentStatus";

type DirectoryOption = {
  value: string;
  label: string;
};

type DirectoryRecord = Record<string, unknown> & {
  id: string | number;
  status?: number;
};

type DirectoryField = {
  key: string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
  readonly?: boolean;
  type?: "text" | "textarea" | "select" | "multiSelect" | "switch";
  optionsKey?: OptionSource;
};

type DirectoryConfig = {
  kind: DirectoryKind;
  title: string;
  description: string;
  eyebrow: string;
  listTitle: string;
  searchPlaceholder: string;
  icon: LucideIcon;
  primaryName: string;
  secondaryName: string;
  fields: DirectoryField[];
  createEnabled?: boolean;
  fetchList: (query: Record<string, unknown>, token: string) => Promise<PaginatedResult<DirectoryRecord>>;
  fetchDetail: (id: string | number, token: string) => Promise<DirectoryRecord>;
  create?: (payload: Record<string, unknown>, token: string) => Promise<LegacyApiResponse>;
  update: (payload: Record<string, unknown>, token: string) => Promise<LegacyApiResponse>;
  updateStatus?: (payload: { id: string | number; status: number }, token: string) => Promise<LegacyApiResponse>;
};

const PAGE_SIZE = 10;

const ROLE_OPTIONS: DirectoryOption[] = [
  { value: "headmaster", label: "校长" },
  { value: "manager", label: "教务管理员" },
  { value: "dormitory", label: "宿管" },
  { value: "head_teacher", label: "班主任" },
  { value: "course_teacher", label: "任课老师" },
];

const STUDENT_STATUS_OPTIONS: DirectoryOption[] = [
  { value: "在籍", label: "在籍" },
  { value: "休学", label: "休学" },
  { value: "转学", label: "转学" },
  { value: "毕业", label: "毕业" },
];

const fieldLabels: Record<string, string> = {
  id: "ID",
  name: "名称",
  title: "标题",
  subjectName: "科目",
  subjectNames: "任教科目",
  no: "编号",
  teacherStatus: "岗位状态",
  roles: "角色",
  schoolCampusName: "校区",
  realname: "姓名",
  nickname: "昵称",
  mobile: "手机号",
  phone: "联系电话",
  gender: "性别",
  status: "状态",
  studentNo: "学号",
  studentNumber: "学号",
  studentStatus: "学籍状态",
  className: "班级",
  createTime: "创建时间",
  updateTime: "更新时间",
  remark: "备注",
  description: "说明",
};

function textOf(value: unknown, fallback = "-"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.map((item) => textOf(item, "")).filter(Boolean).join("、") || fallback;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.name ?? record.realname ?? record.nickname ?? record.mobile ?? record.id ?? fallback);
  }
  return String(value);
}

function pickFirst(record: DirectoryRecord, keys: string[], fallback = "-") {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") return textOf(value, fallback);
  }
  const user = record.user;
  if (user && typeof user === "object") {
    const userRecord = user as Record<string, unknown>;
    for (const key of keys) {
      const value = userRecord[key];
      if (value !== null && value !== undefined && value !== "") return textOf(value, fallback);
    }
  }
  return fallback;
}

function isEnabled(record: DirectoryRecord) {
  if (record.status === 0) return false;
  if (record.status === 1) return true;
  if (record.enable === 0 || record.enabled === false) return false;
  return true;
}

function getDisplayName(record: DirectoryRecord) {
  return pickFirst(record, ["realname", "name", "subjectName", "nickname", "title"], `#${record.id}`);
}

function normalizeForm(record: DirectoryRecord | null, fields: DirectoryField[]) {
  const next: Record<string, string> = {};
  fields.forEach((field) => {
    next[field.key] = record ? textOf(record[field.key], "") : "";
  });
  return next;
}

function buildPayload(form: Record<string, string>, base?: DirectoryRecord | null) {
  const payload: Record<string, unknown> = { ...(base ?? {}) };
  Object.entries(form).forEach(([key, value]) => {
    const trimmed = value.trim();
    if (trimmed !== "") {
      payload[key] = trimmed;
      return;
    }
    delete payload[key];
  });
  return payload;
}

function pickPayloadFields(payload: Record<string, unknown>, keys: string[]) {
  const next: Record<string, unknown> = {};
  keys.forEach((key) => {
    const value = payload[key];
    if (value !== undefined && value !== null && value !== "") next[key] = value;
  });
  return next;
}

function normalizeSubmitPayload(config: DirectoryConfig, payload: Record<string, unknown>) {
  if (config.kind === "teacher") {
    return pickPayloadFields(payload, ["id", "no", "campusId", "dormitoryBuildingIds", "roles", "subjetIds"]);
  }
  if (config.kind === "student") {
    return pickPayloadFields(payload, ["id", "campusId", "no", "studentStatus"]);
  }
  return payload;
}

function detailPairs(record: DirectoryRecord) {
  return Object.entries(record)
    .filter(([key, value]) => key !== "user" && value !== null && value !== undefined && typeof value !== "object")
    .slice(0, 18)
    .map(([key, value]) => ({
      label: fieldLabels[key] ?? key,
      value: textOf(value),
    }));
}

function optionName(record: DirectoryRecord) {
  return pickFirst(record, ["name", "campusName", "buildingName", "subjectName", "realname", "title"], `#${record.id}`);
}

function toOptions(records: DirectoryRecord[]) {
  return records.map((record) => ({
    value: String(record.id),
    label: optionName(record),
  }));
}

function getInfoColumnLabel(kind: DirectoryKind) {
  if (kind === "subject") return "所属学校";
  if (kind === "teacher") return "教师档案";
  return "学号 / 班级";
}

function getDateColumnLabel(kind: DirectoryKind) {
  return kind === "subject" ? "创建时间" : "更新时间";
}

function getPrimaryInfo(record: DirectoryRecord, kind: DirectoryKind) {
  if (kind === "subject") return `学校 ${pickFirst(record, ["schoolId"], "-")}`;
  if (kind === "teacher") return pickFirst(record, ["subjectNames", "subjectName", "subjects"], "暂未配置科目");
  return pickFirst(record, ["no", "studentNo", "studentNumber"], "暂未录入学号");
}

function getSecondaryInfo(record: DirectoryRecord, kind: DirectoryKind) {
  if (kind === "subject") return pickFirst(record, ["createTime"], "-");
  if (kind === "teacher") {
    const no = pickFirst(record, ["no"], "");
    const status = pickFirst(record, ["teacherStatus"], "");
    const gender = pickFirst(record, ["gender"], "");
    return [no ? `工号 ${no}` : "", status, gender].filter(Boolean).join(" · ") || "-";
  }
  return [pickFirst(record, ["studentStatus"], ""), pickFirst(record, ["schoolCampusName", "className"], ""), pickFirst(record, ["gender"], "")]
    .filter(Boolean)
    .join(" · ") || "-";
}

function getMobileInfo(record: DirectoryRecord) {
  return pickFirst(record, ["mobile", "phone"], "暂无手机号");
}

const commonInputClass =
  "h-11 rounded-xl border-[#e8e4f3] bg-white/80 shadow-[0_1px_0_rgba(255,255,255,0.75)_inset] focus-visible:border-primary/45 focus-visible:ring-primary/15";

function DirectoryEditor({
  config,
  record,
  open,
  onOpenChange,
  onSubmit,
  optionMap,
}: {
  config: DirectoryConfig;
  record: DirectoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  optionMap: Record<OptionSource, DirectoryOption[]>;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => normalizeForm(record, config.fields));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(normalizeForm(record, config.fields));
  }, [config.fields, open, record]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(buildPayload(form, record));
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const getFieldOptions = (field: DirectoryField) => (field.optionsKey ? optionMap[field.optionsKey] ?? [] : []);

  const renderField = (field: DirectoryField) => {
    const value = form[field.key] ?? "";
    const options = getFieldOptions(field);

    if (field.type === "switch") {
      const checked = value === "1" || value === "true";
      return (
        <div className="flex h-11 items-center justify-between rounded-xl border border-[#e8e4f3] bg-white/80 px-4">
          <span className="text-sm text-slate-600">{checked ? "启用" : "禁用"}</span>
          <Switch
            checked={checked}
            onCheckedChange={(next) => setForm((current) => ({ ...current, [field.key]: next ? "1" : "0" }))}
          />
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <CinematicSelect
          value={value}
          onValueChange={(next) => setForm((current) => ({ ...current, [field.key]: next }))}
          options={options}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.type === "multiSelect") {
      return (
        <CinematicMultiSelect
          value={value}
          onValueChange={(next) => setForm((current) => ({ ...current, [field.key]: next }))}
          options={options}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.textarea || field.type === "textarea") {
      return (
        <Textarea
          value={value}
          onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
          placeholder={field.placeholder}
          readOnly={field.readonly}
          className="min-h-28 rounded-xl border-[#e8e4f3] bg-white/80 focus-visible:border-primary/45 focus-visible:ring-primary/15"
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
        placeholder={field.placeholder}
        readOnly={field.readonly}
        className={commonInputClass}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-white/80 bg-white/95 p-0 shadow-[0_28px_80px_rgba(87,63,168,0.18)]">
        <DialogHeader className="border-b border-[#eeeaf7] px-6 py-5">
          <DialogTitle className="text-xl font-semibold">{record ? `编辑${config.primaryName}` : `新增${config.primaryName}`}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          {config.fields.map((field) => (
            <div key={field.key} className={cn("space-y-2", field.textarea && "md:col-span-2")}>
              <Label className="text-sm font-medium text-slate-700">{field.label}</Label>
              {renderField(field)}
            </div>
          ))}
        </div>
        <DialogFooter className="border-t border-[#eeeaf7] px-6 py-4">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button className="rounded-xl" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({
  config,
  record,
  open,
  onOpenChange,
}: {
  config: DirectoryConfig;
  record: DirectoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-white/80 bg-white/95 p-0 shadow-[0_28px_80px_rgba(87,63,168,0.18)]">
        <DialogHeader className="border-b border-[#eeeaf7] px-6 py-5">
          <DialogTitle className="text-xl font-semibold">{config.primaryName}详情</DialogTitle>
        </DialogHeader>
        {record ? (
          <div className="space-y-5 px-6 py-5">
            <div className="rounded-2xl bg-[#f8f6fe] p-4">
              <p className="text-sm text-muted-foreground">{config.primaryName}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{getDisplayName(record)}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {detailPairs(record).map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#eeeaf7] bg-white px-4 py-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export const directoryConfigs: Record<DirectoryKind, DirectoryConfig> = {
  subject: {
    kind: "subject",
    title: "科目管理",
    description: "维护学校课程科目，统一支撑教师分配、学生学习档案与课程内容配置。",
    eyebrow: "校园管理",
    listTitle: "科目列表",
    searchPlaceholder: "搜索科目名称",
    icon: BookOpenCheck,
    primaryName: "科目",
    secondaryName: "教学科目",
    createEnabled: true,
    fields: [
      { key: "name", label: "科目名称", placeholder: "例如：乐理、视唱、英语" },
    ],
    fetchList: fetchSubjectList,
    fetchDetail: fetchSubjectDetail,
    create: createSubject,
    update: updateSubject,
  },
  teacher: {
    kind: "teacher",
    title: "教师管理",
    description: "管理教师档案、任教信息与账号状态，保证校园日常教学协作稳定运行。",
    eyebrow: "校园管理",
    listTitle: "教师列表",
    searchPlaceholder: "搜索教师姓名、手机号或任教科目",
    icon: UserRound,
    primaryName: "教师",
    secondaryName: "教师档案",
    fields: [
      { key: "no", label: "教师工号", placeholder: "例如：T00000001" },
      { key: "campusId", label: "所在校区", placeholder: "选择校区", type: "select", optionsKey: "campuses" },
      { key: "subjetIds", label: "任教科目", placeholder: "选择任教科目", type: "multiSelect", optionsKey: "subjects" },
      { key: "roles", label: "角色", placeholder: "选择教师角色", type: "multiSelect", optionsKey: "roles" },
      { key: "dormitoryBuildingIds", label: "宿舍楼", placeholder: "选择宿舍楼", type: "multiSelect", optionsKey: "dormitories" },
    ],
    fetchList: fetchTeacherList,
    fetchDetail: fetchTeacherDetail,
    update: updateTeacher,
    updateStatus: updateTeacherStatus,
  },
  student: {
    kind: "student",
    title: "学生管理",
    description: "集中查看学生档案、班级归属、账号状态与基础学习信息。",
    eyebrow: "校园管理",
    listTitle: "学生列表",
    searchPlaceholder: "搜索学生姓名、学号、手机号或班级",
    icon: GraduationCap,
    primaryName: "学生",
    secondaryName: "学生档案",
    fields: [
      { key: "no", label: "学号", placeholder: "例如：A666666" },
      { key: "campusId", label: "所在校区", placeholder: "选择校区", type: "select", optionsKey: "campuses" },
      { key: "studentStatus", label: "学籍状态", placeholder: "选择学籍状态", type: "select", optionsKey: "studentStatus" },
    ],
    fetchList: fetchStudentList,
    fetchDetail: fetchStudentDetail,
    update: updateStudent,
    updateStatus: updateStudentStatus,
  },
};

export function SchoolDirectoryManager({ kind }: { kind: DirectoryKind }) {
  const config = directoryConfigs[kind];
  const token = useAuthStore((state) => state.token);
  const [records, setRecords] = useState<DirectoryRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DirectoryRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<DirectoryRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [optionMap, setOptionMap] = useState<Record<OptionSource, DirectoryOption[]>>({
    campuses: [],
    subjects: [],
    roles: ROLE_OPTIONS,
    dormitories: [],
    studentStatus: STUDENT_STATUS_OPTIONS,
  });

  const loadRecords = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await config.fetchList({ current: page, size: PAGE_SIZE, keyword, name: keyword }, token);
      setRecords(result.records ?? []);
      setTotal(result.total ?? 0);
      setPages(result.pages ?? Math.max(1, Math.ceil((result.total ?? 0) / PAGE_SIZE)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "列表加载失败");
    } finally {
      setLoading(false);
    }
  }, [config, keyword, page, token]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    setPage(1);
  }, [keyword, kind]);

  useEffect(() => {
    if (!token || (kind !== "teacher" && kind !== "student")) return;

    let ignore = false;
    const requests =
      kind === "teacher"
        ? Promise.all([
            fetchCampusList({ current: 1, size: 200 }, token),
            fetchSubjectList({ current: 1, size: 200 }, token),
            fetchDormitoryBuildingList({ current: 1, size: 200 }, token),
          ])
        : Promise.all([
            fetchCampusList({ current: 1, size: 200 }, token),
            Promise.resolve({ records: [] as DirectoryRecord[] }),
            Promise.resolve({ records: [] as DirectoryRecord[] }),
          ]);

    requests
      .then(([campusResult, subjectResult, dormitoryResult]) => {
        if (ignore) return;
        setOptionMap({
          campuses: toOptions(campusResult.records as DirectoryRecord[]),
          subjects: toOptions(subjectResult.records as DirectoryRecord[]),
          roles: ROLE_OPTIONS,
          dormitories: toOptions(dormitoryResult.records as DirectoryRecord[]),
          studentStatus: STUDENT_STATUS_OPTIONS,
        });
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "教师编辑选项加载失败");
      });

    return () => {
      ignore = true;
    };
  }, [kind, token]);

  const stats = useMemo(() => {
    const enabled = records.filter(isEnabled).length;
    return {
      total,
      enabled,
      disabled: Math.max(0, records.length - enabled),
      currentPage: records.length,
    };
  }, [records, total]);

  const openDetail = async (record: DirectoryRecord) => {
    if (!token) return;
    setDetailOpen(true);
    setDetailRecord(record);
    try {
      const detail = await config.fetchDetail(record.id, token);
      setDetailRecord({ ...record, ...detail });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "详情加载失败");
    }
  };

  const openEditor = async (record?: DirectoryRecord) => {
    if (!record) {
      setCreating(true);
      setEditingRecord(null);
      setEditorOpen(true);
      return;
    }
    if (!token) return;
    setCreating(false);
    setEditingRecord(record);
    setEditorOpen(true);
    try {
      const detail = await config.fetchDetail(record.id, token);
      setEditingRecord({ ...record, ...detail });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "详情加载失败");
    }
  };

  const submitEditor = async (payload: Record<string, unknown>) => {
    if (!token) return;
    const request = creating ? config.create : config.update;
    if (!request) return;
    await request(normalizeSubmitPayload(config, payload), token);
    toast.success(creating ? "新增成功" : "保存成功");
    await loadRecords();
  };

  const toggleStatus = async (record: DirectoryRecord) => {
    if (!token) return;
    const nextStatus = isEnabled(record) ? 0 : 1;
    try {
      if (config.updateStatus) {
        await config.updateStatus({ id: record.id, status: nextStatus }, token);
      } else {
        await config.update({ ...record, status: nextStatus }, token);
      }
      toast.success(nextStatus === 1 ? "已启用" : "已禁用");
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "状态更新失败");
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#fbfaff_55%,#f6f2ff_100%)] px-6 py-6 shadow-[0_22px_70px_rgba(90,67,160,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">{config.eyebrow}</Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{config.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{config.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-11 rounded-xl border-[#e8e4f3] bg-white/80" onClick={loadRecords} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              刷新
            </Button>
            {config.createEnabled ? (
              <Button className="h-11 rounded-xl" onClick={() => openEditor()}>
                <Plus className="size-4" />
                新增{config.primaryName}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={config.icon} label={`${config.primaryName}总数`} value={String(stats.total)} hint="接口返回总量" />
        <MetricCard icon={CheckCircle2} label="启用中" value={String(stats.enabled)} hint="当前页可用账号" />
        <MetricCard icon={SlidersHorizontal} label="已禁用" value={String(stats.disabled)} hint="当前页停用记录" />
        <MetricCard icon={UsersRound} label="本页记录" value={String(stats.currentPage)} hint={`第 ${page} 页数据`} />
      </section>

      <PanelCard className="rounded-[28px] p-0">
        <div className="border-b border-[#eeeaf7] px-5 py-5">
          <SectionHeading
            title={config.listTitle}
            description="数据来自智慧校园 v2 接口，操作会直接同步到后台服务。"
            action={
              <div className="relative w-full min-w-[260px] sm:w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="h-11 rounded-xl border-[#e8e4f3] bg-white pl-9"
                  placeholder={config.searchPlaceholder}
                />
              </div>
            }
          />
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            正在加载数据
          </div>
        ) : records.length === 0 ? (
          <div className="p-5">
            <EmptyPanel title="暂无数据" description="当前接口没有返回记录，可以调整关键词或刷新后再试。" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#eeeaf7] bg-[#fbfaff] hover:bg-[#fbfaff]">
                    <TableHead className="min-w-[180px] px-5 py-4">{config.primaryName}名称</TableHead>
                    <TableHead className="min-w-[160px] px-5 py-4">{getInfoColumnLabel(config.kind)}</TableHead>
                    {config.kind === "teacher" ? <TableHead className="min-w-[140px] px-5 py-4">手机号</TableHead> : null}
                    <TableHead className="min-w-[120px] px-5 py-4">状态</TableHead>
                    <TableHead className="min-w-[150px] px-5 py-4">{getDateColumnLabel(config.kind)}</TableHead>
                    <TableHead className="min-w-[220px] px-5 py-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const enabled = isEnabled(record);
                    return (
                      <TableRow key={String(record.id)} className="border-[#f0edf7] hover:bg-[#fbfaff]/70">
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <config.icon className="size-4" />
                            </span>
                            <div>
                              <p className="font-semibold text-slate-950">{getDisplayName(record)}</p>
                              <p className="text-xs text-muted-foreground">ID {textOf(record.id)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800">
                            {getPrimaryInfo(record, config.kind)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getSecondaryInfo(record, config.kind)}
                          </p>
                        </TableCell>
                        {config.kind === "teacher" ? (
                          <TableCell className="px-5 py-4">
                            <span className="rounded-full bg-[#f7f4ff] px-3 py-1.5 text-sm font-medium text-slate-800">
                              {getMobileInfo(record)}
                            </span>
                          </TableCell>
                        ) : null}
                        <TableCell className="px-5 py-4">
                          <div className="flex w-fit items-center gap-2 rounded-xl border border-[#e8e4f3] bg-white px-3 py-2">
                            <Switch checked={enabled} onCheckedChange={() => toggleStatus(record)} />
                            <span className="text-xs font-medium text-muted-foreground">{enabled ? "启用" : "禁用"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                          {config.kind === "subject" ? pickFirst(record, ["createTime"], "-") : pickFirst(record, ["updateTime", "createTime"], "-")}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openDetail(record)}>
                              <Eye className="size-4" />
                              详情
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEditor(record)}>
                              <Pencil className="size-4" />
                              编辑
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#eeeaf7] px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                共 <b className="text-slate-950">{total}</b> 条，当前第 <b className="text-slate-950">{page}</b> / {pages} 页
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  上一页
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= pages} onClick={() => setPage((current) => Math.min(pages, current + 1))}>
                  下一页
                </Button>
              </div>
            </div>
          </>
        )}
      </PanelCard>

      <DirectoryEditor config={config} record={editingRecord} open={editorOpen} onOpenChange={setEditorOpen} onSubmit={submitEditor} optionMap={optionMap} />
      <DetailDialog config={config} record={detailRecord} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
