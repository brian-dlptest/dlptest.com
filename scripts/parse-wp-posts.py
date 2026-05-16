#!/usr/bin/env python3
"""
Parse posts out of the WordPress wp4v_posts INSERT statement and emit
either a summary (default) or one .md file per post into a target dir.

Usage:
  scripts/parse-wp-posts.py                          # summary to stdout
  scripts/parse-wp-posts.py --emit-md src/content/blog  # write .md files
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path
import html as html_lib

DEFAULT_SQL = (
    "backup/mnt/c126686.sgvps.net/dlptest.com/1776983420/home/www/"
    "dlptest.com/public_html/colora17_wp701.sql"
)

COLS = [
    "ID", "post_author", "post_date", "post_date_gmt", "post_content",
    "post_title", "post_excerpt", "post_status", "comment_status", "ping_status",
    "post_password", "post_name", "to_ping", "pinged", "post_modified",
    "post_modified_gmt", "post_content_filtered", "post_parent", "guid",
    "menu_order", "post_type", "post_mime_type", "comment_count",
]


def split_rows(blob: str) -> list[str]:
    """Split a `(...),(...),(...)` blob into the individual `...` payloads."""
    rows: list[str] = []
    buf: list[str] = []
    depth = 0
    in_str = False
    i = 0
    while i < len(blob):
        c = blob[i]
        if in_str:
            buf.append(c)
            if c == "\\" and i + 1 < len(blob):
                buf.append(blob[i + 1])
                i += 2
                continue
            if c == "'":
                in_str = False
            i += 1
            continue
        if c == "'":
            in_str = True
            buf.append(c)
        elif c == "(":
            if depth == 0:
                buf = []
            else:
                buf.append(c)
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                rows.append("".join(buf))
            else:
                buf.append(c)
        else:
            if depth > 0:
                buf.append(c)
        i += 1
    return rows


def split_fields(row: str) -> list[str]:
    """Split a `a, b, 'c, with commas', d` row into its component fields."""
    fields: list[str] = []
    buf: list[str] = []
    in_str = False
    i = 0
    while i < len(row):
        c = row[i]
        if in_str:
            if c == "\\" and i + 1 < len(row):
                buf.append(c)
                buf.append(row[i + 1])
                i += 2
                continue
            if c == "'":
                in_str = False
                buf.append(c)
                i += 1
                continue
            buf.append(c)
            i += 1
            continue
        if c == "'":
            in_str = True
            buf.append(c)
        elif c == ",":
            fields.append("".join(buf).strip())
            buf = []
        else:
            buf.append(c)
        i += 1
    if buf:
        fields.append("".join(buf).strip())
    return fields


def unquote(field: str) -> str:
    """Strip a SQL string literal and decode common escapes."""
    if field.startswith("'") and field.endswith("'"):
        s = field[1:-1]
        # MySQL backslash-escapes; decode the common ones.
        s = (
            s.replace("\\'", "'")
             .replace("\\\\", "\\")
             .replace("\\n", "\n")
             .replace("\\r", "\r")
             .replace("\\t", "\t")
             .replace("\\0", "")
        )
        return s
    return field


def parse_posts(sql_path: Path) -> list[dict]:
    sql = sql_path.read_text(encoding="utf-8", errors="replace")
    # There can be multiple `INSERT INTO wp4v_posts (...) VALUES (...);`
    # statements depending on dump options; merge them all.
    matches = re.findall(
        r"INSERT INTO `wp4v_posts` \([^;]+?\) VALUES\s*(.+?);\s*\n",
        sql,
        re.DOTALL,
    )
    if not matches:
        raise SystemExit(f"No INSERT for wp4v_posts found in {sql_path}")
    posts: list[dict] = []
    for blob in matches:
        rows = split_rows(blob)
        for r in rows:
            fields = split_fields(r)
            if len(fields) < len(COLS):
                continue
            rec = {COLS[i]: unquote(fields[i]) for i in range(len(COLS))}
            posts.append(rec)
    return posts


def html_to_markdown_lite(html: str) -> str:
    """Very small HTML → Markdown conversion that handles the common WP
    block-editor tags this site actually used. Not a general HTML parser."""
    s = html

    # Strip Gutenberg block comments
    s = re.sub(r"<!--\s*/?wp:[^>]*-->", "", s)

    # Headings
    for n in range(6, 0, -1):
        s = re.sub(
            rf"<h{n}[^>]*>(.*?)</h{n}>",
            lambda m, n=n: f"\n\n{'#' * n} {m.group(1).strip()}\n\n",
            s,
            flags=re.DOTALL | re.IGNORECASE,
        )

    # Paragraphs and breaks
    s = re.sub(r"<p[^>]*>", "\n\n", s, flags=re.IGNORECASE)
    s = re.sub(r"</p>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"<br\s*/?>", "  \n", s, flags=re.IGNORECASE)

    # Strong / em
    s = re.sub(r"</?(strong|b)>", "**", s, flags=re.IGNORECASE)
    s = re.sub(r"</?(em|i)>", "*", s, flags=re.IGNORECASE)

    # Code
    s = re.sub(r"<code[^>]*>(.*?)</code>", r"`\1`", s, flags=re.DOTALL | re.IGNORECASE)
    s = re.sub(r"<pre[^>]*>(.*?)</pre>", r"\n```\n\1\n```\n", s, flags=re.DOTALL | re.IGNORECASE)

    # Lists
    s = re.sub(r"<li[^>]*>(.*?)</li>", lambda m: f"- {m.group(1).strip()}\n", s, flags=re.DOTALL | re.IGNORECASE)
    s = re.sub(r"</?(ul|ol)[^>]*>", "\n", s, flags=re.IGNORECASE)

    # Links and images
    s = re.sub(
        r"<a[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>",
        r"[\2](\1)",
        s, flags=re.DOTALL | re.IGNORECASE,
    )
    s = re.sub(
        r"<img[^>]*src=\"([^\"]+)\"[^>]*alt=\"([^\"]*)\"[^>]*/?>",
        r"![\2](\1)",
        s, flags=re.IGNORECASE,
    )

    # Strip remaining tags
    s = re.sub(r"<[^>]+>", "", s)

    # Decode entities
    s = html_lib.unescape(s)

    # Collapse extra whitespace
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip() + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sql", default=DEFAULT_SQL)
    ap.add_argument(
        "--emit-md",
        help="Write one .md file per published post into this directory",
    )
    args = ap.parse_args()

    posts = parse_posts(Path(args.sql))

    print(f"Parsed {len(posts)} rows from wp4v_posts\n")
    for p in posts:
        print(
            f"  ID={p['ID']:>3} "
            f"type={p['post_type']:<10} "
            f"status={p['post_status']:<10} "
            f"date={p['post_date']} "
            f"chars={len(p['post_content']):>5} "
            f"slug={p['post_name']:<30} "
            f"title={p['post_title']!r}"
        )

    if not args.emit_md:
        return 0

    out_dir = Path(args.emit_md)
    out_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    WANT_TYPES = {"post", "ufaq"}
    for p in posts:
        if p["post_type"] not in WANT_TYPES:
            continue
        if p["post_status"] != "publish":
            continue
        slug = p["post_name"] or f"post-{p['ID']}"
        md = html_to_markdown_lite(p["post_content"])
        safe_title = p["post_title"].replace('"', '\\"')
        pub_date = p["post_date"].split(" ")[0]
        front = [
            "---",
            f'title: "{safe_title}"',
            f"pubDate: {pub_date}",
            f"slug: {slug}",
            f"legacyId: {p['ID']}",
            "draft: false",
            "---",
            "",
        ]
        (out_dir / f"{slug}.md").write_text("\n".join(front) + md, encoding="utf-8")
        n += 1
        print(f"  ✎ wrote {slug}.md")
    print(f"\nEmitted {n} posts to {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
