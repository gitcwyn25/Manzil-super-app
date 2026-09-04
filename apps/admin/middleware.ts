import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "manzil_admin_session";
const PUBLIC_PATHS = [/^\/sign-in(?:\/|$)/, /^\/access-denied(?:\/|$)/, /^\/api\/auth(?:\/|$)/];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((pattern) => pattern.test(pathname));
}

/** The cookie is only a presence hint. Every page calls the API, which verifies the HMAC session and AdminUser permissions. */
export default function middleware(request: NextRequest) {
  if (isPublic(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith("/_next")) return NextResponse.next();
  if (!request.cookies.has(SESSION_COOKIE)) return NextResponse.redirect(new URL("/sign-in", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|.*\\..*).*)", "/api/:path*"] };
