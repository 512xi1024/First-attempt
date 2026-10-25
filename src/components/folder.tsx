"use client";

// ============================================================
// Folder 档案夹组件（对照 reactbits.dev 的 Folder 行为实现）
// - 文件夹合上时纸张只露小边（peek）
// - openOn="click" 点夹子 → 纸张扇形升起，可翻阅
// - 点某张纸 → 打开阅读层（zoomOnClick）
// - 整个夹子可拖拽（含纸张区域）
//
// 阅读层（2026-10-25 重做）：
//   原来一次只能看一张，看下一张得先关掉，多页很难读。
//   现在支持：左右翻页按钮 / 键盘 ← → / 底部页码直接跳 / 拖纸移动位置。
//
// 拖拽实现说明：不用 setPointerCapture。
//   捕获会把 pointerup 重定向到捕获元素，导致子元素的 click 收不到，
//   表现就是"点了没反应"。改成 window 上监听 move/up，click 就正常了。
// ============================================================

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export type FolderItem = {
  title: string;
  content?: string;
  image?: string;
};

type FolderProps = {
  label?: string;
  items?: FolderItem[];
  color?: string; // 文件夹颜色
  paperColor?: string; // 纸张颜色
  tabPosition?: "left" | "right";
  size?: number; // 整体大小（相对父容器宽度的比例）
  openOn?: "click" | "hover";
  peek?: boolean;
  intro?: boolean;
  draggable?: boolean;
  zoomOnClick?: boolean;
  speed?: number; // 动画速度因子（越大越快）
};

// 纸张上的 Markdown 排版（米白纸 + 深字）
function PaperMarkdown({ text }: { text: string }) {
  return (
    <div className="text-sm leading-7 text-stone-800">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-6 text-lg font-medium text-stone-900">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 text-base font-medium text-stone-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-sm font-medium text-stone-900">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#6b2b25]">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-[#6b2b25] underline underline-offset-4">
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-stone-400/60" />,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-[#6b2b25]/50 pl-3 text-stone-600">
              {children}
            </blockquote>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function Folder({
  label = "Archive",
  items = [],
  color = "#6b2b25",
  paperColor = "#e1e1d5",
  tabPosition = "right",
  size = 1,
  openOn = "click",
  peek = true,
  intro = true,
  draggable = true,
  zoomOnClick = true,
  speed = 1,
}: FolderProps) {
  const [mounted, setMounted] = useState(!intro);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // 阅读层里那张纸的位置（可拖走，方便并排看两页）
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [zoomDragging, setZoomDragging] = useState(false);

  const moved = useRef(false);
  const n = items.length;

  // 入场动画
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // 键盘：Esc 关闭，← → 翻页
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (zoom === null) return;
      if (e.key === "Escape") {
        closeZoom();
      } else if (e.key === "ArrowRight") {
        setZoom((z) => (z === null ? z : Math.min(n - 1, z + 1)));
      } else if (e.key === "ArrowLeft") {
        setZoom((z) => (z === null ? z : Math.max(0, z - 1)));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, n]);

  const dur = `${0.5 / speed}s`;
  const bounce = "cubic-bezier(0.34, 1.4, 0.64, 1)";

  function closeZoom() {
    setZoom(null);
    setZoomPos({ x: 0, y: 0 });
  }

  function paperTransform(i: number) {
    if (!mounted) return "translateY(60%)";
    if (!open) {
      // 合上：纸张微微向上探出夹子上沿（peek）
      return `translateY(${peek ? -(5 + i * 1.5) : 0}%)`;
    }
    // 打开：纸张向上扇形升起
    const spread = (i - (n - 1) / 2) * 2.2;
    return `translateY(${-30 - i * 12}%) rotate(${spread}deg)`;
  }

  // 通用拖拽：window 上监听，不动用 pointer capture
  function beginDrag(
    e: React.PointerEvent,
    origin: { x: number; y: number },
    apply: (p: { x: number; y: number }) => void,
    setActive: (v: boolean) => void
  ) {
    if (e.button !== 0) return;
    moved.current = false;
    const start = { sx: e.clientX, sy: e.clientY, ox: origin.x, oy: origin.y };
    setActive(true);

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.sx;
      const dy = ev.clientY - start.sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved.current = true;
      apply({ x: start.ox + dx, y: start.oy + dy });
    };
    const onUp = () => {
      setActive(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function onFrontDown(e: React.PointerEvent) {
    if (!draggable) return;
    beginDrag(e, pos, setPos, setDragging);
  }

  function onFrontClick() {
    if (moved.current) return; // 拖拽过就不触发展开
    if (openOn === "hover") return;
    if (!open) {
      setOpen(true);
      if (zoomOnClick) {
        setTimeout(() => setZoom((z) => (z === null ? 0 : z)), 750 / speed);
      }
    } else {
      setOpen(false);
    }
  }

  // 翻页 / 关闭：拖过纸就算拖拽，不当点击
  function goTo(i: number) {
    if (moved.current) return;
    setZoom(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <>
      {/* 场景：负责整体大小与长宽适配（始终居中，不超出父容器） */}
      <div
        className="relative mx-auto select-none"
        style={{
          width: "100%",
          maxWidth: `${size * 640}px`,
          aspectRatio: "1.55",
        }}
        onPointerDown={onFrontDown}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
            transition: dragging ? "none" : "transform 0.35s ease",
          }}
        >
          {/* 夹子背板（最底层） */}
          <div
            className="absolute inset-x-0 bottom-0 top-1.5 rounded-lg"
            style={{ backgroundColor: color, filter: "brightness(0.75)" }}
          />

          {/* 纸张们 */}
          {items.map((it, i) => (
            <div
              key={i}
              onClick={() => {
                if (moved.current) return; // 刚拖动过，不当作点击
                if (open && zoomOnClick) setZoom(i);
              }}
              className="absolute bottom-[4%] left-[5%] right-[5%] top-[16%] cursor-pointer overflow-hidden rounded-[3px] px-4 py-3"
              style={{
                backgroundColor: paperColor,
                zIndex: 10 + i,
                transform: paperTransform(i),
                transition: `transform ${dur} ${bounce}`,
                transitionDelay: open ? `${i * 0.05}s` : "0s",
                boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
              }}
            >
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">
                no.{i + 1}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-stone-900">
                {it.title}
              </p>
              {/* 缩略内容（合起时只隐约可见） */}
              <div className="mt-2 h-[2px] w-8 bg-stone-400/60" />
            </div>
          ))}

          {/* 夹子正面（盖住纸张下半截） */}
          <div
            onClick={onFrontClick}
            onMouseEnter={() => openOn === "hover" && setOpen(true)}
            className={
              "absolute inset-x-0 bottom-0 top-[14%] rounded-b-lg rounded-tr-lg border-t border-white/10 " +
              (draggable ? "cursor-grab active:cursor-grabbing" : "")
            }
            style={{
              backgroundColor: color,
              zIndex: 40,
              boxShadow:
                "inset 0 2px 12px rgba(0,0,0,0.35), 0 14px 30px rgba(0,0,0,0.45)",
            }}
          >
            {/* 标签页 */}
            <div
              className="absolute -top-6 flex h-6 items-center rounded-t-md px-4"
              style={{
                backgroundColor: color,
                right: tabPosition === "right" ? "6%" : undefined,
                left: tabPosition === "left" ? "6%" : undefined,
                filter: "brightness(1.15)",
              }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-200/90">
                {label}
              </span>
            </div>

            {/* 页数提示：合上时也能知道一共几页 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span className="font-mono text-[10px] tracking-[0.3em] text-stone-300/40">
                共 {n} 页 · 点击翻开
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 阅读层：可翻页、可拖动 ===== */}
      {zoom !== null && items[zoom] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-8"
          onClick={closeZoom}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) =>
              beginDrag(e, zoomPos, setZoomPos, setZoomDragging)
            }
            className="animate-fade-in-up flex max-h-[88vh] w-full max-w-3xl cursor-grab flex-col overflow-hidden rounded-sm shadow-[0_30px_80px_rgba(0,0,0,0.65)] active:cursor-grabbing"
            style={{
              backgroundColor: paperColor,
              transform: `translate3d(${zoomPos.x}px, ${zoomPos.y}px, 0)`,
              transition: zoomDragging ? "none" : "transform 0.25s ease",
            }}
          >
            {/* 纸头：档案编号 + 标题 + 合上 */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-400/40 px-5 py-4 sm:px-8 sm:py-5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
                  no.{zoom + 1} / {n}
                </p>
                <h2 className="mt-1 truncate text-lg font-medium text-stone-900 sm:text-xl">
                  {items[zoom].title}
                </h2>
              </div>
              <button
                onClick={() => {
                  if (moved.current) return;
                  closeZoom();
                }}
                aria-label="合上这张纸"
                className="cursor-target -mr-1 shrink-0 rounded-full p-2 text-stone-500 transition hover:bg-stone-900/10 hover:text-stone-900"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* 正文：滚动区。key 跟着页码变，翻页时自动回到顶部 */}
            <div
              key={zoom}
              className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6"
            >
              <PaperMarkdown text={items[zoom].content || ""} />
            </div>

            {/* 纸脚：翻页 */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-stone-400/40 px-4 py-3 sm:px-6">
              <button
                onClick={() => goTo(zoom - 1)}
                disabled={zoom === 0}
                className="cursor-target flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs tracking-widest text-stone-600 transition hover:bg-stone-900/10 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ‹ 上一张
              </button>

              {/* 页数不多时给圆点，多了只显示数字（免得挤成一排） */}
              {n <= 10 ? (
                <div className="flex items-center gap-1.5">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`第 ${i + 1} 张`}
                      aria-current={i === zoom}
                      className={`h-1.5 rounded-full transition-all ${
                        i === zoom
                          ? "w-5 bg-stone-700"
                          : "w-1.5 bg-stone-400 hover:bg-stone-500"
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <span className="font-mono text-[11px] tracking-[0.2em] text-stone-500">
                  {zoom + 1} / {n}
                </span>
              )}

              <button
                onClick={() => goTo(zoom + 1)}
                disabled={zoom === n - 1}
                className="cursor-target flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs tracking-widest text-stone-600 transition hover:bg-stone-900/10 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              >
                下一张 ›
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
