import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/domain/config";
import { authSecret } from "@/domain/secrets";

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(authSecret()));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const valid = await hasValidSession(request);
  const isLogin = pathname === "/admin/login";

  if (!valid && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (valid && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/feedback";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
