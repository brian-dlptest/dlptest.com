#!/usr/bin/env python3
"""
Import news posts from the live WordPress site at https://dlptest.com/.

The legacy site uses Divi page builder, so post content lives inside
`<div class="et_pb_text_inner">` blocks rather than a single `.entry-content`
wrapper. This script:

  1. Reads the RSS feed (`scripts/news/feed.xml`) for the canonical list of
     posts, with title / link / pubDate / categories.
  2. Fetches each post URL (caching the raw HTML under `scripts/news/cache/`
     so reruns are cheap and offline-friendly).
  3. Pulls every `et_pb_text_inner` block in document order, joins them, and
     runs a small HTML -> Markdown converter against the result.
  4. Writes one Markdown file per post under `src/content/news/<slug>.md`
     with frontmatter that matches the Astro content-collection schema.

This is a one-shot importer; future news posts will be authored directly
(via AI-drafted PRs, per the project roadmap) and don't need this script.
"""

from __future__ import annotations

import html
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
FEED = ROOT / "scripts" / "news" / "feed.xml"
CACHE = ROOT / "scripts" / "news" / "cache"
OUT = ROOT / "src" / "content" / "news"

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"


def fetch(url: str) -> str:
    """Fetch `url`, caching the body under CACHE keyed by the URL slug."""
    CACHE.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", url.lower()).strip("-")
    cache_path = CACHE / f"{slug}.html"
    if cache_path.exists():
        return cache_path.read_text(encoding="utf-8")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8", errors="replace")
    cache_path.write_text(body, encoding="utf-8")
    return body


def parse_feed() -> list[dict]:
    """Return a list of `{title, link, slug, pub_date, categories}` from the RSS feed."""
    tree = ET.parse(FEED)
    items = []
    ns = {"dc": "http://purl.org/dc/elements/1.1/"}
    for item in tree.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_raw = (item.findtext("pubDate") or "").strip()
        cats = [c.text.strip() for c in item.findall("category") if c.text]
        pub = parsedate_to_datetime(pub_raw) if pub_raw else None
        if pub and pub.tzinfo is None:
            pub = pub.replace(tzinfo=timezone.utc)
        slug = link.rstrip("/").rsplit("/", 1)[-1] or ""
        items.append(
            {
                "title": title,
                "link": link,
                "slug": slug,
                "pub_date": pub,
                "categories": cats,
            }
        )
    return items


def extract_text_blocks(html_doc: str) -> str:
    """
    Return the concatenated inner HTML of every `<div class="et_pb_text_inner">`
    block in document order, separated by blank lines.

    Divi nests these inside larger `et_pb_*` wrappers; the inner block is the
    only one that actually carries authored text (paragraphs, headings, lists).
    """
    pattern = re.compile(
        r'<div\s+class="[^"]*\bet_pb_text_inner\b[^"]*"[^>]*>(.*?)</div>\s*(?=</div>)',
        re.DOTALL | re.IGNORECASE,
    )
    parts = [m.group(1).strip() for m in pattern.finditer(html_doc)]
    return "\n\n".join(p for p in parts if p)


def extract_featured_image(html_doc: str) -> str | None:
    """Return the first article-level image src, if any.

    Divi places the post hero in an `et_pb_image_0` module. We capture the
    img inside that module specifically to avoid header logos or social icons.
    """
    m = re.search(
        r'class="[^"]*\bet_pb_image_0\b[^"]*"[^>]*>.*?<img[^>]+src="([^"]+)"',
        html_doc,
        re.DOTALL | re.IGNORECASE,
    )
    return m.group(1) if m else None


_TAG_BLOCKS = (
    ("h1", "# "),
    ("h2", "## "),
    ("h3", "### "),
    ("h4", "#### "),
    ("h5", "##### "),
    ("h6", "###### "),
)


def html_to_markdown(fragment: str) -> str:
    s = fragment

    # Strip <script>/<style>/<iframe> blocks entirely.
    s = re.sub(r"<(script|style|iframe)\b.*?</\1>", "", s, flags=re.DOTALL | re.IGNORECASE)
    # Drop HTML comments.
    s = re.sub(r"<!--.*?-->", "", s, flags=re.DOTALL)

    # Inline formatting.
    s = re.sub(r"<(strong|b)\b[^>]*>(.*?)</\1>", r"**\2**", s, flags=re.DOTALL | re.IGNORECASE)
    s = re.sub(r"<(em|i)\b[^>]*>(.*?)</\1>", r"*\2*", s, flags=re.DOTALL | re.IGNORECASE)
    s = re.sub(r"<code\b[^>]*>(.*?)</code>", r"`\1`", s, flags=re.DOTALL | re.IGNORECASE)

    # Links.
    def _link_sub(m: re.Match[str]) -> str:
        href = m.group(1).strip()
        text = m.group(2).strip()
        text = re.sub(r"<[^>]+>", "", text)
        if not text:
            return href
        if not href or href.startswith("#"):
            return text
        return f"[{text}]({href})"

    s = re.sub(
        r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
        _link_sub,
        s,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Headings.
    for tag, prefix in _TAG_BLOCKS:
        s = re.sub(
            rf"<{tag}\b[^>]*>(.*?)</{tag}>",
            lambda m, p=prefix: "\n\n" + p + re.sub(r"\s+", " ", m.group(1)).strip() + "\n\n",
            s,
            flags=re.DOTALL | re.IGNORECASE,
        )

    # Lists. Translate <li> based on nearest enclosing list type by walking the
    # source: keep it simple and treat all <li> as bullets unless we detect an
    # enclosing <ol>; that's accurate enough for these posts.
    def _list_sub(m: re.Match[str]) -> str:
        kind = m.group(1).lower()
        body = m.group(2)
        bullet = "1. " if kind == "ol" else "- "
        items = re.findall(r"<li\b[^>]*>(.*?)</li>", body, flags=re.DOTALL | re.IGNORECASE)
        lines = []
        for raw in items:
            text = re.sub(r"<[^>]+>", "", raw)
            text = re.sub(r"\s+", " ", text).strip()
            if text:
                lines.append(bullet + text)
        return "\n\n" + "\n".join(lines) + "\n\n"

    s = re.sub(
        r"<(ul|ol)\b[^>]*>(.*?)</\1>",
        _list_sub,
        s,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Paragraphs & line breaks.
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(
        r"<p\b[^>]*>(.*?)</p>",
        lambda m: "\n\n" + re.sub(r"\s+", " ", m.group(1)).strip() + "\n\n",
        s,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Strip any remaining tags.
    s = re.sub(r"<[^>]+>", "", s)
    # Decode HTML entities (&amp;, &#8217;, etc.).
    s = html.unescape(s)
    # Collapse runs of blank lines.
    s = re.sub(r"\n{3,}", "\n\n", s)
    # Trim trailing whitespace from each line.
    s = "\n".join(line.rstrip() for line in s.splitlines()).strip() + "\n"
    return s


def make_excerpt(md: str, max_chars: int = 220) -> str:
    """Plain-text summary built from the first paragraph of the markdown body."""
    for block in md.split("\n\n"):
        block = block.strip()
        if not block or block.startswith("#") or block.startswith("- ") or block.startswith("1. "):
            continue
        text = re.sub(r"\s+", " ", block)
        text = re.sub(r"[*_`]", "", text)
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
        if len(text) <= max_chars:
            return text
        cut = text[: max_chars - 1].rsplit(" ", 1)[0]
        return cut.rstrip(",.;:") + "…"
    return ""


_FRONTMATTER_ESCAPE = str.maketrans({'"': '\\"', "\\": "\\\\"})


def yaml_str(value: str) -> str:
    return '"' + value.translate(_FRONTMATTER_ESCAPE) + '"'


def yaml_list(values: Iterable[str]) -> str:
    return "[" + ", ".join(yaml_str(v) for v in values) + "]"


def render_post(item: dict, md_body: str, hero: str | None) -> str:
    pub: datetime | None = item["pub_date"]
    pub_iso = pub.isoformat() if pub else datetime.now(timezone.utc).isoformat()
    excerpt = make_excerpt(md_body)
    cats = [c for c in item["categories"] if c]
    lines = [
        "---",
        f"title: {yaml_str(item['title'])}",
        f"slug: {yaml_str(item['slug'])}",
        f"pubDate: {pub_iso}",
        f"categories: {yaml_list(cats)}",
        f"excerpt: {yaml_str(excerpt)}",
    ]
    if hero:
        lines.append(f"heroImage: {yaml_str(hero)}")
    lines.append(f"sourceUrl: {yaml_str(item['link'])}")
    lines.append("---")
    lines.append("")
    lines.append(md_body.rstrip() + "\n")
    return "\n".join(lines)


def main() -> int:
    if not FEED.exists():
        print(f"missing feed: {FEED}", file=sys.stderr)
        return 1

    items = parse_feed()
    print(f"feed has {len(items)} item(s)")
    OUT.mkdir(parents=True, exist_ok=True)

    for item in items:
        slug = item["slug"]
        if not slug:
            print(f"  skip (no slug): {item['title']}", file=sys.stderr)
            continue
        try:
            doc = fetch(item["link"])
        except Exception as exc:
            print(f"  FAIL fetch {item['link']}: {exc}", file=sys.stderr)
            continue
        body_html = extract_text_blocks(doc)
        if not body_html:
            print(f"  WARN empty body: {item['link']}", file=sys.stderr)
            continue
        md_body = html_to_markdown(body_html)
        hero = extract_featured_image(doc)
        rendered = render_post(item, md_body, hero)
        out_path = OUT / f"{slug}.md"
        out_path.write_text(rendered, encoding="utf-8")
        size = len(md_body)
        print(f"  wrote {out_path.relative_to(ROOT)}  ({size} body chars)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
