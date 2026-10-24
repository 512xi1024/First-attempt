"use client";

import { useEffect, useState } from "react";

type WorkForm = {
  id: string; // 空字符串 = 新建，有值 = 编辑
  title: string;
  category: string;
  description: string;
  sortOrder: number;
  coverImage: string;
  detailImages: string[];
};

const EMPTY_FORM: WorkForm = {
  id: "",
  title: "",
  category: "",
  description: "",
  sortOrder: 0,
  coverImage: "",
  detailImages: [],
};

export default function WorksPage() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<WorkForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingDetails, setUploadingDetails] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadWorks() {
    const res = await fetch("/api/admin/works");
    const data = await res.json();
    if (data.ok) setWorks(data.works);
    setLoading(false);
  }

  useEffect(() => {
    loadWorks();
  }, []);

  function startCreate() {
    setForm({ ...EMPTY_FORM });
    setMsg("");
  }

  function startEdit(work: any) {
    let details: string[] = [];
    try {
      const parsed = JSON.parse(work.detailImages);
      if (Array.isArray(parsed)) details = parsed;
    } catch {}
    setForm({
      id: work.id,
      title: work.title,
      category: work.category,
      description: work.description,
      sortOrder: work.sortOrder,
      coverImage: work.coverImage,
      detailImages: details,
    });
    setMsg("");
  }

  // 选完文件自动上传（封面）
  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload-image", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (data.ok) {
      setForm((f) => (f ? { ...f, coverImage: data.filename } : f));
    } else {
      setMsg(`❌ ${data.error}`);
    }
    setUploadingCover(false);
    e.target.value = "";
  }

  // 选完文件自动上传（详情图，支持多选）
  async function uploadDetails(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDetails(true);
    const newNames: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.ok) newNames.push(data.filename);
    }
    setForm((f) =>
      f ? { ...f, detailImages: [...f.detailImages, ...newNames] } : f
    );
    setUploadingDetails(false);
    e.target.value = "";
  }

  function removeDetail(index: number) {
    setForm((f) =>
      f
        ? { ...f, detailImages: f.detailImages.filter((_, i) => i !== index) }
        : f
    );
  }

  async function saveWork() {
    if (!form) return;
    if (!form.title.trim()) {
      setMsg("❌ 标题不能为空");
      return;
    }
    setSaving(true);
    setMsg("");

    const isNew = form.id === "";
    const res = await fetch("/api/admin/works", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: form.id,
        title: form.title,
        category: form.category,
        description: form.description,
        coverImage: form.coverImage,
        detailImages: form.detailImages,
        sortOrder: form.sortOrder,
      }),
    });
    const data = await res.json();

    if (data.ok) {
      setForm(null);
      setMsg("✅ 保存成功");
      loadWorks();
    } else {
      setMsg(`❌ ${data.error || "保存失败"}`);
    }
    setSaving(false);
  }

  async function deleteWork(id: string, title: string) {
    if (!window.confirm(`确定删除「${title}」吗？此操作不可撤销。`)) return;
    const res = await fetch(`/api/admin/works?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      setMsg("✅ 已删除");
      loadWorks();
    } else {
      setMsg(`❌ ${data.error || "删除失败"}`);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">作品管理</h1>
        <button
          onClick={startCreate}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
        >
          + 新建作品
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-emerald-400">{msg}</p>}

      {loading ? (
        <p className="mt-8 text-zinc-600">读取中……</p>
      ) : works.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-600">
          还没有作品，点右上角「新建作品」添加第一个。
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {works.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
            >
              {w.coverImage ? (
                <img
                  src={`/api/files/${w.coverImage}`}
                  alt={w.title}
                  className="h-16 w-24 rounded-lg border border-zinc-800 object-cover"
                />
              ) : (
                <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950 text-xs text-zinc-600">
                  无封面
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-zinc-100">{w.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {w.category || "未分类"} · 排序 {w.sortOrder}
                </p>
              </div>
              <button
                onClick={() => startEdit(w)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-amber-400 hover:text-amber-400"
              >
                编辑
              </button>
              <button
                onClick={() => deleteWork(w.id, w.title)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-rose-400 transition hover:border-rose-800 hover:bg-rose-950/50"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-10 flex items-start justify-center overflow-y-auto bg-black/70 p-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/50">
            <h2 className="text-lg font-semibold text-zinc-100">
              {form.id ? "编辑作品" : "新建作品"}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-zinc-500">标题 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-zinc-500">分类</label>
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    placeholder="如：App 改版"
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400"
                  />
                </div>
                <div className="w-40">
                  <label className="text-sm text-zinc-500">排序</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-500">描述</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-sm text-zinc-500">
                  封面图（选完自动上传）
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={uploadCover}
                    className="text-sm text-zinc-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
                  />
                  {uploadingCover && (
                    <span className="ml-2 text-sm text-amber-400">
                      上传中…
                    </span>
                  )}
                </div>
                {form.coverImage && (
                  <img
                    src={`/api/files/${form.coverImage}`}
                    alt="封面预览"
                    className="mt-2 h-32 w-48 rounded-lg border border-zinc-800 object-cover"
                  />
                )}
              </div>

              <div>
                <label className="text-sm text-zinc-500">
                  详情图（可多选，选完自动上传，可多次添加）
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={uploadDetails}
                    className="text-sm text-zinc-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
                  />
                  {uploadingDetails && (
                    <span className="ml-2 text-sm text-amber-400">
                      上传中…
                    </span>
                  )}
                </div>
                {form.detailImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.detailImages.map((name, i) => (
                      <div key={name} className="relative">
                        <img
                          src={`/api/files/${name}`}
                          alt={`详情图 ${i + 1}`}
                          className="h-20 w-28 rounded-lg border border-zinc-800 object-cover"
                        />
                        <button
                          onClick={() => removeDetail(i)}
                          className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-xs text-white hover:bg-rose-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 border-t border-zinc-800 pt-4">
                <button
                  onClick={saveWork}
                  disabled={saving}
                  className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
                >
                  {saving ? "保存中…" : "保存"}
                </button>
                <button
                  onClick={() => setForm(null)}
                  className="rounded-lg border border-zinc-700 px-5 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
