import type { APIRoute } from "astro";
import { generateDataset, rowsToCsv } from "@/lib/data-generator";
import type { PresetDatasetType } from "@/lib/data-generator";

export const prerender = false;

const VALID_DATASETS = new Set<PresetDatasetType>([
  "pii-ssn-ccn",
  "pii-ssn-dob",
  "pci-ccn-zip",
  "pii-dob-email",
  "hipaa",
  "banking",
  "uk-identity",
  "canada-sin",
  "passport",
  "eu-vat",
  "npi-provider",
  "driver-license",
]);

const MAX_COUNT = 500;
const DEFAULT_COUNT = 50;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const dataset = body["dataset"];
  if (typeof dataset !== "string" || !VALID_DATASETS.has(dataset as PresetDatasetType)) {
    return Response.json({ ok: false, error: "invalid_dataset" }, { status: 400 });
  }

  const rawCount = typeof body["count"] === "number" ? (body["count"] as number) : DEFAULT_COUNT;
  const count = Math.max(1, Math.min(MAX_COUNT, Math.floor(rawCount)));

  let seed: number;
  if (typeof body["seed"] === "number" && Number.isFinite(body["seed"] as number)) {
    seed = Math.abs(Math.floor(body["seed"] as number)) >>> 0;
  } else {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    seed = buf[0];
  }

  const format = body["format"] === "csv" ? "csv" : "json";

  const result = generateDataset({ dataset: dataset as PresetDatasetType, count, seed });

  if (format === "csv") {
    return new Response(rowsToCsv(result), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
