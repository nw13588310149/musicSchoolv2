"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { LoginPayload, UserProfile } from "@/lib/api/contracts";
import { getMyInfo, loginSchool } from "@/lib/api/school";
import { clearAuthCookie, clearAuthStorage, readAuthCookie, setAuthCookie } from "@/lib/auth";

interface AuthState {
  hydrated: boolean;
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  setHydrated: (hydrated: boolean) => void;
  hydrateToken: () => void;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  fetchProfile: () => Promise<UserProfile | null>;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      token: null,
      user: null,
      loading: false,
      setHydrated: (hydrated) => set({ hydrated }),
      hydrateToken: () => {
        const token = get().token ?? readAuthCookie();
        if (token) {
          setAuthCookie(token);
          set({ token });
        }
        set({ hydrated: true });
      },
      login: async (payload) => {
        set({ loading: true });
        try {
          const result = await loginSchool(payload);
          setAuthCookie(result.token);
          set({ token: result.token });

          try {
            const profile = await getMyInfo(result.token);
            set({ user: profile, loading: false });
            return profile;
          } catch (profileError) {
            // 登录成功后，个人信息接口失败不应阻断进入后台。
            set({ user: null, loading: false });
            return {
              token: result.token,
            } as UserProfile;
          }
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      fetchProfile: async () => {
        const token = get().token ?? readAuthCookie();
        if (!token) return null;

        set({ loading: true, token });
        try {
          const profile = await getMyInfo(token);
          set({ user: profile, loading: false });
          return profile;
        } catch (error) {
          clearAuthCookie();
          clearAuthStorage();
          set({ token: null, user: null, loading: false });
          throw error;
        }
      },
      setUser: (user) => set({ user }),
      logout: () => {
        clearAuthCookie();
        clearAuthStorage();
        set({ token: null, user: null, loading: false });
      },
    }),
    {
      name: "music-road-admin-v2-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token, user }) => ({ token, user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.token) {
          setAuthCookie(state.token);
        }
      },
    },
  ),
);
