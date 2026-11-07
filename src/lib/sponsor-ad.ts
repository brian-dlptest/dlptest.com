/**
 * Master switch for every sponsored display unit on the site.
 *
 * While false, SponsorAd renders nothing and SponsorAdSlot renders only its
 * children, so pages that wrap content in the skyscraper sidebar
 * (/sample-data/, and /ftp-test/ via ftp-layout--with-ad) fall back to a single
 * full-width column instead of leaving an empty gutter.
 *
 * To run the next campaign: put its creatives in public/ads/<sponsor>/, update
 * SPONSOR and SPONSOR_ADS below, and keep this true. The two unit sizes are the
 * spec to hand a sponsor: a 970x250 billboard and a 160x600 skyscraper, each
 * with a 2x file (1940x500, 320x1200). Name files without "@" (e.g.
 * 970x250-2x.webp): Cloudflare's static assets 307-redirect "@" to "%40",
 * which costs every image an extra round trip.
 */
export const ADS_ENABLED = true;

/**
 * Current campaign: Ent + SACR "Beyond EDR" webinar on 2026-11-19. The
 * creative is dated, so swap or switch it off once the webinar has happened.
 */
export const SPONSOR = {
  id: "ent",
  name: "Ent",
  /** Groups impressions/clicks in /admin/sponsors/. Change it with the creative. */
  campaign: "beyond-edr-webinar-2026-11",
  href: "https://ent-ai.zoom.us/webinar/register/WN_UvjKz6kFQWKO9lfvdclrNw?utm_source=dlptest&utm_medium=display&utm_campaign=webinar-fy26q4-november-beyond-edr",
} as const;

export type SponsorAdUnit = "billboard" | "skyscraper";

export interface SponsorCreative {
  src: string;
  /** Lets high-DPI screens pick the 2x file. Omit when there's only one. */
  srcset?: string;
  sizes?: string;
  /** Rendered CSS size, which is also the img width/height attributes. */
  width: number;
  height: number;
  alt: string;
}

const ALT =
  "Ent and SACR webinar, Nov 19: Beyond EDR. Securing human and AI work at the endpoint. Save your seat.";

export const SPONSOR_ADS: Record<SponsorAdUnit, SponsorCreative> = {
  billboard: {
    src: "/ads/ent/970x250.webp",
    srcset: "/ads/ent/970x250.webp 970w, /ads/ent/970x250-2x.webp 1940w",
    sizes: "(min-width: 1010px) 970px, 100vw",
    width: 970,
    height: 250,
    alt: ALT,
  },
  skyscraper: {
    // Only the 2x file ships: it's a 72 KB WebP, smaller than the 1x JPEG/PNG
    // the sponsor also sent, and sharp on every screen.
    src: "/ads/ent/160x600-2x.webp",
    width: 160,
    height: 600,
    alt: ALT,
  },
};

/**
 * Units placed by SponsorAdSlot. Other pages render <SponsorAd unit=…> directly.
 * - sample-data: skyscraper beside the content on desktop, billboard above it on
 *   narrow screens (/sample-data/).
 * - sample-data-tab: billboard after whatever the slot wraps, i.e. the foot of
 *   the sample-data tabs and /endpoint-dlp-test-plan/, and inline under the
 *   intro on /generate/, where the slot wraps nothing.
 */
export const SPONSOR_PAGE_ADS = {
  "sample-data": ["skyscraper"] as const,
  "sample-data-tab": ["billboard"] as const,
} satisfies Record<string, readonly SponsorAdUnit[]>;

export type SponsorAdPage = keyof typeof SPONSOR_PAGE_ADS;
