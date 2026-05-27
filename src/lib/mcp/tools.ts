// MCP tool registry. Each tool is a thin wrapper around the existing
// data-generator: generateDataset() for the preset pages, generateCustom()
// for the /generate/ page. Tool names deliberately spell out the data type
// (generate_ssn, generate_credit_card, …) because tool names and
// descriptions are serialized into the `tools/list` response — that's the
// payload a DLP product sees when inspecting MCP traffic, and the keywords
// here are what most pattern-based scanners will match on.

import {
  FIELD_TYPE_DEFS,
  generateCustom,
  generateDataset,
  rowsToCsv,
  type CardTypeName,
  type CustomField,
  type FieldTypeKey,
  type GenerateResult,
  type PresetDatasetType,
} from "@/lib/data-generator";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => string;
}

export const MAX_COUNT = 500;
export const DEFAULT_COUNT = 50;
export const MAX_FIELDS = 20;

const VALID_FIELD_TYPES = new Set<FieldTypeKey>(
  Object.keys(FIELD_TYPE_DEFS) as FieldTypeKey[],
);
const VALID_CARD_BRANDS = new Set<CardTypeName>([
  "Visa",
  "Mastercard",
  "American Express",
  "Discover",
]);

function clampCount(raw: unknown): number {
  const n = typeof raw === "number" && Number.isFinite(raw) ? raw : DEFAULT_COUNT;
  return Math.max(1, Math.min(MAX_COUNT, Math.floor(n)));
}

function pickFormat(raw: unknown): "json" | "csv" {
  return raw === "csv" ? "csv" : "json";
}

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

function formatResult(result: GenerateResult, format: "json" | "csv"): string {
  if (format === "csv") return rowsToCsv(result);
  return JSON.stringify(
    { dataset: result.dataset, columns: result.columns, rows: result.rows },
    null,
    2,
  );
}

const COUNT_AND_FORMAT_SCHEMA = {
  count: {
    type: "integer",
    minimum: 1,
    maximum: MAX_COUNT,
    default: DEFAULT_COUNT,
    description: `Number of rows to return (1–${MAX_COUNT}). Default ${DEFAULT_COUNT}.`,
  },
  format: {
    type: "string",
    enum: ["json", "csv"],
    default: "json",
    description: "Output format. 'json' returns a structured object; 'csv' returns a CSV string.",
  },
} as const;

function makePresetTool(
  name: string,
  description: string,
  dataset: PresetDatasetType,
): ToolDefinition {
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties: COUNT_AND_FORMAT_SCHEMA,
      additionalProperties: false,
    },
    handler: (args) => {
      const count = clampCount(args["count"]);
      const format = pickFormat(args["format"]);
      const result = generateDataset({ dataset, count, seed: randomSeed() });
      return formatResult(result, format);
    },
  };
}

// ─── Preset tools (mirror the /sample-data/ pages and /generate/ presets) ───

const presetTools: ToolDefinition[] = [
  makePresetTool(
    "generate_pii_ssn_ccn",
    "Generate synthetic US PII rows containing full name, Social Security Number (SSN), and credit card number (Luhn-valid). Returns 1–500 rows of fake data — never real PII. Useful as a DLP test target for rules that match on SSN + CCN co-occurrence.",
    "pii-ssn-ccn",
  ),
  makePresetTool(
    "generate_pii_ssn_dob",
    "Generate synthetic US PII rows containing full name, Social Security Number (SSN), and date of birth (DOB). Synthetic only — never real identities.",
    "pii-ssn-dob",
  ),
  makePresetTool(
    "generate_pci_credit_card",
    "Generate synthetic PCI/CCN rows containing first name, last name, ZIP code, credit card number (Luhn-valid, Visa/Mastercard/Amex/Discover), and expiration date. Fake test data only.",
    "pci-ccn-zip",
  ),
  makePresetTool(
    "generate_pii_email",
    "Generate synthetic PII rows containing first name, last name, date of birth (DOB), and email address. Synthetic data only.",
    "pii-dob-email",
  ),
  makePresetTool(
    "generate_hipaa_phi",
    "Generate synthetic HIPAA / PHI rows containing first name, last name, DOB, MRN (medical record number), ICD-10 diagnosis code, CPT procedure code, and phone number. Fake data only.",
    "hipaa",
  ),
  makePresetTool(
    "generate_banking",
    "Generate synthetic US banking rows containing name, ABA routing number (check-digit valid), bank account number, and phone. Fake data only.",
    "banking",
  ),
  makePresetTool(
    "generate_uk_identity",
    "Generate synthetic UK identity rows containing first name, last name, UK National Insurance number (NI / NINO), NHS Number (mod-11 valid), and DOB. Fake data only.",
    "uk-identity",
  ),
  makePresetTool(
    "generate_canada_sin",
    "Generate synthetic Canadian SIN rows containing first name, last name, Social Insurance Number (Luhn-valid), province, and DOB. Fake data only.",
    "canada-sin",
  ),
  makePresetTool(
    "generate_passport",
    "Generate synthetic passport rows containing first name, last name, passport number (letter + 8 digits), country, DOB, and expiry. Fake data only.",
    "passport",
  ),
  makePresetTool(
    "generate_eu_vat",
    "Generate synthetic EU VAT rows containing name, EU VAT number (country-formatted), IBAN, and country. Fake data only.",
    "eu-vat",
  ),
  makePresetTool(
    "generate_npi_provider",
    "Generate synthetic healthcare provider rows containing first name, last name, NPI (10-digit Luhn-valid), DEA number (check-digit valid), and medical specialty. Fake data only.",
    "npi-provider",
  ),
  makePresetTool(
    "generate_driver_license",
    "Generate synthetic driver's license rows containing first name, last name, state-formatted DL number, US state, and DOB. Fake data only.",
    "driver-license",
  ),
];

// ─── Custom tool ────────────────────────────────────────────────────────────

const customTool: ToolDefinition = {
  name: "generate_custom",
  description:
    "Build a custom synthetic dataset from an arbitrary list of fields. Each field has a `name` (column header) and a `type` drawn from the full library used by the /generate/ page (SSN, credit-card, DOB, email, phone, MRN, NPI, DEA, IBAN, UK NI, NHS, Canadian SIN, EU VAT, passport, driver's license, IPv4, etc.). Supports optional per-field `blankPct` (0–100), `delimiter`, and `cardBrands` filter. Returns 1–500 rows of synthetic test data — never real PII.",
  inputSchema: {
    type: "object",
    required: ["fields"],
    properties: {
      fields: {
        type: "array",
        minItems: 1,
        maxItems: MAX_FIELDS,
        description: `Up to ${MAX_FIELDS} field definitions.`,
        items: {
          type: "object",
          required: ["name", "type"],
          properties: {
            name: {
              type: "string",
              maxLength: 50,
              description: "Column header for this field.",
            },
            type: {
              type: "string",
              enum: Object.keys(FIELD_TYPE_DEFS),
              description: "Field generator type. See FIELD_TYPE_DEFS for the full list.",
            },
            blankPct: {
              type: "number",
              minimum: 0,
              maximum: 100,
              default: 0,
              description: "Probability (0–100) that this field is blank in any given row.",
            },
            delimiter: {
              type: "string",
              maxLength: 5,
              description:
                "Override delimiter for types that support it (ssn, credit-card, dob, phone, card-expiry, mrn, uk-nin, nhs-number, canada-sin).",
            },
            cardBrands: {
              type: "array",
              items: {
                type: "string",
                enum: ["Visa", "Mastercard", "American Express", "Discover"],
              },
              description: "Restrict credit-card / credit-card-type fields to these brands.",
            },
          },
          additionalProperties: false,
        },
      },
      count: COUNT_AND_FORMAT_SCHEMA.count,
      format: COUNT_AND_FORMAT_SCHEMA.format,
    },
    additionalProperties: false,
  },
  handler: (args) => {
    const rawFields = args["fields"];
    if (!Array.isArray(rawFields) || rawFields.length === 0) {
      throw new Error("`fields` is required and must be a non-empty array");
    }
    if (rawFields.length > MAX_FIELDS) {
      throw new Error(`too many fields (max ${MAX_FIELDS})`);
    }

    const fields: CustomField[] = [];
    for (const f of rawFields) {
      if (typeof f !== "object" || f === null) {
        throw new Error("each field must be an object");
      }
      const field = f as Record<string, unknown>;
      const name = typeof field["name"] === "string" ? field["name"].trim() : "";
      if (!name || name.length > 50) {
        throw new Error("each field must have a non-empty `name` (max 50 chars)");
      }
      const type = field["type"];
      if (typeof type !== "string" || !VALID_FIELD_TYPES.has(type as FieldTypeKey)) {
        throw new Error(
          `invalid field type: ${String(type)}. Valid types: ${Object.keys(FIELD_TYPE_DEFS).join(", ")}`,
        );
      }
      const rawBlank = field["blankPct"];
      const blankPct =
        typeof rawBlank === "number" && Number.isFinite(rawBlank)
          ? Math.max(0, Math.min(100, rawBlank))
          : 0;
      const rawDelim = field["delimiter"];
      const delimiter =
        typeof rawDelim === "string" ? rawDelim.slice(0, 5) : undefined;
      const rawBrands = field["cardBrands"];
      const cardBrands: CardTypeName[] | undefined = Array.isArray(rawBrands)
        ? (rawBrands as unknown[])
            .filter((b): b is string => typeof b === "string")
            .filter((b): b is CardTypeName =>
              VALID_CARD_BRANDS.has(b as CardTypeName),
            )
        : undefined;
      fields.push({
        name,
        type: type as FieldTypeKey,
        blankPct,
        ...(delimiter !== undefined && { delimiter }),
        cardBrands: cardBrands?.length ? cardBrands : undefined,
      });
    }

    const count = clampCount(args["count"]);
    const format = pickFormat(args["format"]);
    const result = generateCustom(fields, count, randomSeed());
    return formatResult(result, format);
  },
};

// ─── Registry ───────────────────────────────────────────────────────────────

export const TOOLS: ToolDefinition[] = [...presetTools, customTool];

const TOOL_INDEX = new Map(TOOLS.map((t) => [t.name, t]));

export function findTool(name: string): ToolDefinition | undefined {
  return TOOL_INDEX.get(name);
}
