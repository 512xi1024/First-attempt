"use client";

import { useEffect, useRef, useState } from "react";

export default function ResumePage() {
  const [current, setCurrent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadCurrent() {
    const res = await fetch("/api/admin/settings?key=resume_file");
    const data = await res.json();
    if (data.ok) setCurrent(data.value);
  }

  useEffect(() => {
    loadCurrent();
  }, []);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMsg("❌ 请先选择一个 PDF 文件");
      return;
    }

    setUploading(true);
    setMsg("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.ok) {
      setMsg("✅ 上传成功");
      await loadCurrent();
    } else {
      setMsg(`❌ ${data.error || "上传失败"}`);
    }
    setUploading(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-zinc-100">简历管理</h1>
      <p className="mt-1 text-sm text-zinc-500">
        上传 PDF 简历。访客在前台点「下载简历」就会拿到这个文件。
      </p>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
          <span className="text-sm text-zinc-500">当前简历</span>
          {current ? (
            <a
              href="/api/files/resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-amber-400 underline-offset-4 hover:text-amber-300 hover:underline"
            >
              查看 resume.pdf ↗
            </a>
          ) : (
            <span className="text-sm text-zinc-600">还没有上传</span>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="mt-4 block w-full text-sm text-zinc-400 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
        />

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
          >
            {uploading ? "上传中……" : "上传"}
          </button>
          <span className="text-sm text-emerald-400">{msg}</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        提示：只支持 PDF，最大 10MB。再次上传会覆盖旧简历。
      </p>
    </div>
  );
}
