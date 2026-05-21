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

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

const CA_PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
] as const;

const EU_COUNTRIES = [
  { code: "DE", name: "Germany",     vatPrefix: "DE", vatDigits: 9  },
  { code: "FR", name: "France",      vatPrefix: "FR", vatDigits: 11 },
  { code: "IT", name: "Italy",       vatPrefix: "IT", vatDigits: 11 },
  { code: "ES", name: "Spain",       vatPrefix: "ES", vatDigits: 9  },
  { code: "NL", name: "Netherlands", vatPrefix: "NL", vatDigits: 9  },
  { code: "BE", name: "Belgium",     vatPrefix: "BE", vatDigits: 10 },
  { code: "PL", name: "Poland",      vatPrefix: "PL", vatDigits: 10 },
  { code: "SE", name: "Sweden",      vatPrefix: "SE", vatDigits: 12 },
  { code: "AT", name: "Austria",     vatPrefix: "AT", vatDigits: 9  },
  { code: "PT", name: "Portugal",    vatPrefix: "PT", vatDigits: 9  },
] as const;

const PASSPORT_COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "Brazil", "India", "Mexico",
] as const;

const MEDICAL_SPECIALTIES = [
  "Internal Medicine", "Cardiology", "Dermatology", "Emergency Medicine",
  "Family Medicine", "Gastroenterology", "General Surgery", "Neurology",
  "Obstetrics and Gynecology", "Oncology", "Ophthalmology", "Orthopedic Surgery",
  "Pediatrics", "Psychiatry", "Pulmonology", "Radiology", "Urology",
] as const;

// Valid UK NIN first-letter prefixes (D, F, I, Q, U, V not allowed for first; also certain combos excluded)
const UK_NIN_FIRST_LETTERS = [
  "A", "B", "C", "E", "G", "H", "J", "K", "L", "M",
  "N", "O", "P", "R", "S", "T", "W", "X", "Y", "Z",
] as const;
// Second letter: C, I, K, M, O, V not allowed
const UK_NIN_SECOND_LETTERS = [
  "A", "B", "D", "E", "F", "G", "H", "J", "L", "N",
  "P", "Q", "R", "S", "T", "U", "W", "X", "Y", "Z",
] as const;

const DEA_FIRST_LETTERS = ["B", "D", "F", "M", "P", "R"] as const;

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

function generateSSN(rng: ScopedRandom, delim = "-"): string {
  let area: number;
  do {
    area = rng.int(1, 899);
  } while (area === 666);
  const group = rng.int(1, 99);
  const serial = rng.int(1, 9999);
  return `${area.toString().padStart(3, "0")}${delim}${group.toString().padStart(2, "0")}${delim}${serial.toString().padStart(4, "0")}`;
}

function luhnCheckDigit(digits: number[]): number {
  let sum = 0;
  let doubleNext = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (doubleNext) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleNext = !doubleNext;
  }
  return (10 - (sum % 10)) % 10;
}

function generateCreditCard(rng: ScopedRandom, delim = "-"): string {
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
    return `${digits.slice(0, 4).join("")}${delim}${digits.slice(4, 10).join("")}${delim}${digits.slice(10).join("")}`;
  }
  return `${digits.slice(0, 4).join("")}${delim}${digits.slice(4, 8).join("")}${delim}${digits.slice(8, 12).join("")}${delim}${digits.slice(12).join("")}`;
}

function generateDOB(rng: ScopedRandom, delim = "/"): string {
  const year = rng.int(new Date().getFullYear() - 80, new Date().getFullYear() - 21);
  const month = rng.int(1, 12);
  const maxDay = new Date(year, month, 0).getDate();
  const day = rng.int(1, maxDay);
  return `${month}${delim}${day}${delim}${year}`;
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

function generatePhone(rng: ScopedRandom, delim?: string): string {
  const area = rng.int(200, 999);
  const exchange = rng.int(200, 999);
  const line = rng.int(1000, 9999);
  if (delim !== undefined) {
    return `${area}${delim}${exchange}${delim}${line}`;
  }
  return `(${area}) ${exchange}-${line}`;
}

function generateZip(rng: ScopedRandom): string {
  return rng.pick(ZIP_CODES);
}

function generateCardExpiry(rng: ScopedRandom, delim = "/"): string {
  const year = new Date().getFullYear() + rng.int(1, 4);
  const month = rng.int(1, 12);
  return `${month}${delim}${year}`;
}

function generateMRN(rng: ScopedRandom, delim = "-"): string {
  const num = Array.from({ length: 8 }, () => rng.int(0, 9)).join("");
  return `MRN${delim}${num}`;
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

function generateUKNIN(rng: ScopedRandom, delim = " "): string {
  const l1 = rng.pick(UK_NIN_FIRST_LETTERS);
  const l2 = rng.pick(UK_NIN_SECOND_LETTERS);
  const d1 = rng.int(10, 99).toString().padStart(2, "0");
  const d2 = rng.int(10, 99).toString().padStart(2, "0");
  const d3 = rng.int(10, 99).toString().padStart(2, "0");
  const suffix = rng.pick(["A", "B", "C", "D"] as const);
  return `${l1}${l2}${delim}${d1}${delim}${d2}${delim}${d3}${delim}${suffix}`;
}

function generateNHSNumber(rng: ScopedRandom, delim = " "): string {
  // Generate 9 digits then compute modulus-11 check digit
  let digits: number[];
  let check: number;
  do {
    digits = Array.from({ length: 9 }, () => rng.int(0, 9));
    const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
    check = 11 - (sum % 11);
  } while (check === 11 || check === 10); // 10 = invalid, 11 = use 0
  const all = [...digits, check === 11 ? 0 : check];
  return `${all.slice(0, 3).join("")}${delim}${all.slice(3, 6).join("")}${delim}${all.slice(6).join("")}`;
}

function generateCanadianSIN(rng: ScopedRandom, delim = "-"): string {
  // First digit 1-8; 9-prefix reserved for temporary residents
  let digits: number[];
  let check: number;
  do {
    digits = [rng.int(1, 8), ...Array.from({ length: 7 }, () => rng.int(0, 9))];
    check = luhnCheckDigit(digits);
  } while (check < 0);
  const all = [...digits, check];
  return `${all.slice(0, 3).join("")}${delim}${all.slice(3, 6).join("")}${delim}${all.slice(6).join("")}`;
}

function generatePassportNumber(rng: ScopedRandom): string {
  const letter = String.fromCharCode(65 + rng.int(0, 25));
  const digits = Array.from({ length: 8 }, () => rng.int(0, 9)).join("");
  return `${letter}${digits}`;
}

function generateEUVATNumber(rng: ScopedRandom, country: typeof EU_COUNTRIES[number]): string {
  const digits = Array.from({ length: country.vatDigits }, () => rng.int(0, 9)).join("");
  return `${country.vatPrefix}${digits}`;
}

function generateIBAN(rng: ScopedRandom, countryCode: string): string {
  const check = rng.int(10, 99).toString();
  const formatMap: Record<string, number> = {
    DE: 18, FR: 23, IT: 23, ES: 20, NL: 14,
    BE: 12, PL: 24, SE: 20, AT: 16, PT: 21,
  };
  const len = formatMap[countryCode] ?? 18;
  const body = Array.from({ length: len }, () => rng.int(0, 9)).join("");
  return `${countryCode}${check}${body}`;
}

function generateNPI(rng: ScopedRandom): string {
  // NPI Luhn: prepend 80840 to 9 payload digits, compute check
  const payload = Array.from({ length: 9 }, () => rng.int(0, 9));
  const prefix = [8, 0, 8, 4, 0];
  const check = luhnCheckDigit([...prefix, ...payload]);
  return `${payload.join("")}${check}`;
}

function generateDEANumber(rng: ScopedRandom, lastName: string): string {
  const first = rng.pick(DEA_FIRST_LETTERS);
  const second = (lastName[0] ?? String.fromCharCode(65 + rng.int(0, 25))).toUpperCase();
  const digits = Array.from({ length: 6 }, () => rng.int(0, 9));
  // DEA checksum: (d1+d3+d5) + 2*(d2+d4+d6), last digit = ones place
  const sum1 = digits[0] + digits[2] + digits[4];
  const sum2 = 2 * (digits[1] + digits[3] + digits[5]);
  const check = (sum1 + sum2) % 10;
  return `${first}${second}${digits.join("")}${check}`;
}

function generateDriversLicense(rng: ScopedRandom, state: string): string {
  const letter = () => String.fromCharCode(65 + rng.int(0, 25));
  const digits = (n: number) => Array.from({ length: n }, () => rng.int(0, 9)).join("");
  switch (state) {
    case "CA": return `${letter()}${digits(7)}`;
    case "TX": return digits(8);
    case "NY": return `${letter()}${digits(7)}`;
    case "FL": return `${letter()}${digits(12)}`;
    case "IL": return `${letter()}${digits(11)}`;
    case "PA": return `${digits(2)} ${digits(3)} ${digits(3)}`;
    default:   return `${letter()}${digits(7)}`;
  }
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

function buildUkIdentityRow(rng: ScopedRandom): UkIdentityRow {
  const { first, last } = generateName(rng);
  return {
    first,
    last,
    nin: generateUKNIN(rng),
    nhs: generateNHSNumber(rng),
    dob: generateDOB(rng),
  };
}

function buildCanadaSinRow(rng: ScopedRandom): CanadaSinRow {
  const { first, last } = generateName(rng);
  return {
    first,
    last,
    sin: generateCanadianSIN(rng),
    province: rng.pick(CA_PROVINCES),
    dob: generateDOB(rng),
  };
}

function buildPassportRow(rng: ScopedRandom): PassportRow {
  const { first, last } = generateName(rng);
  return {
    first,
    last,
    passport: generatePassportNumber(rng),
    country: rng.pick(PASSPORT_COUNTRIES),
    dob: generateDOB(rng),
    expiry: generateCardExpiry(rng),
  };
}

function buildEuVatRow(rng: ScopedRandom): EuVatRow {
  const { full } = generateName(rng);
  const country = rng.pick(EU_COUNTRIES);
  return {
    name: full,
    vat: generateEUVATNumber(rng, country),
    iban: generateIBAN(rng, country.code),
    country: country.name,
  };
}

function buildNpiProviderRow(rng: ScopedRandom): NpiProviderRow {
  const { first, last } = generateName(rng);
  return {
    first,
    last,
    npi: generateNPI(rng),
    dea: generateDEANumber(rng, last),
    specialty: rng.pick(MEDICAL_SPECIALTIES),
  };
}

function buildDriverLicenseRow(rng: ScopedRandom): DriverLicenseRow {
  const { first, last } = generateName(rng);
  const state = rng.pick(US_STATES);
  return {
    first,
    last,
    dl: generateDriversLicense(rng, state),
    state,
    dob: generateDOB(rng),
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

export interface UkIdentityRow {
  first: string;
  last: string;
  nin: string;
  nhs: string;
  dob: string;
}

export interface CanadaSinRow {
  first: string;
  last: string;
  sin: string;
  province: string;
  dob: string;
}

export interface PassportRow {
  first: string;
  last: string;
  passport: string;
  country: string;
  dob: string;
  expiry: string;
}

export interface EuVatRow {
  name: string;
  vat: string;
  iban: string;
  country: string;
}

export interface NpiProviderRow {
  first: string;
  last: string;
  npi: string;
  dea: string;
  specialty: string;
}

export interface DriverLicenseRow {
  first: string;
  last: string;
  dl: string;
  state: string;
  dob: string;
}

export type DatasetRow =
  | PiiSsnCcnRow
  | PiiSsnDobRow
  | PciCcnZipRow
  | PiiDobEmailRow
  | HipaaRow
  | BankingRow
  | UkIdentityRow
  | CanadaSinRow
  | PassportRow
  | EuVatRow
  | NpiProviderRow
  | DriverLicenseRow;

export type DatasetType =
  | "pii-ssn-ccn"
  | "pii-ssn-dob"
  | "pci-ccn-zip"
  | "pii-dob-email"
  | "hipaa"
  | "banking"
  | "uk-identity"
  | "canada-sin"
  | "passport"
  | "eu-vat"
  | "npi-provider"
  | "driver-license"
  | "custom";

export type PresetDatasetType = Exclude<DatasetType, "custom">;

export interface GenerateOptions {
  dataset: PresetDatasetType;
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

const BUILDERS: Record<PresetDatasetType, (rng: ScopedRandom) => DatasetRow> = {
  "pii-ssn-ccn": buildPiiSsnCcnRow,
  "pii-ssn-dob": buildPiiSsnDobRow,
  "pci-ccn-zip": buildPciCcnZipRow,
  "pii-dob-email": buildPiiDobEmailRow,
  hipaa: buildHipaaRow,
  banking: buildBankingRow,
  "uk-identity": buildUkIdentityRow,
  "canada-sin": buildCanadaSinRow,
  passport: buildPassportRow,
  "eu-vat": buildEuVatRow,
  "npi-provider": buildNpiProviderRow,
  "driver-license": buildDriverLicenseRow,
};

const COLUMNS: Record<PresetDatasetType, string[]> = {
  "pii-ssn-ccn": ["Name", "SSN", "Credit Card Number"],
  "pii-ssn-dob": ["Name", "SSN", "Date of Birth"],
  "pci-ccn-zip": ["First Name", "Last Name", "ZIP", "Credit Card Number", "Expiration"],
  "pii-dob-email": ["First Name", "Last Name", "Date of Birth", "Email"],
  hipaa: ["First Name", "Last Name", "DOB", "MRN", "ICD-10", "CPT", "Phone"],
  banking: ["Name", "Routing Number", "Account Number", "Phone"],
  "uk-identity": ["First Name", "Last Name", "NI Number", "NHS Number", "Date of Birth"],
  "canada-sin": ["First Name", "Last Name", "SIN", "Province", "Date of Birth"],
  passport: ["First Name", "Last Name", "Passport Number", "Country", "Date of Birth", "Expiry"],
  "eu-vat": ["Name", "EU VAT Number", "IBAN", "Country"],
  "npi-provider": ["First Name", "Last Name", "NPI", "DEA Number", "Specialty"],
  "driver-license": ["First Name", "Last Name", "DL Number", "State", "Date of Birth"],
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

// ─── Standalone field generators ─────────────────────────────────────────────

function generateEmailStandalone(rng: ScopedRandom): string {
  const first = rng.pick(FIRST_NAMES);
  const last = rng.pick(LAST_NAMES);
  return generateEmail(rng, first, last);
}

function generateGender(rng: ScopedRandom): string {
  return rng.pick(["Male", "Female", "Non-binary"] as const);
}

function generateIPv4(rng: ScopedRandom): string {
  return `${rng.int(1, 254)}.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`;
}

function generateDEANumberStandalone(rng: ScopedRandom): string {
  const first = rng.pick(DEA_FIRST_LETTERS);
  const second = String.fromCharCode(65 + rng.int(0, 25));
  const digits = Array.from({ length: 6 }, () => rng.int(0, 9));
  const sum1 = digits[0] + digits[2] + digits[4];
  const sum2 = 2 * (digits[1] + digits[3] + digits[5]);
  const check = (sum1 + sum2) % 10;
  return `${first}${second}${digits.join("")}${check}`;
}

function generateDriversLicenseStandalone(rng: ScopedRandom): string {
  const state = rng.pick(US_STATES);
  return generateDriversLicense(rng, state);
}

function generateEUVATStandalone(rng: ScopedRandom): string {
  const country = rng.pick(EU_COUNTRIES);
  return generateEUVATNumber(rng, country);
}

function generateIBANStandalone(rng: ScopedRandom): string {
  const country = rng.pick(EU_COUNTRIES);
  return generateIBAN(rng, country.code);
}

// ─── Custom field types ───────────────────────────────────────────────────────

export type FieldTypeKey =
  | "row-number" | "first-name" | "last-name" | "full-name" | "gender" | "email" | "ip-v4"
  | "ssn" | "credit-card" | "dob" | "phone" | "zip" | "card-expiry"
  | "mrn" | "icd10" | "cpt" | "routing-number" | "account-number" | "npi" | "dea-number"
  | "specialty" | "us-state" | "dl-number"
  | "uk-nin" | "nhs-number" | "canada-sin" | "canada-province" | "passport-number"
  | "country" | "eu-vat" | "iban";

interface FieldTypeDef {
  label: string;
  group: string;
  generate: (rng: ScopedRandom, rowIndex: number) => string;
}

export const FIELD_TYPE_DEFS: Record<FieldTypeKey, FieldTypeDef> = {
  "row-number":      { label: "Row Number",              group: "Basic",          generate: (_, i) => String(i + 1) },
  "first-name":      { label: "First Name",              group: "Basic",          generate: (rng)  => rng.pick(FIRST_NAMES) },
  "last-name":       { label: "Last Name",               group: "Basic",          generate: (rng)  => rng.pick(LAST_NAMES) },
  "full-name":       { label: "Full Name",               group: "Basic",          generate: (rng)  => generateName(rng).full },
  "gender":          { label: "Gender",                  group: "Basic",          generate: (rng)  => generateGender(rng) },
  "email":           { label: "Email Address",           group: "Basic",          generate: (rng)  => generateEmailStandalone(rng) },
  "ip-v4":           { label: "IP Address v4",           group: "Basic",          generate: (rng)  => generateIPv4(rng) },
  "ssn":             { label: "SSN",                     group: "US PII / PCI",   generate: (rng)  => generateSSN(rng) },
  "credit-card":     { label: "Credit Card Number",      group: "US PII / PCI",   generate: (rng)  => generateCreditCard(rng) },
  "dob":             { label: "Date of Birth",           group: "US PII / PCI",   generate: (rng)  => generateDOB(rng) },
  "phone":           { label: "Phone Number",            group: "US PII / PCI",   generate: (rng)  => generatePhone(rng) },
  "zip":             { label: "ZIP Code",                group: "US PII / PCI",   generate: (rng)  => generateZip(rng) },
  "card-expiry":     { label: "Card Expiry",             group: "US PII / PCI",   generate: (rng)  => generateCardExpiry(rng) },
  "mrn":             { label: "Medical Record Number",   group: "US Specialized", generate: (rng)  => generateMRN(rng) },
  "icd10":           { label: "ICD-10 Code",             group: "US Specialized", generate: (rng)  => generateICD10(rng) },
  "cpt":             { label: "CPT Code",                group: "US Specialized", generate: (rng)  => generateCPT(rng) },
  "routing-number":  { label: "Routing Number",          group: "US Specialized", generate: (rng)  => generateRoutingNumber(rng) },
  "account-number":  { label: "Bank Account Number",     group: "US Specialized", generate: (rng)  => generateAccountNumber(rng) },
  "npi":             { label: "NPI",                     group: "US Specialized", generate: (rng)  => generateNPI(rng) },
  "dea-number":      { label: "DEA Number",              group: "US Specialized", generate: (rng)  => generateDEANumberStandalone(rng) },
  "specialty":       { label: "Medical Specialty",       group: "US Specialized", generate: (rng)  => rng.pick(MEDICAL_SPECIALTIES) },
  "us-state":        { label: "US State",                group: "US Specialized", generate: (rng)  => rng.pick(US_STATES) },
  "dl-number":       { label: "Driver's License Number", group: "US Specialized", generate: (rng)  => generateDriversLicenseStandalone(rng) },
  "uk-nin":          { label: "UK NI Number",            group: "International",  generate: (rng)  => generateUKNIN(rng) },
  "nhs-number":      { label: "NHS Number",              group: "International",  generate: (rng)  => generateNHSNumber(rng) },
  "canada-sin":      { label: "Canadian SIN",            group: "International",  generate: (rng)  => generateCanadianSIN(rng) },
  "canada-province": { label: "Canadian Province",       group: "International",  generate: (rng)  => rng.pick(CA_PROVINCES) },
  "passport-number": { label: "Passport Number",         group: "International",  generate: (rng)  => generatePassportNumber(rng) },
  "country":         { label: "Country",                 group: "International",  generate: (rng)  => rng.pick(PASSPORT_COUNTRIES) },
  "eu-vat":          { label: "EU VAT Number",           group: "International",  generate: (rng)  => generateEUVATStandalone(rng) },
  "iban":            { label: "IBAN",                    group: "International",  generate: (rng)  => generateIBANStandalone(rng) },
};

export interface CustomField {
  name: string;
  type: FieldTypeKey;
  blankPct: number;
  delimiter?: string;
}

// Maps field types that support custom delimiters to their default delimiter character.
// "" means the default format uses no single delimiter (e.g. phone uses parens).
export const DELIMITER_DEFAULTS: Partial<Record<FieldTypeKey, string>> = {
  "ssn":          "-",
  "credit-card":  "-",
  "dob":          "/",
  "phone":        "",
  "card-expiry":  "/",
  "mrn":          "-",
  "uk-nin":       " ",
  "nhs-number":   " ",
  "canada-sin":   "-",
};

type DelimGen = (rng: ScopedRandom, rowIndex: number, delimiter: string) => string;

const DELIMITER_GENERATORS: Partial<Record<FieldTypeKey, DelimGen>> = {
  "ssn":         (rng, _, d) => generateSSN(rng, d),
  "credit-card": (rng, _, d) => generateCreditCard(rng, d),
  "dob":         (rng, _, d) => generateDOB(rng, d),
  "phone":       (rng, _, d) => generatePhone(rng, d),
  "card-expiry": (rng, _, d) => generateCardExpiry(rng, d),
  "mrn":         (rng, _, d) => generateMRN(rng, d),
  "uk-nin":      (rng, _, d) => generateUKNIN(rng, d),
  "nhs-number":  (rng, _, d) => generateNHSNumber(rng, d),
  "canada-sin":  (rng, _, d) => generateCanadianSIN(rng, d),
};

export function generateCustom(
  fields: CustomField[],
  count: number,
  seed: number
): GenerateResult {
  const rng = createScopedRandom(seed);
  const rows = Array.from({ length: count }, (_, rowIndex) => {
    const row: Record<string, string> = {};
    for (const field of fields) {
      if (field.blankPct > 0 && rng.float() * 100 < field.blankPct) {
        row[field.name] = "";
      } else {
        const delimGen = DELIMITER_GENERATORS[field.type];
        if (typeof field.delimiter === "string" && delimGen) {
          row[field.name] = delimGen(rng, rowIndex, field.delimiter);
        } else {
          row[field.name] = FIELD_TYPE_DEFS[field.type].generate(rng, rowIndex);
        }
      }
    }
    return row;
  });
  return {
    rows: rows as unknown as DatasetRow[],
    columns: fields.map((f) => f.name),
    dataset: "custom",
    seed,
    count,
  };
}
