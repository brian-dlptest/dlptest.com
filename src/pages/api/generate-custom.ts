import type { APIRoute } from "astro";
import {
  generateCustom,
  rowsToCsv,
  sanitizeForSpreadsheet,
  FIELD_TYPE_DEFS,
} from "@/lib/data-generator";
import type { CustomField, FieldTypeKey, CardTypeName } from "@/lib/data-generator";
import * as XLSX from "xlsx";
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  WidthType, TextRun, BorderStyle,
} from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";

const VALID_BRANDS = new Set<CardTypeName>(["Visa", "Mastercard", "American Express", "Discover"]);

export const prerender = false;

const VALID_TYPES = new Set<FieldTypeKey>(
  Object.keys(FIELD_TYPE_DEFS) as FieldTypeKey[]
);

const VALID_FORMATS = new Set(["csv", "json", "xlsx", "docx", "pdf"]);

const MAX_COUNT = 500;
const DEFAULT_COUNT = 50;
const MAX_FIELDS = 20;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const rawFields = body["fields"];
  if (!Array.isArray(rawFields) || rawFields.length === 0) {
    return Response.json({ ok: false, error: "fields_required" }, { status: 400 });
  }
  if (rawFields.length > MAX_FIELDS) {
    return Response.json({ ok: false, error: "too_many_fields" }, { status: 400 });
  }

  const fields: CustomField[] = [];
  for (const f of rawFields) {
    if (typeof f !== "object" || f === null) {
      return Response.json({ ok: false, error: "invalid_field" }, { status: 400 });
    }
    const field = f as Record<string, unknown>;
    const name = typeof field["name"] === "string" ? field["name"].trim() : "";
    if (!name || name.length > 50) {
      return Response.json({ ok: false, error: "invalid_field_name" }, { status: 400 });
    }
    const type = field["type"];
    if (typeof type !== "string" || !VALID_TYPES.has(type as FieldTypeKey)) {
      return Response.json({ ok: false, error: "invalid_field_type" }, { status: 400 });
    }
    const rawBlank = field["blankPct"];
    const blankPct =
      typeof rawBlank === "number" && Number.isFinite(rawBlank)
        ? Math.max(0, Math.min(100, rawBlank))
        : 0;
    const rawDelim = field["delimiter"];
    const delimiter = typeof rawDelim === "string" ? rawDelim.slice(0, 5) : undefined;
    const rawBrands = field["cardBrands"];
    const cardBrands: CardTypeName[] | undefined = Array.isArray(rawBrands)
      ? (rawBrands as unknown[])
          .filter((b): b is string => typeof b === "string")
          .filter((b): b is CardTypeName => VALID_BRANDS.has(b as CardTypeName))
      : undefined;
    fields.push({ name, type: type as FieldTypeKey, blankPct, ...(delimiter !== undefined && { delimiter }), cardBrands: cardBrands?.length ? cardBrands : undefined });
  }

  const rawCount =
    typeof body["count"] === "number" ? (body["count"] as number) : DEFAULT_COUNT;
  const count = Math.max(1, Math.min(MAX_COUNT, Math.floor(rawCount)));

  let seed: number;
  if (typeof body["seed"] === "number" && Number.isFinite(body["seed"] as number)) {
    seed = Math.abs(Math.floor(body["seed"] as number)) >>> 0;
  } else {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    seed = buf[0];
  }

  const rawFormat = body["format"];
  const format =
    typeof rawFormat === "string" && VALID_FORMATS.has(rawFormat)
      ? rawFormat
      : "json";

  const result = generateCustom(fields, count, seed);
  const filename = `dlptest-custom-seed${seed}`;

  if (format === "csv") {
    return new Response(rowsToCsv(result), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "xlsx") {
    // Sanitize header and cell values to prevent CSV/XLSX formula injection
    // when the user names a field starting with `=`, `+`, `-`, `@`, etc.
    // See sanitizeForSpreadsheet() for the OWASP reference.
    const safeColumns = result.columns.map((c) => sanitizeForSpreadsheet(c));
    const safeRows = result.rows.map((row) => {
      const out: Record<string, string> = {};
      result.columns.forEach((col, i) => {
        out[safeColumns[i]!] = sanitizeForSpreadsheet(
          String((row as unknown as Record<string, string>)[col] ?? ""),
        );
      });
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(safeRows, { header: safeColumns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
    return new Response(arr as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "docx") {
    const noBorder = {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    };

    const headerRow = new TableRow({
      children: result.columns.map(
        (col) =>
          new TableCell({
            borders: noBorder,
            children: [
              new Paragraph({
                children: [new TextRun({ text: col, bold: true })],
              }),
            ],
          })
      ),
    });

    const dataRows = result.rows.map(
      (row) =>
        new TableRow({
          children: result.columns.map(
            (col) =>
              new TableCell({
                borders: noBorder,
                children: [new Paragraph(String((row as unknown as Record<string, string>)[col] ?? ""))],
              })
          ),
        })
    );

    const table = new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    const doc = new Document({ sections: [{ children: [table] }] });
    const buf = await Packer.toBuffer(doc);
    return new Response(new Uint8Array(buf) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "pdf") {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

    const fontSize = 8;
    const lineHeight = fontSize * 1.6;
    const marginX = 36;
    const marginTop = 36;
    const marginBottom = 36;
    const pageWidth = 595;
    const pageHeight = 842;
    const contentWidth = pageWidth - marginX * 2;

    const colCount = result.columns.length;
    const colWidth = contentWidth / colCount;

    function addPage() {
      const p = pdfDoc.addPage([pageWidth, pageHeight]);
      return { page: p, y: pageHeight - marginTop };
    }

    let { page, y } = addPage();

    // Draw a single row of text cells at the current y position
    function drawRow(
      values: string[],
      bold: boolean,
      currentPage: ReturnType<typeof pdfDoc.addPage>,
      currentY: number
    ) {
      const usedFont = bold ? boldFont : font;
      for (let i = 0; i < values.length; i++) {
        const x = marginX + i * colWidth;
        // Truncate value to fit column width
        let text = values[i];
        while (text.length > 0 && usedFont.widthOfTextAtSize(text, fontSize) > colWidth - 2) {
          text = text.slice(0, -1);
        }
        currentPage.drawText(text, { x, y: currentY, size: fontSize, font: usedFont });
      }
    }

    drawRow(result.columns, true, page, y);
    y -= lineHeight;

    for (const row of result.rows) {
      if (y < marginBottom + lineHeight) {
        ({ page, y } = addPage());
      }
      drawRow(
        result.columns.map((col) => String((row as unknown as Record<string, string>)[col] ?? "")),
        false,
        page,
        y
      );
      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Default: JSON
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
