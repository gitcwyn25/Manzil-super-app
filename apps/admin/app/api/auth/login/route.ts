import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
const SESSION_COOKIE = "manzil_admin_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  if (!body?.username || !body.password) return NextResponse.json({ message: "Username and password are required" }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/console/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: body.username, password: body.password }), cache: "no-store" });
  } catch {
    return NextResponse.json({ message: "The console API is unavailable. Try again when the service is online." }, { status: 503 });
  }

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json({ message: payload.message ?? "Invalid username or password" }, { status: upstream.status });

  const upstreamCookie = upstream.headers.get("set-cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  if (!upstreamCookie) return NextResponse.json({ message: "The API did not issue a secure admin session" }, { status: 502 });

  const response = NextResponse.json(payload);
  response.cookies.set({ name: SESSION_COOKIE, value: upstreamCookie, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
  return response;
}
