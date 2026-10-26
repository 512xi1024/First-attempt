import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import sharp from "sharp";

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

// 允许按需缩图的宽度上限（超过按原图给）
const MAX_WIDTH = 2400;

// 缩图结果留在内存里，避免同一张图被反复解码。
// 键 = 文件名 + 宽度；上限 200 条，超出按写入顺序淘汰（FIFO 够用）
const thumbCache = new Map<string, Buffer>();
const THUMB_CACHE_MAX = 200;

export async function GET(
  request: Request,
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

  // ?w=600 之类的参数：按需缩图。
  // 列表/轨道里的封面只需要几百像素宽，没必要为它下载几 MB 的原图
  const widthParam = Number(new URL(request.url).searchParams.get("w") || 0);
  const wantWidth =
    ext !== "pdf" && Number.isFinite(widthParam) && widthParam >= 80
      ? Math.min(Math.round(widthParam), MAX_WIDTH)
      : 0;

  try {
    // 缩略图路径
    if (wantWidth) {
      const cacheKey = `${name}@${wantWidth}`;
      const cached = thumbCache.get(cacheKey);
      if (cached) {
        return imageResponse(cached, "image/webp");
      }

      const original = await readFile(filePath);
      const resized = await sharp(original, { failOn: "none" })
        .rotate()
        .resize({ width: wantWidth, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      if (thumbCache.size >= THUMB_CACHE_MAX) {
        const oldest = thumbCache.keys().next().value;
        if (oldest !== undefined) thumbCache.delete(oldest);
      }
      thumbCache.set(cacheKey, resized);

      return imageResponse(resized, "image/webp");
    }

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

function imageResponse(buffer: Buffer, contentType: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      "Cache-Control": IMMUTABLE,
    },
  });
}
