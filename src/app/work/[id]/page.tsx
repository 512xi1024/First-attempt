import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import CommentsSection from "@/components/comments-section";
import WorkGallery from "@/components/work-gallery";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await prisma.work.findUnique({ where: { id } });

  // 作品不存在 → 显示 404 页
  if (!work) notFound();

  // 详情图是 JSON 字符串存的，解析成数组
  let detailImages: string[] = [];
  try {
    const parsed = JSON.parse(work.detailImages);
    if (Array.isArray(parsed)) detailImages = parsed;
  } catch {}

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-10 py-14">
        <Link
          href="/gallery"
          className="text-xs tracking-widest text-stone-500 transition hover:text-amber-200"
        >
          ← 返回总图档
        </Link>

        <h1 className="mt-4 text-2xl text-stone-100">{work.title}</h1>
        <p className="mt-2 text-sm text-stone-500">{work.category || "未分类"}</p>

        {work.description && (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-stone-300">
            {work.description}
          </p>
        )}

        {/* 图片：封面 + 详情图，点任意一张进全屏灯箱
            灯箱和正文用同一个 URL，点开时缓存命中、不重新下载；
            首张 eager，其余 lazy，没滚到的图不会请求 */}
        <WorkGallery
          title={work.title}
          items={[
            ...(work.coverImage
              ? [{ file: work.coverImage, alt: `${work.title} 封面` }]
              : []),
            ...detailImages.map((name, i) => ({
              file: name,
              alt: `${work.title} 图 ${i + 1}`,
            })),
          ]}
        />

        {/* 评论区 */}
        <div className="mt-14 border-t border-stone-800 pt-10">
          <h2 className="text-base tracking-[0.2em] text-stone-300">
            关于这份卷宗的留言
          </h2>
          <CommentsSection workId={work.id} />
        </div>
      </div>
    </main>
  );
}
