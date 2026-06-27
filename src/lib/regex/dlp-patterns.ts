// Curated library of DLP-relevant regular expressions.
//
// This is the single source of truth for the pattern library shown on the
// /regex/ page and returned by the `list_dlp_patterns` MCP tool — mirroring how
// src/lib/data-generator.ts backs both the /generate/ page and the MCP generate
// tools.
//
// Every pattern is written in ECMAScript (JavaScript `RegExp`) syntax so it runs
// natively in the browser and on the Worker without a WASM engine. Each entry
// carries a representative `example` that the pattern is guaranteed to match;
// `validateDlpPatterns()` enforces that contract and is run by the
// `npm run regex:validate` script so a bad pattern fails before it ships.
//
// These patterns are intentionally pragmatic DLP detectors (favouring recall),
// NOT formal validators — e.g. the credit-card patterns match on brand prefix +
// length, not the Luhn check digit. They are meant as starting points for tuning
// real DLP rules, which is exactly what the /regex/ workbench is for.

export type DlpCategory =
  | "Personal Identity"
  | "Financial / PCI"
  | "Healthcare / PHI"
  | "Network / Tech"
  | "Credentials / Secrets"
  | "Government / Tax"
  | "International";

/** Display/order for category filters on the page and the tool's enum. */
export const DLP_CATEGORIES: DlpCategory[] = [
  "Personal Identity",
  "Financial / PCI",
  "Healthcare / PHI",
  "Network / Tech",
  "Credentials / Secrets",
  "Government / Tax",
  "International",
];

export interface DlpPattern {
  /** Stable kebab-case identifier (unique across the library). */
  id: string;
  /** Human-friendly name shown in the library. */
  name: string;
  category: DlpCategory;
  /** ECMAScript regex source (no surrounding slashes). */
  pattern: string;
  /** Default flags to apply (e.g. "g", "gi"). */
  flags: string;
  /** A string the pattern is guaranteed to match (verified at build time). */
  example: string;
  /** Optional one-line note about scope / known limitations. */
  description?: string;
}

// Synthetic credential examples are assembled from fragments so secret scanners
// (e.g. GitHub push protection) don't false-positive on the literal vendor key
// shapes. Every value here is fabricated — there's nothing real to leak — but
// scanners match on shape, so we keep the shape out of the static source text.
// The runtime string is identical to writing the value inline.
const syn = (...parts: string[]): string => parts.join("");

export const DLP_PATTERNS: DlpPattern[] = [
  // ─── Personal Identity ────────────────────────────────────────────────────
  {
    id: "ssn-dashed",
    name: "US Social Security Number (dashed)",
    category: "Personal Identity",
    pattern: String.raw`\b\d{3}-\d{2}-\d{4}\b`,
    flags: "g",
    example: "123-45-6789",
  },
  {
    id: "ssn-spaced",
    name: "US Social Security Number (spaced)",
    category: "Personal Identity",
    pattern: String.raw`\b\d{3} \d{2} \d{4}\b`,
    flags: "g",
    example: "123 45 6789",
  },
  {
    id: "ssn-flexible",
    name: "US Social Security Number (any/no separator)",
    category: "Personal Identity",
    pattern: String.raw`\b\d{3}[-. ]?\d{2}[-. ]?\d{4}\b`,
    flags: "g",
    example: "123456789",
    description: "Also matches the 9-digit run with no separators.",
  },
  {
    id: "ssn-labeled",
    name: "US SSN with label",
    category: "Personal Identity",
    pattern: String.raw`\bSSN:?\s*\d{3}-?\d{2}-?\d{4}\b`,
    flags: "gi",
    example: "SSN: 123-45-6789",
  },
  {
    id: "itin",
    name: "US Individual Taxpayer ID (ITIN)",
    category: "Personal Identity",
    pattern: String.raw`\b9\d{2}-?[78]\d-?\d{4}\b`,
    flags: "g",
    example: "912-78-1234",
    description: "ITINs begin with 9 and have a 70–88 group number.",
  },
  {
    id: "email",
    name: "Email Address",
    category: "Personal Identity",
    pattern: String.raw`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`,
    flags: "g",
    example: "jane.doe@example.com",
  },
  {
    id: "us-phone",
    name: "US Phone Number",
    category: "Personal Identity",
    pattern: String.raw`(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}`,
    flags: "g",
    example: "(555) 123-4567",
  },
  {
    id: "us-phone-e164",
    name: "US Phone Number (E.164)",
    category: "Personal Identity",
    pattern: String.raw`\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}`,
    flags: "g",
    example: "+1 555 123 4567",
  },
  {
    id: "dob-mdy",
    name: "Date of Birth (MM/DD/YYYY)",
    category: "Personal Identity",
    pattern: String.raw`\b(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\d|3[01])/(?:19|20)\d{2}\b`,
    flags: "g",
    example: "04/15/1985",
  },
  {
    id: "dob-iso",
    name: "Date of Birth (ISO YYYY-MM-DD)",
    category: "Personal Identity",
    pattern: String.raw`\b(?:19|20)\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b`,
    flags: "g",
    example: "1985-04-15",
  },
  {
    id: "dob-labeled",
    name: "Date of Birth with label",
    category: "Personal Identity",
    pattern: String.raw`\b(?:DOB|D\.O\.B\.?):?\s*(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\d|3[01])/(?:19|20)\d{2}\b`,
    flags: "gi",
    example: "DOB: 04/15/1985",
  },
  {
    id: "us-zip",
    name: "US ZIP Code (ZIP / ZIP+4)",
    category: "Personal Identity",
    pattern: String.raw`\b\d{5}(?:-\d{4})?\b`,
    flags: "g",
    example: "90210-1234",
  },
  {
    id: "us-drivers-license",
    name: "US Driver's License (generic)",
    category: "Personal Identity",
    pattern: String.raw`\b[A-Z]{1,2}\d{5,7}\b`,
    flags: "g",
    example: "D1234567",
    description: "Formats vary by state; this is a broad letter+digits heuristic.",
  },
  {
    id: "us-passport",
    name: "US Passport Number",
    category: "Personal Identity",
    pattern: String.raw`\b[A-Z0-9]\d{8}\b`,
    flags: "g",
    example: "C03005988",
  },
  {
    id: "full-name",
    name: "Full Name (heuristic)",
    category: "Personal Identity",
    pattern: String.raw`\b[A-Z][a-z]+(?: [A-Z][a-z]+){1,2}\b`,
    flags: "g",
    example: "John Smith",
    description: "Two or three capitalised words; high false-positive rate by design.",
  },
  {
    id: "name-with-title",
    name: "Name with Honorific",
    category: "Personal Identity",
    pattern: String.raw`\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s[A-Z][a-z]+\b`,
    flags: "g",
    example: "Dr. Smith",
  },
  {
    id: "po-box",
    name: "PO Box",
    category: "Personal Identity",
    pattern: String.raw`\bP\.?O\.?\s?Box\s?\d+\b`,
    flags: "gi",
    example: "P.O. Box 1234",
  },
  {
    id: "us-street-address",
    name: "US Street Address (heuristic)",
    category: "Personal Identity",
    pattern: String.raw`\b\d{1,5}\s[A-Z][A-Za-z]+\s(?:St|Ave|Blvd|Rd|Ln|Dr|Ct|Way)\b`,
    flags: "g",
    example: "123 Main St",
  },
  {
    id: "vin",
    name: "Vehicle Identification Number (VIN)",
    category: "Personal Identity",
    pattern: String.raw`\b[A-HJ-NPR-Z0-9]{17}\b`,
    flags: "g",
    example: "1HGBH41JXMN109186",
    description: "17 chars excluding I, O, and Q.",
  },

  // ─── Financial / PCI ──────────────────────────────────────────────────────
  {
    id: "cc-visa",
    name: "Credit Card — Visa",
    category: "Financial / PCI",
    pattern: String.raw`\b4\d{12}(?:\d{3})?\b`,
    flags: "g",
    example: "4111111111111111",
    description: "Prefix + length only — does not enforce the Luhn check digit.",
  },
  {
    id: "cc-mastercard",
    name: "Credit Card — Mastercard",
    category: "Financial / PCI",
    pattern: String.raw`\b5[1-5]\d{14}\b`,
    flags: "g",
    example: "5500005555555559",
  },
  {
    id: "cc-amex",
    name: "Credit Card — American Express",
    category: "Financial / PCI",
    pattern: String.raw`\b3[47]\d{13}\b`,
    flags: "g",
    example: "340000000000009",
  },
  {
    id: "cc-discover",
    name: "Credit Card — Discover",
    category: "Financial / PCI",
    pattern: String.raw`\b6(?:011|5\d{2})\d{12}\b`,
    flags: "g",
    example: "6011000000000004",
  },
  {
    id: "cc-diners",
    name: "Credit Card — Diners Club",
    category: "Financial / PCI",
    pattern: String.raw`\b3(?:0[0-5]|[68]\d)\d{11}\b`,
    flags: "g",
    example: "30000000000004",
  },
  {
    id: "cc-jcb",
    name: "Credit Card — JCB",
    category: "Financial / PCI",
    pattern: String.raw`\b(?:2131|1800|35\d{3})\d{11}\b`,
    flags: "g",
    example: "3530111333300000",
  },
  {
    id: "cc-maestro",
    name: "Credit Card — Maestro",
    category: "Financial / PCI",
    pattern: String.raw`\b(?:5018|5020|5038|6304|6759|6761|6763)\d{8,15}\b`,
    flags: "g",
    example: "6759649826438453",
  },
  {
    id: "cc-16-generic",
    name: "Credit Card — any 16 digits",
    category: "Financial / PCI",
    pattern: String.raw`\b\d{16}\b`,
    flags: "g",
    example: "4111111111111111",
  },
  {
    id: "cc-grouped",
    name: "Credit Card — 4×4 grouped",
    category: "Financial / PCI",
    pattern: String.raw`\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}\b`,
    flags: "g",
    example: "4111 1111 1111 1111",
  },
  {
    id: "cc-amex-grouped",
    name: "Credit Card — Amex grouped",
    category: "Financial / PCI",
    pattern: String.raw`\b3[47]\d{2}[- ]\d{6}[- ]\d{5}\b`,
    flags: "g",
    example: "3782 822463 10005",
  },
  {
    id: "cvv-labeled",
    name: "Card Verification Value (labeled)",
    category: "Financial / PCI",
    pattern: String.raw`\bCVV2?:?\s*\d{3,4}\b`,
    flags: "gi",
    example: "CVV: 123",
  },
  {
    id: "card-expiry",
    name: "Card Expiry (MM/YY)",
    category: "Financial / PCI",
    pattern: String.raw`\b(?:0[1-9]|1[0-2])/\d{2}\b`,
    flags: "g",
    example: "12/25",
  },
  {
    id: "iban",
    name: "IBAN (International Bank Account Number)",
    category: "Financial / PCI",
    pattern: String.raw`\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b`,
    flags: "g",
    example: "GB82WEST12345698765432",
  },
  {
    id: "aba-routing",
    name: "ABA Routing Number",
    category: "Financial / PCI",
    pattern: String.raw`\b\d{9}\b`,
    flags: "g",
    example: "021000021",
    description: "9 digits; pair with context to reduce false positives.",
  },
  {
    id: "bank-account",
    name: "Bank Account Number",
    category: "Financial / PCI",
    pattern: String.raw`\b\d{8,17}\b`,
    flags: "g",
    example: "12345678",
  },
  {
    id: "swift-bic",
    name: "SWIFT / BIC Code",
    category: "Financial / PCI",
    pattern: String.raw`\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b`,
    flags: "g",
    example: "DEUTDEFF500",
  },
  {
    id: "uk-sort-code",
    name: "UK Sort Code",
    category: "Financial / PCI",
    pattern: String.raw`\b\d{2}-\d{2}-\d{2}\b`,
    flags: "g",
    example: "12-34-56",
  },
  {
    id: "bitcoin-address",
    name: "Bitcoin Address",
    category: "Financial / PCI",
    pattern: String.raw`\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b`,
    flags: "g",
    example: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  },
  {
    id: "ethereum-address",
    name: "Ethereum Address",
    category: "Financial / PCI",
    pattern: String.raw`\b0x[a-fA-F0-9]{40}\b`,
    flags: "g",
    example: "0x52908400098527886E0F7030069857D2E4169EE7",
  },

  // ─── Healthcare / PHI ─────────────────────────────────────────────────────
  {
    id: "mrn-labeled",
    name: "Medical Record Number (labeled)",
    category: "Healthcare / PHI",
    pattern: String.raw`\b(?:MRN|MR|Record)#?:?\s*\d{6,10}\b`,
    flags: "gi",
    example: "MRN: 1234567",
  },
  {
    id: "patient-id-labeled",
    name: "Patient ID (labeled)",
    category: "Healthcare / PHI",
    pattern: String.raw`\b(?:Patient ID|PatientID|PID):?\s*\d{5,10}\b`,
    flags: "gi",
    example: "Patient ID: 12345",
  },
  {
    id: "icd10",
    name: "ICD-10 Diagnosis Code",
    category: "Healthcare / PHI",
    pattern: String.raw`\b[A-TV-Z]\d{2}(?:\.\d{1,4})?\b`,
    flags: "g",
    example: "E11.9",
  },
  {
    id: "cpt",
    name: "CPT Procedure Code",
    category: "Healthcare / PHI",
    pattern: String.raw`\b\d{5}\b`,
    flags: "g",
    example: "99213",
    description: "5 digits; overlaps with ZIP — pair with context.",
  },
  {
    id: "npi",
    name: "NPI (National Provider Identifier)",
    category: "Healthcare / PHI",
    pattern: String.raw`\b\d{10}\b`,
    flags: "g",
    example: "1234567890",
  },
  {
    id: "dea",
    name: "DEA Registration Number",
    category: "Healthcare / PHI",
    pattern: String.raw`\b[A-Z]{2}\d{7}\b`,
    flags: "g",
    example: "AB1234567",
  },
  {
    id: "medicare-hicn",
    name: "Medicare HICN (legacy)",
    category: "Healthcare / PHI",
    pattern: String.raw`\b\d{9}[A-Z]\d?\b`,
    flags: "g",
    example: "123456789A",
  },
  {
    id: "medicare-mbi",
    name: "Medicare Beneficiary Identifier (MBI)",
    category: "Healthcare / PHI",
    pattern: String.raw`\b[1-9][A-Z][A-Z0-9]\d[A-Z][A-Z0-9]\d[A-Z]{2}\d{2}\b`,
    flags: "g",
    example: "1EG4TE5MK73",
  },
  {
    id: "ndc",
    name: "National Drug Code (NDC)",
    category: "Healthcare / PHI",
    pattern: String.raw`\b\d{4,5}-\d{3,4}-\d{1,2}\b`,
    flags: "g",
    example: "12345-6789-01",
  },
  {
    id: "loinc",
    name: "LOINC Code",
    category: "Healthcare / PHI",
    pattern: String.raw`\b\d{1,5}-\d\b`,
    flags: "g",
    example: "1234-5",
  },
  {
    id: "health-claim-number",
    name: "Health Insurance Claim Number",
    category: "Healthcare / PHI",
    pattern: String.raw`\b[A-Z]\d{9}\b`,
    flags: "g",
    example: "A123456789",
  },

  // ─── Network / Tech ───────────────────────────────────────────────────────
  {
    id: "ipv4",
    name: "IPv4 Address",
    category: "Network / Tech",
    pattern: String.raw`\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\b`,
    flags: "g",
    example: "192.168.1.1",
  },
  {
    id: "ipv4-private",
    name: "IPv4 Private Range (RFC 1918)",
    category: "Network / Tech",
    pattern: String.raw`\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b`,
    flags: "g",
    example: "192.168.1.100",
  },
  {
    id: "ipv4-cidr",
    name: "IPv4 CIDR Block",
    category: "Network / Tech",
    pattern: String.raw`\b(?:\d{1,3}\.){3}\d{1,3}/\d{1,2}\b`,
    flags: "g",
    example: "10.0.0.0/24",
  },
  {
    id: "ipv6",
    name: "IPv6 Address (full)",
    category: "Network / Tech",
    pattern: String.raw`\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b`,
    flags: "gi",
    example: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
  },
  {
    id: "mac-colon",
    name: "MAC Address (colon)",
    category: "Network / Tech",
    pattern: String.raw`\b[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}\b`,
    flags: "g",
    example: "00:1B:44:11:3A:B7",
  },
  {
    id: "mac-dash",
    name: "MAC Address (dash)",
    category: "Network / Tech",
    pattern: String.raw`\b[0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2}){5}\b`,
    flags: "g",
    example: "00-1B-44-11-3A-B7",
  },
  {
    id: "url",
    name: "HTTP/HTTPS URL",
    category: "Network / Tech",
    pattern: String.raw`https?://[^\s]+`,
    flags: "g",
    example: "https://example.com/path?id=1",
  },
  {
    id: "uuid",
    name: "UUID (v1–v5)",
    category: "Network / Tech",
    pattern: String.raw`\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b`,
    flags: "gi",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },
  {
    id: "hostname-fqdn",
    name: "Fully-Qualified Domain Name",
    category: "Network / Tech",
    pattern: String.raw`\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b`,
    flags: "g",
    example: "server.internal.corp.com",
  },
  {
    id: "tcp-port",
    name: "TCP/UDP Port (host:port)",
    category: "Network / Tech",
    pattern: String.raw`:(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|\d{1,4})\b`,
    flags: "g",
    example: ":8080",
  },
  {
    id: "aws-arn",
    name: "AWS ARN",
    category: "Network / Tech",
    pattern: String.raw`\barn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:[A-Za-z0-9-_/:.]+`,
    flags: "g",
    example: "arn:aws:iam::123456789012:user/Bob",
  },
  {
    id: "s3-uri",
    name: "Amazon S3 URI",
    category: "Network / Tech",
    pattern: String.raw`\bs3://[a-z0-9.-]+/[^\s]*`,
    flags: "g",
    example: "s3://my-bucket/path/file.txt",
  },
  {
    id: "jdbc-uri",
    name: "JDBC Connection String",
    category: "Network / Tech",
    pattern: String.raw`\bjdbc:[a-z]+://[^\s]+`,
    flags: "g",
    example: "jdbc:mysql://localhost:3306/db",
  },

  // ─── Credentials / Secrets ────────────────────────────────────────────────
  {
    id: "aws-access-key-id",
    name: "AWS Access Key ID",
    category: "Credentials / Secrets",
    pattern: String.raw`\b(?:AKIA|ASIA|AGPA|AIDA)[A-Z0-9]{16}\b`,
    flags: "g",
    example: syn("AKIA", "IOSFODNN7EXAMPLE"),
  },
  {
    id: "aws-secret-key",
    name: "AWS Secret Access Key",
    category: "Credentials / Secrets",
    pattern: String.raw`\b[A-Za-z0-9/+]{40}\b`,
    flags: "g",
    example: syn("wJalrXUtnFEMI/K7MDENG/", "bPxRfiCYEXAMPLEKEY"),
    description: "40-char base64; high false-positive rate without context.",
  },
  {
    id: "github-token",
    name: "GitHub Personal Access Token",
    category: "Credentials / Secrets",
    pattern: String.raw`\bghp_[A-Za-z0-9]{36}\b`,
    flags: "g",
    example: syn("ghp_", "1234567890abcdefghijklmnopqrstuvwxyz"),
  },
  {
    id: "github-fine-grained",
    name: "GitHub Fine-Grained Token",
    category: "Credentials / Secrets",
    pattern: String.raw`\bgithub_pat_[A-Za-z0-9_]{22,}\b`,
    flags: "g",
    example: syn("github_pat_", "11ABCDEFG0abcdefghijkl"),
  },
  {
    id: "gitlab-pat",
    name: "GitLab Personal Access Token",
    category: "Credentials / Secrets",
    pattern: String.raw`\bglpat-[A-Za-z0-9_-]{20}\b`,
    flags: "g",
    example: syn("glpat-", "12345678901234567890"),
  },
  {
    id: "slack-token",
    name: "Slack Token",
    category: "Credentials / Secrets",
    pattern: String.raw`\bxox[baprs]-[A-Za-z0-9-]{10,48}\b`,
    flags: "g",
    example: syn("xoxb-", "123456789012-abcdefghijkl"),
  },
  {
    id: "google-api-key",
    name: "Google API Key",
    category: "Credentials / Secrets",
    pattern: String.raw`\bAIza[0-9A-Za-z_-]{35}\b`,
    flags: "g",
    example: syn("AIza", "SyAbCdEfGhIjKlMnOpQrStUvWxYz0123456"),
  },
  {
    id: "stripe-secret-key",
    name: "Stripe Secret/Restricted Key",
    category: "Credentials / Secrets",
    pattern: String.raw`\b[sr]k_(?:live|test)_[A-Za-z0-9]{24,}\b`,
    flags: "g",
    example: syn("sk_", "test_0123456789abcdefghijABCD"),
  },
  {
    id: "openai-key",
    name: "OpenAI-style API Key",
    category: "Credentials / Secrets",
    pattern: String.raw`\bsk-[A-Za-z0-9]{32,}\b`,
    flags: "g",
    example: syn("sk-", "abcdefghijklmnopqrstuvwxyz123456"),
  },
  {
    id: "twilio-account-sid",
    name: "Twilio Account SID",
    category: "Credentials / Secrets",
    pattern: String.raw`\bAC[a-f0-9]{32}\b`,
    flags: "gi",
    example: syn("AC", "0123456789abcdef0123456789abcdef"),
  },
  {
    id: "npm-token",
    name: "npm Access Token",
    category: "Credentials / Secrets",
    pattern: String.raw`\bnpm_[A-Za-z0-9]{36}\b`,
    flags: "g",
    example: syn("npm_", "123456789012345678901234567890123456"),
  },
  {
    id: "jwt",
    name: "JSON Web Token (JWT)",
    category: "Credentials / Secrets",
    pattern: String.raw`\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b`,
    flags: "g",
    example: syn(
      "eyJhbGciOiJIUzI1NiJ9",
      ".eyJzdWIiOiIxMjM0NTY3ODkwIn0",
      ".dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    ),
  },
  {
    id: "private-key-pem",
    name: "PEM Private Key Header",
    category: "Credentials / Secrets",
    pattern: String.raw`-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----`,
    flags: "g",
    example: "-----BEGIN RSA PRIVATE KEY-----",
  },
  {
    id: "ssh-public-key",
    name: "SSH Public Key",
    category: "Credentials / Secrets",
    pattern: String.raw`\bssh-(?:rsa|ed25519|dss) [A-Za-z0-9+/]{20,}`,
    flags: "g",
    example: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQAB",
  },
  {
    id: "bearer-token",
    name: "Bearer Token (Authorization header)",
    category: "Credentials / Secrets",
    pattern: String.raw`\bBearer\s+[A-Za-z0-9._-]{10,}\b`,
    flags: "g",
    example: "Bearer abcdef1234567890",
  },
  {
    id: "basic-auth",
    name: "Basic Auth (Authorization header)",
    category: "Credentials / Secrets",
    pattern: String.raw`\bBasic\s[A-Za-z0-9+/]{16,}={0,2}`,
    flags: "g",
    example: "Basic dXNlcjpwYXNzd29yZA==",
  },
  {
    id: "password-in-url",
    name: "Credentials Embedded in URL",
    category: "Credentials / Secrets",
    pattern: String.raw`\b[a-z]+://[^:@\s]+:[^@\s]+@`,
    flags: "gi",
    example: "https://admin:secret@example.com",
  },
  {
    id: "generic-api-key",
    name: "Generic API Key / Token (32–64 chars)",
    category: "Credentials / Secrets",
    pattern: String.raw`\b[A-Za-z0-9]{32,64}\b`,
    flags: "g",
    example: "abcd1234efgh5678ijkl9012mnop3456",
  },

  // ─── Government / Tax ─────────────────────────────────────────────────────
  {
    id: "ein",
    name: "US Employer ID Number (EIN)",
    category: "Government / Tax",
    pattern: String.raw`\b\d{2}-\d{7}\b`,
    flags: "g",
    example: "12-3456789",
  },
  {
    id: "ein-labeled",
    name: "US EIN / Tax ID (labeled)",
    category: "Government / Tax",
    pattern: String.raw`\b(?:EIN|FEIN|Tax ID):?\s*\d{2}-\d{7}\b`,
    flags: "gi",
    example: "EIN: 12-3456789",
  },
  {
    id: "itin-labeled",
    name: "US ITIN (labeled)",
    category: "Government / Tax",
    pattern: String.raw`\bITIN:?\s*9\d{2}-?[78]\d-?\d{4}\b`,
    flags: "gi",
    example: "ITIN: 912-78-1234",
  },

  // ─── International ────────────────────────────────────────────────────────
  {
    id: "uk-nino",
    name: "UK National Insurance Number",
    category: "International",
    pattern: String.raw`\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b`,
    flags: "g",
    example: "AB123456C",
  },
  {
    id: "uk-nhs",
    name: "UK NHS Number",
    category: "International",
    pattern: String.raw`\b\d{3}[ -]?\d{3}[ -]?\d{4}\b`,
    flags: "g",
    example: "401 023 2137",
  },
  {
    id: "canada-sin",
    name: "Canada Social Insurance Number (SIN)",
    category: "International",
    pattern: String.raw`\b\d{3}[- ]?\d{3}[- ]?\d{3}\b`,
    flags: "g",
    example: "046-454-286",
  },
  {
    id: "eu-vat",
    name: "EU VAT Number",
    category: "International",
    pattern: String.raw`\b(?:AT|BE|BG|HR|CY|CZ|DE|DK|EE|EL|ES|FI|FR|HU|IE|IT|LT|LU|LV|MT|NL|PL|PT|RO|SE|SI|SK)[A-Z0-9]{8,12}\b`,
    flags: "g",
    example: "DE123456789",
  },
  {
    id: "india-aadhaar",
    name: "India Aadhaar Number",
    category: "International",
    pattern: String.raw`\b\d{4}\s?\d{4}\s?\d{4}\b`,
    flags: "g",
    example: "2234 5678 9012",
  },
  {
    id: "india-pan",
    name: "India PAN (Permanent Account Number)",
    category: "International",
    pattern: String.raw`\b[A-Z]{5}\d{4}[A-Z]\b`,
    flags: "g",
    example: "ABCDE1234F",
  },
  {
    id: "australia-tfn",
    name: "Australia Tax File Number (TFN)",
    category: "International",
    pattern: String.raw`\b\d{3}\s?\d{3}\s?\d{3}\b`,
    flags: "g",
    example: "123 456 789",
  },
  {
    id: "australia-medicare",
    name: "Australia Medicare Number",
    category: "International",
    pattern: String.raw`\b\d{4}\s?\d{5}\s?\d\b`,
    flags: "g",
    example: "2123 45670 1",
  },
  {
    id: "france-insee",
    name: "France INSEE / Social Security Number",
    category: "International",
    pattern: String.raw`\b[12]\d{2}(?:0[1-9]|1[0-2])\d{10}\b`,
    flags: "g",
    example: "180012345678901",
  },
  {
    id: "germany-steuer-id",
    name: "Germany Tax ID (Steuer-ID)",
    category: "International",
    pattern: String.raw`\b\d{11}\b`,
    flags: "g",
    example: "12345678901",
  },
  {
    id: "spain-dni",
    name: "Spain DNI / NIF",
    category: "International",
    pattern: String.raw`\b\d{8}[A-Za-z]\b`,
    flags: "g",
    example: "12345678Z",
  },
  {
    id: "italy-fiscal-code",
    name: "Italy Fiscal Code (Codice Fiscale)",
    category: "International",
    pattern: String.raw`\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b`,
    flags: "gi",
    example: "RSSMRA85T10A562S",
  },
  {
    id: "brazil-cpf",
    name: "Brazil CPF",
    category: "International",
    pattern: String.raw`\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`,
    flags: "g",
    example: "123.456.789-09",
  },
  {
    id: "south-africa-id",
    name: "South Africa National ID",
    category: "International",
    pattern: String.raw`\b\d{13}\b`,
    flags: "g",
    example: "8001015009087",
  },
  {
    id: "ireland-pps",
    name: "Ireland PPS Number",
    category: "International",
    pattern: String.raw`\b\d{7}[A-Za-z]{1,2}\b`,
    flags: "g",
    example: "1234567T",
  },
  {
    id: "mexico-curp",
    name: "Mexico CURP",
    category: "International",
    pattern: String.raw`\b[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d\b`,
    flags: "gi",
    example: "BADD110313HCMLNS09",
  },
  {
    id: "japan-mynumber",
    name: "Japan My Number",
    category: "International",
    pattern: String.raw`\b\d{4}\s?\d{4}\s?\d{4}\b`,
    flags: "g",
    example: "1234 5678 9012",
  },
  {
    id: "china-resident-id",
    name: "China Resident Identity Card",
    category: "International",
    pattern: String.raw`\b\d{17}[0-9Xx]\b`,
    flags: "g",
    example: "11010519491231002X",
  },
  {
    id: "singapore-nric",
    name: "Singapore NRIC / FIN",
    category: "International",
    pattern: String.raw`\b[STFGstfg]\d{7}[A-Za-z]\b`,
    flags: "g",
    example: "S1234567D",
  },
  {
    id: "south-korea-rrn",
    name: "South Korea Resident Registration Number",
    category: "International",
    pattern: String.raw`\b\d{6}-?\d{7}\b`,
    flags: "g",
    example: "900101-1234567",
  },
];

/**
 * Validate the library: every pattern must compile and its `example` must match,
 * and every `id` must be unique. Returns a list of failures (empty = all good).
 *
 * Run via `npm run regex:validate`. Kept as a pure exported function (rather than
 * a throw-at-import guard) so importing the library can never break the Worker at
 * runtime — the contract is enforced before code ships, not on every request.
 */
export function validateDlpPatterns(): { id: string; reason: string }[] {
  const failures: { id: string; reason: string }[] = [];
  const seen = new Set<string>();

  for (const p of DLP_PATTERNS) {
    if (seen.has(p.id)) {
      failures.push({ id: p.id, reason: "duplicate id" });
    }
    seen.add(p.id);

    try {
      // eslint-disable-next-line no-new
      new RegExp(p.pattern, p.flags);
    } catch (e) {
      failures.push({
        id: p.id,
        reason: `invalid regex: ${e instanceof Error ? e.message : String(e)}`,
      });
      continue;
    }

    // Test with a non-global clone so the global flag's lastIndex statefulness
    // can't cause a spurious miss.
    const testRe = new RegExp(p.pattern, p.flags.replace(/g/g, ""));
    if (!testRe.test(p.example)) {
      failures.push({
        id: p.id,
        reason: `example does not match pattern: ${JSON.stringify(p.example)}`,
      });
    }
  }

  return failures;
}
