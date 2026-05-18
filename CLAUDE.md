# dlptest.com — Development Notes

## Completed

### Copy-to-clipboard buttons on sample data tables (PR #14)
Added per-row **Copy** buttons and a **Copy all** button (top-right header cell) to all four sample-data tables. Implemented via `src/components/CopyRowScript.astro` — a shared component that injects JS via event delegation on any `<div data-copy-table>` wrapper. Copies tab-separated values; degrades gracefully without JS. Applied to:
- `src/pages/sample-data/index.astro`
- `src/pages/sample-data/namessndob.astro`
- `src/pages/sample-data/nameccnzip.astro`
- `src/pages/sample-data/namedobemail.astro`

---

## Backlog

### Dataset expansion
Add new dataset types to the `/generate/` page (`src/lib/data-generator.ts`):
- UK National Insurance numbers (format: `AB 12 34 56 C`)
- Canadian Social Insurance Numbers (SINs, 9-digit with Luhn check)
- Passport numbers (US format: letter + 8 digits)
- NPI — National Provider Identifier (10-digit with Luhn check)
- Driver's license numbers (state-formatted, e.g. `A1234567` for CA)

Each new type needs: a generator function, a row builder, a `DatasetType` entry, a `COLUMNS` entry, and a `BUILDERS` entry. Also add the option to the `<select>` in `src/pages/generate/index.astro`.

### Downloadable test artifacts
Let users download a file pre-loaded with PII/PCI data for endpoint DLP / USB / cloud-storage testing:
- `.docx` — Word document with a table of SSN + CCN rows
- `.pdf` — PDF with a paragraph of PII text
- `.xlsx` — Excel spreadsheet with PII columns
- `.png` — Image with SSNs/CCNs rendered as text (for OCR-based DLP testing)

These can be statically generated at build time (scripts in `/scripts/`) or served as dynamic API routes that call the data generator and stream the file. Downloadable files should reuse the existing `generateDataset()` function from `src/lib/data-generator.ts`.
