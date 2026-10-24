// 顶部滚动条幅（学习 igma.im 的 ticker）：
// 文字复制多遍撑满屏幕宽度，写两遍 + translateX(-50%) 无缝循环
// （单份文字在宽屏上不够宽，会出现"只滚半边"的空档）
export default function TickerBar() {
  const line =
    "克里斯蒂小姐 · 侦探事务所 · MISS CHRISTIE'S AGENCY · EST. 1897 LONDON · ";
  // 一份文字约 480px，重复 8 份 ≈ 3840px，4K 宽屏也铺得满
  const half = line.repeat(8);

  return (
    <div className="relative z-10 overflow-hidden border-y border-stone-800/60 py-2">
      <div className="animate-ticker flex w-max whitespace-nowrap font-mono text-[11px] tracking-[0.25em] text-stone-500">
        <span>{half}</span>
        <span aria-hidden>{half}</span>
      </div>
    </div>
  );
}
