"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// 留言页专属「委托登记簿」
// 左侧说明已上移到 page.tsx，这里只负责三段：
//   案卷标签带（册次 / 已入册 / 最后入册 / 存放）
//   → 落笔区（横置的纸质登记表）
//   → 往来记录（通栏四栏对齐的登记簿表格）
// 接口契约与 comments-section 相同：GET/POST/DELETE /api/comments
// 访客凭证存 localStorage，凭它可以删除自己写下的记录
// ============================================================

type Entry = {
  id: string;
  content: string;
  nickname: string;
  createdAt: string;
  mine: boolean;
};

type Status = { kind: "ok" | "err"; text: string } | null;

const MAX = 500;
const TOKEN_KEY = "guestbook_token";

// 记录时间戳：2026.10.21 08:48（等宽数字，档案感）
function stamp(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

// 一枚小印章：轻微歪斜 + 细描边，像盖在卷宗上的戳
function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex -rotate-3 items-center rounded-[3px] border border-amber-200/35 px-1.5 py-[3px] font-mono text-[9px] uppercase leading-none tracking-[0.22em] text-amber-200/75">
      {children}
    </span>
  );
}

// 两步删除按钮：第一次点变「确认删除？」，第二次才真删
function DeleteButton({
  armed,
  onClick,
}: {
  armed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={armed ? "再次点击确认删除这条留言" : "删除这条留言"}
      className={`cursor-target inline-flex h-8 items-center rounded-full px-3 font-mono text-[10px] uppercase tracking-[0.25em] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70 ${
        armed
          ? "bg-rose-500/10 text-rose-300"
          : "text-stone-500 hover:bg-stone-800/60 hover:text-stone-300"
      }`}
    >
      {armed ? "确认删除？" : "删除"}
    </button>
  );
}

export default function GuestbookBoard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [token, setToken] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem(TOKEN_KEY) || ""
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<HTMLElement>(null);

  async function load(t: string = token) {
    try {
      const params = new URLSearchParams();
      if (t) params.set("token", t);
      const res = await fetch(`/api/comments?${params.toString()}`);
      const data = await res.json();
      if (data.ok) setEntries(data.comments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text || sending) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, nickname }),
      });
      const data = await res.json();

      if (data.ok) {
        setContent("");
        setStatus({ kind: "ok", text: "记录已入册。" });
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
          await load(data.token);
        } else {
          await load();
        }
        // 入册后把记录列表滚进视野（尊重"减少动态"偏好）
        setTimeout(() => {
          const reduce = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
          ).matches;
          logRef.current?.scrollIntoView({
            behavior: reduce ? "auto" : "smooth",
            block: "start",
          });
        }, 80);
      } else {
        setStatus({ kind: "err", text: data.error || "递交失败，请稍后再试。" });
      }
    } catch {
      setStatus({ kind: "err", text: "线路不通，请稍后再试。" });
    } finally {
      setSending(false);
    }
  }

  function askDelete(id: string) {
    if (confirmId === id) {
      handleDelete(id);
      return;
    }
    setConfirmId(id);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmId(null), 3000);
  }

  async function handleDelete(id: string) {
    setConfirmId(null);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    try {
      const res = await fetch(
        `/api/comments?id=${id}&token=${encodeURIComponent(token)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.ok) {
        setStatus({ kind: "ok", text: "记录已撤下。" });
        await load();
      } else {
        setStatus({ kind: "err", text: data.error || "删除失败。" });
      }
    } catch {
      setStatus({ kind: "err", text: "线路不通，请稍后再试。" });
    }
  }

  const overLimit = content.length >= MAX;
  const nearLimit = content.length >= MAX * 0.9;

  // 案卷标签带：像贴在同一张档案袋口的一排标签
  const META = [
    { label: "册次 · Vol", value: "01" },
    {
      label: "已入册",
      value: loading ? "——" : String(entries.length).padStart(2, "0"),
    },
    {
      label: "最后入册",
      value: loading ? "——" : entries[0] ? stamp(entries[0].createdAt) : "尚无记录",
    },
    { label: "存放 · Shelf", value: "接待台" },
  ];

  return (
    <div>
      {/* ===== 案卷标签带 ===== */}
      <dl className="mt-10 mb-12 grid grid-cols-2 border-y border-stone-800 sm:grid-cols-4">
        {META.map((m, i) => (
          <div
            key={m.label}
            className={[
              "px-4 py-3",
              i === 1 || i === 3 ? "border-l border-stone-800" : "",
              i === 2 || i === 3
                ? "border-t border-stone-800 sm:border-t-0"
                : "",
              i === 2 ? "sm:border-l sm:border-stone-800" : "",
            ].join(" ")}
          >
            <dt className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500">
              {m.label}
            </dt>
            <dd className="mt-1.5 font-mono text-[13px] tabular-nums text-stone-200">
              {m.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* ===== 落笔区：横置的纸质登记表 =====
          左列标题、右列填写，中间一条竖线、行间一条横线。
          不做圆角卡片，做成一张摊开的表格 */}
      <form
        onSubmit={handleSubmit}
        className="border border-stone-700/50 bg-stone-900/50 backdrop-blur-[2px] transition-colors focus-within:border-amber-200/40"
      >
        <div className="flex items-center justify-between border-b border-stone-800 px-5 py-3">
          <span className="flex items-center gap-2.5">
            <span className="h-3.5 w-[2px] bg-amber-200/60" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-stone-500">
              New entry
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`font-mono text-[11px] tabular-nums transition-colors ${
              overLimit
                ? "text-rose-400"
                : nearLimit
                  ? "text-amber-300/90"
                  : "text-stone-500"
            }`}
          >
            {content.length} / {MAX}
          </span>
        </div>

        <div className="grid grid-cols-[5rem_1fr] sm:grid-cols-[8rem_1fr]">
          <label
            htmlFor="gb-name"
            className="border-b border-r border-stone-800 px-4 py-4"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">
              署名
            </span>
            <span className="mt-1 block font-mono text-[9px] tracking-[0.12em] text-stone-500">
              可留白
            </span>
          </label>
          <div className="border-b border-stone-800 px-4 py-3">
            <input
              id="gb-name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              autoComplete="off"
              placeholder="留白者，记为匿名访客"
              className="w-full bg-transparent text-sm text-stone-200 outline-none transition-colors placeholder:text-stone-500"
            />
          </div>

          <label
            htmlFor="gb-content"
            className="border-r border-stone-800 px-4 py-4"
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">
              内容
            </span>
            <span className="mt-1 block font-mono text-[9px] tracking-[0.12em] text-stone-500">
              ≤ {MAX} 字
            </span>
          </label>
          <div className="px-4 py-3">
            <textarea
              id="gb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={MAX}
              placeholder="写点什么，委托人……"
              aria-describedby="gb-hint"
              className="w-full resize-none bg-transparent text-[15px] leading-7 text-stone-200 outline-none transition-colors placeholder:text-stone-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-800 px-5 py-3">
          <p
            id="gb-hint"
            aria-live="polite"
            className={`text-xs transition-colors ${
              status?.kind === "err"
                ? "text-rose-300"
                : status?.kind === "ok"
                  ? "text-amber-200"
                  : "text-stone-500"
            }`}
          >
            {status ? status.text : "落笔即入册 · 此后只有你能删"}
          </p>
          <button
            type="submit"
            disabled={!content.trim() || sending || overLimit}
            className="cursor-target inline-flex h-10 items-center rounded-full border border-stone-700 px-6 text-xs tracking-[0.3em] text-stone-300 transition hover:-translate-y-0.5 hover:border-amber-200 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70 disabled:pointer-events-none disabled:opacity-40"
          >
            {sending ? "递交中…" : "落 笔"}
          </button>
        </div>
      </form>

      {/* ===== 往来记录 ===== */}
      <section
        aria-labelledby="gb-log"
        ref={logRef}
        className="mt-16 scroll-mt-24"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <h2 id="gb-log" className="flex items-center gap-2.5">
            <span className="h-3 w-[2px] bg-amber-200/60" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-stone-500">
              往来记录
            </span>
          </h2>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] tabular-nums text-stone-500">
              {loading ? "——" : String(entries.length).padStart(2, "0")} 条
            </span>
            <Stamp>已归档</Stamp>
          </div>
        </div>

        {/* 列标题：与下方每行共用同一套栅格，竖线才能连成一条 */}
        <div className="mt-3 grid grid-cols-[3.25rem_1fr] gap-x-4 border-y border-stone-800 sm:gap-x-6 lg:grid-cols-[4rem_8rem_minmax(0,1fr)_9rem]">
          <span className="py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">
            №
          </span>
          <span className="hidden border-l border-stone-800/70 py-2.5 pl-4 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 lg:block lg:pl-6">
            署名 · Name
          </span>
          <span className="py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 lg:border-l lg:border-stone-800/70 lg:pl-6">
            记录 · Record
          </span>
          <span className="hidden border-l border-stone-800/70 py-2.5 pl-4 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 lg:block lg:pl-6">
            归档 · Filed
          </span>
        </div>

        {loading ? (
          // 骨架：栅格与真实记录一致，加载完不跳版
          <div aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[3.25rem_1fr] gap-x-4 border-b border-stone-800/70 sm:gap-x-6 lg:grid-cols-[4rem_8rem_minmax(0,1fr)_9rem]"
              >
                <div className="py-5">
                  <div className="h-3 w-12 animate-pulse bg-stone-800/70" />
                </div>
                <div className="animate-pulse space-y-3 border-l border-stone-800/70 py-5 pl-4 sm:pl-6">
                  <div className="h-3 w-28 bg-stone-800/80" />
                  <div className="h-3 w-full bg-stone-800/50" />
                  <div className="h-3 w-2/3 bg-stone-800/40" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="border-b border-stone-800/70 py-16 text-center">
            <p className="text-sm text-stone-500">簿册还空着。</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.35em] text-stone-500">
              The first record awaits
            </p>
          </div>
        ) : (
          <ol>
            {entries.map((c, i) => (
              <li
                key={c.id}
                className="group relative grid grid-cols-[3.25rem_1fr] gap-x-4 border-b border-stone-800/70 transition-colors hover:bg-stone-900/25 sm:gap-x-6 lg:grid-cols-[4rem_8rem_minmax(0,1fr)_9rem]"
              >
                {/* 抽出卷宗的手感：hover 时左缘浮出一条琥珀细线 */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-[2px] bg-amber-200/0 transition-colors duration-200 group-hover:bg-amber-200/45"
                />

                <span className="py-5 font-mono text-[11px] tabular-nums text-stone-500 transition-colors group-hover:text-amber-200/80">
                  № {String(entries.length - i).padStart(3, "0")}
                </span>

                {/* 手机上这三块竖排成一列；到 lg 用 display:contents
                    让它们直接成为四栏表格的单元格——一套标记撑两种版式 */}
                <div className="min-w-0 space-y-1.5 py-5 lg:contents lg:space-y-0">
                  <span className="flex flex-wrap items-center gap-2 text-sm text-amber-100/90 lg:border-l lg:border-stone-800/70 lg:py-5 lg:pl-6">
                    {c.nickname}
                    {c.mine && <Stamp>你的记录</Stamp>}
                  </span>

                  <article className="min-w-0 lg:border-l lg:border-stone-800/70 lg:py-5 lg:pl-6">
                    <p className="max-w-[72ch] whitespace-pre-wrap break-words text-[15px] leading-7 text-stone-300">
                      {c.content}
                    </p>
                    {c.mine && (
                      <div className="mt-2 lg:hidden">
                        <DeleteButton
                          armed={confirmId === c.id}
                          onClick={() => askDelete(c.id)}
                        />
                      </div>
                    )}
                  </article>

                  <div className="lg:border-l lg:border-stone-800/70 lg:py-5 lg:pl-6">
                    <time
                      dateTime={c.createdAt}
                      className="block font-mono text-[11px] tabular-nums text-stone-500"
                    >
                      {stamp(c.createdAt)}
                    </time>
                    {c.mine && (
                      <div className="mt-1.5 hidden lg:block">
                        <DeleteButton
                          armed={confirmId === c.id}
                          onClick={() => askDelete(c.id)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
