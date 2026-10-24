"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// 留言页专属「委托登记簿」
// 左侧说明在 page.tsx，这里负责落笔区 + 往来记录列表
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
  // 两步删除：第一次点变成「确认删除？」，3 秒后自动复位
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

  // 第一次点击：请求确认；第二次点击：真正删除
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

  return (
    <div>
      {/* ===== 落笔区：新记录 ===== */}
      <form
        onSubmit={handleSubmit}
        className="relative rounded-sm border border-stone-700/50 bg-stone-900/50 backdrop-blur-[2px] transition-colors focus-within:border-amber-200/40"
      >
        <div className="flex items-baseline justify-between border-b border-stone-800 px-5 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-stone-500">
            New entry
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

        <div className="space-y-6 px-5 pb-5 pt-6">
          <div>
            <label
              htmlFor="gb-name"
              className="block font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500"
            >
              署名 · 可留白
            </label>
            <input
              id="gb-name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              autoComplete="off"
              placeholder="留白者，记为匿名访客"
              className="mt-2 w-full max-w-[280px] border-b border-stone-700/60 bg-transparent pb-2 text-sm text-stone-200 outline-none transition-colors placeholder:text-stone-500 focus:border-amber-200/70"
            />
          </div>

          <div>
            <label
              htmlFor="gb-content"
              className="block font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500"
            >
              留言内容
            </label>
            <textarea
              id="gb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={MAX}
              placeholder="写点什么，委托人……"
              aria-describedby="gb-hint"
              className="mt-2 w-full resize-none border-b border-stone-700/60 bg-transparent pb-2 text-[15px] leading-7 text-stone-200 outline-none transition-colors placeholder:text-stone-500 focus:border-amber-200/70"
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
      <section aria-labelledby="gb-log" ref={logRef} className="mt-14 scroll-mt-24">
        <div className="flex items-baseline justify-between border-b border-stone-800 pb-3">
          <h2
            id="gb-log"
            className="font-mono text-[10px] uppercase tracking-[0.35em] text-stone-500"
          >
            往来记录
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-stone-500">
            {loading ? "——" : String(entries.length).padStart(2, "0")} 条
          </span>
        </div>

        {loading ? (
          // 读取中的骨架：三行灰线
          <div className="space-y-8 py-8" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-3 w-32 bg-stone-800/80" />
                <div className="h-3 w-full bg-stone-800/50" />
                <div className="h-3 w-2/3 bg-stone-800/40" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="border-b border-stone-800/70 py-16 text-center">
            <p className="text-sm text-stone-500">簿册还空着。</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.35em] text-stone-700">
              The first record awaits
            </p>
          </div>
        ) : (
          <ol>
            {entries.map((c, i) => (
              <li
                key={c.id}
                className="group grid grid-cols-[3.25rem_1fr] gap-x-4 border-b border-stone-800/70 py-6 transition-colors hover:bg-stone-900/25 sm:grid-cols-[4rem_1fr] sm:gap-x-6"
              >
                <span className="pt-1 font-mono text-[11px] tabular-nums text-stone-500">
                  № {String(entries.length - i).padStart(3, "0")}
                </span>
                <article>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="flex items-center gap-2 text-sm text-amber-100/90">
                      {c.nickname}
                      {c.mine && (
                        <em className="not-italic font-mono text-[9px] uppercase tracking-[0.25em] text-stone-500">
                          · 你的记录
                        </em>
                      )}
                    </span>
                    <time
                      dateTime={c.createdAt}
                      className="font-mono text-[11px] tabular-nums text-stone-500"
                    >
                      {stamp(c.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 max-w-[72ch] whitespace-pre-wrap break-words text-[15px] leading-7 text-stone-300">
                    {c.content}
                  </p>
                  {c.mine && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => askDelete(c.id)}
                        aria-label={
                          confirmId === c.id
                            ? "再次点击确认删除这条留言"
                            : "删除这条留言"
                        }
                        className={`cursor-target inline-flex h-8 items-center rounded-full px-3 font-mono text-[10px] uppercase tracking-[0.25em] transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70 ${
                          confirmId === c.id
                            ? "bg-rose-500/10 text-rose-300"
                            : "text-stone-500 hover:bg-stone-800/60 hover:text-stone-300"
                        }`}
                      >
                        {confirmId === c.id ? "确认删除？" : "删除"}
                      </button>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
