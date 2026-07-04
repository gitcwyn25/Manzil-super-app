import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

const isProtectedRoute = createRouteMatcher(["/:locale/admin(.*)"]);
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default clerkEnabled
  ? clerkMiddleware(async (auth, request) => {
      const nextRequest = request as NextRequest;

      if (isProtectedRoute(nextRequest)) {
        await auth.protect();
      }

      return updateSession(nextRequest);
    })
  : (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
