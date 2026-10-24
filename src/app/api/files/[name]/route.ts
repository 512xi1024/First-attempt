import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
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

  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, name));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${name}"`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "文件不存在" }, { status: 404 });
  }
}
