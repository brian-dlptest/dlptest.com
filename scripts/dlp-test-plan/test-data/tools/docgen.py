"""Rendering helpers: CSV/TXT, Word, Excel, PowerPoint, images, archives.

Paths are relative to test-data/. Committed payloads go under files/; anything that
cannot be committed (credential-shaped files, nested git repositories) goes under the
gitignored generated/ folder.
"""
import csv
import os
import tarfile
import zipfile

from docx import Document
from docx.shared import Pt
from openpyxl import Workbook
from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt as PPt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def syn(*parts):
    """Join fragments at runtime so a credential-shaped literal never appears whole in
    source. GitHub push protection matches on shape, not validity - the same reason
    src/lib/regex/dlp-patterns.ts has a syn() helper."""
    return "".join(parts)


def path(*parts):
    """Resolve a library-relative path, creating parent directories."""
    p = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


def write_text(rel, text):
    p = path(*rel.split("/"))
    with open(p, "w") as fh:
        fh.write(text if text.endswith("\n") else text + "\n")
    return p


def write_csv(rel, header, rows):
    p = path(*rel.split("/"))
    with open(p, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)
    return p


def write_docx(rel, title, paragraphs=None, table=None, heading_level=1):
    """Word document: a title, optional paragraphs, and one optional table."""
    doc = Document()
    doc.add_heading(title, heading_level)
    for para in paragraphs or []:
        if isinstance(para, tuple):
            kind, text = para
            if kind == "h":
                doc.add_heading(text, 2)
                continue
            if kind == "b":
                p = doc.add_paragraph()
                p.add_run(text).bold = True
                continue
        doc.add_paragraph(para)
    if table:
        header, rows = table
        t = doc.add_table(rows=1, cols=len(header))
        t.style = "Table Grid"
        for i, h in enumerate(header):
            cell = t.rows[0].cells[i]
            cell.text = str(h)
            for run in cell.paragraphs[0].runs:
                run.bold = True
        for row in rows:
            cells = t.add_row().cells
            for i, v in enumerate(row):
                cells[i].text = str(v)
    p = path(*rel.split("/"))
    doc.save(p)
    return p


def write_xlsx(rel, sheets):
    """Excel workbook. `sheets` is [(name, header, rows), ...]."""
    wb = Workbook()
    wb.remove(wb.active)
    for name, header, rows in sheets:
        ws = wb.create_sheet(title=name[:31])
        if header:
            ws.append(list(header))
            for c in ws[1]:
                c.font = c.font.copy(bold=True)
        for row in rows:
            ws.append(list(row))
    p = path(*rel.split("/"))
    wb.save(p)
    return p


def write_pptx(rel, slides):
    """Deck. `slides` is [(title, [bullet, ...]), ...]."""
    prs = Presentation()
    title_layout, body_layout = prs.slide_layouts[0], prs.slide_layouts[1]
    first = True
    for title, bullets in slides:
        slide = prs.slides.add_slide(title_layout if first else body_layout)
        slide.shapes.title.text = title
        holder = slide.placeholders[1]
        if first:
            holder.text = bullets[0] if bullets else ""
            first = False
            continue
        tf = holder.text_frame
        tf.text = bullets[0] if bullets else ""
        for b in bullets[1:]:
            para = tf.add_paragraph()
            para.text = b
            para.level = 1 if b.startswith("  ") else 0
            para.font.size = PPt(16)
    p = path(*rel.split("/"))
    prs.save(p)
    return p


def _font(size):
    for candidate in ("/System/Library/Fonts/Supplemental/Arial.ttf",
                      "/System/Library/Fonts/Helvetica.ttc"):
        if os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size)
            except OSError:
                continue
    return ImageFont.load_default()


def render_table_image(rel, header, rows, rotate=0, jpeg_quality=None, scale=1):
    """Render a table as an image — the screenshot-exfiltration payload for OCR tests."""
    fs = int(17 * scale)
    font, bold = _font(fs), _font(fs)
    pad, row_h = int(14 * scale), int(30 * scale)
    widths = [max(len(str(r[i])) for r in [header] + rows) for i in range(len(header))]
    col_w = [int((w * fs * 0.62) + pad * 2) for w in widths]
    W, H = sum(col_w) + pad * 2, row_h * (len(rows) + 1) + pad * 3

    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    y = pad
    x = pad
    for i, h in enumerate(header):
        d.rectangle([x, y, x + col_w[i], y + row_h], fill="#e8eaf0")
        d.text((x + pad, y + 6 * scale), str(h), font=bold, fill="black")
        x += col_w[i]
    y += row_h
    for row in rows:
        x = pad
        for i, v in enumerate(row):
            d.rectangle([x, y, x + col_w[i], y + row_h], outline="#c9ccd4")
            d.text((x + pad, y + 6 * scale), str(v), font=font, fill="black")
            x += col_w[i]
        y += row_h
    if rotate:
        img = img.rotate(rotate, expand=True, fillcolor="white")
    p = path(*rel.split("/"))
    if jpeg_quality:
        img.save(p, "JPEG", quality=jpeg_quality)
    else:
        img.save(p, "PNG")
    return p


def make_zip(rel, members, password=None):
    """Zip `members` = [(arcname, source_path), ...]. A password forces ZipCrypto."""
    p = path(*rel.split("/"))
    if password:
        import py7zr  # noqa: F401  (import proves the dep is present)
        # ZipCrypto via the system `zip` binary — Python's zipfile cannot write encrypted
        # archives, and ZipCrypto is what a user would actually produce from Finder/7-Zip.
        import shutil
        import subprocess
        import tempfile
        tmp = tempfile.mkdtemp()
        try:
            for arc, src in members:
                dst = os.path.join(tmp, arc)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy(src, dst)
            if os.path.exists(p):
                os.remove(p)
            subprocess.run(["zip", "-r", "-q", "-P", password, p, "."],
                           cwd=tmp, check=True)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        return p
    with zipfile.ZipFile(p, "w", zipfile.ZIP_DEFLATED) as z:
        for arc, src in members:
            z.write(src, arc)
    return p


def make_7z(rel, members):
    import py7zr
    p = path(*rel.split("/"))
    with py7zr.SevenZipFile(p, "w") as z:
        for arc, src in members:
            z.write(src, arc)
    return p


def make_targz(rel, members):
    p = path(*rel.split("/"))
    with tarfile.open(p, "w:gz") as t:
        for arc, src in members:
            t.add(src, arcname=arc)
    return p
