import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("admin_session");
  const { pathname } = request.nextUrl;

  // 后台页面（除了登录页本身）都要求先登录
  const isAdminPage = pathname.startsWith("/admin/dashboard");

  if (isAdminPage && !session) {
    // 没通行证 → 赶回登录页
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

// 只对 /admin 下的路径生效
export const config = {
  matcher: ["/admin/:path*"],
};
