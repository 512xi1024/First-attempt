import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 允许后台修改的 key 白名单（防止乱传 key 写入脏数据）
const ALLOWED_KEYS = [
  "system_prompt",
  "knowledge_base",
  "about_text",
  "resume_file",
];

async function isLoggedIn() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session");
}

// GET：读一条设置，例如 /api/admin/settings?key=system_prompt
export async function GET(request: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ ok: false, error: "不允许的 key" }, { status: 400 });
  }

  const row = await prisma.setting.findUnique({ where: { key } });
  return NextResponse.json({ ok: true, value: row?.value ?? "" });
}

// POST：保存一条设置
export async function POST(request: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const key = String(body.key ?? "");
  const value = String(body.value ?? "");

  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ ok: false, error: "不允许的 key" }, { status: 400 });
  }

  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return NextResponse.json({ ok: true });
}
