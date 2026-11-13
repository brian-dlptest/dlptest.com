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

// HMRC NI number prefix rules: D, F, I, Q, U and V are never the first letter; D, F, I,
// O, Q, U and V are never the second; and BG, GB, KN, NK, NT, TN and ZZ are never issued.
const UK_NIN_FIRST_LETTERS = [
  "A", "B", "C", "E", "G", "H", "J", "K", "L", "M",
  "N", "O", "P", "R", "S", "T", "W", "X", "Y", "Z",
] as const;
const UK_NIN_SECOND_LETTERS = [
  "A", "B", "C", "E", "G", "H", "J", "K", "L", "M",
  "N", "P", "R", "S", "T", "W", "X", "Y", "Z",
] as const;
const UK_NIN_BANNED_PREFIXES = new Set(["BG", "GB", "KN", "NK", "NT", "TN", "ZZ"]);

// Registrant-type letters Purview's DEA number definition accepts (A, B, F, G, M, P, R).
// "A" replaced "D", which Purview rejects; same length, so seeded picks don't shift.
const DEA_FIRST_LETTERS = ["B", "A", "F", "M", "P", "R"] as const;

const BANK_NAMES = [
  "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citibank",
  "U.S. Bank", "PNC Bank", "Goldman Sachs", "TD Bank", "Capital One",
  "Truist Bank", "Citizens Bank", "Fifth Third Bank", "KeyBank",
  "Regions Bank", "Huntington National Bank", "BMO Harris Bank",
  "M&T Bank", "Ally Bank", "Santander Bank", "First National Bank",
] as const;

const CARD_TYPES = ["Visa", "Mastercard", "American Express", "Discover"] as const;
export type CardTypeName = typeof CARD_TYPES[number];

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

function generateCreditCard(rng: ScopedRandom, cardType?: CardTypeName, delim = "-"): string {
  return formatCard(cardDigits(rng, cardType ?? rng.pick(CARD_TYPES)), delim);
}

/** Amex-length (15) numbers group 4-6-5; everything else groups in fours. */
function formatCard(digits: number[], delim: string): string {
  const s = digits.join("");
  if (digits.length === 15 && s[0] === "3") {
    return `${s.slice(0, 4)}${delim}${s.slice(4, 10)}${delim}${s.slice(10)}`;
  }
  return (s.match(/.{1,4}/g) ?? [s]).join(delim);
}

function cardDigits(rng: ScopedRandom, resolved: CardTypeName): number[] {
  let prefix: number[];
  let length: number;

  if (resolved === "Visa") {
    prefix = [4];
    length = 16;
  } else if (resolved === "Mastercard") {
    prefix = [5, rng.int(1, 5)];
    length = 16;
  } else if (resolved === "American Express") {
    prefix = [3, rng.pick([4, 7] as const)];
    length = 15;
  } else {
    // Discover
    prefix = [6, 0, 1, 1];
    length = 16;
  }

  return withLuhn(rng, prefix, length);
}

/** prefix + random digits up to `length - 1`, then the Luhn check digit. */
function withLuhn(rng: ScopedRandom, prefix: number[], length: number): number[] {
  const digits: number[] = [...prefix];
  while (digits.length < length - 1) {
    digits.push(rng.int(0, 9));
  }
  digits.push(luhnCheckDigit(digits));
  return digits;
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

// Area codes in service in the US. A draw from 200–999 used to land on unassigned codes and
// on N11 (911…), N9X (expansion) and 37X/96X (reserved) codes about 13.5% of the time, and
// phone-number libraries such as libphonenumber reject those.
const US_AREA_CODES = [
  201, 202, 203, 205, 206, 207, 208, 209, 210, 212, 213, 214, 215, 216, 217, 218, 219, 224,
  225, 228, 229, 231, 234, 239, 240, 248, 251, 252, 253, 254, 256, 260, 262, 267, 269, 270,
  276, 281, 301, 302, 303, 304, 305, 307, 308, 309, 310, 312, 313, 314, 315, 316, 317, 318,
  319, 320, 321, 323, 325, 330, 334, 336, 337, 339, 347, 351, 352, 360, 361, 385, 386, 401,
  402, 404, 405, 406, 407, 408, 409, 410, 412, 413, 414, 415, 417, 419, 423, 424, 425, 432,
  434, 435, 440, 443, 469, 478, 479, 480, 484, 501, 502, 503, 504, 505, 507, 508, 509, 510,
  512, 513, 515, 516, 517, 518, 520, 530, 540, 541, 551, 559, 561, 562, 563, 567, 570, 571,
  573, 574, 575, 580, 585, 586, 601, 602, 603, 605, 606, 607, 608, 609, 610, 612, 614, 615,
  616, 617, 618, 619, 620, 623, 626, 630, 631, 636, 641, 646, 650, 651, 660, 661, 662, 678,
  682, 701, 702, 703, 704, 706, 707, 708, 712, 713, 714, 715, 716, 717, 718, 719, 720, 724,
  727, 731, 732, 734, 740, 754, 757, 760, 763, 765, 770, 772, 773, 774, 775, 781, 785, 786,
  801, 802, 803, 804, 805, 806, 808, 810, 812, 813, 814, 815, 816, 817, 818, 828, 830, 831,
  832, 843, 845, 847, 848, 850, 856, 857, 858, 859, 860, 862, 863, 864, 865, 870, 901, 903,
  904, 906, 907, 908, 909, 910, 912, 913, 914, 915, 916, 917, 918, 919, 920, 925, 928, 931,
  936, 937, 940, 941, 947, 949, 951, 952, 954, 956, 970, 971, 972, 973, 978, 979, 980, 985,
  989,
] as const;

function generatePhone(rng: ScopedRandom, delim?: string): string {
  // Same draws as before (200–999 each), mapped onto valid values so a seeded dataset's
  // other columns don't change.
  const area = US_AREA_CODES[(rng.int(200, 999) - 200) % US_AREA_CODES.length];
  let exchange = rng.int(200, 999);
  if (exchange % 100 === 11) exchange += 1; // N11 (211, 411, 911…) are service codes, not exchanges
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
  // Routing numbers start 00–12, 21–32, 61–72 or 80. The draws above give 00–19, so
  // move 13–19 to 21–27 rather than drawing again (keeps a seeded dataset's other columns).
  const prefix = d[0] * 10 + d[1];
  if (prefix > 12) {
    const moved = 21 + (prefix - 13);
    d[0] = Math.floor(moved / 10);
    d[1] = moved % 10;
  }
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
  let l2: string = rng.pick(UK_NIN_SECOND_LETTERS);
  if (UK_NIN_BANNED_PREFIXES.has(l1 + l2)) {
    // Step to the next second letter rather than drawing again, so the random stream (and
    // every other column of a seeded dataset) is unchanged. No banned pair maps to another.
    const i = UK_NIN_SECOND_LETTERS.indexOf(l2 as (typeof UK_NIN_SECOND_LETTERS)[number]);
    l2 = UK_NIN_SECOND_LETTERS[(i + 1) % UK_NIN_SECOND_LETTERS.length];
  }
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

// SIN first digits 1–7 are the regional series. 9 is temporary residents, and 8 is used
// for business numbers (Wikipedia's table, uncited), so 8 folds onto 4 (Ontario) to keep
// the draw, and a seeded dataset's other columns, unchanged.
function sinFirstDigit(rng: ScopedRandom): number {
  const first = rng.int(1, 8);
  return first === 8 ? 4 : first;
}

function generateCanadianSIN(rng: ScopedRandom, delim = "-"): string {
  const digits = [sinFirstDigit(rng), ...Array.from({ length: 7 }, () => rng.int(0, 9))];
  const all = [...digits, luhnCheckDigit(digits)];
  return `${all.slice(0, 3).join("")}${delim}${all.slice(3, 6).join("")}${delim}${all.slice(6).join("")}`;
}

function generatePassportNumber(rng: ScopedRandom): string {
  const letter = String.fromCharCode(65 + rng.int(0, 25));
  const digits = Array.from({ length: 8 }, () => rng.int(0, 9)).join("");
  return `${letter}${digits}`;
}

// EU VAT numbers carry per-country check characters. Purview documents checksums for
// its DE and FR VAT types; the rules here follow python-stdnum. Each country still draws
// `vatDigits` digits as it did before the rules existed, so a seeded dataset's other
// columns don't change: the draws fill the body and the check characters are computed.
type EuCountryCode = typeof EU_COUNTRIES[number]["code"];

interface VatRule {
  /** The part after the "DE"/"FR"/… prefix, built from `vatDigits` drawn digits. */
  build: (d: number[]) => string;
  /** [start, end) of the check characters within the built part. */
  check: [number, number];
}

/** Luhn sum of digits that already end in their check digit (0 means valid). */
function luhnSum(d: number[]): number {
  let sum = 0;
  for (let i = d.length - 1, k = 0; i >= 0; i--, k++) {
    let x = d[i];
    if (k % 2 === 1) {
      x *= 2;
      if (x > 9) x -= 9;
    }
    sum += x;
  }
  return sum % 10;
}

/**
 * ISO 7064 Mod 11,10 check digit (German VAT). Validation runs c = ((c || 10) × 2 mod 11
 * + digit) mod 10 from c = 5 over all 9 digits and needs c = 1 at the end, so the check
 * digit is 1 − ((c || 10) × 2 mod 11), mod 10.
 */
function mod1110CheckDigit(d: number[]): number {
  let c = 5;
  for (const x of d) c = (((c || 10) * 2) % 11 + x) % 10;
  return (((1 - ((c || 10) * 2) % 11) % 10) + 10) % 10;
}

const weightedSum = (d: number[], weights: number[]) => d.reduce((acc, x, i) => acc + x * weights[i], 0);

/**
 * Nudge one digit until `compute` gives a usable check digit. Deterministic (no draws),
 * for the mod-11 rules where a remainder of 10 has no check digit.
 */
function withCheck(d: number[], at: number, compute: (d: number[]) => number | null): number[] {
  for (let n = 0; n < 10; n++) {
    const c = compute(d);
    if (c !== null) return [...d, c];
    d[at] = (d[at] + 1) % 10;
  }
  throw new Error("no valid check digit");
}

const VAT_RULES: Record<EuCountryCode, VatRule> = {
  // 9 digits, first not 0, ISO 7064 Mod 11,10.
  DE: {
    build: (d) => {
      const body = [1 + (d[0] % 9), ...d.slice(1, 8)];
      return [...body, mod1110CheckDigit(body)].join("");
    },
    check: [8, 9],
  },
  // 2-digit key + 9-digit SIREN (itself Luhn). Key = (12 + 3 × (SIREN mod 97)) mod 97.
  FR: {
    build: (d) => {
      const sirenBody = d.slice(2, 10);
      const siren = [...sirenBody, luhnCheckDigit(sirenBody)].join("");
      return pad((12 + 3 * (Number(siren) % 97)) % 97, 2) + siren;
    },
    check: [0, 2],
  },
  // 7-digit company number + office code (001–100) + Luhn over all 11 digits.
  IT: {
    build: (d) => {
      const company = d.slice(0, 7);
      if (!company.some((x) => x !== 0)) company[0] = 1;
      const office = digitsOf(((d[7] * 100 + d[8] * 10 + d[9]) % 100) + 1, 3);
      const body = [...company, ...office];
      return [...body, luhnCheckDigit(body)].join("");
    },
    check: [10, 11],
  },
  // An individual's NIF: 8 digits + the DNI letter, TRWAGMYFPDXBNJZSQVHLCKE[number mod 23].
  ES: {
    build: (d) => {
      const num = d.slice(0, 8).join("");
      return num + DNI_LETTERS[Number(num) % 23];
    },
    check: [8, 9],
  },
  // 9 digits passing the 11-proef, then B01 (the B + 2 digits every NL VAT number ends in).
  NL: {
    build: (d) => {
      const nine = withCheck(d.slice(0, 8), 7, (b) => {
        const c = weightedSum(b, [9, 8, 7, 6, 5, 4, 3, 2]) % 11;
        return c === 10 ? null : c;
      });
      return nine.join("") + "B01";
    },
    check: [8, 9],
  },
  // 10 digits starting 0 or 1; the last 2 are 97 − (first 8 mod 97).
  BE: {
    build: (d) => {
      const body = [d[0] % 2, ...d.slice(1, 8)];
      return body.join("") + pad(97 - (Number(body.join("")) % 97), 2);
    },
    check: [8, 10],
  },
  // 10 digits; weights 6,5,7,2,3,4,5,6,7; check = sum mod 11 (10 isn't allowed).
  PL: {
    build: (d) => withCheck(d.slice(0, 9), 8, (b) => {
      const c = weightedSum(b, [6, 5, 7, 2, 3, 4, 5, 6, 7]) % 11;
      return c === 10 ? null : c;
    }).join(""),
    check: [9, 10],
  },
  // 10-digit organisation number (Luhn) + 01.
  SE: {
    build: (d) => {
      const body = d.slice(0, 9);
      return [...body, luhnCheckDigit(body)].join("") + "01";
    },
    check: [9, 10],
  },
  // U + 7 digits + check, where check = (6 − Luhn sum of the 7) mod 10.
  AT: {
    build: (d) => {
      const body = d.slice(1, 8);
      return "U" + body.join("") + (((6 - luhnSum(body)) % 10) + 10) % 10;
    },
    check: [8, 9],
  },
  // 9 digits; weights 9…2; check = 11 − (sum mod 11), and 10 or 11 become 0.
  PT: {
    build: (d) => {
      const body = [[1, 2, 3, 5, 6, 8, 9][d[0] % 7], ...d.slice(1, 8)];
      const c = 11 - (weightedSum(body, [9, 8, 7, 6, 5, 4, 3, 2]) % 11);
      return [...body, c >= 10 ? 0 : c].join("");
    },
    check: [8, 9],
  },
};

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

function vatDraws(rng: ScopedRandom, country: typeof EU_COUNTRIES[number]): number[] {
  return Array.from({ length: country.vatDigits }, () => rng.int(0, 9));
}

function generateEUVATNumber(rng: ScopedRandom, country: typeof EU_COUNTRIES[number]): string {
  return `${country.vatPrefix}${VAT_RULES[country.code].build(vatDraws(rng, country))}`;
}

// ISO 13616 check digits: move the country code and "00" to the end, read letters as
// 10..35, and take 98 minus the remainder mod 97.
function ibanCheckDigits(countryCode: string, bban: string): string {
  let rem = 0;
  for (const ch of bban + countryCode + "00") {
    const value = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of value) rem = (rem * 10 + Number(d)) % 97;
  }
  return String(98 - rem).padStart(2, "0");
}

function generateIBAN(rng: ScopedRandom, countryCode: string): string {
  // The check digits used to be drawn at random, so almost no IBAN passed mod-97. The
  // draw is kept so every other column of a seeded dataset is unchanged by the fix.
  rng.int(10, 99);
  const body = ibanBban(rng, countryCode, IBAN_BBAN_LENGTHS[countryCode] ?? 18);
  return `${countryCode}${ibanCheckDigits(countryCode, body)}${body}`;
}

// Dutch account parts start with a 4-letter bank code; Italian ones with a CIN letter.
// Every country still draws `len` digits, so a seeded dataset's other columns don't change.
const NL_BANK_CODES = ["ABNA", "INGB", "RABO", "SNSB", "TRIO", "KNAB", "BUNQ", "ASNB", "RBRB", "FVLB"] as const;

function ibanBban(rng: ScopedRandom, countryCode: string, len: number): string {
  const d = Array.from({ length: len }, () => rng.int(0, 9));
  if (countryCode === "NL") return NL_BANK_CODES[d[0]] + d.slice(4).join("");
  if (countryCode === "IT") {
    const rest = d.slice(1).join(""); // ABI (5) + CAB (5) + account (12)
    return italianCin(rest) + rest;
  }
  return d.join("");
}

// Italian CIN: characters in odd positions (1st, 3rd, …) map through this table, even
// ones count as their value (0–9, A=0…Z=25); the sum mod 26 is the letter.
const CIN_ODD = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
function italianCin(s: string): string {
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    const v = code <= 57 ? code - 48 : code - 65;
    sum += i % 2 === 0 ? CIN_ODD[v] : v;
  }
  return String.fromCharCode(65 + (sum % 26));
}

/** Length of the account part (BBAN) after the 2-letter country and 2 check digits. */
const IBAN_BBAN_LENGTHS: Record<string, number> = {
  DE: 18, FR: 23, IT: 23, ES: 20, NL: 14,
  BE: 12, PL: 24, SE: 20, AT: 16, PT: 21,
};

function generateNPI(rng: ScopedRandom): string {
  // NPI Luhn: prepend 80840 to 9 payload digits, compute check
  const payload = Array.from({ length: 9 }, () => rng.int(0, 9));
  // CMS only issues NPIs starting with 1 or 2. Fold the 0–9 draw onto those two.
  payload[0] = 1 + (payload[0] % 2);
  return `${payload.join("")}${npiCheckDigit(payload)}`;
}

const NPI_PREFIX = [8, 0, 8, 4, 0];
function npiCheckDigit(payload: number[]): number {
  return luhnCheckDigit([...NPI_PREFIX, ...payload]);
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
  /** Custom datasets with a Near-miss % set: the answer key, one entry per near-miss cell. */
  nearMisses?: NearMiss[];
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

// Characters that Excel / Google Sheets / LibreOffice Calc interpret as the
// start of a formula when they appear as the first character of a cell. A
// field name like `=cmd|'/c calc'!A1` would otherwise execute on open.
// OWASP CSV Injection Prevention Cheat Sheet:
// https://cheatsheetseries.owasp.org/cheatsheets/CSV_Injection_Prevention_Cheat_Sheet.html
const FORMULA_PREFIX_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Prefix a single quote onto any value whose first character would be
 * interpreted as a formula by a spreadsheet app. The single quote is the
 * standard literal-string escape and is hidden from the user when the sheet
 * is rendered. Applied to both header cells and body cells before they
 * reach the CSV / xlsx output.
 */
export function sanitizeForSpreadsheet(value: string): string {
  if (value.length > 0 && FORMULA_PREFIX_CHARS.has(value[0]!)) {
    return `'${value}`;
  }
  return value;
}

function csvEscape(value: string): string {
  const safe = sanitizeForSpreadsheet(value);
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function rowsToCsv(result: GenerateResult): string {
  // Escape headers as well as body cells — a field name like `a,b` or one
  // containing a newline would otherwise corrupt the CSV structure, and a
  // name starting with `=` would be a formula in Excel.
  const header = result.columns.map(csvEscape).join(",");
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

function generateCardType(rng: ScopedRandom): string {
  return rng.pick(CARD_TYPES);
}

function generateBankName(rng: ScopedRandom): string {
  return rng.pick(BANK_NAMES);
}

// ─── Network / Tech generators ───────────────────────────────────────────────

function generateIPv6(rng: ScopedRandom): string {
  return Array.from({ length: 8 }, () =>
    rng.int(0, 0xffff).toString(16).padStart(4, "0")
  ).join(":");
}

function generateMACAddress(rng: ScopedRandom, delim = ":"): string {
  const octets = Array.from({ length: 6 }, () =>
    rng.int(0, 255).toString(16).padStart(2, "0").toUpperCase()
  );
  if (delim === ".") {
    // Cisco style: AAAA.BBBB.CCCC
    return [
      octets.slice(0, 2).join(""),
      octets.slice(2, 4).join(""),
      octets.slice(4, 6).join(""),
    ].join(".");
  }
  return octets.join(delim);
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function generateBitcoinWallet(rng: ScopedRandom): string {
  const length = rng.int(24, 33);
  const body = Array.from({ length }, () => BASE58_ALPHABET[rng.int(0, 57)]).join("");
  return "1" + body;
}

// Access key IDs are base32 after the prefix (A–Z and 2–7), and gitleaks' rule rejects
// 0, 1, 8 and 9. Each character is still drawn from 36 values and folded onto the 32,
// so a seeded dataset's other columns don't change.
const AWS_KEY_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function awsKeyIdBody(rng: ScopedRandom): string {
  return Array.from({ length: 16 }, () => AWS_KEY_ID_CHARS[rng.int(0, 35) % 32]).join("");
}
function generateAWSAccessKey(rng: ScopedRandom): string {
  return "AKIA" + awsKeyIdBody(rng);
}

function generateAPIKey(rng: ScopedRandom): string {
  return Array.from({ length: 32 }, () => rng.int(0, 15).toString(16)).join("");
}

// ─── Credential / secret generators ──────────────────────────────────────────
// Each format matches its pattern in src/lib/regex/dlp-patterns.ts, so the
// site's own regex library flags every generated value. Charsets that allow
// "/", "+" or "-" still start and end on a letter or digit, so the patterns'
// \b anchors match when a value sits between commas or spaces.

const ALNUM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomChars(rng: ScopedRandom, chars: string, length: number): string {
  return Array.from({ length }, () => chars[rng.int(0, chars.length - 1)]).join("");
}

function randomToken(rng: ScopedRandom, chars: string, length: number): string {
  return randomChars(rng, ALNUM_CHARS, 1) + randomChars(rng, chars, length - 2) + randomChars(rng, ALNUM_CHARS, 1);
}

function generateAWSSecretKey(rng: ScopedRandom): string {
  return randomToken(rng, ALNUM_CHARS + "/+", 40);
}

// GitHub tokens end in a checksum: CRC32 of the 30 random characters, base62-encoded
// (0-9A-Za-z) into 6 characters. Checksum-aware scanners treat a token without it as
// fake. The alphabet order was checked against a real gho_ token.
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
let crc32Table: Uint32Array | undefined;
function crc32(text: string): number {
  if (!crc32Table) {
    crc32Table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crc32Table[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < text.length; i++) c = crc32Table[(c ^ text.charCodeAt(i)) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function githubChecksum(body: string): string {
  let n = crc32(body);
  let out = "";
  while (n > 0) {
    out = BASE62[n % 62] + out;
    n = Math.floor(n / 62);
  }
  return out.padStart(6, "0");
}
function generateGitHubToken(rng: ScopedRandom): string {
  // All 36 characters are still drawn, so a seeded dataset's other columns don't change.
  const body = randomChars(rng, ALNUM_CHARS, 36).slice(0, 30);
  return "ghp_" + body + githubChecksum(body);
}

function generateSlackBotToken(rng: ScopedRandom): string {
  return `xoxb-${randomChars(rng, "0123456789", 12)}-${randomChars(rng, "0123456789", 13)}-${randomChars(rng, ALNUM_CHARS, 24)}`;
}

function generateStripeSecretKey(rng: ScopedRandom): string {
  return "sk_live_" + randomChars(rng, ALNUM_CHARS, 24);
}

function generateGoogleAPIKey(rng: ScopedRandom): string {
  return "AIza" + randomToken(rng, ALNUM_CHARS + "_-", 35);
}

// OpenAI keys carry a fixed marker, base64 for "OpenAI", and gitleaks won't consider a
// candidate without it. This is the legacy shape: sk- + 20 + marker + 20. The 48 drawn
// characters are kept (8 overwritten) so a seeded dataset's other columns don't change.
const OPENAI_MARKER = "T3Blbk" + "FJ";
function generateOpenAIKey(rng: ScopedRandom): string {
  const drawn = randomChars(rng, ALNUM_CHARS, 48);
  return "sk-" + drawn.slice(0, 20) + OPENAI_MARKER + drawn.slice(28);
}

function generateUsername(rng: ScopedRandom): string {
  const first = rng.pick(FIRST_NAMES).toLowerCase().replace(/[^a-z0-9]/g, "");
  const last = rng.pick(LAST_NAMES).toLowerCase().replace(/[^a-z0-9]/g, "");
  switch (rng.int(0, 4)) {
    case 0:  return `${first[0]}${last}`;
    case 1:  return `${first}.${last}`;
    case 2:  return `${first}_${last}`;
    case 3:  return `${first}${last[0]}${rng.int(1, 99)}`;
    default: return `${last}${first[0]}`;
  }
}

const PASSWORD_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PASSWORD_LOWER = "abcdefghijklmnopqrstuvwxyz";
const PASSWORD_DIGITS = "0123456789";
// No quotes, commas or backslashes (CSV-safe), and no = + - (formula triggers).
const PASSWORD_SYMBOLS = "!#$%&*?@^";

// 12–16 characters with at least one of each class. Always starts with a
// lowercase letter, so sanitizeForSpreadsheet() never has to escape it.
function generatePassword(rng: ScopedRandom): string {
  const all = PASSWORD_UPPER + PASSWORD_LOWER + PASSWORD_DIGITS + PASSWORD_SYMBOLS;
  const rest = [
    randomChars(rng, PASSWORD_UPPER, 1),
    randomChars(rng, PASSWORD_DIGITS, 1),
    randomChars(rng, PASSWORD_SYMBOLS, 1),
    ...randomChars(rng, all, rng.int(12, 16) - 4),
  ];
  for (let i = rest.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return randomChars(rng, PASSWORD_LOWER, 1) + rest.join("");
}

// ─── Multi-language PII generators ───────────────────────────────────────────

function generateFranceINSEE(rng: ScopedRandom, delim = " "): string {
  const sex = rng.int(1, 2);
  const year = rng.int(0, 99).toString().padStart(2, "0");
  const month = rng.int(1, 12).toString().padStart(2, "0");
  // Departments 01–95; skip 20 (split into 2A/2B Corsica) for numeric simplicity
  const dept = rng.int(1, 95).toString().padStart(2, "0");
  const commune = rng.int(1, 999).toString().padStart(3, "0");
  const order = rng.int(1, 999).toString().padStart(3, "0");
  const base13 = `${sex}${year}${month}${dept}${commune}${order}`;
  const key = (97 - (parseInt(base13, 10) % 97)).toString().padStart(2, "0");
  return `${sex}${delim}${year}${delim}${month}${delim}${dept}${delim}${commune}${delim}${order}${delim}${key}`;
}

function generateGermanyTaxID(rng: ScopedRandom): string {
  // Steueridentifikationsnummer: 11 digits, first digit 1–9
  const digits: number[] = [rng.int(1, 9)];
  for (let i = 1; i < 10; i++) digits.push(rng.int(0, 9));
  // Check digit via ISO/IEC 7064 MOD 11,10 variant
  let product = 10;
  for (const d of digits) {
    let sum = (d + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }
  const check = (11 - product) % 10;
  return digits.join("") + check;
}

const MY_NUMBER_WEIGHTS = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;
function generateJapanMyNumber(rng: ScopedRandom): string {
  const digits = Array.from({ length: 11 }, () => rng.int(0, 9));
  const sum = digits.reduce((acc, d, i) => acc + d * MY_NUMBER_WEIGHTS[i], 0);
  const remainder = sum % 11;
  const check = remainder <= 1 ? 0 : 11 - remainder;
  return digits.join("") + check;
}

// ─── Custom field types ───────────────────────────────────────────────────────

export type FieldTypeKey =
  | "row-number" | "first-name" | "last-name" | "full-name" | "gender" | "email" | "ip-v4"
  | "ip-v6" | "mac-address" | "crypto-wallet" | "aws-access-key" | "api-key"
  | "aws-secret-key" | "github-token" | "slack-token" | "stripe-secret-key" | "google-api-key"
  | "openai-api-key" | "username" | "password"
  | "ssn" | "credit-card" | "credit-card-type" | "bank-name"
  | "dob" | "phone" | "zip" | "card-expiry"
  | "mrn" | "icd10" | "cpt" | "routing-number" | "account-number" | "npi" | "dea-number"
  | "specialty" | "us-state" | "dl-number"
  | "uk-nin" | "nhs-number" | "canada-sin" | "canada-province" | "passport-number"
  | "country" | "eu-vat" | "iban"
  | "france-insee" | "germany-tax-id" | "japan-my-number"
  | "custom-regex";

export interface CustomFieldOptions {
  cardBrands?: CardTypeName[];
}

interface FieldTypeDef {
  label: string;
  group: string;
  generate: (rng: ScopedRandom, rowIndex: number, options?: CustomFieldOptions) => string;
}

export const FIELD_TYPE_DEFS: Record<FieldTypeKey, FieldTypeDef> = {
  "row-number":      { label: "Row Number",              group: "Basic",          generate: (_, i) => String(i + 1) },
  "first-name":      { label: "First Name",              group: "Basic",          generate: (rng)  => rng.pick(FIRST_NAMES) },
  "last-name":       { label: "Last Name",               group: "Basic",          generate: (rng)  => rng.pick(LAST_NAMES) },
  "full-name":       { label: "Full Name",               group: "Basic",          generate: (rng)  => generateName(rng).full },
  "gender":          { label: "Gender",                  group: "Basic",          generate: (rng)  => generateGender(rng) },
  "email":           { label: "Email Address",           group: "Basic",          generate: (rng)  => generateEmailStandalone(rng) },
  "ip-v4":           { label: "IP Address v4",           group: "Basic",          generate: (rng)  => generateIPv4(rng) },
  "ip-v6":           { label: "IPv6 Address",            group: "Network / Tech", generate: (rng)  => generateIPv6(rng) },
  "mac-address":     { label: "MAC Address",             group: "Network / Tech", generate: (rng)  => generateMACAddress(rng) },
  "crypto-wallet":   { label: "Bitcoin Wallet",          group: "Network / Tech", generate: (rng)  => generateBitcoinWallet(rng) },
  "username":          { label: "Username",                     group: "Credentials / Secrets", generate: (rng) => generateUsername(rng) },
  "password":          { label: "Password",                     group: "Credentials / Secrets", generate: (rng) => generatePassword(rng) },
  "aws-access-key":    { label: "AWS Access Key ID",            group: "Credentials / Secrets", generate: (rng) => generateAWSAccessKey(rng) },
  "aws-secret-key":    { label: "AWS Secret Access Key",        group: "Credentials / Secrets", generate: (rng) => generateAWSSecretKey(rng) },
  "github-token":      { label: "GitHub Personal Access Token", group: "Credentials / Secrets", generate: (rng) => generateGitHubToken(rng) },
  "slack-token":       { label: "Slack Bot Token",              group: "Credentials / Secrets", generate: (rng) => generateSlackBotToken(rng) },
  "stripe-secret-key": { label: "Stripe Secret Key",            group: "Credentials / Secrets", generate: (rng) => generateStripeSecretKey(rng) },
  "google-api-key":    { label: "Google API Key",               group: "Credentials / Secrets", generate: (rng) => generateGoogleAPIKey(rng) },
  "openai-api-key":    { label: "OpenAI-style API Key",         group: "Credentials / Secrets", generate: (rng) => generateOpenAIKey(rng) },
  "api-key":           { label: "API Key / Secret",             group: "Credentials / Secrets", generate: (rng) => generateAPIKey(rng) },
  "ssn":             { label: "SSN",                group: "US PII / PCI", generate: (rng)        => generateSSN(rng) },
  "credit-card":     { label: "Credit Card Number", group: "US PII / PCI", generate: (rng, _, opts) => {
    const brands = opts?.cardBrands;
    return generateCreditCard(rng, brands && brands.length > 0 ? rng.pick(brands) : undefined);
  }},
  "credit-card-type": { label: "Credit Card Type",  group: "US PII / PCI", generate: (rng, _, opts) => {
    const brands = opts?.cardBrands;
    return brands && brands.length > 0 ? rng.pick(brands) : generateCardType(rng);
  }},
  "bank-name":       { label: "Bank Name",          group: "US PII / PCI", generate: (rng)        => generateBankName(rng) },
  "dob":             { label: "Date of Birth",       group: "US PII / PCI", generate: (rng)        => generateDOB(rng) },
  "phone":           { label: "Phone Number",        group: "US PII / PCI", generate: (rng)        => generatePhone(rng) },
  "zip":             { label: "ZIP Code",            group: "US PII / PCI", generate: (rng)        => generateZip(rng) },
  "card-expiry":     { label: "Card Expiry",         group: "US PII / PCI", generate: (rng)        => generateCardExpiry(rng) },
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
  "france-insee":    { label: "French INSEE Number",     group: "International",  generate: (rng)  => generateFranceINSEE(rng) },
  "germany-tax-id":  { label: "German Tax ID",           group: "International",  generate: (rng)  => generateGermanyTaxID(rng) },
  "japan-my-number": { label: "Japanese My Number",      group: "International",  generate: (rng)  => generateJapanMyNumber(rng) },
  // Generated from the field's pattern in generateCustom(); this entry only names it.
  "custom-regex":    { label: "Custom Regex",            group: "Custom",         generate: ()     => "" },
};

export interface CustomField {
  name: string;
  type: FieldTypeKey;
  blankPct: number;
  /** 0–100: share of non-blank values replaced by a near miss (types in NEAR_MISS_TYPES). */
  nearMissPct?: number;
  /** Custom Regex fields: the pattern every value must fully match. */
  pattern?: string;
  delimiter?: string;
  cardBrands?: CardTypeName[];
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
  "mac-address":  ":",
  "france-insee": " ",
};

type DelimGen = (rng: ScopedRandom, rowIndex: number, delimiter: string) => string;

const DELIMITER_GENERATORS: Partial<Record<FieldTypeKey, DelimGen>> = {
  "ssn":          (rng, _, d) => generateSSN(rng, d),
  "credit-card":  (rng, _, d) => generateCreditCard(rng, undefined, d),
  "dob":          (rng, _, d) => generateDOB(rng, d),
  "phone":        (rng, _, d) => generatePhone(rng, d),
  "card-expiry":  (rng, _, d) => generateCardExpiry(rng, d),
  "mrn":          (rng, _, d) => generateMRN(rng, d),
  "uk-nin":       (rng, _, d) => generateUKNIN(rng, d),
  "nhs-number":   (rng, _, d) => generateNHSNumber(rng, d),
  "canada-sin":   (rng, _, d) => generateCanadianSIN(rng, d),
  "mac-address":  (rng, _, d) => generateMACAddress(rng, d),
  "france-insee": (rng, _, d) => generateFranceINSEE(rng, d),
};

// ─── Near misses ─────────────────────────────────────────────────────────────
//
// A near miss keeps a type's format but breaks one rule that DLP engines are
// documented to check (a checksum, a never-issued range, a prefix that isn't a
// credential), so a well-tuned policy should NOT flag it. Only types with such
// a rule are here. Phone, email, IP, DOB and the like have no value-level rule
// engines check, so they have no near miss. Values that some engines count and
// others ignore (published test card numbers, Stripe sk_test_ keys, SSN areas
// 734–749 and 773–899, valid since 2011's randomization) are never produced.
//
// Sources for the rules: Microsoft Purview sensitive information type definitions,
// SSA POMS (SSN ranges), HMRC NIM39110 (NI prefixes), CMS NPPES (NPI check digit),
// AWS IAM identifier prefixes, Stripe's API key docs, and the gitleaks and
// CredSweeper rules for credential formats (GitHub's CRC32, OpenAI's marker).

export interface NearMiss {
  /** 1-based row number, as shown on the page and in exports. */
  row: number;
  field: string;
  value: string;
  reason: string;
}

interface NearMissValue {
  value: string;
  reason: string;
}

type NearMissGen = (rng: ScopedRandom, delim: string | undefined, brand: CardTypeName | undefined) => NearMissValue;

const pad = (n: number, width: number) => n.toString().padStart(width, "0");
/** A digit guaranteed to differ from `d`. */
const otherDigit = (rng: ScopedRandom, d: number) => (d + rng.int(1, 9)) % 10;
const digitsOf = (n: number, width: number) => pad(n, width).split("").map(Number);
const groupDigits = (digits: number[], sizes: number[], delim: string) => {
  const parts: string[] = [];
  let i = 0;
  for (const size of sizes) {
    parts.push(digits.slice(i, i + size).join(""));
    i += size;
  }
  return parts.join(delim);
};

function validSsnArea(rng: ScopedRandom): number {
  let area: number;
  do area = rng.int(1, 899); while (area === 666);
  return area;
}

const nearMissSsn: NearMissGen = (rng, delim = "-") => {
  const fmt = (a: number, g: number, s: number) => `${pad(a, 3)}${delim}${pad(g, 2)}${delim}${pad(s, 4)}`;
  switch (rng.int(0, 4)) {
    case 0: return { value: fmt(0, rng.int(1, 99), rng.int(1, 9999)), reason: "SSN area 000 is never issued" };
    case 1: return { value: fmt(666, rng.int(1, 99), rng.int(1, 9999)), reason: "SSN area 666 is never issued" };
    // Groups 01–49 stay clear of the ITIN groups (50–65, 70–88, 90–92, 94–99).
    case 2: return { value: fmt(rng.int(900, 999), rng.int(1, 49), rng.int(1, 9999)), reason: "SSN areas 900–999 are never issued (and the group isn't an ITIN group)" };
    case 3: return { value: fmt(validSsnArea(rng), 0, rng.int(1, 9999)), reason: "SSN group 00 is never issued" };
    default: return { value: fmt(validSsnArea(rng), rng.int(1, 99), 0), reason: "SSN serial 0000 is never issued" };
  }
};

const nearMissCard: NearMissGen = (rng, delim = "-", brand) => {
  const resolved = brand ?? rng.pick(CARD_TYPES);
  const kind = rng.int(0, 3);
  if (kind === 0 || kind === 1) {
    const digits = cardDigits(rng, resolved);
    if (kind === 1) {
      // Swap two neighbors. Luhn catches every adjacent swap except 0↔9.
      for (let tries = 0; tries < 20; tries++) {
        const i = rng.int(1, digits.length - 2);
        const [a, b] = [digits[i], digits[i + 1]];
        if (a !== b && a + b !== 9) {
          digits[i] = b;
          digits[i + 1] = a;
          return { value: formatCard(digits, delim), reason: "Fails the Luhn check (two neighboring digits swapped)" };
        }
      }
    }
    const i = rng.int(1, digits.length - 1);
    digits[i] = otherDigit(rng, digits[i]);
    return { value: formatCard(digits, delim), reason: "Fails the Luhn check (one digit changed)" };
  }
  if (kind === 2) {
    return { value: formatCard(withLuhn(rng, [7], 16), delim), reason: "Passes Luhn, but no major card brand starts with 7" };
  }
  if (resolved === "American Express") {
    return { value: formatCard(withLuhn(rng, [3, rng.pick([4, 7] as const)], 16), delim), reason: "Passes Luhn, but American Express numbers are 15 digits, not 16" };
  }
  const prefix = resolved === "Visa" ? [4] : resolved === "Mastercard" ? [5, rng.int(1, 5)] : [6, 0, 1, 1];
  return { value: formatCard(withLuhn(rng, prefix, 15), delim), reason: `Passes Luhn, but ${resolved} numbers are 16 digits, not 15` };
};

const ROUTING_WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7];
const routingCheck = (d: number[]) => (10 - (ROUTING_WEIGHTS.reduce((acc, w, i) => acc + w * d[i], 0) % 10)) % 10;
// Every two-digit start that isn't 00–12, 21–32, 61–72 or 80.
const UNUSED_ROUTING_PREFIXES = Array.from({ length: 100 }, (_, p) => p).filter(
  (p) => !(p <= 12 || (p >= 21 && p <= 32) || (p >= 61 && p <= 72) || p === 80),
);

const nearMissRouting: NearMissGen = (rng) => {
  if (rng.int(0, 1) === 0) {
    const d = digitsOf(rng.int(0, 99_999_999), 8);
    const p = rng.pick([rng.int(0, 12), rng.int(21, 32), rng.int(61, 72), 80]);
    [d[0], d[1]] = digitsOf(p, 2);
    return { value: d.join("") + otherDigit(rng, routingCheck(d)), reason: "Fails the ABA routing number checksum" };
  }
  const p = rng.pick(UNUSED_ROUTING_PREFIXES);
  const d = [...digitsOf(p, 2), ...digitsOf(rng.int(0, 999_999), 6)];
  return { value: d.join("") + routingCheck(d), reason: `Passes the ABA checksum, but no routing number starts with ${pad(p, 2)}` };
};

const nearMissNpi: NearMissGen = (rng) => {
  const payload = [rng.int(1, 2), ...digitsOf(rng.int(0, 99_999_999), 8)];
  switch (rng.int(0, 2)) {
    case 0:
      return { value: payload.join("") + otherDigit(rng, npiCheckDigit(payload)), reason: "Fails the NPI check digit" };
    case 1:
      // NPI's check is Luhn over 80840 + the 9 digits. Plain Luhn always gives a different digit.
      return { value: payload.join("") + luhnCheckDigit(payload), reason: "Passes a plain Luhn check, but not NPI's (Luhn with the 80840 prefix)" };
    default:
      payload[0] = rng.int(3, 9);
      return { value: payload.join("") + npiCheckDigit(payload), reason: `Check digit is right, but NPIs start with 1 or 2, not ${payload[0]}` };
  }
};

const deaCheck = (d: number[]) => (d[0] + d[2] + d[4] + 2 * (d[1] + d[3] + d[5])) % 10;
const nearMissDea: NearMissGen = (rng) => {
  const second = String.fromCharCode(65 + rng.int(0, 25));
  const d = digitsOf(rng.int(0, 999_999), 6);
  if (rng.int(0, 1) === 0) {
    return { value: `${rng.pick(DEA_FIRST_LETTERS)}${second}${d.join("")}${otherDigit(rng, deaCheck(d))}`, reason: "Fails the DEA number check digit" };
  }
  const first = rng.pick(["Q", "V", "W", "Y", "Z"] as const);
  return { value: `${first}${second}${d.join("")}${deaCheck(d)}`, reason: `Check digit is right, but no DEA registration starts with ${first}` };
};

const NHS_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const nhsCheck = (d: number[]) => 11 - (d.reduce((acc, x, i) => acc + x * NHS_WEIGHTS[i], 0) % 11);
const nearMissNhs: NearMissGen = (rng, delim = " ") => {
  const wantTen = rng.int(0, 1) === 1;
  let d: number[];
  let check: number;
  do {
    d = digitsOf(rng.int(0, 999_999_999), 9);
    check = nhsCheck(d);
  } while (wantTen ? check !== 10 : check === 10);
  if (wantTen) {
    return { value: groupDigits([...d, rng.int(0, 9)], [3, 3, 4], delim), reason: "Its mod-11 check digit would be 10, so this NHS number is never issued" };
  }
  const real = check === 11 ? 0 : check;
  return { value: groupDigits([...d, otherDigit(rng, real)], [3, 3, 4], delim), reason: "Fails the NHS number mod-11 check" };
};

const nearMissSin: NearMissGen = (rng, delim = "-") => {
  const d = [sinFirstDigit(rng), ...digitsOf(rng.int(0, 9_999_999), 7)];
  d.push(luhnCheckDigit(d));
  const i = rng.int(1, 8);
  d[i] = otherDigit(rng, d[i]);
  return { value: groupDigits(d, [3, 3, 3], delim), reason: "Fails the SIN Luhn check (one digit changed)" };
};

const nearMissNin: NearMissGen = (rng, delim = " ") => {
  const digits = () => [pad(rng.int(0, 99), 2), pad(rng.int(0, 99), 2), pad(rng.int(0, 99), 2)].join(delim);
  const fmt = (prefix: string, suffix: string) => `${prefix}${delim}${digits()}${delim}${suffix}`;
  const suffix = () => rng.pick(["A", "B", "C", "D"] as const);
  switch (rng.int(0, 3)) {
    case 0: {
      const prefix = rng.pick([...UK_NIN_BANNED_PREFIXES]);
      return { value: fmt(prefix, suffix()), reason: `NI prefix ${prefix} is never issued` };
    }
    case 1: {
      const bad = rng.pick(["D", "F", "I", "Q", "U", "V"] as const);
      return { value: fmt(bad + rng.pick(UK_NIN_SECOND_LETTERS), suffix()), reason: `NI numbers never start with ${bad}` };
    }
    case 2:
      return { value: fmt(rng.pick(UK_NIN_FIRST_LETTERS) + "O", suffix()), reason: "NI numbers never use O as the second letter" };
    default: {
      const bad = rng.pick(["E", "F", "G", "H", "J", "K", "M", "P", "X", "Z"] as const);
      return { value: fmt(rng.pick(UK_NIN_FIRST_LETTERS) + rng.pick(UK_NIN_SECOND_LETTERS), bad), reason: `NI numbers end in A, B, C or D, not ${bad}` };
    }
  }
};

const nearMissIban: NearMissGen = (rng) => {
  const country = rng.pick(EU_COUNTRIES).code;
  const len = IBAN_BBAN_LENGTHS[country] ?? 18;
  if (rng.int(0, 1) === 0) {
    const body = ibanBban(rng, country, len);
    const real = Number(ibanCheckDigits(country, body));
    const wrong = 2 + ((real - 2 + rng.int(1, 96)) % 97);
    return { value: `${country}${pad(wrong, 2)}${body}`, reason: "Fails the IBAN mod-97 check" };
  }
  // One digit dropped from, or added to, the end of a well-formed account part.
  const off = rng.pick([-1, 1] as const);
  const full = ibanBban(rng, country, len);
  const body = off === -1 ? full.slice(0, -1) : full + rng.int(0, 9);
  return {
    value: `${country}${ibanCheckDigits(country, body)}${body}`,
    reason: `Passes mod-97, but ${country} IBANs are ${len + 4} characters, not ${len + 4 + off}`,
  };
};

// NL VAT numbers also pass if ISO 7064 Mod 97-10 over "NL" + the 12 characters holds
// (the post-2020 numbers), so a broken 11-proef alone isn't enough to make a near miss.
function nlVatMod97Passes(built: string): boolean {
  let rem = 0;
  for (const ch of "NL" + built) {
    const v = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const c of v) rem = (rem * 10 + Number(c)) % 97;
  }
  return rem === 1;
}

const nearMissVat: NearMissGen = (rng) => {
  const country = rng.pick(EU_COUNTRIES);
  const rule = VAT_RULES[country.code];
  const built = rule.build(vatDraws(rng, country));
  const [start, end] = rule.check;
  const real = built.slice(start, end);
  let wrong: string;
  if (country.code === "ES") {
    wrong = DNI_LETTERS[(DNI_LETTERS.indexOf(real) + rng.int(1, 22)) % 23];
  } else if (end - start === 2) {
    wrong = pad((Number(real) + rng.int(1, 96)) % 97, 2);
  } else {
    wrong = String(otherDigit(rng, Number(real)));
  }
  let value = built.slice(0, start) + wrong + built.slice(end);
  // Step the digit (no draws) until the NL fallback check fails too.
  while (country.code === "NL" && nlVatMod97Passes(value)) {
    let next = (Number(value[start]) + 1) % 10;
    if (String(next) === real) next = (next + 1) % 10;
    value = value.slice(0, start) + next + value.slice(end);
  }
  return {
    value: country.vatPrefix + value,
    reason: `Fails the ${country.name} VAT ${end - start === 2 ? "check digits" : country.code === "ES" ? "check letter" : "check digit"}`,
  };
};

const nearMissGitHub: NearMissGen = (rng) => {
  const body = randomChars(rng, ALNUM_CHARS, 30);
  const real = githubChecksum(body);
  let tail = randomChars(rng, BASE62, 6);
  if (tail === real) tail = (tail[0] === "0" ? "1" : "0") + tail.slice(1);
  return { value: "ghp_" + body + tail, reason: "Last 6 characters aren't the CRC32 checksum real GitHub tokens end in" };
};

const AWS_ID_PREFIXES = [
  { prefix: "AIDA", what: "an IAM user ID" },
  { prefix: "AROA", what: "an IAM role ID" },
  { prefix: "AGPA", what: "an IAM group ID" },
  { prefix: "ANPA", what: "a managed policy ID" },
] as const;
const nearMissAwsKeyId: NearMissGen = (rng) => {
  const { prefix, what } = rng.pick(AWS_ID_PREFIXES);
  return { value: prefix + awsKeyIdBody(rng), reason: `${prefix}… is ${what}, not an access key` };
};

const nearMissStripe: NearMissGen = (rng) => ({
  value: "pk_live_" + randomChars(rng, ALNUM_CHARS, 24),
  reason: "Publishable key (pk_live_), which Stripe says is safe to expose",
});

const nearMissOpenAI: NearMissGen = (rng) => ({
  value: "sk-" + randomChars(rng, ALNUM_CHARS, 48),
  reason: "Missing the T3BlbkFJ marker that OpenAI keys carry",
});

const nearMissGoogle: NearMissGen = (rng) => ({
  value: "AIza" + randomToken(rng, ALNUM_CHARS + "_-", 34),
  reason: "Google API keys are AIza plus 35 characters; this one has 34",
});

const NEAR_MISS_GENERATORS: Partial<Record<FieldTypeKey, NearMissGen>> = {
  "ssn": nearMissSsn,
  "credit-card": nearMissCard,
  "routing-number": nearMissRouting,
  "npi": nearMissNpi,
  "dea-number": nearMissDea,
  "nhs-number": nearMissNhs,
  "canada-sin": nearMissSin,
  "uk-nin": nearMissNin,
  "iban": nearMissIban,
  "eu-vat": nearMissVat,
  "github-token": nearMissGitHub,
  "aws-access-key": nearMissAwsKeyId,
  "stripe-secret-key": nearMissStripe,
  "openai-api-key": nearMissOpenAI,
  "google-api-key": nearMissGoogle,
};

/** Field types that support a Near-miss %. */
export const NEAR_MISS_TYPES: readonly FieldTypeKey[] = Object.keys(NEAR_MISS_GENERATORS) as FieldTypeKey[];

/** Thrown when a field can't be generated (e.g. a Custom Regex pattern that doesn't work). */
export class CustomFieldError extends Error {
  // A plain field, not a constructor parameter property: Node's type stripping (which
  // scripts/generator.test.mjs uses to load this file) can't erase those.
  readonly field: string;
  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.field = field;
  }
}

/**
 * Builds the per-row generator for a Custom Regex pattern. Injected by the
 * server-side callers (src/lib/regex/generate-match.ts makeMatchGenerator), so
 * this module, which also ships to the browser via xlsx-export, doesn't pull
 * in the regex engines.
 */
export type RegexGeneratorFactory = (pattern: string) =>
  | { ok: true; next: (rand: () => number) => string | null }
  | { ok: false; error: string };

export function generateCustom(
  fields: CustomField[],
  count: number,
  seed: number,
  opts: { regex?: RegexGeneratorFactory } = {},
): GenerateResult {
  const rng = createScopedRandom(seed);
  const nearMisses: NearMiss[] = [];

  const regexNext = new Map<CustomField, (rand: () => number) => string | null>();
  for (const field of fields) {
    if (field.type !== "custom-regex") continue;
    if (!opts.regex) throw new CustomFieldError(field.name, "Custom Regex isn't available here");
    const gen = opts.regex(field.pattern ?? "");
    if (!gen.ok) throw new CustomFieldError(field.name, gen.error);
    regexNext.set(field, gen.next);
  }

  const hasCCN    = fields.some(f => f.type === "credit-card");
  const hasCCType = fields.some(f => f.type === "credit-card-type");

  const rows = Array.from({ length: count }, (_, rowIndex) => {
    const row: Record<string, string> = {};

    // When both credit-card and credit-card-type are in the same row, pick one
    // brand up-front so the number and type always match.
    let sharedBrand: CardTypeName | undefined;
    if (hasCCN && hasCCType) {
      const brandsSource = fields.find(f => f.type === "credit-card" || f.type === "credit-card-type");
      const brands = brandsSource?.cardBrands;
      sharedBrand = brands && brands.length > 0 ? rng.pick(brands) : rng.pick(CARD_TYPES);
    }

    for (const field of fields) {
      const nearMissGen = NEAR_MISS_GENERATORS[field.type];
      const regex = regexNext.get(field);
      if (field.blankPct > 0 && rng.float() * 100 < field.blankPct) {
        row[field.name] = "";
      } else if (
        // Only draws when a Near-miss % is set, so datasets without one are unchanged.
        nearMissGen && field.nearMissPct && field.nearMissPct > 0 && rng.float() * 100 < field.nearMissPct
      ) {
        const brand = field.type === "credit-card"
          ? sharedBrand ?? (field.cardBrands?.length ? rng.pick(field.cardBrands) : undefined)
          : undefined;
        const { value, reason } = nearMissGen(rng, field.delimiter, brand);
        row[field.name] = value;
        nearMisses.push({ row: rowIndex + 1, field: field.name, value, reason });
      } else if (regex) {
        const value = regex(() => rng.float());
        if (value === null) throw new CustomFieldError(field.name, `couldn't generate a value for row ${rowIndex + 1}`);
        row[field.name] = value;
      } else {
        const delimGen = DELIMITER_GENERATORS[field.type];
        if (typeof field.delimiter === "string" && delimGen) {
          if (field.type === "credit-card") {
            const brand = sharedBrand ?? (field.cardBrands?.length ? rng.pick(field.cardBrands) : undefined);
            row[field.name] = generateCreditCard(rng, brand, field.delimiter);
          } else {
            row[field.name] = delimGen(rng, rowIndex, field.delimiter);
          }
        } else {
          if (sharedBrand && field.type === "credit-card-type") {
            row[field.name] = sharedBrand;
          } else if (sharedBrand && field.type === "credit-card") {
            row[field.name] = generateCreditCard(rng, sharedBrand);
          } else {
            row[field.name] = FIELD_TYPE_DEFS[field.type].generate(rng, rowIndex, { cardBrands: field.cardBrands });
          }
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
    // Only when a field that has a near miss asked for one. A Near-miss % on a phone
    // or email field does nothing, so it shouldn't produce an (empty) answer key either.
    ...(fields.some((f) => NEAR_MISS_GENERATORS[f.type] && f.nearMissPct && f.nearMissPct > 0) && { nearMisses }),
  };
}
