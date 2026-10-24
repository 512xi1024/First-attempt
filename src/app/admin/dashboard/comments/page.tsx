"use client";

import { useEffect, useState } from "react";

export default function CommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function loadComments() {
    const res = await fetch("/api/admin/comments");
    const data = await res.json();
    if (data.ok) setComments(data.comments);
    setLoading(false);
  }

  useEffect(() => {
    loadComments();
    fetch("/api/admin/works")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setWorks(d.works);
      });
  }, []);

  function workTitle(workId: string) {
    const w = works.find((x) => x.id === workId);
    return w ? w.title : "已删除的作品";
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("zh-CN");
  }

  async function deleteComment(id: string) {
    if (!window.confirm("确定删除这条留言吗？")) return;
    const res = await fetch(`/api/admin/comments?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.ok) {
      setMsg("✅ 已删除");
      loadComments();
    } else {
      setMsg(`❌ ${data.error || "删除失败"}`);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-zinc-100">留言管理</h1>
      <p className="mt-1 text-sm text-zinc-500">
        访客在留言板和作品评论区写的内容都在这里。删掉就从前台消失。
      </p>
      {msg && <p className="mt-3 text-sm text-emerald-400">{msg}</p>}

      {loading ? (
        <p className="mt-8 text-zinc-600">读取中……</p>
      ) : comments.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-600">
          还没有留言。等前台做好后，访客的留言会出现在这里。
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                    {(c.nickname || "匿").charAt(0)}
                  </span>
                  <span className="font-medium text-zinc-100">
                    {c.nickname}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {c.workId
                      ? `评论于「${workTitle(c.workId)}」`
                      : "全局留言板"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600">
                    {formatTime(c.createdAt)}
                  </span>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-rose-400 transition hover:border-rose-800 hover:bg-rose-950/50"
                  >
                    删除
                  </button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
