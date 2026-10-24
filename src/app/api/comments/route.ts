import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

// 拿访客真实 IP（开发环境拿不到就是 "local"）
function getIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

// 查询留言：不传 workId = 全局留言板；传 workId = 某个作品的评论区
// 带 token 参数时，会标出哪些是"这个浏览器自己写的"（mine: true）
export async function GET(req: NextRequest) {
  const workId = req.nextUrl.searchParams.get("workId");
  const token = req.nextUrl.searchParams.get("token") || "";
  const rows = await prisma.comment.findMany({
    where: workId ? { workId } : { workId: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const comments = rows.map((c) => ({
    id: c.id,
    content: c.content,
    nickname: c.nickname,
    workId: c.workId,
    createdAt: c.createdAt,
    mine: !!token && c.ownerToken === token, // 只标记，绝不把凭证本身发出去
  }));
  return NextResponse.json({ ok: true, comments });
}

// 提交留言（公开接口，10 秒防刷：同一 IP 十秒内只能发一条）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = (body.content || "").toString().trim();
    const nickname =
      (body.nickname || "").toString().trim().slice(0, 20) || "匿名访客";
    const workId = body.workId ? body.workId.toString() : null;

    if (!content) {
      return NextResponse.json(
        { ok: false, error: "留言内容不能为空" },
        { status: 400 }
      );
    }
    if (content.length > 500) {
      return NextResponse.json(
        { ok: false, error: "留言最多 500 字" },
        { status: 400 }
      );
    }

    // 防刷：查这个 IP 最近 10 秒内有没有发过
    const ip = getIp(req);
    const recent = await prisma.comment.findFirst({
      where: {
        ip,
        createdAt: { gt: new Date(Date.now() - 10 * 1000) },
      },
    });
    if (recent) {
      return NextResponse.json(
        { ok: false, error: "写得太快了，歇十秒再留言。" },
        { status: 429 }
      );
    }

    // 发一个"主人凭证"给访客，存在他浏览器里；以后删自己的留言要对上它
    const ownerToken = randomUUID();
    const comment = await prisma.comment.create({
      data: { content, nickname, workId, ip, ownerToken },
    });
    return NextResponse.json({ ok: true, comment, token: ownerToken });
  } catch {
    return NextResponse.json(
      { ok: false, error: "提交失败，请稍后再试" },
      { status: 500 }
    );
  }
}

// 删除留言：只能删"凭证对得上"的那条（自己的）
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!id || !token) {
    return NextResponse.json({ ok: false, error: "缺少参数" }, { status: 400 });
  }
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json(
      { ok: false, error: "留言不存在" },
      { status: 404 }
    );
  }
  if (comment.ownerToken !== token) {
    return NextResponse.json(
      { ok: false, error: "只能删除自己写的留言" },
      { status: 403 }
    );
  }
  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
