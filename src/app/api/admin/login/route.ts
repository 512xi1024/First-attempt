import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { scryptSync, timingSafeEqual } from "crypto";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const password = String(body.password ?? "");

  const row = await prisma.setting.findUnique({
    where: { key: "admin_password_hash" },
  });

  if (!row) {
    return NextResponse.json({ ok: false, error: "后台密码未设置" }, { status: 500 });
  }

  const [salt, storedHash] = row.value.split(":");
  const inputHash = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  const ok = a.length === b.length && timingSafeEqual(a, b);

  if (!ok) {
    return NextResponse.json({ ok: false, error: "密码不对" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", storedHash.slice(0, 32), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
