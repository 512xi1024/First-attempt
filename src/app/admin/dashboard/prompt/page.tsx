"use client";

import { useEffect, useState } from "react";

export default function PromptPage() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 打开页面时，把已保存的内容读出来填进文本框
  useEffect(() => {
    fetch("/api/admin/settings?key=system_prompt")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setValue(d.value);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "system_prompt", value }),
    });
    const data = await res.json();
    setMsg(data.ok ? "✅ 保存成功" : `❌ ${data.error || "保存失败"}`);
    setSaving(false);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-zinc-100">AI 人设提示词</h1>
      <p className="mt-1 text-sm text-zinc-500">
        这段文字会作为 AI 角色的「身份设定」发给模型，决定它是什么人、怎么说话、能回答什么。
      </p>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          system_prompt
        </label>
        <textarea
          value={loading ? "" : value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={loading ? "读取中……" : "在这里写下 AI 的人设提示词……"}
          rows={18}
          className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400"
        />

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
          >
            {saving ? "保存中……" : "保存"}
          </button>
          <span className="text-sm text-emerald-400">{msg}</span>
        </div>
      </div>
    </div>
  );
}
