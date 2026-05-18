# dlptest.com — Development Notes

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
