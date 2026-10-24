import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function POST(request: Request) {
  // 1. 先验登录
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_session")) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  // 2. 取出上传的文件
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "没有收到文件" }, { status: 400 });
  }

  // 3. 只允许 PDF
  if (file.type !== "application/pdf") {
    return NextResponse.json({ ok: false, error: "只支持 PDF 文件" }, { status: 400 });
  }

  // 4. 限制 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "文件不能超过 10MB" }, { status: 400 });
  }

  // 5. 存文件（固定叫 resume.pdf，传新的就覆盖旧的）
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, "resume.pdf"), buffer);

  // 6. 把文件名记进数据库
  await prisma.setting.upsert({
    where: { key: "resume_file" },
    update: { value: "resume.pdf" },
    create: { key: "resume_file", value: "resume.pdf" },
  });

  return NextResponse.json({ ok: true, filename: "resume.pdf" });
}
