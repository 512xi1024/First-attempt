import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function isLoggedIn() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session");
}

// R：读取作品列表
export async function GET() {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const works = await prisma.work.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ ok: true, works });
}

// C：新建作品
export async function POST(request: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ ok: false, error: "标题不能为空" }, { status: 400 });
  }

  const work = await prisma.work.create({
    data: {
      title,
      description: String(body.description ?? ""),
      category: String(body.category ?? "未分类"),
      coverImage: String(body.coverImage ?? ""),
      detailImages: JSON.stringify(
        Array.isArray(body.detailImages) ? body.detailImages : []
      ),
      sortOrder: Number(body.sortOrder ?? 0),
    },
  });
  return NextResponse.json({ ok: true, work });
}

// U：更新作品
export async function PUT(request: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ ok: false, error: "缺少作品 id" }, { status: 400 });
  }

  const work = await prisma.work.update({
    where: { id },
    data: {
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      category: String(body.category ?? "未分类"),
      coverImage: String(body.coverImage ?? ""),
      detailImages: JSON.stringify(
        Array.isArray(body.detailImages) ? body.detailImages : []
      ),
      sortOrder: Number(body.sortOrder ?? 0),
    },
  });
  return NextResponse.json({ ok: true, work });
}

// D：删除作品（id 放网址参数：/api/admin/works?id=xxx）
export async function DELETE(request: Request) {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "缺少作品 id" }, { status: 400 });
  }

  await prisma.work.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
