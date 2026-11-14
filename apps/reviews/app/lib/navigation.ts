export function localPath(path: string | null): string {
  if (!path?.startsWith("/") || /[\u0000-\u0020\u007f\\]/.test(path)) return "/profile";
  try {
    const url = new URL(path, "https://review.manzilgroup.uz");
    return url.origin === "https://review.manzilgroup.uz" ? url.pathname + url.search + url.hash : "/profile";
  } catch { return "/profile"; }
}
