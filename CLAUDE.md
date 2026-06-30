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

### Regex Test page + MCP regex tools (PRs #154–#158)
A `/regex/` regex workbench for DLP rule authoring, plus three MCP tools. Delivered as a stack of 5 PRs into `staging` (merge in order #154 → #158). All regex code lives in `src/lib/regex/`.

- **`src/lib/regex/dlp-patterns.ts`** — single source of truth: a curated library of 103 DLP-relevant regexes across 7 categories (Personal Identity, Financial/PCI, Healthcare/PHI, Network/Tech, Credentials/Secrets, Government/Tax, International). ECMAScript syntax; each entry has a sample `example`. Validated by `npm run regex:validate` (compiles every pattern, asserts examples match, checks unique ids). Backs both the page's library tab and the MCP `list_dlp_patterns` tool. Fake credential-shaped examples are assembled via a `syn()` helper so GitHub secret scanning doesn't false-positive (PR #154).
- **`src/lib/regex/engines.ts`** — `runMatch()` / `runReplace()` over two WASM-free engines: native ECMAScript `RegExp` and `re2js` (pure-JS RE2/Go, linear-time/ReDoS-safe). Pure, synchronous, with input/pattern/match caps so it's safe server-side (PR #155).
- **`src/lib/regex/pcre.ts`** — browser-only PCRE engine (`pcre2-wasm`, base64-inlined). Lazy-loaded via dynamic `import()` only when the PCRE flavor is selected; never in the Worker. Needs `'wasm-unsafe-eval'` in the CSP (`src/middleware.ts` + `public/_headers`, kept in sync) (PR #156).
- **`src/lib/regex/explain.ts`** — pattern → plain-English token breakdown. **`share.ts`** — workbench state ↔ URL hash (PRs #155, #157).
- **`src/lib/regex/generate-match.ts`** — bounded, self-verifying generator that synthesizes strings matching a pattern (rejects backreferences/look-around; verifies output before returning) (PR #158).
- **`src/pages/regex/index.astro`** — the workbench: pattern + flag toggles, live match highlighting, capture-group panel, three-engine selector, Match/Substitution tabs, live Explanation, a searchable/paginated DLP pattern library, and Copy-link sharing. Fully client-side. **Note:** JS-created elements (match cards, library cards, explanation rows) need `:global()` selectors in the scoped `<style>` — same pattern as the data generator's copy buttons.
- **MCP tools** added to `src/lib/mcp/tools.ts`: `regex_test` (match, RE2 default, ReDoS caps), `list_dlp_patterns` (the library), `regex_generate_matches` (reverse: pattern → verified samples). Documented on `/mcp/` and in `public/mcp-setup-readme.md`.

Engine choice rationale: only PCRE needs WASM (browser-only, lazy); ECMAScript and RE2 are free. `.NET` and Python `re` have no lightweight WASM build, so they're documented on the page as "closest match = PCRE" rather than shipped as engines.

> Requires Node ≥22.12 (Astro 6). The default `node` may be older — see the `dlptest-dev` config in `.claude/launch.json`.

---

## Backlog

### Downloadable test artifacts
Let users download a file pre-loaded with PII/PCI data for endpoint DLP / USB / cloud-storage testing:
- `.docx` — Word document with a table of SSN + CCN rows
- `.pdf` — PDF with a paragraph of PII text
- `.xlsx` — Excel spreadsheet with PII columns
- `.png` — Image with SSNs/CCNs rendered as text (for OCR-based DLP testing)

These can be statically generated at build time (scripts in `/scripts/`) or served as dynamic API routes that call the data generator and stream the file. Downloadable files should reuse the existing `generateDataset()` function from `src/lib/data-generator.ts`.
