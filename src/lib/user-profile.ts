import type { SchoolProfile, UserProfile } from "@/lib/api/contracts";

export function getSchoolProfile(user?: UserProfile | null): SchoolProfile {
  if (!user) return {};
  if (user.school && typeof user.school === "object") {
    return user.school as SchoolProfile;
  }
  return {};
}

export function getSchoolName(user?: UserProfile | null) {
  const school = getSchoolProfile(user);
  return school.name || user?.user?.nickname || user?.realName || user?.username || "音乐之路";
}

export function getSchoolAccount(user?: UserProfile | null) {
  const school = getSchoolProfile(user);
  return school.loginUser || user?.user?.loginUser || user?.username || "未绑定账号";
}

export function getManagerName(user?: UserProfile | null) {
  return user?.user?.nickname || user?.realName || user?.username || "管理员";
}

export function getManagerPermissions(user?: UserProfile | null) {
  return (user?.user?.permissions ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isSuperAdmin(user?: UserProfile | null) {
  return user?.user?.isSuperAdmin === 1;
}
