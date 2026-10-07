import * as XLSX from "xlsx";

import { sanitizeForSpreadsheet } from "@/lib/data-generator";

// Build an .xlsx whose package structure resembles a workbook saved by Excel,
// so DLP / content-inspection engines extract it the same way they would a
// real one. SheetJS defaults differ from Excel in ways those engines key on:
//   - cell text is written inline (t="str") with no xl/sharedStrings.xml —
//     extractors that read the shared-strings table see an empty sheet
//   - zip entries are STORED (uncompressed); Excel always deflates
//   - docProps/app.xml says <Application>SheetJS</Application>
// bookSST + compression fix the first two; app.xml is patched after writing
// because SheetJS hardcodes the Application name.

const MIN_COL_WIDTH = 8;
const MAX_COL_WIDTH = 50;

const EXCEL_APP_PROPS =
  "<Application>Microsoft Excel</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop>";
const EXCEL_APP_VERSION = "<AppVersion>16.0300</AppVersion>";

export function buildExcelLikeXlsx(
  columns: string[],
  rows: Record<string, unknown>[],
): Uint8Array {
  // Sanitize header and cell values to prevent CSV/XLSX formula injection
  // when the user names a field starting with `=`, `+`, `-`, `@`, etc.
  // See sanitizeForSpreadsheet() for the OWASP reference.
  const safeColumns = columns.map((c) => sanitizeForSpreadsheet(c));
  const safeRows = rows.map((row) => {
    const out: Record<string, string> = {};
    columns.forEach((col, i) => {
      out[safeColumns[i]!] = sanitizeForSpreadsheet(String(row[col] ?? ""));
    });
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(safeRows, { header: safeColumns });
  ws["!cols"] = safeColumns.map((col) => {
    const longest = safeRows.reduce((max, r) => Math.max(max, r[col]!.length), col.length);
    return { wch: Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, longest + 2)) };
  });

  const now = new Date();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  wb.Props = {
    Author: "dlptest.com",
    LastAuthor: "dlptest.com",
    CreatedDate: now,
    ModifiedDate: now,
  };

  const written = new Uint8Array(
    XLSX.write(wb, {
      type: "array",
      bookType: "xlsx",
      bookSST: true,
      compression: true,
    }) as ArrayBuffer,
  );
  return patchAppProps(written);
}

// Rewrite docProps/app.xml to report Excel as the authoring application.
// Falls back to the unpatched workbook if the part can't be found.
function patchAppProps(xlsx: Uint8Array): Uint8Array {
  const zip = XLSX.CFB.read(xlsx, { type: "array" });
  const idx = (zip.FullPaths as string[]).findIndex((p) => p.endsWith("docProps/app.xml"));
  if (idx < 0) return xlsx;

  const entry = zip.FileIndex[idx];
  const original = new TextDecoder().decode(entry.content);
  const patched = original
    .replace(/<Application>[^<]*<\/Application>/, EXCEL_APP_PROPS)
    .replace("</Properties>", `${EXCEL_APP_VERSION}</Properties>`);
  if (patched === original) return xlsx;

  entry.content = new TextEncoder().encode(patched);
  entry.size = entry.content.length;
  return new Uint8Array(
    XLSX.CFB.write(zip, { type: "array", fileType: "zip", compression: true }),
  );
}
