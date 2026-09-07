import { NextResponse } from "next/server";
import { API_BASE_URL } from "../../../lib/api-base-url";
import { fetchWithTimeout } from "../../../lib/fetch-with-timeout";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetchWithTimeout(`${API_BASE_URL}/waitlist`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store"
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" }
    });
  } catch {
    return NextResponse.json({ message: "Waitlist service unavailable" }, { status: 503 });
  }
}
