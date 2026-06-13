"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";

import { ImageUp, Power, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getMyInfo, updateCoursewareSwitch, updateLogo, uploadBrandAsset } from "@/lib/api/school";
import { getSchoolName, getSchoolProfile } from "@/lib/user-profile";
import { useAuthStore } from "@/stores/auth-store";

export default function BrandInfoPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [uploading, setUploading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const school = useMemo(() => getSchoolProfile(user), [user]);
  const schoolName = getSchoolName(user) || "校园 APP";
  const coursewareEnabled = Boolean(school.coursewareSwitch);
  const logo = (school.logo as string | undefined) || "/brand/logo.png";

  useEffect(() => {
    if (!token) return;
    void getMyInfo(token)
      .then((profile) => setUser(profile))
      .catch(() => undefined);
  }, [setUser, token]);

  const refreshProfile = async () => {
    if (!token) return;
    const profile = await getMyInfo(token);
    setUser(profile);
  };

  const onSelectLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片格式的 Logo。");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const uploadUrl = await uploadBrandAsset(file, token);
      await updateLogo(uploadUrl, token);
      await refreshProfile();
      toast.success("APP Logo 已更新。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logo 上传失败，请稍后重试。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onToggleCourseware = async (checked: boolean) => {
    if (!token) return;
    try {
      setToggling(true);
      await updateCoursewareSwitch(checked, token);
      await refreshProfile();
      toast.success(checked ? "校园课件已打开。" : "校园课件已关闭。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "状态更新失败，请稍后重试。");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-4 pb-4 lg:space-y-5 lg:pb-5">
      <section className="rounded-[2rem] border border-[#f0eef8] bg-white px-5 py-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:px-6 lg:py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">APP信息</h1>
            <p className="mt-1 text-sm text-muted-foreground">维护应用展示 Logo 与校园课件入口状态。</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            {schoolName}
          </span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
        <article className="rounded-[2rem] border border-[#f0eef8] bg-white p-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">APP Logo</h2>
              <p className="mt-1 text-sm text-muted-foreground">用于 APP、后台侧栏与品牌展示。</p>
            </div>
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-full">
              <ImageUp className="size-4" />
              {uploading ? "上传中" : "更新 Logo"}
            </Button>
          </div>

          <div className="mt-6 rounded-[1.65rem] border border-[#f0eef8] bg-[#fcfcfe] p-6">
            <div className="flex min-h-40 items-center justify-center rounded-[1.4rem] bg-white p-6 shadow-inner">
              {logo.startsWith("/") ? (
                <Image src={logo} alt={schoolName} width={260} height={120} className="h-auto max-h-28 w-auto max-w-[260px] object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={schoolName} className="max-h-28 max-w-[260px] object-contain" />
              )}
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">建议上传透明背景 PNG 或清晰横向 Logo，更新后立即同步到当前学校账号。</p>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onSelectLogo} />
        </article>

        <article className="rounded-[2rem] border border-[#f0eef8] bg-white p-5 shadow-[0_16px_44px_rgba(103,79,194,0.05)] lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">校园课件</h2>
              <p className="mt-1 text-sm text-muted-foreground">控制 APP 是否展示校园课件入口。</p>
            </div>
            <Switch checked={coursewareEnabled} onCheckedChange={onToggleCourseware} disabled={toggling} />
          </div>

          <div className="mt-6 rounded-[1.65rem] border border-[#f0eef8] bg-[#fcfcfe] p-6">
            <div className="flex items-center gap-4">
              <span className={coursewareEnabled ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600" : "flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"}>
                <Power className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{coursewareEnabled ? "已打开" : "已关闭"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {coursewareEnabled ? "APP 端将展示校园课件入口。" : "APP 端暂不展示校园课件入口。"}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
