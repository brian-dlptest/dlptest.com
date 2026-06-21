import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// RSS feed for the Data Security News section, served at /feed.xml. The legacy
// WordPress feed lived at /feed/ — middleware 301s /feed and /feed/ here so
// existing subscribers keep working after the WordPress→Worker cutover.
//
// Prerendered: the news collection is build-time content, so this is emitted as
// a static asset (and picks up headers from public/_headers, like other static
// files).
export const prerender = true;

const SITE = "https://dlptest.com";
const MAX_ITEMS = 30;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async (context) => {
  const site = (context.site?.toString() ?? SITE).replace(/\/$/, "");

  const posts = (await getCollection("news"))
    .sort(
      (a, b) =>
        new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime(),
    )
    .slice(0, MAX_ITEMS);

  const items = posts
    .map((post) => {
      const link = `${site}/${post.data.slug}/`;
      const pubDate = new Date(post.data.pubDate).toUTCString();
      const desc = post.data.excerpt ?? "";
      return [
        "    <item>",
        `      <title>${escapeXml(post.data.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${escapeXml(desc)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const lastBuild =
    posts.length > 0
      ? new Date(posts[0].data.pubDate).toUTCString()
      : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DLP Test — Data Security News</title>
    <link>${site}/blog/</link>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Funding, M&amp;A, and product news across DLP, DSPM, and insider risk — practitioner notes from DLP Test.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
