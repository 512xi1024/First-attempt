"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (data.ok) {
      window.location.href = "/admin/dashboard";
    } else {
      setMsg(data.error || "登录失败");
    }
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-8">
      {/* 背景装饰光斑 */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />

      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center">
            <span className="block h-3 w-3 rotate-45 bg-amber-400" />
          </span>
          <h1 className="text-lg font-semibold tracking-wide text-zinc-100">
            克里斯蒂小姐侦探所
          </h1>
          <p className="mt-1 text-xs text-zinc-500">内容管理后台</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入后台密码"
          autoFocus
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
        >
          {loading ? "验证中……" : "进入后台"}
        </button>
        {msg && <p className="mt-3 text-center text-sm text-rose-400">{msg}</p>}
      </form>
    </main>
  );
}
