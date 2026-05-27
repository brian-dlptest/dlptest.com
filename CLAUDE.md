# dlptest.com — Development Notes

## Workflow

This repo has more than one contributor — **do not push directly to `staging` or `main`**. All work goes through pull requests.

**Branch layout:**
- `main` — production. Deploys to dlptest.com.
- `staging` — integration. Deploys to staging.dlptest.com.
- `feature/<short-name>` — day-to-day work. Branch off `staging`.

**For every change Claude makes:**
1. Start from latest `staging`: `git checkout staging && git pull`.
2. Create a feature branch: `git checkout -b feature/<short-name>` (kebab-case, describes the change).
3. Commit on the feature branch.
4. Open a PR into `staging` with `gh pr create --base staging --fill` (gh is authenticated as `brian-dlptest`).
5. Do **not** merge the PR — leave it for human review.

**Releases (`staging` → `main`)** are opened by a human, not by Claude, unless explicitly asked.

**Narrow exceptions where direct push to `staging` is acceptable** (still ask first if unsure):
- Trivial copy/typo fixes the user explicitly says to push directly.
- A branch the user explicitly names as theirs (e.g., `brian/experiments`).

When the user says "commit and push" without specifying a branch, assume the feature-branch workflow above — don't push to `staging` directly.

> The same workflow lives in `.cursor/rules/workflow.mdc` so Cursor follows it too. If you change one, change the other.

---

## Completed

### Copy-to-clipboard buttons on sample data tables (PR #14)
Added per-row **Copy** buttons and a **Copy all** button (top-right header cell) to all four sample-data tables. Implemented via `src/components/CopyRowScript.astro` — a shared component that injects JS via event delegation on any `<div data-copy-table>` wrapper. Copies tab-separated values; degrades gracefully without JS. Applied to:
- `src/pages/sample-data/index.astro`
- `src/pages/sample-data/namessndob.astro`
- `src/pages/sample-data/nameccnzip.astro`
- `src/pages/sample-data/namedobemail.astro`

---

### Dataset expansion (PR #15)
Added 6 new dataset types to the `/generate/` page (`src/lib/data-generator.ts`):
- UK National Insurance numbers (`AB 12 34 56 C`) + NHS Number — `uk-identity`
- Canadian Social Insurance Numbers (Luhn, `XXX-XXX-XXX`) + Province — `canada-sin`
- Passport numbers (letter + 8 digits) + Country — `passport`
- EU VAT numbers + IBAN + Country — `eu-vat`
- NPI (10-digit Luhn) + DEA Number + Specialty — `npi-provider`
- Driver's license numbers (state-formatted) + State — `driver-license`

Options in `<select>` are grouped into optgroups: US PII/PCI, US Specialized, International.

---

### Fix CCN Luhn check digit (PR #18)
The `luhnCheckDigit` function in `src/lib/data-generator.ts` used a left-to-right parity loop that doubled the wrong digit positions, causing every generated credit card number to fail Luhn validation. Replaced with a right-to-left iteration (`doubleNext = true` starting from the rightmost partial digit), matching the canonical Luhn spec and the fix shipped in robserver v2.7.7. Applies correctly to both 16-digit cards (Visa, Mastercard, Discover) and 15-digit AMEX.

---

## Backlog

### Downloadable test artifacts
Let users download a file pre-loaded with PII/PCI data for endpoint DLP / USB / cloud-storage testing:
- `.docx` — Word document with a table of SSN + CCN rows
- `.pdf` — PDF with a paragraph of PII text
- `.xlsx` — Excel spreadsheet with PII columns
- `.png` — Image with SSNs/CCNs rendered as text (for OCR-based DLP testing)

These can be statically generated at build time (scripts in `/scripts/`) or served as dynamic API routes that call the data generator and stream the file. Downloadable files should reuse the existing `generateDataset()` function from `src/lib/data-generator.ts`.
