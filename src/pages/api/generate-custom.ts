import type { APIRoute } from "astro";
import { generateCustom, FIELD_TYPE_DEFS } from "@/lib/data-generator";
import type { CustomField, FieldTypeKey } from "@/lib/data-generator";

export const prerender = false;

const VALID_TYPES = new Set<FieldTypeKey>(
  Object.keys(FIELD_TYPE_DEFS) as FieldTypeKey[]
);

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
    fields.push({ name, type: type as FieldTypeKey, blankPct });
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

  const result = generateCustom(fields, count, seed);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
