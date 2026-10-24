import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function isLoggedIn() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session");
}

// R：留言列表（最新的在前）
export async function GET() {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true, comments });
}

// D：删除留言（?id=xxx）
export async function DELETE(request: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "缺少留言 id" }, { status: 400 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
