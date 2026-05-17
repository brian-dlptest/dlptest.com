#!/usr/bin/env node
/**
 * Upload a single large object to the dlptest-downloads R2 bucket via the
 * S3-compatible API. Use this for files bigger than wrangler/dashboard's
 * 300 MB single-PUT cap. The R2 S3 API itself accepts single PUTs up to
 * 5 GB, so it covers everything we care about; if we ever need >5 GB we'll
 * add proper multipart here.
 *
 * Reads credentials from a local .env file (gitignored). Set up once:
 *
 *   1. Cloudflare dashboard → R2 → "Manage R2 API tokens" → "Create
 *      Account API Token" → permissions "Object Read & Write" → specify
 *      bucket "dlptest-downloads" → copy Access Key ID + Secret.
 *   2. Save into ./.env:
 *
 *        R2_ACCOUNT_ID=3210a4eb0e2a9c264f1584cd27674cd8
 *        R2_ACCESS_KEY_ID=...
 *        R2_SECRET_ACCESS_KEY=...
 *        R2_BUCKET=dlptest-downloads
 *
 *   3. Run:
 *
 *        node --env-file=.env scripts/upload-large.mjs <local-file> [object-key]
 *
 * The object key defaults to the local file's basename.
 */
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { AwsClient } from "aws4fetch";

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET = "dlptest-downloads",
} = process.env;

for (const [name, value] of Object.entries({
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
})) {
  if (!value) {
    console.error(`Missing env var: ${name}. See header comment for setup.`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node --env-file=.env scripts/upload-large.mjs <local-file> [object-key]");
  process.exit(1);
}

const localPath = args[0];
const key = args[1] ?? basename(localPath);

const CONTENT_TYPE_BY_EXT = {
  csv: "text/csv; charset=utf-8",
  pdf: "application/pdf",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  zip: "application/zip",
  xml: "application/xml; charset=utf-8",
};
const ext = key.split(".").pop()?.toLowerCase() ?? "";
const contentType = CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";

const fileStat = await stat(localPath);
console.log(`→ ${localPath} (${fileStat.size.toLocaleString()} bytes, ${contentType})`);
console.log(`  destination: r2://${R2_BUCKET}/${key}`);

const body = await readFile(localPath);

const client = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${encodeURIComponent(key)}`;

const started = Date.now();
const res = await client.fetch(url, {
  method: "PUT",
  body,
  headers: { "Content-Type": contentType },
});

if (!res.ok) {
  console.error(`✘ HTTP ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
console.log(`✓ Uploaded in ${elapsed}s (etag ${res.headers.get("etag")})`);
