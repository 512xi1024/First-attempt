import SiteHeader from "@/components/site-header";
import GuestbookBoard from "@/components/guestbook-board";

export const dynamic = "force-dynamic";

// 接待台说明（编号规章，档案感）
const RULES = [
  { no: "01", text: "署名可留可白。留白者，记为匿名访客。" },
  { no: "02", text: "每条至多 500 字，落笔即入册。" },
  { no: "03", text: "自己的记录，只有自己能删。" },
];

export default function GuestbookPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      <div className="animate-fade-in-up px-10 pb-24 pt-14 motion-reduce:animate-none lg:px-20 xl:px-24 2xl:px-32">
        <div className="w-full">
          {/* ===== 页头：与全站标题左对齐，右端与导航右缘对齐 ===== */}
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-stone-600">
                Guestbook — 委托登记簿
              </p>
              <h1 className="mt-3 text-3xl tracking-[0.28em] text-stone-100 sm:text-4xl">
                留言
              </h1>
            </div>
            <p className="hidden pb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-600 lg:block">
              Vol. 01 · 接待台
            </p>
          </div>
          <div
            className="mt-7 h-px w-full bg-gradient-to-r from-stone-700/80 via-stone-800/60 to-transparent"
            aria-hidden="true"
          />

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[320px_minmax(0,1fr)]">
            {/* ===== 左栏：接待台说明（滚动时吸附） ===== */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-lg leading-8 text-stone-300">
                门不必敲。
                <br />
                到了这里，便算与事务所有了往来。
              </p>
              <p className="mt-5 text-sm leading-7 text-stone-500">
                留言簿就摊在接待台上。写下的每一条都会归入档案，谁都能翻阅。
              </p>

              <ol className="mt-10 space-y-5 border-t border-stone-800/70 pt-8">
                {RULES.map((r) => (
                  <li key={r.no} className="grid grid-cols-[2rem_1fr] gap-3">
                    <span className="pt-0.5 font-mono text-[11px] tabular-nums text-stone-500">
                      {r.no}
                    </span>
                    <span className="text-sm leading-6 text-stone-500">
                      {r.text}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-12 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.3em] text-stone-600">
                <span className="h-px w-8 bg-stone-700/80" aria-hidden="true" />
                Miss Christie&apos;s Agency
              </div>
            </aside>

            {/* ===== 右栏：落笔区 + 往来记录（流体填满右侧） ===== */}
            <div className="min-w-0">
              <GuestbookBoard />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
