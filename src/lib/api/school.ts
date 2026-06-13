"use client";

import { apiPost, uploadFile } from "@/lib/api/client";
import type { LoginPayload, LoginResponse, UserProfile } from "@/lib/api/contracts";

export function loginSchool(payload: LoginPayload) {
  return apiPost<LoginResponse>("/school/auth/login", payload);
}

export function getMyInfo(token: string) {
  return apiPost<UserProfile>("/school/auth/getMyInfo", {}, token);
}

export function updateLogo(logo: string, token: string) {
  return apiPost("/school/auth/updateLogo", { logo }, token);
}

export function updateCoursewareSwitch(coursewareSwitch: boolean, token: string) {
  return apiPost("/school/auth/updateCoursewareSwitch", { coursewareSwitch }, token);
}

export function updateHomepage(payload: { htmlContent: string; config?: string }, token: string) {
  return apiPost("/school/auth/updateHomepage", payload, token);
}

export function uploadBrandAsset(file: File, token: string) {
  return uploadFile(file, token);
}
