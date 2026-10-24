"use client";

import { useState } from "react";

// 复制到剪贴板的小按钮（联系页用）
export default function CopyButton({
  value,
  label = "复制",
}: {
  value: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      // 浏览器不支持或未授权：静默失败
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`cursor-target inline-flex h-7 items-center rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70 ${
        done
          ? "border-amber-200/60 text-amber-200"
          : "border-stone-700/70 text-stone-500 hover:border-amber-200/50 hover:text-amber-100"
      }`}
    >
      {done ? "已复制" : label}
    </button>
  );
}
