"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OrbitImages from "@/components/OrbitImages";

type WorkItem = {
  id: string;
  title: string;
  category: string;
  coverImage: string;
};

// 总图档：一条轨道装全部作品封面
// 悬停某张图 = 选中该板块 → 轨道中心显示对应板块名
export default function GalleryOrbit({ works }: { works: WorkItem[] }) {
  const router = useRouter();
  const [centerName, setCenterName] = useState<string | null>(null);

  // 没封面的作品上不了轨道，跳过
  const withCover = works.filter((w) => w.coverImage);
  if (withCover.length === 0) return null;

  // 轨道/网格里的封面只占两三百像素，用 ?w=520 让服务端缩好再发，
  // 不要为了一张小卡片下载几百 KB 的原图
  const thumb = (file: string, w = 520) => `/api/files/${file}?w=${w}`;

  const images = withCover.map((w) => ({
    src: thumb(w.coverImage),
    alt: w.title,
  }));

  // 作品越多，单张越小、轨道越大，避免封面互相压住看不见
  const n = withCover.length;
  const itemSize = n <= 3 ? 280 : n <= 5 ? 240 : n <= 8 ? 200 : 176;
  const radiusX = 560 + Math.min(n, 12) * 24;
  const radiusY = 120 + Math.min(n, 12) * 10;

  // 悬停在轨道图片上时，找出它属于哪个板块
  function handleOver(e: React.MouseEvent) {
    const el = (e.target as HTMLElement).closest("[data-orbit-item]");
    if (el) {
      const idx = Number(el.getAttribute("data-orbit-item"));
      const w = withCover[idx];
      setCenterName(w ? (w.category || "").trim() || "未分类" : null);
    } else {
      setCenterName(null);
    }
  }

  return (
    <>
      {/* 窄屏（手机上竖着看，比如走了「仍然竖屏浏览」）：轨道会缩成一小撮，
          改成两列网格。图片走同一批 URL，已有缓存，不会重复下载。 */}
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:hidden">
        {withCover.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => router.push(`/work/${w.id}`)}
              className="block w-full text-left"
            >
              <img
                src={thumb(w.coverImage, 600)}
                alt={w.title}
                loading="lazy"
                decoding="async"
                className="w-full rounded-sm border border-stone-800 object-cover"
              />
              <p className="mt-2 truncate text-sm text-stone-200">{w.title}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
                {(w.category || "").trim() || "未分类"}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block">
        <section
          onMouseOver={handleOver}
          onMouseLeave={() => setCenterName(null)}
        >
          <OrbitImages
            images={images}
            duration={45}
            itemSize={itemSize}
            depth={0.5}
            rotation={-6}
            radiusX={radiusX}
            radiusY={radiusY}
            showPath
            pathColor="rgba(168,162,158,0.25)"
            pathWidth={2}
            pathDash={10}
            itemRadius={24}
            shadow={0.35}
            hoverScale={1.1}
            hoverSpeed={0.3}
            draggable
            clickToFront
            onItemClick={(index: number) =>
              router.push(`/work/${withCover[index].id}`)
            }
            /* 选中板块时，轨道中心显示板块名 */
            centerContent={
              centerName ? (
                <div className="select-none text-center">
                  <p className="text-3xl tracking-[0.3em] text-stone-200">
                    {centerName}
                  </p>
                  <p className="mt-3 font-mono text-xs uppercase tracking-widest text-stone-500">
                    section
                  </p>
                </div>
              ) : null
            }
          />
        </section>
      </div>
    </>
  );
}
