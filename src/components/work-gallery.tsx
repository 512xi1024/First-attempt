"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// 作品图集：正文按原尺寸铺开，点任意一张进全屏灯箱
//
// 为什么不做成"新开标签页"：
//   新标签页会跳出网站、丢导航和暗色底，手机上还得按返回才回来。
//   灯箱在页面内浮起，视觉连续，关掉就回到原位。
//
// 为什么不会卡：
//   1. 正文和灯箱用的是同一个 URL → 点开时浏览器缓存直接命中，不重新下载
//   2. 图片本来就有 loading="lazy"，没滚到的图不会请求
//   3. 灯箱只渲染当前那一张，切换时把旧的整张卸掉，不做预挂载
//   4. 打开时锁住页面滚动，避免手机端背景跟着滑动
// ============================================================

export type GalleryItem = { file: string; alt: string };

const srcOf = (file: string) => `/api/files/${file}`;

export default function WorkGallery({
  items,
  title,
}: {
  items: GalleryItem[];
  title: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const preloaded = useRef<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIndex(null), []);

  // 注意：更新函数保持纯函数，不要把 setLoaded 塞进去
  // （严格模式下更新函数可能被调用两次，副作用会重复执行）
  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((cur) => {
        if (cur === null) return cur;
        const next = cur + dir;
        if (next < 0 || next >= items.length) return cur;
        return next;
      });
    },
    [items.length]
  );

  // 打开灯箱：锁滚动 + 键盘操作
  useEffect(() => {
    if (index === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, close, go]);

  // 提前把左右相邻两张塞进浏览器缓存，翻页时几乎不用等
  useEffect(() => {
    if (index === null) return;
    for (const i of [index - 1, index + 1]) {
      if (i < 0 || i >= items.length || preloaded.current.has(i)) continue;
      preloaded.current.add(i);
      const img = new Image();
      img.src = srcOf(items[i].file);
    }
  }, [index, items]);

  // 换图时：先淡出旧图避免闪一下，同时回到顶部
  // （否则会停在上半张的滚动位置）
  useEffect(() => {
    if (index === null) return;
    setLoaded(false);
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
  }, [index]);

  // 灯箱开着时给 body 加个标记，方便外部按需处理
  useEffect(() => {
    document.body.classList.toggle("lightbox-open", index !== null);
    return () => document.body.classList.remove("lightbox-open");
  }, [index]);

  if (items.length === 0) return null;

  return (
    <>
      {/* ===== 正文图集：单列，点开看大图 ===== */}
      <div className="mt-8 space-y-6" data-cursor-hide>
        {items.map((it, i) => (
          <button
            key={it.file}
            type="button"
            onClick={() => {
              setLoaded(false);
              setIndex(i);
            }}
            aria-label={`放大查看 ${it.alt}`}
            className="block w-full cursor-zoom-in overflow-hidden rounded-lg border border-stone-800 transition hover:border-stone-600"
          >
            <img
              src={srcOf(it.file)}
              alt={it.alt}
              /* 第一张是封面，属于首屏；其余等滚到附近再下 */
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="w-full"
            />
          </button>
        ))}
      </div>

      {/* ===== 全屏灯箱 =====
          图片按宽度铺满视口（不设 max-height），竖图超出一屏时可以上下滚。
          不能用"整张塞进一屏"：竖版设计稿塞进去反而比正文里还小。
          img 只给 max-width 不给 width，图本身小就不会被拉伸放大。 */}
      {index !== null && (
        <div
          ref={scrollRef}
          className="lightbox fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-stone-950/95 backdrop-blur-sm"
          onClick={close}
          data-cursor-hide
        >
          {/* 内容区：短图居中，长图从顶部开始滚（m-auto 在溢出时自动归零） */}
          <div
            className="flex min-h-full items-center justify-center p-3 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={items[index].file}
              src={srcOf(items[index].file)}
              alt={items[index].alt}
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={`m-auto max-w-[94vw] transition-opacity duration-200 sm:max-w-[88vw] ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {/* 加载指示（固定在视口中间，不随图片滚动） */}
          {!loaded && (
            <div className="pointer-events-none fixed inset-0 grid place-items-center">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-stone-600 border-t-amber-200" />
            </div>
          )}

          {/* 顶栏：固定在视口顶部 */}
          <div className="fixed inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-stone-950/90 to-transparent px-4 py-4 sm:px-6">
            <p className="pointer-events-none font-mono text-[11px] tracking-[0.3em] text-stone-300">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(items.length).padStart(2, "0")} · {title}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="关闭"
              className="-mr-1 shrink-0 rounded-full bg-stone-900/70 p-2 text-stone-300 backdrop-blur transition hover:bg-stone-800 hover:text-amber-200"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* 左：上一张（固定在视口中线） */}
          {index > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="上一张"
              className="fixed left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-stone-900/70 text-stone-300 backdrop-blur transition hover:bg-stone-800 hover:text-amber-200 sm:left-6"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          )}

          {/* 右：下一张 */}
          {index < items.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="下一张"
              className="fixed right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-stone-900/70 text-stone-300 backdrop-blur transition hover:bg-stone-800 hover:text-amber-200 sm:right-6"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
