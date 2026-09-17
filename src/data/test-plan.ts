// Metadata for the Endpoint DLP Test Plan workbook (/endpoint-dlp-test-plan/).
//
// The workbook itself lives in R2 and is served through /downloads/?file=<key>;
// the key must also be listed in DOWNLOAD_KEYS (src/lib/downloads.ts) or the
// route 404s. Row counts below are copied from the workbook — update them here
// when a new build is uploaded.

export const TEST_PLAN_KEY = "DLPTest-com_Endpoint_DLP_Use_Case_Test_Plan.xlsx";

// Bumped whenever a new build is uploaded over the same R2 key. The downloads
// route sends `cache-control: immutable, max-age=31536000`, so without a
// changing query string browsers keep serving the copy they already have.
export const TEST_PLAN_VERSION = 5;

export const TEST_PLAN_HREF =
  `/downloads/?file=${TEST_PLAN_KEY}&v=${TEST_PLAN_VERSION}`;

export const TEST_PLAN_UPDATED = "2026-09-17";
export const TEST_PLAN_ROWS = 168;

export type TestPlanSheet = {
  name: string;
  rows: number;
  question: string;
  detail: string;
};

export const TEST_PLAN_SHEETS: readonly TestPlanSheet[] = [
  {
    name: "1. Classification",
    rows: 22,
    question: "Can the tool find the data?",
    detail:
      "Four use cases: regulatory PII, PHI and card data; intellectual property and source code; financial reporting and material nonpublic information; and bulk exports out of business applications. Covers match counting, confidence levels, exact data match, OCR and nested archives.",
  },
  {
    name: "2. Policy",
    rows: 88,
    question: "Can it act on what it found?",
    detail:
      "31 egress channels — GenAI tools, webmail, cloud storage, browsers, USB, printing, AirDrop, RDP and more — scored for Monitor / Warn and separately for Block, because seeing a channel is the easy half. One row per channel per operating system, since a channel that is table stakes on Windows is often advanced on macOS and rare on Linux.",
  },
  {
    name: "3. Enforcement",
    rows: 6,
    question: "What can it enforce in real time?",
    detail:
      "Why some classifications can block inline and others can only alert afterwards. This is the sheet that explains how a team can block card numbers going to a GenAI tool and still be unable to block AI-classified data going to the same place.",
  },
  {
    name: "4. Investigations",
    rows: 27,
    question: "What happens after an alert?",
    detail:
      "Evidence and context, timeline and lineage, pivoting from a user or a file or a destination, insider-risk behaviour, case workflow, privacy controls and response actions.",
  },
  {
    name: "5. Usability",
    rows: 25,
    question: "What does it cost to run?",
    detail:
      "AI-assisted classification, policy authoring and triage, rollout and change control, agent footprint and user-visible latency, and the end-user experience that decides whether people route around the agent.",
  },
];
