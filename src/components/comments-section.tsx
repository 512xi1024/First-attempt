"use client";

import { useEffect, useState } from "react";

// 评论区 / 留言板（全站共用）
// workId 有值 = 某个作品的评论区；不传 = 全局留言板
// 访客发留言时会拿到一个"凭证"存在浏览器里，凭它删除自己的留言
export default function CommentsSection({ workId }: { workId?: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  // 主人凭证：存在浏览器 localStorage，只有这个浏览器知道
  const [token, setToken] = useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("guestbook_token") || ""
  );

  async function load(t: string = token) {
    const params = new URLSearchParams();
    if (workId) params.set("workId", workId);
    if (t) params.set("token", t);
    const res = await fetch(`/api/comments?${params.toString()}`);
    const data = await res.json();
    if (data.ok) setComments(data.comments);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    setSending(true);
    setMsg("");
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, nickname, workId }),
    });
    const data = await res.json();

    if (data.ok) {
      setContent("");
      setMsg("✅ 已留下");
      // 记住凭证：以后这个浏览器可以删这条留言
      if (data.token) {
        localStorage.setItem("guestbook_token", data.token);
        setToken(data.token);
        await load(data.token);
      } else {
        load();
      }
    } else {
      setMsg(`❌ ${data.error}`);
    }
    setSending(false);
  }

  // 删除自己的留言
  async function handleDelete(id: string) {
    if (!window.confirm("确定删除这条留言吗？")) return;
    const res = await fetch(
      `/api/comments?id=${id}&token=${encodeURIComponent(token)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (data.ok) {
      setMsg("✅ 已删除");
      load();
    } else {
      setMsg(`❌ ${data.error}`);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("zh-CN");
  }

  return (
    <div className="mt-6">
      {/* 留言表单 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="署名（可不填，默认匿名访客）"
          className="w-full max-w-xs rounded-lg border border-stone-700/60 bg-stone-900/60 px-3 py-2 text-sm text-stone-200 outline-none placeholder:text-stone-600 focus:border-amber-200/60"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="写点什么……（最多 500 字）"
          className="w-full rounded-lg border border-stone-700/60 bg-stone-900/60 px-3 py-2 text-sm text-stone-200 outline-none placeholder:text-stone-600 focus:border-amber-200/60"
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={sending}
            className="cursor-target rounded-full border border-stone-700 px-5 py-1.5 text-xs tracking-widest text-stone-300 transition hover:border-amber-200/80 hover:text-amber-200 disabled:opacity-50"
          >
            {sending ? "递交中……" : "留 言"}
          </button>
          {msg && <span className="text-xs text-stone-500">{msg}</span>}
        </div>
      </form>

      {/* 留言列表 */}
      {comments.length > 0 && (
        <div className="mt-10 space-y-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-stone-800 bg-stone-900/40 px-4 py-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-amber-100">{c.nickname}</span>
                <div className="flex items-center gap-3">
                  {c.mine && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="cursor-target text-xs text-stone-600 transition hover:text-rose-400"
                    >
                      删除
                    </button>
                  )}
                  <span className="font-mono text-[11px] tracking-wider text-stone-600">
                    {formatTime(c.createdAt)}
                  </span>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-300">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
