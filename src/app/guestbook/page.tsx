import SiteHeader from "@/components/site-header";
import GuestbookBoard from "@/components/guestbook-board";

export const dynamic = "force-dynamic";

// 接待台说明（编号规章，档案感）
const RULES = [
  { no: "01", text: "署名可留白。留白者，记为匿名访客。" },
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
        </div>

        {/* ===== 登记簿本体：整页通栏，左侧留一条档案夹书脊 ===== */}
        <div className="relative mt-12 lg:pl-12">
          {/* 书脊：竖排册名 + 上下延伸的细线，像夹在架上的一册卷宗 */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-7 flex-col items-center lg:flex"
            aria-hidden="true"
          >
            <span className="w-px flex-1 bg-stone-800/70" />
            <span className="my-5 rotate-180 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.45em] text-stone-500 [writing-mode:vertical-rl]">
              Guestbook · Vol. 01 · Est. 1897
            </span>
            <span className="w-px flex-1 bg-stone-800/70" />
          </div>

          {/* 引导语 + 三条规章：从侧栏搬到正文里，横排两栏 */}
          <div className="grid gap-10 border-b border-stone-800/70 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-20">
            <div>
              <p className="text-lg leading-8 text-stone-300">
                门不必敲。
                <br />
                到了这里，便算与事务所有了往来。
              </p>
              <p className="mt-4 max-w-[54ch] text-pretty text-sm leading-7 text-stone-500">
                留言簿就摊在接待台上。写下的每一条都会归入档案，谁都能翻阅。
              </p>
            </div>

            <ol className="space-y-4 lg:pt-1">
              {RULES.map((r) => (
                <li key={r.no} className="grid grid-cols-[2rem_1fr] gap-2">
                  <span className="pt-0.5 font-mono text-[11px] tabular-nums text-stone-500">
                    {r.no}
                  </span>
                  <span className="text-sm leading-6 text-stone-500">
                    {r.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <GuestbookBoard />
        </div>
      </div>
    </main>
  );
}
