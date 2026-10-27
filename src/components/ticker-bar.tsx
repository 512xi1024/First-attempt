"use client";

import { useEffect, useRef } from "react";

// ============================================================
// 顶部滚动条幅（学习 igma.im 的 ticker）
// 文字复制多遍撑满屏幕宽度，写两遍 + translateX(-50%) 无缝循环
// （单份文字在宽屏上不够宽，会出现"只滚半边"的空档）
//
// 跨页面连贯：条幅在每个页面各渲染一份，换页时组件会重新挂载，
// CSS 动画会从头开始，看起来就是"一切页面就重播"。
// 解法是把动画起点记在 sessionStorage，新页面用负的 animation-delay
// 把动画直接拉到"本该播到的位置"。
// ============================================================

const DURATION = 120; // 秒，一圈
const START_KEY = "ticker_start_at";

export default function TickerBar() {
  const innerRef = useRef<HTMLDivElement>(null);

  const line =
    "克里斯蒂小姐 · 侦探事务所 · MISS CHRISTIE'S AGENCY · EST. 1897 LONDON · ";
  // 一份文字约 480px，重复 8 份 ≈ 3840px，4K 宽屏也铺得满
  const half = line.repeat(8);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const now = Date.now();
    let start = Number(sessionStorage.getItem(START_KEY) || 0);
    // 没有记录、或者已经超过一整圈（时间戳太久就别追了）→ 重新起算
    if (!start || now - start > DURATION * 1000) {
      start = now;
      sessionStorage.setItem(START_KEY, String(start));
    }

    const elapsed = ((now - start) / 1000) % DURATION;
    el.style.animationDelay = `-${elapsed}s`;
  }, []);

  return (
    <div className="relative z-10 overflow-hidden border-y border-stone-800/60 py-2">
      <div
        ref={innerRef}
        className="animate-ticker flex w-max whitespace-nowrap font-mono text-[11px] tracking-[0.25em] text-stone-500"
        style={{ "--ticker-duration": `${DURATION}s` } as React.CSSProperties}
      >
        <span>{half}</span>
        <span aria-hidden>{half}</span>
      </div>
    </div>
  );
}
