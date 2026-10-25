import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// 统一转 WebP：同样画质下比 PNG 小 80%~90%，比 JPG 小 30% 左右
// 长边超过 MAX_EDGE 就等比缩小；小图不放大
const MAX_EDGE = 2400;
const WEBP_QUALITY = 86;

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

  // 4. 限制 20MB（设计师出的 4K 大图普遍超标；nginx client_max_body_size 是 30m）
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "图片不能超过 20MB" }, { status: 400 });
  }

  const originalSize = file.size;
  const input = Buffer.from(await file.arrayBuffer());

  // 5. 转 WebP
  // 转码失败（坏图/格式怪）时不阻塞上传，直接存原文件，前端照样能用
  let output = input;
  let outExt = ext;
  let converted = false;

  try {
    output = await sharp(input, { failOn: "none" })
      // 手机拍的照片带 EXIF 方向，rotate() 不传参 = 按 EXIF 自动摆正
      .rotate()
      // 统一转成 sRGB：iPhone 照片、Mac 截图常带 Display P3 / AdobeRGB，
      // 直接丢 ICC 会给浏览器按 sRGB 解释，颜色明显偏饱和
      .toColourspace("srgb")
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();
    outExt = "webp";
    converted = true;
  } catch {
    output = input;
    outExt = ext;
  }

  // 6. 生成随机文件名（时间 + 随机数 + 扩展名）
  const filename = `${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")}.${outExt}`;

  // 7. 存文件
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), output);

  // 8. 把文件名返回给前端（前端把它记进作品数据里）
  return NextResponse.json({
    ok: true,
    filename,
    converted,
    originalBytes: originalSize,
    bytes: output.length,
  });
}
