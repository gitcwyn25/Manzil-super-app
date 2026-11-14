import { createFileRoute, redirect } from "@tanstack/react-router";
import { links } from "@/lib/links";

// Development/SSR parity. Production static hosting owns the HTTP redirect in
// vercel.json, so a plain anchor also works with JavaScript disabled.
export const Route = createFileRoute("/gurman/waitlist")({
  beforeLoad: () => {
    throw redirect({ href: links.tallyGurmanWaitlist, statusCode: 307 });
  },
});
