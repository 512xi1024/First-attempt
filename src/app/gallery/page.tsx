import SiteHeader from "@/components/site-header";
import GalleryOrbit from "@/components/gallery-orbit";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;

  // 有 cat 参数就按分类筛（大小写不敏感），没有就展示全部
  const works = await prisma.work.findMany({
    where: cat ? { category: { contains: cat } } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* 全宽布局：左边距与页头「克里斯蒂小姐」对齐（同为 px-10） */}
      <div className="animate-fade-in-up px-10 py-14">
        <h1 className="text-xl tracking-[0.3em] text-stone-100">总图档</h1>

        {works.length === 0 ? (
          <p className="mt-10 text-sm text-stone-600">
            {cat
              ? `没有找到分类为「${cat}」的作品。`
              : "还没有作品——去后台「作品管理」添加，这里就会自动显示。"}
          </p>
        ) : (
          <GalleryOrbit
            works={works.map((w) => ({
              id: w.id,
              title: w.title,
              category: w.category || "",
              coverImage: w.coverImage || "",
            }))}
          />
        )}
      </div>
    </main>
  );
}
