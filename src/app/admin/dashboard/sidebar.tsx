"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    label: "内容",
    items: [
      { href: "/admin/dashboard/prompt", label: "AI 人设提示词", icon: "✦" },
      { href: "/admin/dashboard/knowledge", label: "知识库", icon: "❑" },
      { href: "/admin/dashboard/about", label: "作者简介", icon: "◉" },
    ],
  },
  {
    label: "资源",
    items: [
      { href: "/admin/dashboard/resume", label: "简历管理", icon: "⇩" },
      { href: "/admin/dashboard/works", label: "作品管理", icon: "▤" },
      { href: "/admin/dashboard/comments", label: "留言管理", icon: "✉" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/40">
      <div className="px-5 pb-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rotate-45 bg-amber-400" />
          <span className="font-semibold tracking-wide text-zinc-100">
            克里斯蒂小姐侦探所
          </span>
        </div>
        <p className="mt-1 pl-[18px] text-xs text-zinc-500">内容管理后台</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "flex items-center gap-2.5 rounded-lg bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-400"
                        : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/60 hover:text-zinc-200"
                    }
                  >
                    <span className={active ? "text-amber-400" : "text-zinc-600"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-zinc-800 p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800/60 hover:text-zinc-200"
        >
          <span className="text-zinc-600">↗</span> 回到网站
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition hover:bg-zinc-800/60 hover:text-rose-400"
        >
          <span className="text-zinc-600">⏻</span> 退出登录
        </button>
      </div>
    </aside>
  );
}
