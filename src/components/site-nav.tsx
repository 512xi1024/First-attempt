"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { SITE } from "@/lib/config";

// ============================================================
// 顶部导航（首页和二级页共用）
// - 手机窄屏时横向可滑，当前页那一项自动滚到可视区正中
// - 点击任意一项时立刻把它滑到中间，手指还没松开就看到反馈
// - 所有链接 prefetch={false}：默认预取会把首页的立绘和背景图
//   一起下下来，导致每个二级页白背 250KB 用不到的图
// ============================================================

const ITEMS = [
  { href: "/", label: "首页" },
  { href: "/about", label: "档案" },
  { href: "/gallery", label: "总图档" },
  { href: "/guestbook", label: "留言" },
  { href: "/contact", label: "联系" },
];

export default function SiteNav() {
  const navRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // 让某个元素滑到导航的可视区中间
  function centerEl(el: Element | null, smooth = true) {
    const nav = navRef.current;
    if (!nav || !el) return;
    const navRect = nav.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const delta = rect.left + rect.width / 2 - (navRect.left + navRect.width / 2);
    if (Math.abs(delta) < 1) return;
    nav.scrollTo({
      left: nav.scrollLeft + delta,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  // 进页面 / 换页后把当前项对齐到中间。
  // 延迟 30ms 是因为首帧拿到的宽度可能是 0（字体和布局还没稳定）
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector(`[data-nav-href="${pathname}"]`);
    const t = setTimeout(() => centerEl(active, false), 30);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      className="flex items-center gap-4 overflow-x-auto text-sm text-stone-400 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] sm:gap-8 [&::-webkit-scrollbar]:hidden"
    >
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          prefetch={false}
          data-nav-href={it.href}
          onPointerDown={(e) => centerEl(e.currentTarget)}
          className="cursor-target nav-link shrink-0 whitespace-nowrap tracking-widest transition hover:text-amber-200"
        >
          {it.label}
        </Link>
      ))}
      <a
        href={SITE.resumeUrl}
        download
        data-cursor-label="下载"
        className="cursor-target shrink-0 whitespace-nowrap rounded-full border border-stone-700 px-4 py-1.5 tracking-widest text-stone-300 transition hover:-translate-y-0.5 hover:border-amber-200 hover:text-amber-200"
      >
        下载简历 PDF
      </a>
    </nav>
  );
}
