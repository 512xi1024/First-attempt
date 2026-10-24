import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [workCount, commentCount, resume, prompt] = await Promise.all([
    prisma.work.count(),
    prisma.comment.count(),
    prisma.setting.findUnique({ where: { key: "resume_file" } }),
    prisma.setting.findUnique({ where: { key: "system_prompt" } }),
  ]);

  const stats = [
    {
      href: "/admin/dashboard/works",
      label: "作品",
      value: `${workCount} 篇`,
      hint: "前往管理 →",
    },
    {
      href: "/admin/dashboard/comments",
      label: "留言",
      value: `${commentCount} 条`,
      hint: "前往管理 →",
    },
    {
      href: "/admin/dashboard/resume",
      label: "简历",
      value: resume ? "已上传" : "未上传",
      hint: resume ? "查看 / 替换 →" : "去上传 →",
    },
    {
      href: "/admin/dashboard/prompt",
      label: "AI 人设",
      value: prompt ? "已设置" : "未设置",
      hint: "去编辑 →",
    },
  ];

  return (
    <div>
      <p className="text-sm text-zinc-500">欢迎回来</p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-100">总览</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-amber-400/40 hover:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">
              {s.value}
            </p>
            <p className="mt-3 text-xs text-zinc-600 transition group-hover:text-amber-400">
              {s.hint}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-medium text-zinc-300">小提示</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-zinc-500">
          <li>· 所有改动保存后立即生效，前台会实时读取最新数据。</li>
          <li>· 留言没有审核环节，发现垃圾内容直接在「留言管理」删除即可。</li>
        </ul>
      </div>
    </div>
  );
}
