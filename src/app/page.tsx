import Link from "next/link";
import { ASSETS } from "@/lib/assets";
import { SITE } from "@/lib/config";
import ChatBox from "@/components/chat-box";
import TickerBar from "@/components/ticker-bar";

export default function Home() {
  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-stone-950 font-serif text-stone-200">
      {/* ===== 背景：压暗做旧质感（占位，素材见 src/lib/assets.ts） ===== */}
      {ASSETS.background && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${ASSETS.background})` }}
        />
      )}
      {/* 四周暗角，营造旧照片质感 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(12,10,7,0.9) 100%)",
        }}
      />

      {/* ===== 顶部栏：左标题 + 右五按钮 ===== */}
      <header className="relative z-10 flex items-center justify-between gap-6 px-5 pt-6 sm:px-10 sm:pt-8">
        <h1 className="shrink-0 whitespace-nowrap text-base tracking-[0.3em] text-stone-100 sm:text-lg">
          克里斯蒂小姐
        </h1>
        <nav className="flex items-center gap-4 overflow-x-auto text-sm text-stone-400 sm:gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/" className="cursor-target nav-link shrink-0 whitespace-nowrap tracking-widest transition hover:text-amber-200">
            首页
          </Link>
          <Link
            href="/about"
            className="cursor-target nav-link shrink-0 whitespace-nowrap tracking-widest transition hover:text-amber-200"
          >
            档案
          </Link>
          <Link
            href="/gallery"
            className="cursor-target nav-link shrink-0 whitespace-nowrap tracking-widest transition hover:text-amber-200"
          >
            总图档
          </Link>
          <Link
            href="/guestbook"
            className="cursor-target nav-link shrink-0 whitespace-nowrap tracking-widest transition hover:text-amber-200"
          >
            留言
          </Link>
          <Link
            href="/contact"
            prefetch={false}
            className="cursor-target nav-link shrink-0 whitespace-nowrap tracking-widest transition hover:text-amber-200"
          >
            联系
          </Link>
          <a
            href={SITE.resumeUrl}
            download
            className="cursor-target shrink-0 whitespace-nowrap rounded-full border border-stone-700 px-4 py-1.5 tracking-widest text-stone-300 transition hover:-translate-y-0.5 hover:border-amber-200 hover:text-amber-200"
          >
            下载简历 PDF
          </a>
        </nav>
      </header>
      <TickerBar />

      {/* ===== 主体：角色大立绘居中、贴屏幕底边；对话框挂在她手边 ===== */}
      <div className="relative z-10 flex-1">
        {/* 角色形象：水平居中 + 底对齐，占满大半屏高（fade 入场） */}
        <div className="animate-fade-in-up absolute inset-x-0 bottom-0 flex justify-center">
          {ASSETS.characterIdle ? (
            /* 以后有正式立绘时走这里：限制高度、贴底显示 */
            <img
              src={ASSETS.characterIdle}
              alt="克里斯蒂小姐"
              /* 首页唯一的主体形象，让它优先于背景图下载 */
              fetchPriority="high"
              decoding="async"
              className="max-h-[72vh] w-auto object-contain object-bottom"
            />
          ) : (
            /* 没图时的占位框：同样居中贴底 */
            <div className="flex h-[60vh] w-96 flex-col items-center justify-center rounded-t-lg border border-b-0 border-dashed border-stone-700/80 text-stone-600">
              <span className="text-sm tracking-widest">角色形象占位</span>
              <span className="mt-2 text-xs">克里斯蒂小姐 · 待机姿态</span>
            </div>
          )}
        </div>

        {/* 对话框：宽屏挂在角色右手边；窄屏（横屏手机）改为贴右侧，
            避免 left-1/2 + 固定宽度算出屏幕外 */}
        <div
          className="animate-fade-in-up absolute bottom-2 right-4 top-2 flex w-[min(19rem,calc(100vw-2rem))] flex-col justify-start min-[1360px]:bottom-24 min-[1360px]:left-1/2 min-[1360px]:right-auto min-[1360px]:top-[22vh] min-[1360px]:ml-56 min-[1360px]:w-[26rem]"
          style={{ animationDelay: "0.25s" }}
        >
          <ChatBox />
        </div>
      </div>

      {/* ===== 底部：其他项目入口（占位，配置见 src/lib/config.ts） ===== */}
      {SITE.externalProjects.length > 0 && (
        <footer className="relative z-10 flex justify-end gap-6 px-10 pb-6 text-sm text-stone-500">
          {SITE.externalProjects.map((p) => (
            <a
              key={p.url}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="tracking-widest transition hover:text-amber-200"
            >
              {p.name} ↗
            </a>
          ))}
        </footer>
      )}
      {/* ===== 右下角：后台管理入口（齿轮按钮） ===== */}
      <a
        href="/admin"
        aria-label="后台管理" data-cursor-label="后台"
        className="cursor-target group fixed bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-stone-700/80 bg-stone-900/70 backdrop-blur-sm transition hover:border-amber-200/80 max-[1360px]:right-auto max-[1360px]:left-6"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-stone-500 transition duration-500 group-hover:rotate-90 group-hover:text-amber-200"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </a>
    </main>
  );
}
