import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

// 根据扩展名判断文件类型（白名单：只服务这些类型）
const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

// 图片文件名带时间戳+随机串，内容永不重复 → 可以让浏览器缓存一年，不再回源
const IMMUTABLE = "public, max-age=31536000, immutable";
// 简历固定叫 resume.pdf、重传会覆盖同名文件 → 必须每次校验，不能长缓存
const MUST_REVALIDATE = "no-cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  // 安全检查：防路径穿越
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    return NextResponse.json({ ok: false, error: "非法文件名" }, { status: 400 });
  }

  // 取出扩展名（最后一个小数点后面的部分）
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  // 不在白名单里的类型一律拒绝
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ ok: false, error: "不支持的文件类型" }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, name);

  try {
    const [buffer, info] = await Promise.all([readFile(filePath), stat(filePath)]);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${name}"`,
        "Content-Length": String(buffer.length),
        "Last-Modified": info.mtime.toUTCString(),
        // 图片长期缓存；PDF（简历）每次回源校验
        "Cache-Control": ext === "pdf" ? MUST_REVALIDATE : IMMUTABLE,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "文件不存在" }, { status: 404 });
  }
}
