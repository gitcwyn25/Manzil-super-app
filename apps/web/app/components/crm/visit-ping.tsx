"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "../../lib/api-base-url";

/** Fire-and-forget visit beacon for CRM analytics. */
export function VisitPing({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/businesses/${slug}/visit`, {
      method: "POST",
      signal: controller.signal,
      keepalive: true
    }).catch(() => {
      // Analytics must never affect the page.
    });

    return () => controller.abort();
  }, [slug]);

  return null;
}
