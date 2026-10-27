"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// 复制到剪贴板的小按钮（联系页用）
//
// 为什么不能只用 navigator.clipboard：
//   这个 API 只在「安全上下文」里存在——https 或 localhost。
//   网站目前是 http://服务器IP 访问，navigator.clipboard 是 undefined，
//   一调用就抛错；原来 catch 里什么都不做，于是点下去毫无反应。
//
// 两道保险：
//   ① 安全上下文 → 用标准异步 API
//   ② 其余情况   → 临时 textarea + execCommand("copy") 老办法
//      （已标废弃，但所有浏览器都还支持，http 下可用）
// 并且无论成败都改按钮文字，绝不会再「静默失败」。
// ============================================================

async function writeClipboard(text: string): Promise<boolean> {
  // ① 标准路径
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 权限被拒、或调用不在用户手势里 —— 落到下面试老办法
    }
  }

  // ② 兜底路径
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    // 必须真的在文档里才选得中；fixed + 透明，避免页面跳动
    ta.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;outline:none;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS 必须显式给范围
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

type State = "idle" | "done" | "fail";

export default function CopyButton({
  value,
  label = "复制",
}: {
  value: string;
  label?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<number | null>(null);

  // 组件卸载时清掉定时器，避免对已卸载组件 setState
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  async function copy() {
    const ok = await writeClipboard(value);
    setState(ok ? "done" : "fail");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setState("idle"),
      ok ? 1600 : 2800
    );
  }

  const text = state === "done" ? "已复制" : state === "fail" ? "请手动" : label;

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      title={
        state === "fail"
          ? "浏览器不允许网页自动复制，请选中文字后按 Ctrl+C（手机长按复制）"
          : "复制到剪贴板"
      }
      className={`cursor-target inline-flex h-7 items-center rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70 ${
        state === "done"
          ? "border-amber-200/60 text-amber-200"
          : state === "fail"
            ? "border-rose-300/50 text-rose-300"
            : "border-stone-700/70 text-stone-500 hover:border-amber-200/50 hover:text-amber-100"
      }`}
    >
      {text}
    </button>
  );
}
