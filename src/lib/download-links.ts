import { DOWNLOAD_KEYS } from "@/lib/downloads";

/** Extract a download key from same-origin `/key` or `/downloads/key` URLs. */
export function downloadKeyFromHref(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const key = url.pathname.replace(/^\/downloads\//, "").replace(/^\//, "");
    return DOWNLOAD_KEYS.has(key) ? key : null;
  } catch {
    return null;
  }
}
