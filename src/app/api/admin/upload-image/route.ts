import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  // 1. 验登录
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_session")) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  // 2. 取文件
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "没有收到文件" }, { status: 400 });
  }

  // 3. 检查类型（只收 png / jpg / webp）
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: "只支持 PNG / JPG / WebP 图片" },
      { status: 400 }
    );
  }

  // 4. 限制 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "图片不能超过 5MB" }, { status: 400 });
  }

  // 5. 生成随机文件名（时间 + 随机数 + 扩展名）
  const filename = `${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")}.${ext}`;

  // 6. 存文件
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  // 7. 把文件名返回给前端（前端把它记进作品数据里）
  return NextResponse.json({ ok: true, filename });
}
