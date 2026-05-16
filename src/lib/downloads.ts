// Centralised list of legacy download keys that must be served from R2 at
// their historical root paths (e.g. /sample-data.csv, /334-MB-Test-CSV.csv).
// Keep in sync with src/data/sample-data.ts.
//
// We use a Set for O(1) lookup in middleware on every request.
export const DOWNLOAD_KEYS: ReadonlySet<string> = new Set([
  "sample-data.csv",
  "sample-data.xls",
  "sample-data.xlsx",
  "sample-data.pdf",
  "1-MB-Test.docx",
  "10-MB-Test.docx",
  "1-MB-Test.xlsx",
  "10-MB-Test.xlsx",
  "30-MB-Test.xlsx",
  "103-MB-Test.xlsx",
  "111-MB-Test.csv",
  "334-MB-Test-CSV.csv",
  "AIP_Test_Doc.docx",
  "DLP_Test_FTP_FileZilla.xml",
  "DLP_Test_FTP_FileZilla_old.xml",
  "DLP-Test-State-Data.zip",
]);

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  csv: "text/csv; charset=utf-8",
  pdf: "application/pdf",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  zip: "application/zip",
  xml: "application/xml; charset=utf-8",
};

export function contentTypeFor(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
}

/** Serve an R2 object as an HTTP response, including Range support. */
export async function serveR2Object(
  bucket: R2Bucket,
  key: string,
  request: Request,
): Promise<Response> {
  // R2 supports Range natively via the options.range parameter on get().
  const rangeHeader = request.headers.get("range");
  let rangeOpt: { offset: number; length?: number } | undefined;
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d+)?$/i.exec(rangeHeader);
    if (match) {
      const offset = Number(match[1]);
      const end = match[2] !== undefined ? Number(match[2]) : undefined;
      rangeOpt = end !== undefined
        ? { offset, length: end - offset + 1 }
        : { offset };
    }
  }

  const obj = rangeOpt
    ? await bucket.get(key, { range: rangeOpt })
    : await bucket.get(key);

  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  if (!headers.has("content-type")) {
    headers.set("content-type", contentTypeFor(key));
  }
  // Long-lived caching for static download blobs. Use immutable so Cloudflare
  // and clients trust the etag.
  headers.set("cache-control", "public, max-age=31536000, immutable");

  // If a range was requested, emit a 206 Partial Content response. R2 also
  // accepts `suffix` ranges (e.g. "bytes=-500"), but we don't support those
  // here — callers virtually never send them for static download URLs.
  if (rangeOpt) {
    const total = obj.size;
    const start = rangeOpt.offset;
    const length = rangeOpt.length ?? total - start;
    headers.set("content-range", `bytes ${start}-${start + length - 1}/${total}`);
    headers.set("content-length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }

  headers.set("content-length", String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}
