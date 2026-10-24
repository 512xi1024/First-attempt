"use client";

// ============================================================
// Folder 档案夹组件（对照 reactbits.dev 的 Folder 行为实现）
// - 文件夹合上时纸张只露小边（peek）
// - openOn="click" 点夹子 → 纸张扇形升起，可翻阅
// - 点某张纸 → 放大阅读（zoomOnClick）
// - 整个夹子可拖拽（draggable）
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
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(
    null
  );
  const moved = useRef(false);
  const n = items.length;

  // 入场动画
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Esc 关闭放大纸
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const dur = `${0.5 / speed}s`;
  const bounce = "cubic-bezier(0.34, 1.4, 0.64, 1)";

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

  function onFrontDown(e: React.PointerEvent) {
    if (!draggable || e.button !== 0) return;
    moved.current = false;
    drag.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: pos.x,
      oy: pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onFrontMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved.current = true;
    setPos({ x: d.ox + dx, y: d.oy + dy });
  }
  function onFrontUp() {
    drag.current = null;
  }
  function onFrontClick() {
    if (moved.current) return; // 拖拽过就不触发
    if (openOn === "hover") return;
    if (!open) {
      // 点夹子：先让纸张弹出，动画结束后再显示内容
      setOpen(true);
      if (zoomOnClick) {
        setTimeout(() => setZoom((z) => (z === null ? 0 : z)), 750 / speed);
      }
    } else {
      setOpen(false);
    }
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
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
            transition: drag.current ? "none" : "transform 0.35s ease",
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
              onClick={() => open && zoomOnClick && setZoom(i)}
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
            onPointerDown={onFrontDown}
            onPointerMove={onFrontMove}
            onPointerUp={onFrontUp}
            onClick={onFrontClick}
            onMouseEnter={() => openOn === "hover" && setOpen(true)}
            className={
              "absolute inset-x-0 bottom-0 top-[14%] rounded-b-lg rounded-tr-lg border-t border-white/10 " +
              (draggable ? "cursor-grab active:cursor-grabbing" : "")
            }
            style={{
              backgroundColor: color,
              zIndex: 40,
              boxShadow: "inset 0 2px 12px rgba(0,0,0,0.35), 0 14px 30px rgba(0,0,0,0.45)",
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
          </div>
        </div>
      </div>

      {/* 放大阅读层 */}
      {zoom !== null && items[zoom] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm"
          onClick={() => setZoom(null)}
        >
          <div
            className="animate-fade-in-up max-h-[80vh] w-[90vw] max-w-2xl overflow-y-auto rounded-sm p-8 shadow-2xl"
            style={{ backgroundColor: paperColor }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
              no.{zoom + 1} / {n}
            </p>
            <h2 className="mt-2 text-xl font-medium text-stone-900">
              {items[zoom].title}
            </h2>
            <hr className="my-4 border-stone-400/50" />
            <PaperMarkdown text={items[zoom].content || ""} />
            <button
              onClick={() => setZoom(null)}
              className="cursor-target mt-6 rounded-full border border-stone-500/60 px-4 py-1.5 text-xs tracking-widest text-stone-700 transition hover:border-stone-900"
            >
              合上这张纸
            </button>
          </div>
        </div>
      )}
    </>
  );
}
