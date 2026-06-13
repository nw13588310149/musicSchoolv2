"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();

  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const hydrateToken = useAuthStore((state) => state.hydrateToken);
  const loading = useAuthStore((state) => state.loading);

  const [introReady, setIntroReady] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/dashboard/overview");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    if (redirect) setRedirectTo(redirect);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      hydrateToken();
      return;
    }

    if (token) {
      router.replace(redirectTo);
      router.refresh();
    }
  }, [hydrateToken, hydrated, redirectTo, router, token]);

  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>(".ambient-video");

    const markReady = () => {
      setPageReady(true);
      const raf = requestAnimationFrame(() => setIntroReady(true));
      return () => cancelAnimationFrame(raf);
    };

    if (!video) {
      markReady();
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markReady();
      return;
    }

    const handleLoadedData = () => {
      markReady();
    };

    const handleError = () => {
      markReady();
    };

    video.addEventListener("loadeddata", handleLoadedData, { once: true });
    video.addEventListener("canplay", handleLoadedData, { once: true });
    video.addEventListener("error", handleError, { once: true });

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleLoadedData);
      video.removeEventListener("error", handleError);
    };
  }, []);

  const loginLabel = useMemo(() => "进入管理后台", []);
  const loadingLabel = useMemo(() => "正在登录...", []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!account.trim()) {
      toast.warning("请输入管理账号。");
      return;
    }

    if (!password.trim()) {
      toast.warning("请输入登录密码。");
      return;
    }

    try {
      await login({
        loginUser: account.trim(),
        loginPwd: password,
      });

      toast.success("登录成功，正在进入后台。");
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败，请稍后重试。");
    }
  };

  return (
    <main className="cine-login-ultra">
      <div className={`loading-curtain ${pageReady ? "is-ready" : ""}`} />
      <div className={`video-canvas ${pageReady ? "is-ready" : ""}`}>
        <video autoPlay loop muted playsInline preload="auto" className="ambient-video">
          <source src="/brand/background.mp4" type="video/mp4" />
        </video>
        <div className="cinematic-vignette" />
      </div>

      <div className={`relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 py-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:px-14 xl:px-20 ${pageReady ? "is-ready" : "is-loading"}`}>
        <section className="flex items-center">
          <div className={`title-sequence ${introReady ? "is-ready" : ""}`}>
            <div className="sequence-kicker sequence-reveal" style={{ ["--d" as string]: "0.1s" }}>
              <span className="kicker-line" />
              <span>学校管理 · 授权登录</span>
            </div>

            <h1 className="sequence-main sequence-reveal" style={{ ["--d" as string]: "0.35s" }}>
              <span className="sequence-main__word">音乐之路</span>
            </h1>

            <p className="sequence-sub sequence-reveal" style={{ ["--d" as string]: "0.6s" }}>
              校园后台统一工作台
            </p>

            <p className="sequence-poem sequence-reveal" style={{ ["--d" as string]: "0.85s" }}>
              面向教务、课程与校园事务的数字化管理入口，
              <br />
              请使用学校管理员分发的账号登录，勿与他人共享凭据。
            </p>
          </div>
        </section>

        <aside className="flex items-center justify-start lg:justify-end">
          <div className={`form-sculpture sequence-reveal w-full max-w-[360px] ${introReady ? "is-ready" : ""}`} style={{ ["--d" as string]: "1.05s" }}>
            <div className="brand-mark">
              <div className="brand-mark__row">
                <Image src="/brand/logo.png" alt="品牌标识" width={180} height={52} className="h-10 w-auto opacity-90" priority />
                <div className="brand-mark__welcome">
                  <p className="brand-mark__welcome-title">音乐之路</p>
                  <p className="brand-mark__welcome-subtitle">校园管理中枢</p>
                </div>
              </div>
            </div>

            <form className="fluid-form" onSubmit={handleSubmit}>
              <div className="input-realm">
                <input
                  id="account"
                  value={account}
                  onChange={(event) => setAccount(event.target.value)}
                  type="text"
                  placeholder=" "
                  autoComplete="username"
                  name="username"
                  disabled={loading}
                />
                <label htmlFor="account">管理账号</label>
                <div className="light-beam" />
              </div>

              <div className="input-realm">
                <input
                  id="secret"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder=" "
                  autoComplete="current-password"
                  name="password"
                  disabled={loading}
                />
                <label htmlFor="secret">安全凭证</label>
                <div className="light-beam" />
              </div>

              <div className="form-accessories">
                <label className="zen-checkbox">
                  <input checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} type="checkbox" />
                  <span className="zen-box" />
                  <span className="zen-label">保持登入状态</span>
                </label>
              </div>

              <button type="submit" className="cinematic-enter" disabled={loading}>
                <span className="enter-text">{loading ? loadingLabel : loginLabel}</span>
                <span className="enter-sweep" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Noto+Serif+SC:wght@200;300;400;500&display=swap');

        body {
          background: #030303;
        }
      `}</style>

      <style jsx>{`
        .cine-login-ultra {
          --font-serif: 'Noto Serif SC', 'Source Han Serif SC', 'Source Han Serif CN', 'Songti SC', 'STSong', 'SimSun', serif;
          --font-sans: 'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif;
          --color-text-primary: rgba(255, 255, 255, 0.9);
          --color-text-muted: rgba(255, 255, 255, 0.45);
          --color-accent: #8741ff;
          --color-accent-dim: rgba(135, 65, 255, 0.35);
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #030303;
          color: var(--color-text-primary);
          font-family: var(--font-sans);
        }

        .loading-curtain {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: #030303;
          opacity: 1;
          transition: opacity 0.55s ease;
        }

        .loading-curtain.is-ready {
          opacity: 0;
          pointer-events: none;
        }

        .video-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0;
          transition: opacity 0.6s ease;
        }

        .video-canvas.is-ready {
          opacity: 1;
        }

        .ambient-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.65) contrast(1.15);
        }

        .cinematic-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 40% 50%, transparent 20%, rgba(0, 0, 0, 0.65) 100%),
            linear-gradient(90deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.7) 65%, rgba(0, 0, 0, 0.92) 100%);
        }

        .title-sequence {
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
          min-height: 100%;
        }

        .form-sculpture.is-ready {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }

        .sequence-reveal {
          opacity: 0;
          transform: translate3d(0, 18px, 0) scale(0.99);
          filter: blur(6px);
          transition: opacity 1.1s cubic-bezier(0.2, 0.85, 0.2, 1), transform 1.1s cubic-bezier(0.2, 0.85, 0.2, 1),
            filter 1.1s cubic-bezier(0.2, 0.85, 0.2, 1);
          transition-delay: var(--d, 0s);
        }

        .is-ready .sequence-reveal,
        .sequence-reveal.is-ready {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
          filter: blur(0);
        }

        .sequence-kicker {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          font-family: var(--font-serif);
          font-size: 0.85rem;
          letter-spacing: 0.5em;
          color: var(--color-accent);
          margin-bottom: 2.5rem;
          opacity: 0.8;
        }

        .kicker-line {
          width: 45px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-accent));
          box-shadow: 0 0 12px var(--color-accent-dim);
        }

        .sequence-main {
          font-family: var(--font-serif);
          font-size: clamp(3.5rem, 5vw, 5.5rem);
          font-weight: 300;
          letter-spacing: 0.15em;
          line-height: 1.2;
          margin: 0 0 1rem;
        }

        .sequence-main__word {
          display: inline-block;
          background: linear-gradient(120deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.82) 45%, rgba(135, 65, 255, 0.88) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 14px 36px rgba(0, 0, 0, 0.72)) drop-shadow(0 0 48px rgba(135, 65, 255, 0.18));
        }

        .sequence-sub {
          font-family: var(--font-serif);
          font-size: 1.05rem;
          font-weight: 400;
          letter-spacing: 0.8em;
          color: var(--color-text-muted);
          margin-bottom: 3rem;
        }

        .sequence-poem {
          font-family: var(--font-serif);
          font-size: 0.95rem;
          line-height: 2.4;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
          font-weight: 300;
        }

        .form-sculpture {
          width: 100%;
          opacity: 0;
          transform: translate3d(0, 20px, 0) scale(0.99);
          transition: opacity 1.1s cubic-bezier(0.2, 0.85, 0.2, 1), transform 1.1s cubic-bezier(0.2, 0.85, 0.2, 1);
          transition-delay: var(--d, 0s);
        }

        .brand-mark {
          margin-bottom: 4rem;
          text-align: left;
        }

        .brand-mark__row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .brand-mark__welcome {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding-left: 1rem;
          border-left: 1px solid rgba(255, 255, 255, 0.12);
        }

        .brand-mark__welcome-title {
          margin: 0;
          font-family: var(--font-serif);
          font-size: 0.98rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--color-text-primary);
        }

        .brand-mark__welcome-subtitle {
          margin: 0;
          font-size: 0.76rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .fluid-form {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .input-realm {
          position: relative;
          padding-top: 1.2rem;
        }

        .input-realm input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.6rem 0;
          color: var(--color-text-primary);
          font-size: 1.1rem;
          letter-spacing: 0.05em;
          outline: none;
          transition: border-color 0.5s;
        }

        .input-realm input:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .input-realm label {
          position: absolute;
          left: 0;
          top: 1.8rem;
          color: var(--color-text-muted);
          font-size: 0.95rem;
          letter-spacing: 0.2em;
          pointer-events: none;
          transition: 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .light-beam {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 1px;
          background: var(--color-accent);
          transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 0 8px var(--color-accent-dim);
        }

        .input-realm input:focus ~ label,
        .input-realm input:not(:placeholder-shown) ~ label {
          top: -0.2rem;
          font-size: 0.75rem;
          color: var(--color-accent);
          letter-spacing: 0.3em;
        }

        .input-realm input:focus ~ .light-beam {
          width: 100%;
          left: 0;
        }

        .form-accessories {
          margin-top: -0.5rem;
          margin-bottom: 1.5rem;
        }

        .zen-checkbox {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          cursor: pointer;
          width: fit-content;
        }

        .zen-checkbox input {
          display: none;
        }

        .zen-box {
          width: 12px;
          height: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          position: relative;
          transition: 0.4s;
        }

        .zen-checkbox input:checked ~ .zen-box {
          background: var(--color-accent);
          border-color: var(--color-accent);
          box-shadow: 0 0 10px var(--color-accent-dim);
        }

        .zen-label {
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
          transition: color 0.4s;
        }

        .zen-checkbox:hover .zen-label {
          color: var(--color-text-primary);
        }

        .cinematic-enter {
          position: relative;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--color-text-primary);
          padding: 1.2rem;
          font-size: 0.95rem;
          letter-spacing: 0.8em;
          text-indent: 0.4em;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.6s, color 0.6s;
          margin-top: 1rem;
          font-weight: 300;
        }

        .enter-text {
          position: relative;
          z-index: 2;
        }

        .enter-sweep {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
          transform: skewX(-20deg);
          z-index: 1;
        }

        .cinematic-enter:hover {
          border-color: rgba(255, 255, 255, 0.4);
          color: #fff;
        }

        .cinematic-enter:hover:not(:disabled) .enter-sweep {
          left: 200%;
          transition: 1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .cinematic-enter:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .sequence-reveal {
            opacity: 1;
            filter: none;
            transform: none;
            transition: none;
          }
        }

        @media (max-width: 1024px) {
          .cine-login-ultra {
            height: auto;
            min-height: 100vh;
          }

          .title-sequence {
            min-height: auto;
            padding-top: 4rem;
          }

          .form-sculpture {
            max-width: 100%;
          }

          .cinematic-vignette {
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.85) 100%);
          }

          .sequence-main {
            font-size: 3rem;
          }

          .sequence-sub {
            letter-spacing: 0.4em;
          }

          .content-director {
            gap: 4rem;
          }
        }
      `}</style>
    </main>
  );
}
