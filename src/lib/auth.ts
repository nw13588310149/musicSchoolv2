const TOKEN_KEY = "school-token";
const AUTH_STORAGE_KEY = "music-road-admin-v2-auth";
const COOKIE_TTL = 60 * 60 * 24 * 14;

export function getTokenCookieName() {
  return TOKEN_KEY;
}

export function getAuthStorageKey() {
  return AUTH_STORAGE_KEY;
}

export function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_TTL}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function readAuthCookie() {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${TOKEN_KEY}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
