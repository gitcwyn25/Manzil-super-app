import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
const SESSION_COOKIE = "manzil_admin_session";

export async function POST() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (session) {
    await fetch(`${API_BASE_URL}/console/auth/logout`, { method: "POST", headers: { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(session)}` }, cache: "no-store" }).catch(() => undefined);
  }
  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.set({ name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
