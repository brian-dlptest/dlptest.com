import { DOWNLOAD_KEYS } from "@/lib/downloads";

/**
 * Extract a download key from a same-origin download URL. Handles the canonical
 * `/downloads/?file=<key>` form plus legacy `/downloads/<key>` and `/<key>`
 * paths (kept so click tracking still works on any stray old links).
 */
export function downloadKeyFromHref(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const fileParam = url.searchParams.get("file");
    const key =
      fileParam ??
      url.pathname.replace(/^\/downloads\//, "").replace(/^\//, "").replace(/\/$/, "");
    return key && DOWNLOAD_KEYS.has(key) ? key : null;
  } catch {
    return null;
  }
}
