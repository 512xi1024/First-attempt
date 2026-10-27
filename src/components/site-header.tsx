import Link from "next/link";
import SiteNav from "@/components/site-nav";
import TickerBar from "@/components/ticker-bar";

// 二级页面共用的顶部栏（和首页同款：左标题 + 右导航 + 滚动条幅）
// 导航用 Link：应用内跳转不重载页面，环境音等全局状态不会被打断
export default function SiteHeader() {
  return (
    <>
      {/* 手机窄屏（横屏也一样）会挤：文字一律不换行，导航允许横向滚动，
          宁可超出可滑，也不要让标题被压成一列竖排字 */}
      <header className="flex items-center justify-between gap-6 px-5 pt-6 sm:px-10 sm:pt-8">
        {/* prefetch={false}：默认预取会把首页的立绘+背景图也一起下下来，
            导致任何一个二级页面都白背 250KB 用不到的图 */}
        <Link
          href="/"
          prefetch={false}
          className="cursor-target shrink-0 whitespace-nowrap text-base tracking-[0.3em] text-stone-100 sm:text-lg"
        >
          克里斯蒂小姐
        </Link>
        <SiteNav />
      </header>
      <TickerBar />
    </>
  );
}
