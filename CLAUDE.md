# dlptest.com — Development Notes

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

## Backlog

### Downloadable test artifacts
Let users download a file pre-loaded with PII/PCI data for endpoint DLP / USB / cloud-storage testing:
- `.docx` — Word document with a table of SSN + CCN rows
- `.pdf` — PDF with a paragraph of PII text
- `.xlsx` — Excel spreadsheet with PII columns
- `.png` — Image with SSNs/CCNs rendered as text (for OCR-based DLP testing)

These can be statically generated at build time (scripts in `/scripts/`) or served as dynamic API routes that call the data generator and stream the file. Downloadable files should reuse the existing `generateDataset()` function from `src/lib/data-generator.ts`.
