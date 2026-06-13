"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BadgeCheck, Clock3, Eye, Search, ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";
import { toast } from "sonner";

import { CinematicSelect } from "@/components/dashboard/cinematic-select";
import { EmptyPanel, MetricCard, ModuleHero, PanelCard, SectionHeading, StatusBadge } from "@/components/dashboard/module-kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { auditSchoolUsers, fetchUserAuditDetail, fetchUserAuditList } from "@/lib/api/business";
import type { SchoolUserAuditRecord } from "@/lib/api/contracts";
import { useAuthStore } from "@/stores/auth-store";

const STATUS_MAP: Record<string, { label: string; tone: "warning" | "success" | "danger" }> = {
  "0": { label: "待审核", tone: "warning" },
  "1": { label: "已通过", tone: "success" },
  "2": { label: "已拒绝", tone: "danger" },
};

const ROLE_OPTIONS = [
  { value: "student", label: "学生" },
  { value: "teacher", label: "教师" },
];

type AuditDraft = {
  record: SchoolUserAuditRecord;
  status: 1 | 2;
  role: string;
  reason: string;
};

function getUserName(record: SchoolUserAuditRecord) {
  return record.realname || record.realName || record.nickname || record.user?.nickname || `用户 ${record.userId ?? record.id}`;
}

function getUserMobile(record: SchoolUserAuditRecord) {
  return record.mobile || record.user?.mobile || "暂无手机号";
}

function getRoleLabel(role?: string) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label ?? "未分配";
}

export function RealNameManager() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<SchoolUserAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ keyword: "", status: "all" });
  const [auditDraft, setAuditDraft] = useState<AuditDraft | null>(null);
  const [detail, setDetail] = useState<SchoolUserAuditRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetchUserAuditList(
        {
          current: page,
          size: pageSize,
          keyword: filters.keyword || undefined,
          status: filters.status === "all" ? undefined : Number(filters.status),
        },
        token,
      );
      setItems(response.records ?? []);
      setTotal(Number(response.total ?? 0));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "审核列表加载失败。");
    } finally {
      setLoading(false);
    }
  }, [filters.keyword, filters.status, page, pageSize, token]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const metrics = useMemo(() => {
    const pending = items.filter((item) => Number(item.status ?? 0) === 0).length;
    const passed = items.filter((item) => Number(item.status ?? 0) === 1).length;
    const rejected = items.filter((item) => Number(item.status ?? 0) === 2).length;

    return [
      { icon: ShieldCheck, label: "审核总量", value: String(total || items.length), hint: "当前筛选条件下的用户申请" },
      { icon: Clock3, label: "待审核", value: String(pending), hint: "建议优先处理新加入用户" },
      { icon: BadgeCheck, label: "已通过", value: String(passed), hint: "通过后按角色进入校园体系" },
      { icon: UserRoundX, label: "已拒绝", value: String(rejected), hint: "拒绝原因会回写给申请用户" },
    ];
  }, [items, total]);

  const openAuditDialog = (record: SchoolUserAuditRecord, status: 1 | 2) => {
    setAuditDraft({
      record,
      status,
      role: record.role === "teacher" ? "teacher" : "student",
      reason: status === 1 ? "ok" : (record.reason ?? ""),
    });
  };

  const submitAudit = async () => {
    if (!token || !auditDraft) return;
    if (auditDraft.status === 2 && !auditDraft.reason.trim()) {
      toast.error("请填写拒绝原因。");
      return;
    }

    setSubmitting(true);
    try {
      await auditSchoolUsers(
        {
          ids: [auditDraft.record.id],
          reason: auditDraft.reason.trim() || "ok",
          role: auditDraft.role,
          status: auditDraft.status,
        },
        token,
      );
      toast.success(auditDraft.status === 1 ? "已通过用户审核。" : "已拒绝用户申请。");
      setAuditDraft(null);
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "审核操作失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (record: SchoolUserAuditRecord) => {
    if (!token) return;
    try {
      const nextDetail = await fetchUserAuditDetail(record.id, token);
      setDetail(nextDetail || record);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "详情加载失败。");
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHero
        title="审核管理"
        eyebrow="用户审核工作台"
        description="集中处理用户加入学校的审核申请，按学生或教师身份完成通过、拒绝与原因回写。"
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <PanelCard>
        <SectionHeading title="用户审核列表" description="每次操作都会单独调用审核接口，避免一次性保存造成状态不一致。" />

        <div className="mb-5 grid gap-3 rounded-[1.5rem] bg-[#f7f4ff] p-4 md:grid-cols-[1fr_220px_auto]">
          <Input
            value={filters.keyword}
            onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
            placeholder="搜索用户 ID、昵称或手机号"
            className="h-11 rounded-full border-white bg-white/90"
          />
          <CinematicSelect
            value={filters.status}
            onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
            options={[
              { value: "all", label: "全部状态" },
              { value: "0", label: "待审核" },
              { value: "1", label: "已通过" },
              { value: "2", label: "已拒绝" },
            ]}
            placeholder="选择状态"
          />
          <Button
            className="rounded-full px-5"
            onClick={() => {
              setPage(1);
              void fetchItems();
            }}
          >
            <Search className="size-4" />
            查询
          </Button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/88">
          <Table>
            <TableHeader className="bg-[#faf8ff]">
              <TableRow className="border-white/70 hover:bg-transparent">
                <TableHead className="px-4">申请用户</TableHead>
                <TableHead>用户 ID</TableHead>
                <TableHead>学校 ID</TableHead>
                <TableHead>建议身份</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead>拒绝原因</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const status = STATUS_MAP[String(item.status ?? 0)] ?? STATUS_MAP["0"];
                const isPending = Number(item.status ?? 0) === 0;

                return (
                  <TableRow key={item.id} className="border-white/70">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[inset_0_1px_8px_rgba(132,78,255,0.16)]">
                          <UserRoundCheck className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{getUserName(item)}</p>
                          <p className="text-sm text-muted-foreground">{getUserMobile(item)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.userId ?? "-"}</TableCell>
                    <TableCell>{item.schoolId ?? "-"}</TableCell>
                    <TableCell>{getRoleLabel(item.role)}</TableCell>
                    <TableCell>{item.createTime ?? "-"}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{item.reason || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="rounded-full border-white/80 bg-white/90" onClick={() => void openDetail(item)}>
                          <Eye className="size-4" />
                          详情
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                          onClick={() => openAuditDialog(item, 1)}
                          disabled={!isPending}
                        >
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full border-rose-200 bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => openAuditDialog(item, 2)}
                          disabled={!isPending}
                        >
                          拒绝
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!items.length && !loading ? (
                <TableRow className="border-white/70">
                  <TableCell colSpan={8} className="px-4 py-12">
                    <EmptyPanel title="暂无用户审核申请" description="当前筛选条件下没有待处理的用户加入学校记录。" />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            共 {total} 条审核记录，每页 {pageSize} 条
          </p>
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

      <Dialog open={Boolean(auditDraft)} onOpenChange={(open) => !open && setAuditDraft(null)}>
        <DialogContent className="rounded-[2rem] border-white/75 bg-white/95 shadow-[0_30px_90px_rgba(41,34,70,0.22)] backdrop-blur-2xl sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{auditDraft?.status === 1 ? "通过用户审核" : "拒绝用户申请"}</DialogTitle>
          </DialogHeader>
          {auditDraft ? (
            <div className="space-y-5 px-6 py-5">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-[linear-gradient(135deg,rgba(247,244,255,0.96),rgba(255,255,255,0.92))] p-4 shadow-[0_14px_36px_rgba(132,78,255,0.08),0_1px_0_rgba(255,255,255,0.9)_inset]">
                <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">申请用户</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{getUserName(auditDraft.record)}</p>
                <p className="mt-1 text-sm text-muted-foreground">用户 ID：{auditDraft.record.userId ?? auditDraft.record.id}</p>
              </div>
              <div className="space-y-2.5">
                <Label className="text-sm font-medium text-slate-700">分配身份</Label>
                <CinematicSelect value={auditDraft.role} onValueChange={(role) => setAuditDraft((current) => (current ? { ...current, role } : current))} options={ROLE_OPTIONS} />
              </div>
              <div className="space-y-2.5">
                <Label className="text-sm font-medium text-slate-700">{auditDraft.status === 1 ? "审核备注" : "拒绝原因"}</Label>
                <Textarea
                  value={auditDraft.reason}
                  onChange={(event) => setAuditDraft((current) => (current ? { ...current, reason: event.target.value } : current))}
                  placeholder={auditDraft.status === 1 ? "默认提交 ok" : "请输入拒绝原因"}
                  className="min-h-28 resize-none rounded-[1.5rem] border-[#e8e4f3] bg-white/92 px-4 py-3 text-sm shadow-[0_1px_0_rgba(255,255,255,0.86)_inset,0_10px_28px_rgba(82,62,145,0.04)] focus-visible:border-primary/45 focus-visible:ring-primary/15"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="px-6 py-5 [&_[data-slot=button]]:h-11 [&_[data-slot=button]]:rounded-full [&_[data-slot=button]]:px-6">
            <Button variant="outline" className="border-[#ece8f8] bg-white/90 text-slate-700 hover:bg-white" onClick={() => setAuditDraft(null)}>
              取消
            </Button>
            <Button className="min-w-28 shadow-[0_12px_28px_rgba(132,78,255,0.28)]" onClick={() => void submitAudit()} disabled={submitting}>
              {submitting ? "提交中..." : "确认审核"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="rounded-[2rem] border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(36,29,71,0.18)] backdrop-blur-2xl sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>审核详情</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="grid gap-3 rounded-[1.5rem] bg-[#f7f4ff] p-4 text-sm md:grid-cols-2">
              <InfoItem label="记录 ID" value={detail.id} />
              <InfoItem label="用户 ID" value={detail.userId} />
              <InfoItem label="学校 ID" value={detail.schoolId} />
              <InfoItem label="归档 ID" value={detail.archiveId} />
              <InfoItem label="状态" value={STATUS_MAP[String(detail.status ?? 0)]?.label ?? "未知"} />
              <InfoItem label="申请时间" value={detail.createTime} />
              <InfoItem label="拒绝原因" value={detail.reason || "-"} wide />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ label, value, wide }: { label: string; value: unknown; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 rounded-2xl bg-white/90 px-3 py-2 font-medium text-foreground">{value == null || value === "" ? "-" : String(value)}</p>
    </div>
  );
}
