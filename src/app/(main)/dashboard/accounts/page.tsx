"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ClipboardList,
  Disc3,
  Eye,
  Headphones,
  Image,
  ListChecks,
  Loader2,
  Mic2,
  Music4,
  Newspaper,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
  Users2,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { CinematicMultiSelect } from "@/components/dashboard/cinematic-select";
import { EmptyPanel, MetricCard, PanelCard, SectionHeading, StatusBadge } from "@/components/dashboard/module-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SchoolManagerRecord } from "@/lib/api/contracts";
import { createManager, fetchManagerDetail, fetchManagerList, updateManager } from "@/lib/api/business";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const PERMISSION_OPTIONS = [
  { value: "video", label: "视频管理", icon: Video },
  { value: "dictation", label: "听写管理", icon: Headphones },
  { value: "sightSinging", label: "视唱管理", icon: Music4 },
  { value: "theory", label: "乐理管理", icon: ClipboardList },
  { value: "instrumental", label: "器乐管理", icon: Disc3 },
  { value: "vocal", label: "声乐管理", icon: Mic2 },
  { value: "answer", label: "答题管理", icon: Sparkles },
  { value: "brushQuestions", label: "刷题管理", icon: ListChecks },
  { value: "campus", label: "校园管理", icon: ShieldCheck },
  { value: "banner", label: "Banner管理", icon: Image },
  { value: "news", label: "资讯列表", icon: Newspaper },
  { value: "exam", label: "考试管理", icon: ClipboardList },
  { value: "audit", label: "审核管理", icon: ShieldCheck },
] as const;

type AccountForm = {
  id?: string | number;
  loginUser: string;
  loginPwd: string;
  nickname: string;
  permissions: string;
  enableStatus: string;
};

const emptyForm: AccountForm = {
  loginUser: "",
  loginPwd: "",
  nickname: "",
  permissions: "",
  enableStatus: "1",
};

function splitPermissions(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildForm(record?: SchoolManagerRecord | null): AccountForm {
  if (!record) return emptyForm;
  return {
    id: record.id,
    loginUser: record.loginUser ?? "",
    loginPwd: record.loginPwd ?? "",
    nickname: record.nickname ?? "",
    permissions: record.permissions ?? "",
    enableStatus: String(record.enableStatus ?? 1),
  };
}

function buildPayload(form: AccountForm) {
  const payload: Record<string, unknown> = {
    loginUser: form.loginUser.trim(),
    loginPwd: form.loginPwd.trim(),
    nickname: form.nickname.trim(),
    permissions: form.permissions,
    enableStatus: Number(form.enableStatus),
  };
  if (form.id !== undefined) payload.id = form.id;
  return payload;
}

function AccountEditor({
  open,
  record,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  record: SchoolManagerRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(buildForm(record));
  }, [open, record]);

  const submit = async () => {
    if (!form.loginUser.trim() || !form.loginPwd.trim() || !form.nickname.trim()) {
      toast.error("请填写登录账户、密码和昵称");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(buildPayload(form));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record ? "编辑账号" : "新增账号"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>登录账户</Label>
            <Input value={form.loginUser} onChange={(event) => setForm((current) => ({ ...current, loginUser: event.target.value }))} className="h-11 rounded-xl border-[#e8e4f3] bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label>登录密码</Label>
            <Input value={form.loginPwd} onChange={(event) => setForm((current) => ({ ...current, loginPwd: event.target.value }))} className="h-11 rounded-xl border-[#e8e4f3] bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label>昵称</Label>
            <Input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} className="h-11 rounded-xl border-[#e8e4f3] bg-white/80" />
          </div>
          <div className="space-y-2">
            <Label>启用状态</Label>
            <div className="flex h-11 items-center justify-between rounded-xl border border-[#e8e4f3] bg-white/80 px-4">
              <span className="text-sm text-slate-600">{Number(form.enableStatus) === 1 ? "启用" : "禁用"}</span>
              <Switch checked={Number(form.enableStatus) === 1} onCheckedChange={(checked) => setForm((current) => ({ ...current, enableStatus: checked ? "1" : "0" }))} />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>权限配置</Label>
            <CinematicMultiSelect
              value={form.permissions}
              onValueChange={(value) => setForm((current) => ({ ...current, permissions: value }))}
              options={PERMISSION_OPTIONS.map(({ value, label }) => ({ value, label }))}
              placeholder="选择权限"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({ record, open, onOpenChange }: { record: SchoolManagerRecord | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>账号详情</DialogTitle>
        </DialogHeader>
        {record ? (
          <div className="grid gap-3 px-6 py-5 md:grid-cols-2">
            {[
              ["昵称", record.nickname],
              ["登录账户", record.loginUser],
              ["登录密码", record.loginPwd],
              ["启用状态", record.enableStatus === 1 ? "启用" : "禁用"],
              ["是否超管", record.isSuperAdmin === 1 ? "是" : "否"],
              ["学校 ID", record.schoolId],
              ["权限配置", record.permissions],
              ["创建时间", record.createTime],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-[#eeeaf7] bg-white px-4 py-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">{String(value ?? "-")}</p>
              </div>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function AccountsPage() {
  const token = useAuthStore((state) => state.token);
  const [accounts, setAccounts] = useState<SchoolManagerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SchoolManagerRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<SchoolManagerRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await fetchManagerList({ current: 1, size: 100 }, token);
      setAccounts(result.records ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "账号列表加载失败");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const stats = useMemo(() => {
    const enabled = accounts.filter((item) => item.enableStatus === 1).length;
    const superAdmins = accounts.filter((item) => item.isSuperAdmin === 1).length;
    return { total: accounts.length, enabled, disabled: accounts.length - enabled, superAdmins };
  }, [accounts]);

  const permissionCoverage = useMemo(
    () =>
      PERMISSION_OPTIONS.map((item) => ({
        ...item,
        count: accounts.filter((account) => splitPermissions(account.permissions).includes(item.value)).length,
      })),
    [accounts],
  );

  const openCreate = () => {
    setEditingRecord(null);
    setEditorOpen(true);
  };

  const openEdit = async (record: SchoolManagerRecord) => {
    if (!token) return;
    setEditingRecord(record);
    setEditorOpen(true);
    try {
      const detail = await fetchManagerDetail(record.id, token);
      setEditingRecord({ ...record, ...detail });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "详情加载失败");
    }
  };

  const openDetail = async (record: SchoolManagerRecord) => {
    if (!token) return;
    setDetailRecord(record);
    setDetailOpen(true);
    try {
      const detail = await fetchManagerDetail(record.id, token);
      setDetailRecord({ ...record, ...detail });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "详情加载失败");
    }
  };

  const submitAccount = async (payload: Record<string, unknown>) => {
    if (!token) return;
    if ("id" in payload) {
      await updateManager(payload, token);
      toast.success("账号已更新");
    } else {
      await createManager(payload, token);
      toast.success("账号已新增");
    }
    await loadAccounts();
  };

  const toggleStatus = async (record: SchoolManagerRecord) => {
    if (!token) return;
    const payload = {
      id: record.id,
      loginUser: record.loginUser ?? "",
      loginPwd: record.loginPwd ?? "",
      nickname: record.nickname ?? "",
      permissions: record.permissions ?? "",
      enableStatus: record.enableStatus === 1 ? 0 : 1,
    };
    await updateManager(payload, token);
    toast.success(payload.enableStatus === 1 ? "账号已启用" : "账号已禁用");
    await loadAccounts();
  };

  return (
    <div className="space-y-4 pb-4 lg:space-y-5 lg:pb-5">
      <section className="rounded-[2.1rem] border border-[#f0eef8] bg-white px-5 py-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:px-6 lg:py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">账号管理</Badge>
            <Badge className="rounded-full border border-[#f0eef8] bg-white px-3 py-1 text-foreground hover:bg-white">School Manager</Badge>
            <Badge className="rounded-full border border-[#f0eef8] bg-white px-3 py-1 text-foreground hover:bg-white">权限独立配置</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-10 rounded-full border-[#f0eef8] bg-white" onClick={loadAccounts} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              刷新
            </Button>
            <Button className="h-10 rounded-full" onClick={openCreate}>
              <Plus className="size-4" />
              新增账号
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users2} label="账号总数" value={String(stats.total)} hint="manager/list" />
        <MetricCard icon={ShieldCheck} label="超级管理员" value={String(stats.superAdmins)} hint="拥有全部权限" />
        <MetricCard icon={UserRoundCog} label="启用中" value={String(stats.enabled)} hint="可正常登录" />
        <MetricCard icon={Sparkles} label="已禁用" value={String(stats.disabled)} hint="暂不可用" />
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <PanelCard>
          <SectionHeading title="新增账号" description="按登录账户、密码、昵称和权限配置创建学校后台账号。" />
          <Button onClick={openCreate} className="h-11 w-full rounded-full">
            <Plus className="size-4" />
            创建账号
          </Button>
        </PanelCard>

        <PanelCard>
          <SectionHeading title="权限覆盖" />
          <div className="grid gap-3 sm:grid-cols-2">
            {permissionCoverage.map((item) => (
              <div key={item.value} className="rounded-[1.2rem] border border-[#f0eef8] bg-[#fcfcfe] px-4 py-4">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{item.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">拥有该权限的账号数</p>
              </div>
            ))}
          </div>
        </PanelCard>
      </section>

      <PanelCard className="p-0">
        <div className="border-b border-[#eeeaf7] px-5 py-5">
          <SectionHeading title="账号列表" description="列表、详情、新增和编辑均使用 School Manager 接口。" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#eeeaf7] bg-[#fbfaff] hover:bg-[#fbfaff]">
                <TableHead className="min-w-[180px] px-5 py-4">账号</TableHead>
                <TableHead className="min-w-[160px] px-5 py-4">昵称</TableHead>
                <TableHead className="min-w-[120px] px-5 py-4">状态</TableHead>
                <TableHead className="min-w-[220px] px-5 py-4">权限</TableHead>
                <TableHead className="min-w-[150px] px-5 py-4">创建时间</TableHead>
                <TableHead className="min-w-[220px] px-5 py-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    正在加载账号
                  </TableCell>
                </TableRow>
              ) : accounts.length ? (
                accounts.map((item) => {
                  const enabled = item.enableStatus === 1;
                  const permissions = splitPermissions(item.permissions);
                  return (
                    <TableRow key={String(item.id)} className="border-[#f0edf7] hover:bg-[#fbfaff]/70">
                      <TableCell className="px-5 py-4">
                        <p className="font-semibold text-slate-950">{item.loginUser ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">ID {item.id}</p>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-slate-700">{item.nickname ?? "-"}</TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex w-fit items-center gap-2 rounded-xl border border-[#e8e4f3] bg-white px-3 py-2">
                          <Switch checked={enabled} disabled={item.isSuperAdmin === 1} onCheckedChange={() => toggleStatus(item)} />
                          <span className="text-xs font-medium text-muted-foreground">{enabled ? "启用" : "禁用"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex max-w-[320px] flex-wrap gap-1.5">
                          {item.isSuperAdmin === 1 ? <StatusBadge tone="brand">超级管理员</StatusBadge> : null}
                          {permissions.slice(0, 4).map((permission) => (
                            <span key={permission} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              {PERMISSION_OPTIONS.find((option) => option.value === permission)?.label ?? permission}
                            </span>
                          ))}
                          {permissions.length > 4 ? <span className="rounded-full bg-[#f5f6fa] px-2.5 py-1 text-xs text-muted-foreground">+{permissions.length - 4}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-muted-foreground">{item.createTime ?? "-"}</TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openDetail(item)}>
                            <Eye className="size-4" />
                            详情
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEdit(item)}>
                            <Pencil className="size-4" />
                            编辑
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-5">
                    <EmptyPanel title="暂无账号" description="当前学校还没有返回后台账号数据。" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </PanelCard>

      <AccountEditor open={editorOpen} record={editingRecord} onOpenChange={setEditorOpen} onSubmit={submitAccount} />
      <DetailDialog open={detailOpen} record={detailRecord} onOpenChange={setDetailOpen} />
    </div>
  );
}
