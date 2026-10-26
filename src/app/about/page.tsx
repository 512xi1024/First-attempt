import SiteHeader from "@/components/site-header";
import Folder, { type FolderItem } from "@/components/folder";
import FloatingLines from "@/components/floating-lines";
import { prisma } from "@/lib/db";

// 每次访问都读数据库（后台改了简介，前台立刻生效）
export const dynamic = "force-dynamic";

// 把后台的 Markdown 简介按「## 标题」切成板块：一个板块 = 一张纸
function splitSections(md: string): FolderItem[] {
  const items: FolderItem[] = [];
  let title = "简介";
  let body: string[] = [];
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      const content = body.join("\n").trim();
      if (content || items.length === 0) {
        items.push({ title, content });
      }
      title = m[1].trim();
      body = [];
    } else {
      body.push(line);
    }
  }
  const last = body.join("\n").trim();
  if (last || title !== "简介") {
    items.push({ title, content: last });
  }
  return items;
}

export default async function AboutPage() {
  const setting = await prisma.setting.findUnique({
    where: { key: "about_text" },
  });
  const text = setting?.value || "";
  const sections = splitSections(text);

  // 正文直接从「## 标题」开头时，会先产出一个空白的"简介"页，扔掉它
  if (sections.length > 1 && sections[0].title === "简介" && !sections[0].content) {
    sections.shift();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 漂浮线条背景（占位装饰，参数见组件 floating-lines.tsx） */}
      <FloatingLines
        linesGradient={["#4d4731", "#ffffff"]}
        enabledWaves={["top", "middle", "bottom"]}
        lineCount={10}
        lineDistance={6}
        bendStrength={-0.5}
        interactive
        clickSwirl
        lineStyle="dashed"
        lineWidth={1}
        glow={1}
        brightness={1}
        animationSpeed={1}
        amplitude={1}
        depthOfField={0.5}
        edgeFade={0}
        bendRadius={5}
        parallax
        parallaxStrength={0.2}
        intro
        lightMode={false}
      />

      <div className="relative z-10">
        <SiteHeader />

        {/* 间距用「宽 + 高同时满足」的断点：手机横屏时宽 844 但高只有 390，
            只用宽度断点会让 py-14 / mt-12 生效，光留白就吃掉 200px，案卷被挤出去 */}
        <div className="animate-fade-in-up mx-auto max-w-4xl px-6 py-6 sm:px-10 [@media(min-width:640px)and(min-height:600px)]:px-10 [@media(min-width:640px)and(min-height:600px)]:py-14">
          <h1 className="text-xl tracking-[0.3em] text-stone-100">档案</h1>

          {sections.length > 0 ? (
            /* 案卷的宽高比是 1.55。手机上横屏只有 390 高，
               按宽度铺满会把文件夹撑出屏幕，所以这里用「可用高度 × 1.55」
               反过来限制最大宽度，矮屏自动缩成能完整看见的大小。
               210 = 页头 + 上下内边距 + 标题 + 标题下间距，留一点余量 */
            <div
              className="mx-auto mt-6 w-full [@media(min-width:640px)and(min-height:600px)]:mt-12"
              style={{
                maxWidth: "min(100%, calc((100dvh - 210px) * 1.55))",
              }}
            >
              <Folder
                label="档案"
                items={sections}
                color="#54402e"
                paperColor="#e1e1d5"
                tabPosition="right"
                size={1.2}
                openOn="click"
                peek
                intro
                draggable
                zoomOnClick
                speed={1}
              />
            </div>
          ) : (
            <p className="mt-10 text-sm text-stone-600">
              还没有写简介——去后台「作者简介」写好，这里就会自动显示。
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
