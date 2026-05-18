// ─── Data pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna",
  "Kenneth", "Michelle", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
  "Timothy", "Deborah",
] as const;

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts",
] as const;

const EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "facebook.com", "me.com", "live.com", "msn.com",
] as const;

const ZIP_CODES = [
  "10001", "90210", "60601", "77001", "85001", "30301", "98101", "02101",
  "33101", "48201", "55401", "64101", "73101", "80201", "84101", "37201",
  "46201", "53201", "70801", "43201", "35201", "40201", "29201", "50301",
  "68501", "87501", "19101", "23201", "53901", "72201", "49201", "57101",
  "38101", "93101", "27501", "76101", "83201", "45201", "58201", "66101",
  "04101", "21201", "96813", "67201", "59101", "82801", "05801", "89501",
  "99501", "88001",
] as const;

const ICD10_CODES = [
  "E11.9",  // Type 2 diabetes mellitus without complications
  "I10",    // Essential (primary) hypertension
  "J18.9",  // Pneumonia, unspecified organism
  "M79.3",  // Panniculitis
  "Z23",    // Encounter for immunization
  "K21.0",  // Gastroesophageal reflux disease with esophagitis
  "F32.1",  // Major depressive disorder, single episode, moderate
  "J06.9",  // Acute upper respiratory infection, unspecified
  "M54.5",  // Low back pain
  "Z00.00", // Encounter for general adult medical examination
  "E78.5",  // Hyperlipidemia, unspecified
  "J44.1",  // Chronic obstructive pulmonary disease with acute exacerbation
  "N39.0",  // Urinary tract infection, site not specified
  "I25.10", // Atherosclerotic heart disease of native coronary artery
  "G43.909",// Migraine, unspecified, not intractable
  "F41.1",  // Generalized anxiety disorder
  "Z12.31", // Encounter for screening mammogram for malignant neoplasm of breast
  "M17.11", // Primary osteoarthritis, right knee
  "I48.91", // Unspecified atrial fibrillation
  "E03.9",  // Hypothyroidism, unspecified
] as const;

const CPT_CODES = [
  "99213", "99214", "99203", "99204", "99396", "99386", "93000",
  "71046", "80053", "85025", "36415", "90834", "97110", "99283",
] as const;

// ─── PRNG ─────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ScopedRandom {
  float(): number;
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
}

function createScopedRandom(seed: number): ScopedRandom {
  const rng = mulberry32(seed);
  return {
    float: () => rng(),
    int(min: number, max: number): number {
      return Math.floor(rng() * (max - min + 1)) + min;
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(rng() * arr.length)];
    },
  };
}

// ─── Individual generators ────────────────────────────────────────────────────

function generateName(rng: ScopedRandom): { first: string; last: string; full: string } {
  const first = rng.pick(FIRST_NAMES);
  const last = rng.pick(LAST_NAMES);
  return { first, last, full: `${first} ${last}` };
}

function generateSSN(rng: ScopedRandom): string {
  let area: number;
  do {
    area = rng.int(1, 899);
  } while (area === 666);
  const group = rng.int(1, 99);
  const serial = rng.int(1, 9999);
  return `${area.toString().padStart(3, "0")}-${group.toString().padStart(2, "0")}-${serial.toString().padStart(4, "0")}`;
}

function luhnCheckDigit(digits: number[]): number {
  let sum = 0;
  const parity = digits.length % 2;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    if (i % 2 === parity) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

function generateCreditCard(rng: ScopedRandom): string {
  const type = rng.int(0, 3); // 0=Visa, 1=MC, 2=AMEX, 3=Discover
  let prefix: number[];
  let length: number;

  if (type === 0) {
    prefix = [4];
    length = 16;
  } else if (type === 1) {
    prefix = [5, rng.int(1, 5)];
    length = 16;
  } else if (type === 2) {
    prefix = [3, rng.pick([4, 7] as const)];
    length = 15;
  } else {
    prefix = [6, 0, 1, 1];
    length = 16;
  }

  const digits: number[] = [...prefix];
  while (digits.length < length - 1) {
    digits.push(rng.int(0, 9));
  }
  digits.push(luhnCheckDigit(digits));

  if (length === 15) {
    return `${digits.slice(0, 4).join("")}-${digits.slice(4, 10).join("")}-${digits.slice(10).join("")}`;
  }
  return `${digits.slice(0, 4).join("")}-${digits.slice(4, 8).join("")}-${digits.slice(8, 12).join("")}-${digits.slice(12).join("")}`;
}

function generateDOB(rng: ScopedRandom): string {
  const year = rng.int(new Date().getFullYear() - 80, new Date().getFullYear() - 21);
  const month = rng.int(1, 12);
  const maxDay = new Date(year, month, 0).getDate();
  const day = rng.int(1, maxDay);
  return `${month}/${day}/${year}`;
}

function generateEmail(rng: ScopedRandom, first: string, last: string): string {
  const domain = rng.pick(EMAIL_DOMAINS);
  const pattern = rng.int(0, 3);
  const local =
    pattern === 0 ? `${first.toLowerCase()}${last.toLowerCase()}` :
    pattern === 1 ? `${first.toLowerCase()}.${last.toLowerCase()}` :
    pattern === 2 ? `${first[0].toLowerCase()}${last.toLowerCase()}` :
                    `${first.toLowerCase()}${rng.int(10, 99)}`;
  return `${local}@${domain}`;
}

function generatePhone(rng: ScopedRandom): string {
  const area = rng.int(200, 999);
  const exchange = rng.int(200, 999);
  const line = rng.int(1000, 9999);
  return `(${area}) ${exchange}-${line}`;
}

function generateZip(rng: ScopedRandom): string {
  return rng.pick(ZIP_CODES);
}

function generateCardExpiry(rng: ScopedRandom): string {
  const year = new Date().getFullYear() + rng.int(1, 4);
  const month = rng.int(1, 12);
  return `${month}/${year}`;
}

function generateMRN(rng: ScopedRandom): string {
  const num = Array.from({ length: 8 }, () => rng.int(0, 9)).join("");
  return `MRN-${num}`;
}

function generateICD10(rng: ScopedRandom): string {
  return rng.pick(ICD10_CODES);
}

function generateCPT(rng: ScopedRandom): string {
  return rng.pick(CPT_CODES);
}

function generateRoutingNumber(rng: ScopedRandom): string {
  // ABA checksum: (3d1 + 7d2 + d3 + 3d4 + 7d5 + d6 + 3d7 + 7d8 + d9) % 10 === 0
  const weights = [3, 7, 1, 3, 7, 1, 3, 7];
  const d: number[] = [rng.int(0, 1)]; // first digit: 0 or 1
  for (let i = 1; i < 8; i++) d.push(rng.int(0, 9));
  const sum = weights.reduce((acc, w, i) => acc + w * d[i], 0);
  const check = (10 - (sum % 10)) % 10;
  d.push(check);
  return d.join("");
}

function generateAccountNumber(rng: ScopedRandom): string {
  const len = rng.int(10, 12);
  return Array.from({ length: len }, () => rng.int(0, 9)).join("");
}

// ─── Row builders ─────────────────────────────────────────────────────────────

function buildPiiSsnCcnRow(rng: ScopedRandom): PiiSsnCcnRow {
  const { full } = generateName(rng);
  return { name: full, ssn: generateSSN(rng), ccn: generateCreditCard(rng) };
}

function buildPiiSsnDobRow(rng: ScopedRandom): PiiSsnDobRow {
  const { full } = generateName(rng);
  return { name: full, ssn: generateSSN(rng), dob: generateDOB(rng) };
}

function buildPciCcnZipRow(rng: ScopedRandom): PciCcnZipRow {
  const { first, last } = generateName(rng);
  return {
    first,
    last,
    zip: generateZip(rng),
    ccn: generateCreditCard(rng),
    expiry: generateCardExpiry(rng),
  };
}

function buildPiiDobEmailRow(rng: ScopedRandom): PiiDobEmailRow {
  const { first, last } = generateName(rng);
  return { first, last, dob: generateDOB(rng), email: generateEmail(rng, first, last) };
}

function buildHipaaRow(rng: ScopedRandom): HipaaRow {
  const { first, last } = generateName(rng);
  return {
    first,
    last,
    dob: generateDOB(rng),
    mrn: generateMRN(rng),
    icd10: generateICD10(rng),
    cpt: generateCPT(rng),
    phone: generatePhone(rng),
  };
}

function buildBankingRow(rng: ScopedRandom): BankingRow {
  const { full } = generateName(rng);
  return {
    name: full,
    routing: generateRoutingNumber(rng),
    account: generateAccountNumber(rng),
    phone: generatePhone(rng),
  };
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PiiSsnCcnRow {
  name: string;
  ssn: string;
  ccn: string;
}

export interface PiiSsnDobRow {
  name: string;
  ssn: string;
  dob: string;
}

export interface PciCcnZipRow {
  first: string;
  last: string;
  zip: string;
  ccn: string;
  expiry: string;
}

export interface PiiDobEmailRow {
  first: string;
  last: string;
  dob: string;
  email: string;
}

export interface HipaaRow {
  first: string;
  last: string;
  dob: string;
  mrn: string;
  icd10: string;
  cpt: string;
  phone: string;
}

export interface BankingRow {
  name: string;
  routing: string;
  account: string;
  phone: string;
}

export type DatasetRow =
  | PiiSsnCcnRow
  | PiiSsnDobRow
  | PciCcnZipRow
  | PiiDobEmailRow
  | HipaaRow
  | BankingRow;

export type DatasetType =
  | "pii-ssn-ccn"
  | "pii-ssn-dob"
  | "pci-ccn-zip"
  | "pii-dob-email"
  | "hipaa"
  | "banking";

export interface GenerateOptions {
  dataset: DatasetType;
  count: number;
  seed: number;
}

export interface GenerateResult {
  rows: DatasetRow[];
  columns: string[];
  dataset: DatasetType;
  seed: number;
  count: number;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const BUILDERS: Record<DatasetType, (rng: ScopedRandom) => DatasetRow> = {
  "pii-ssn-ccn": buildPiiSsnCcnRow,
  "pii-ssn-dob": buildPiiSsnDobRow,
  "pci-ccn-zip": buildPciCcnZipRow,
  "pii-dob-email": buildPiiDobEmailRow,
  hipaa: buildHipaaRow,
  banking: buildBankingRow,
};

const COLUMNS: Record<DatasetType, string[]> = {
  "pii-ssn-ccn": ["Name", "SSN", "Credit Card Number"],
  "pii-ssn-dob": ["Name", "SSN", "Date of Birth"],
  "pci-ccn-zip": ["First Name", "Last Name", "ZIP", "Credit Card Number", "Expiration"],
  "pii-dob-email": ["First Name", "Last Name", "Date of Birth", "Email"],
  hipaa: ["First Name", "Last Name", "DOB", "MRN", "ICD-10", "CPT", "Phone"],
  banking: ["Name", "Routing Number", "Account Number", "Phone"],
};

export function generateDataset(options: GenerateOptions): GenerateResult {
  const { dataset, count, seed } = options;
  const rng = createScopedRandom(seed);
  const builder = BUILDERS[dataset];
  const rows = Array.from({ length: count }, () => builder(rng));
  return { rows, columns: COLUMNS[dataset], dataset, seed, count };
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowsToCsv(result: GenerateResult): string {
  const header = result.columns.join(",");
  const rowKeys = Object.keys(result.rows[0] ?? {});
  const body = result.rows
    .map((row) =>
      rowKeys.map((k) => csvEscape(String((row as unknown as Record<string, unknown>)[k] ?? ""))).join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}
