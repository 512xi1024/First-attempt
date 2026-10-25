"use client";

import { useEffect, useState } from "react";

// 竖屏遮罩：手机上竖着拿时盖住整站，提示横过来看
// 说明：iOS Safari 不允许网页锁定屏幕方向，所以做不到"真的强制旋转"，
// 只能这样挡住 + 引导。Android 上会额外尝试调系统方向锁（全屏时才生效，失败无副作用）。
const ALLOW_KEY = "christie-allow-portrait";

export default function RotateHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function check() {
      try {
        if (sessionStorage.getItem(ALLOW_KEY) === "1") {
          setShow(false);
          return;
        }
      } catch {
        /* 隐私模式下 sessionStorage 可能不可用，忽略 */
      }
      const portrait = window.innerHeight > window.innerWidth;
      const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 900;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      setShow(portrait && smallScreen && touch);
    }

    check();

    // Android Chrome 在允许全屏的页面里能锁方向；不支持时静默失败
    const o = screen.orientation as unknown as {
      lock?: (dir: string) => Promise<void>;
    };
    o?.lock?.("landscape").catch(() => {});

    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // 遮罩盖住时锁住页面滚动，避免背景跟着晃
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  function allowPortrait() {
    try {
      sessionStorage.setItem(ALLOW_KEY, "1");
    } catch {
      /* 忽略 */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="请横屏浏览"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-950 px-8 text-center"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
        Orientation notice
      </p>

      {/* 会自己转 90° 的手机轮廓 */}
      <svg
        viewBox="0 0 96 96"
        className="mt-10 h-24 w-24"
        aria-hidden="true"
      >
        <g className="animate-rotate-hint">
          <rect
            x="34"
            y="16"
            width="28"
            height="52"
            rx="5"
            fill="none"
            stroke="#e7d3a1"
            strokeWidth="1.6"
          />
          <line
            x1="44"
            y1="22"
            x2="52"
            y2="22"
            stroke="#e7d3a1"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M24 74 q24 12 48 0"
            fill="none"
            stroke="#a8a29e"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="3 5"
          />
        </g>
      </svg>

      <h2 className="mt-10 text-2xl tracking-[0.25em] text-stone-100">
        请把手机横过来
      </h2>

      <p className="mt-5 max-w-[32ch] text-sm leading-relaxed text-stone-500">
        这套案卷是按横向阅读排版的。竖着看，封面会被压小，标题也会挤成一列。
      </p>

      <div className="mt-9 h-px w-16 bg-stone-800" />

      <button
        type="button"
        onClick={allowPortrait}
        className="mt-9 font-mono text-[11px] tracking-[0.2em] text-stone-600 underline decoration-stone-700 underline-offset-4 transition hover:text-amber-200 hover:decoration-amber-200"
      >
        仍要竖屏浏览
      </button>
    </div>
  );
}
