import Link from "next/link";
import { SITE } from "@/lib/config";
import TickerBar from "@/components/ticker-bar";

// 二级页面共用的顶部栏（和首页同款：左标题 + 右导航 + 滚动条幅）
// 导航用 Link：应用内跳转不重载页面，环境音等全局状态不会被打断
export default function SiteHeader() {
  return (
    <>
      <header className="flex items-center justify-between px-10 pt-8">
        <Link
          href="/"
          className="cursor-target text-lg tracking-[0.3em] text-stone-100"
        >
          克里斯蒂小姐
        </Link>
        <nav className="flex items-center gap-8 text-sm text-stone-400">
          <Link
            href="/"
            className="cursor-target nav-link tracking-widest transition hover:text-amber-200"
          >
            首页
          </Link>
          <Link
            href="/about"
            className="cursor-target nav-link tracking-widest transition hover:text-amber-200"
          >
            档案
          </Link>
          <Link
            href="/gallery"
            className="cursor-target nav-link tracking-widest transition hover:text-amber-200"
          >
            总图档
          </Link>
          <Link
            href="/guestbook"
            className="cursor-target nav-link tracking-widest transition hover:text-amber-200"
          >
            留言
          </Link>
          <Link
            href="/contact"
            className="cursor-target nav-link tracking-widest transition hover:text-amber-200"
          >
            联系
          </Link>
          <a
            href={SITE.resumeUrl}
            download
            data-cursor-label="下载"
            className="cursor-target rounded-full border border-stone-700 px-4 py-1.5 tracking-widest text-stone-300 transition hover:-translate-y-0.5 hover:border-amber-200 hover:text-amber-200"
          >
            下载简历 PDF
          </a>
        </nav>
      </header>
      <TickerBar />
    </>
  );
}
