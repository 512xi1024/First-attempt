"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// 竖屏遮罩：手机上竖着拿时盖住整站，提示横过来看
//
// 踩过的坑（别再改回去）：
// 1) 绝对不要调用 screen.orientation.lock()。
//    - iOS Safari 不支持；
//    - 部分安卓浏览器/内置 WebView 里它要么同步抛错、要么返回 undefined（没有 .catch），
//      要么「成功」把页面锁成横向渲染但 innerWidth 不变 ——
//      前两种会让整个 useEffect 中断，后面的 resize 监听根本注册不上；
//      第三种会让判定永远是竖屏。结果都是：遮罩出现后转屏永远不消失，用户被卡死。
// 2) 只监听 resize / orientationchange 不够：微信等内置浏览器转屏后可能一个事件都不派发，
//    所以额外加低频轮询兜底。
// ============================================================

const ALLOW_KEY = "christie-allow-portrait";

// 是否处于竖屏。以 matchMedia 为主判定，宽高比只作兜底
function readPortrait(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(orientation: portrait)");
      if (mq.media !== "not all") return mq.matches;
    }
  } catch {
    /* 忽略 */
  }
  return window.innerHeight > window.innerWidth;
}

export default function RotateHint() {
  const [show, setShow] = useState(false);
  const allowedRef = useRef(false);

  const evaluate = useCallback(() => {
    if (allowedRef.current) {
      setShow(false);
      return;
    }
    const portrait = readPortrait();
    const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 900;
    const touch =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(pointer: coarse)").matches
        : false;
    setShow(portrait && smallScreen && touch);
  }, []);

  useEffect(() => {
    try {
      allowedRef.current = sessionStorage.getItem(ALLOW_KEY) === "1";
    } catch {
      /* 隐私模式下 sessionStorage 可能不可用 */
    }

    evaluate();

    const onChange = () => evaluate();
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    // 地址栏收起/展开时只有 visualViewport 会变，有些浏览器不派发 resize
    window.visualViewport?.addEventListener("resize", onChange);

    // 兜底轮询：每次只比较两个数，开销可忽略；React 对相同 state 不会重渲染
    const timer = window.setInterval(() => {
      if (!document.hidden) evaluate();
    }, 400);

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
      window.visualViewport?.removeEventListener("resize", onChange);
      window.clearInterval(timer);
    };
  }, [evaluate]);

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
    allowedRef.current = true;
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
      <svg viewBox="0 0 96 96" className="mt-8 h-24 w-24" aria-hidden="true">
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

      <h2 className="mt-8 text-2xl tracking-[0.25em] text-stone-100">
        请把手机横过来
      </h2>

      <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-stone-500">
        这套案卷是按横向阅读排版的。竖着看，封面会被压小，标题也会挤成一列。
      </p>

      <div className="mt-7 h-px w-16 bg-stone-800" />

      {/* 逃生口：万一浏览器转屏没反应，用户能自己出来，不会被锁死 */}
      <p className="mt-7 max-w-[30ch] text-[11px] leading-relaxed text-stone-600">
        转过来之后这页如果还停在这里，说明浏览器没有跟着转
      </p>
      <button
        type="button"
        onClick={allowPortrait}
        className="cursor-target mt-3 rounded-full border border-amber-200/50 bg-amber-200/[0.08] px-6 py-2 font-mono text-[11px] tracking-[0.2em] text-amber-200 transition hover:border-amber-200 hover:bg-amber-200/15 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200"
      >
        仍然竖屏浏览
      </button>
    </div>
  );
}
