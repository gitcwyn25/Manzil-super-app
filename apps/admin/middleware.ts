import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const isPublic = createRouteMatcher(["/sign-in(.*)", "/access-denied"]);

// Every admin route requires a signed-in Clerk user. AdminUser + permission
// checks happen server-side in the API; this only enforces authentication.
export default clerkEnabled
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublic(request as NextRequest)) {
        await auth.protect();
      }
    })
  : (_request: NextRequest) => NextResponse.next();

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"]
};
