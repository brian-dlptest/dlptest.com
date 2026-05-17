/**
 * Google Tag Manager / GA4 helpers.
 *
 * Production WordPress used GTM container GTM-T4T9GLJ; GA4 receives custom
 * events (e.g. `cyberhaven_ad_click`) from tags configured in that container.
 *
 * Cloudflare options (not used here):
 * - Web Analytics: page views only, no custom click events.
 * - Zaraz: CF-hosted tag manager; could mirror GTM in the dashboard later.
 */
export const GTM_CONTAINER_ID = "GTM-T4T9GLJ";

export function pushDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

/** Matches the legacy GA4 event name for sponsored Cyberhaven units. */
export function trackCyberhavenAdClick(adUnit: string): void {
  pushDataLayer({
    event: "cyberhaven_ad_click",
    ad_unit: adUnit,
    page_path: window.location.pathname,
  });
}

export function trackHttpPostTextSubmitClick(): void {
  pushDataLayer({
    event: "http_post_text_submit_click",
    page_path: window.location.pathname,
  });
}

export function trackHttpPostAttachmentSubmitClick(): void {
  pushDataLayer({
    event: "http_post_attachment_submit_click",
    page_path: window.location.pathname,
  });
}

export function trackFileDownload(fileName: string): void {
  pushDataLayer({
    event: "file_download",
    file_name: fileName,
    page_path: window.location.pathname,
  });
}
