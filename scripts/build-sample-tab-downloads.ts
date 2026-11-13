// Builds the CSV / XLS / XLSX / PDF downloads for the Name + SSN + DOB,
// Name + CCN + ZIP, Name + DOB + Email and Name + Phone + SSN tabs under
// /sample-data/. Each file
// holds exactly the rows and column headings its tab shows, from
// src/data/sample-data.ts, so a download matches the table above its link.
//
// The keys come from `downloadFiles` (groups ssndob, ccnzip, dobemail,
// phonessn), and
// /downloads/?file=<key> serves them from the R2 bucket `dlptest-downloads`.
// The Name + SSN + CCN files (sample-data.*) are the legacy WordPress files
// that scripts/upload-r2.sh uploads, not these.
//
// Usage (from the repo root, so the @/ paths in tsconfig.json resolve):
//   npx --yes tsx scripts/build-sample-tab-downloads.ts <out-dir>
//   npx --yes tsx scripts/build-sample-tab-downloads.ts <out-dir> --upload
//   npx --yes tsx scripts/build-sample-tab-downloads.ts <out-dir> --only phonessn --upload
//
// --only <group> builds (and uploads) just that tab's files. Use it when adding
// a tab, so the upload doesn't rewrite files that are already live.
//
// --upload puts each file to R2 with wrangler. Staging and production share
// the bucket, so an upload goes live on both at once. It needs `wrangler login`
// (or CLOUDFLARE_API_TOKEN) with R2 write access.
//
// After a rebuild, copy the printed sizes into `approxBytes` in
// src/data/sample-data.ts.

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import {
  downloadFiles,
  sampleNameCcnZip,
  sampleNameDobEmail,
  sampleNamePhoneSsn,
  sampleNameSsnDob,
} from "@/data/sample-data";
import { sanitizeForSpreadsheet } from "@/lib/data-generator";
import { DOWNLOAD_KEYS, contentTypeFor } from "@/lib/downloads";
import { buildExcelLikeXlsx } from "@/lib/xlsx-export";

// Under Node ESM, `import * as XLSX from "xlsx"` has no CFB (xlsx 0.18.5 is
// CommonJS and Node can't see that export), so load the CommonJS module.
const XLSX = createRequire(import.meta.url)("xlsx") as typeof import("xlsx");

const BUCKET = "dlptest-downloads";

interface Dataset {
  group: "ssndob" | "ccnzip" | "dobemail" | "phonessn";
  title: string;
  columns: string[];
  rows: string[][];
}

const DATASETS: Dataset[] = [
  {
    group: "ssndob",
    title: "Name + SSN + Date of Birth",
    columns: ["First and Last Name", "SSN", "Date of Birth"],
    rows: sampleNameSsnDob.map((r) => [r.name, r.ssn, r.dob]),
  },
  {
    group: "ccnzip",
    title: "Name + Credit Card Number + ZIP + Expiration",
    columns: ["First Name", "Last Name", "ZIP", "Credit Card Number", "Expiration"],
    rows: sampleNameCcnZip.map((r) => [r.first, r.last, r.zip, r.ccn, r.expiry]),
  },
  {
    group: "dobemail",
    title: "Name + Date of Birth + Email",
    columns: ["First Name", "Last Name", "Date of Birth", "Email"],
    rows: sampleNameDobEmail.map((r) => [r.first, r.last, r.dob, r.email]),
  },
  {
    group: "phonessn",
    title: "Name + Phone Number + SSN",
    columns: ["First and Last Name", "Phone Number", "SSN"],
    rows: sampleNamePhoneSsn.map((r) => [r.name, r.phone, r.ssn]),
  },
];

function buildCsv({ columns, rows }: Dataset): Uint8Array {
  const cell = (v: string) => {
    const s = sanitizeForSpreadsheet(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns, ...rows].map((r) => r.map(cell).join(","));
  return new TextEncoder().encode(lines.join("\r\n") + "\r\n");
}

function buildXlsx({ columns, rows }: Dataset): Uint8Array {
  const records = rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
  return buildExcelLikeXlsx(columns, records, XLSX.CFB);
}

// Legacy Excel 97-2003 (BIFF8). Every cell is a string, so SSNs, card numbers
// and ZIPs keep their dashes and leading zeros.
function buildXls({ columns, rows }: Dataset): Uint8Array {
  const aoa = [columns, ...rows].map((r) => r.map(sanitizeForSpreadsheet));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = columns.map((_, i) => ({
    wch: Math.max(...aoa.map((r) => r[i]!.length)) + 2,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  wb.Props = { Author: "dlptest.com", LastAuthor: "dlptest.com" };
  return new Uint8Array(XLSX.write(wb, { type: "array", bookType: "biff8" }) as ArrayBuffer);
}

// Text-based PDF (not an image), laid out like the PDFs /sample-data/ builds
// in the browser: landscape letter, a title, then the table.
async function buildPdf({ title, columns, rows }: Dataset): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`DLP Test Sample Data: ${title}`);
  doc.setAuthor("dlptest.com");
  doc.setCreator("dlptest.com");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 792;
  const H = 612;
  const margin = 40;
  const size = 10;
  const lineH = 16;
  const colW = (W - margin * 2) / columns.length;
  const black = rgb(0, 0, 0);

  let page = doc.addPage([W, H]);
  let y = H - margin;
  page.drawText(`DLP Test Sample Data: ${title}`, { x: margin, y, size: 13, font: bold, color: black });
  y -= 18;
  page.drawText("Fabricated test data from dlptest.com. Not real PII.", {
    x: margin, y, size: 8, font, color: rgb(0.4, 0.4, 0.4),
  });
  y -= 24;

  const drawHeader = () => {
    columns.forEach((c, i) => page.drawText(c, { x: margin + i * colW, y, size, font: bold, color: black }));
    y -= 5;
    page.drawLine({
      start: { x: margin, y }, end: { x: W - margin, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6),
    });
    y -= lineH;
  };
  drawHeader();
  for (const row of rows) {
    if (y < margin) {
      page = doc.addPage([W, H]);
      y = H - margin;
      drawHeader();
    }
    row.forEach((v, i) => page.drawText(v, { x: margin + i * colW, y, size, font, color: black }));
    y -= lineH;
  }
  return doc.save();
}

async function build(ext: string, ds: Dataset): Promise<Uint8Array> {
  switch (ext) {
    case "csv": return buildCsv(ds);
    case "xls": return buildXls(ds);
    case "xlsx": return buildXlsx(ds);
    case "pdf": return buildPdf(ds);
    default: throw new Error(`No builder for .${ext}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const upload = args.includes("--upload");
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? args[onlyIdx + 1] : undefined;
  const outArg = args.find((a, i) => !a.startsWith("--") && i !== onlyIdx + 1);
  if (!outArg || (onlyIdx >= 0 && !DATASETS.some((d) => d.group === only))) {
    console.error(
      "Usage: npx --yes tsx scripts/build-sample-tab-downloads.ts <out-dir> [--only <group>] [--upload]\n" +
      `Groups: ${DATASETS.map((d) => d.group).join(", ")}`,
    );
    process.exit(2);
  }
  const outDir = resolve(outArg);
  mkdirSync(outDir, { recursive: true });

  const built: { key: string; path: string }[] = [];
  for (const ds of DATASETS.filter((d) => !only || d.group === only)) {
    const files = downloadFiles.filter((f) => f.group === ds.group);
    if (files.length === 0) throw new Error(`No downloadFiles in group ${ds.group}`);
    for (const { key } of files) {
      if (!DOWNLOAD_KEYS.has(key)) throw new Error(`${key} is not in DOWNLOAD_KEYS`);
      const ext = key.split(".").pop()!.toLowerCase();
      const bytes = await build(ext, ds);
      const path = join(outDir, key);
      writeFileSync(path, bytes);
      built.push({ key, path });
      console.log(`${key.padEnd(22)} ${String(bytes.byteLength).padStart(7)} bytes  (${ds.rows.length} rows)`);
    }
  }

  if (!upload) {
    console.log(`\nBuilt ${built.length} files in ${outDir}. Pass --upload to put them to R2.`);
    return;
  }
  for (const { key, path } of built) {
    console.log(`↑ ${BUCKET}/${key}`);
    const r = spawnSync(
      "npx",
      ["wrangler", "r2", "object", "put", `${BUCKET}/${key}`,
        "--file", path, "--content-type", contentTypeFor(key), "--remote"],
      { stdio: "inherit" },
    );
    if (r.status !== 0) {
      console.error(`Upload failed for ${key}`);
      process.exit(1);
    }
  }
  console.log(`\nUploaded ${built.length} files to ${BUCKET}.`);
}

await main();
