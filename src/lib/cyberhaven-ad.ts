/**
 * Master switch for every sponsored display unit on the site.
 *
 * Off (2026-09-14): the Cyberhaven placement has ended and the next sponsor
 * isn't signed yet. While false, CyberhavenAd renders nothing and
 * CyberhavenAdSlot renders only its children, so pages that wrap content in the
 * skyscraper sidebar (/sample-data/, and /ftp-test/ via ftp-layout--with-ad)
 * fall back to a single full-width column instead of leaving an empty gutter.
 *
 * To launch the next campaign: replace the creatives in public/ads/, update
 * the href/src/alt below, flip this to true. The unit sizes and placements are
 * the spec to hand the sponsor.
 */
export const ADS_ENABLED = false;

/** Sponsored Cyberhaven display units (monthly placement). */
export const CYBERHAVEN_HREF =
  "https://www.cyberhaven.com/product/dspm?utm_campaign=dlp-without-false-positives&utm_source=dlptest&utm_medium=display";

export type CyberhavenAdUnit = "leaderboard" | "medium-rectangle" | "skyscraper";

export const CYBERHAVEN_ADS: Record<
  CyberhavenAdUnit,
  { src: string; width: number; height: number; alt: string }
> = {
  leaderboard: {
    src: "/ads/cyberhaven/970x250.png",
    width: 970,
    height: 250,
    alt: "Cyberhaven — DLP without false positives",
  },
  "medium-rectangle": {
    src: "/ads/cyberhaven/300x250_Display_DSPM.png",
    width: 300,
    height: 250,
    alt: "Cyberhaven DSPM",
  },
  skyscraper: {
    src: "/ads/cyberhaven/160x600_Display_DSPM.png",
    width: 160,
    height: 600,
    alt: "Cyberhaven DSPM",
  },
};

/** Ad sets per page, matching legacy WordPress placements. */
export const CYBERHAVEN_PAGE_ADS = {
  home: ["leaderboard"] as const,
  "sample-data": ["skyscraper"] as const,
  /** Tab pages under /sample-data/* */
  "sample-data-tab": ["leaderboard"] as const,
  "http-post": ["leaderboard"] as const,
  "ftp-test": ["medium-rectangle"] as const,
} satisfies Record<string, readonly CyberhavenAdUnit[]>;

export type CyberhavenAdPage = keyof typeof CYBERHAVEN_PAGE_ADS;
