"use client";

import type { ApiEnvelope, LegacyApiResponse, UploadResponse } from "@/lib/api/contracts";
import { clearAuthCookie, clearAuthStorage } from "@/lib/auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://test-api.yyzl0931.com:9443").replace(/\/$/, "");
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL ?? `${API_BASE_URL}/school/auth/upload`;
const LOGIN_PATH = "/login";

function handleUnauthorized() {
  if (typeof window === "undefined") return;

  clearAuthCookie();
  clearAuthStorage();

  // 已经在登录页就不再重复跳转，避免 401 风暴
  if (window.location.pathname === LOGIN_PATH) return;

  window.location.replace(LOGIN_PATH);
}

function isUnauthorized(status: number, payload: LegacyApiResponse) {
  return status === 401 || payload.code === 401;
}

function normalizeRawPayload(payload: unknown): LegacyApiResponse {
  if (typeof payload === "string") {
    return normalizeRawPayload(JSON.parse(payload));
  }

  if (Array.isArray(payload)) {
    return {
      code: 0,
      data: payload,
    };
  }

  if (payload && typeof payload === "object" && "code" in payload) {
    return payload as LegacyApiResponse;
  }

  if (payload && typeof payload === "object") {
    return {
      code: 0,
      ...(payload as Record<string, unknown>),
    };
  }

  return {
    code: -1,
    msg: "接口返回格式异常",
    raw: payload,
  };
}

function unwrapPayloadData<T>(payload: LegacyApiResponse): ApiEnvelope<T> {
  if ("data" in payload && payload.data !== undefined) {
    return {
      ...payload,
      data: payload.data as T,
    };
  }

  const { code, msg, message, ...rest } = payload;
  return {
    code,
    msg,
    message,
    data: rest as T,
  };
}

async function parseRawResponse(response: Response) {
  const text = await response.text();
  const raw = text ? JSON.parse(text) : {};
  const payload = normalizeRawPayload(raw);

  // 401 / 未登录：全局清账号信息并跳登录页
  if (isUnauthorized(response.status, payload)) {
    handleUnauthorized();
    throw new Error(payload.msg || payload.message || "未登录");
  }

  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.msg || payload.message || "请求失败");
  }

  return payload;
}

async function postRequest(path: string, body?: unknown, token?: string | null, init?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json;charset=UTF-8" }),
      ...(token ? { "school-token": token } : {}),
      ...(init?.headers ?? {}),
    },
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    cache: "no-store",
    ...init,
  });
}

export async function apiPost<T>(path: string, body?: unknown, token?: string | null, init?: RequestInit) {
  const response = await postRequest(path, body, token, init);
  const payload = await parseRawResponse(response);
  return unwrapPayloadData<T>(payload).data;
}

export async function apiPostRaw<T extends LegacyApiResponse>(
  path: string,
  body?: unknown,
  token?: string | null,
  init?: RequestInit,
) {
  const response = await postRequest(path, body, token, init);
  const payload = await parseRawResponse(response);
  return payload as T;
}

export async function apiPostFormData<T extends LegacyApiResponse>(
  path: string,
  formData: FormData,
  token?: string | null,
  init?: RequestInit,
) {
  const response = await postRequest(path, formData, token, init);
  const payload = await parseRawResponse(response);
  return payload as T;
}

export async function uploadFile(file: File, token?: string | null) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: token ? { "school-token": token } : undefined,
    body: formData,
  });

  const text = await response.text();
  const raw = text ? JSON.parse(text) : {};
  const payload = (typeof raw === "string" ? JSON.parse(raw) : raw) as UploadResponse;

  if (isUnauthorized(response.status, payload as unknown as LegacyApiResponse)) {
    handleUnauthorized();
    throw new Error(payload.message || payload.msg || "未登录");
  }

  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || payload.msg || "上传失败");
  }

  const uploadUrl = payload.url || payload.data?.url;
  if (!uploadUrl) {
    throw new Error("上传成功，但接口没有返回文件地址。");
  }

  return uploadUrl;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
