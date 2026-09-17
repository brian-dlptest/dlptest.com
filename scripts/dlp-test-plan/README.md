# Endpoint DLP Test Plan — build scripts

Generates `DLPTest-com_Endpoint_DLP_Use_Case_Test_Plan.xlsx`, the workbook offered at
[/endpoint-dlp-test-plan/](../../src/pages/endpoint-dlp-test-plan.astro).

**Never hand-edit the .xlsx.** It is generated. Edit the content modules and rebuild, or the
published workbook and this source will drift apart.

## Requirements

```bash
pip install openpyxl
```

Nothing else. No LibreOffice — see [Verification](#verification) for why that matters.

## Workflow

Run all three, in this order, every time:

```bash
python3 scripts/dlp-test-plan/renumber.py   # 1. fix IDs + cross-references
python3 scripts/dlp-test-plan/build.py      # 2. write the .xlsx
python3 scripts/dlp-test-plan/verify.py     # 3. check it
```

The order is not optional. `renumber.py` rewrites the content modules in place; running
`build.py` first bakes stale IDs into the workbook.

## Files

| File | What it holds |
|---|---|
| `content_class.py` | Sheet 1 — Classification |
| `content_policy.py` | Sheet 2 — Policy (one row per channel **per OS**) |
| `content_xp.py` | Sheet 3 — Enforcement, and Sheet 4 — Investigations |
| `content_use.py` | Sheet 5 — Usability |
| `build.py` | Layout, styling, dropdowns, conditional formatting, scoring formulas, chart |
| `renumber.py` | Sequential IDs + cross-reference rewriting |
| `verify.py` | Static checks (see below) |

## IDs

IDs are sequential within their section and are **regenerated on every run** — `C-A01…`,
`P-G01.Windows`, `E-01…`, `I-01…`, `U-01…`. Policy rows carry a `.<OS>` suffix; several rows
share one base, and the base advances only once.

Because IDs shift whenever a row is added or removed, prose that references another row
(`See C-A07`) is rewritten automatically. **`renumber.py` refuses to run if a reference points at
a row that no longer exists**, and names it. Fix the reference, then re-run.

## Verification

There is no LibreOffice on the machines this was written on, so the usual
"recalculate and look for `#REF!`" pass is not available. `verify.py` substitutes for it:

- every formula uses only Excel-2007-era functions (`COUNTIF`, `COUNTIFS`, `SUM`, `IFERROR`)
- every `Sheet!Range` reference resolves, is quoted if the sheet name has a space, and spans
  exactly the sheet's data rows
- result columns are empty (they are for the tester) and criteria columns are populated
- every count formula is simulated in Python against seeded values
- one scoring vocabulary workbook-wide (`Pass / Partial / Fail / N/A`)
- no dangling `C-`/`P-`/`E-`/`I-`/`U-` reference in any cell or comment
- the workbook's IDs match the content modules exactly, and every ID is well formed
- the table stakes failures list is correct end to end: each sheet's hidden helper column points
  only at its own row, the `TEXTJOIN` carries its `_xlfn.` prefix, and after seeding Fails the
  listed IDs equal both the per-sheet count and the tier rollup's Table stakes Fail total
- table stakes coverage below the 70% floor is highlighted
- **the page advertises what the workbook is**: `VERSION` in `build.py`, `TEST_PLAN_VERSION` and
  every row count in `src/data/test-plan.ts`, and the Read Me's version line all agree

A clean run prints `ALL CHECKS PASSED`. Treat anything else as a broken build.

## Two traps worth knowing

**Stale bytecode.** Renumbered IDs are the same length, so a rewritten content module keeps its
byte size; with an mtime in the same second, Python's `__pycache__` check passes and the next
process compiles from a **stale** `.pyc`. This silently produced a workbook with wrong IDs once.
`renumber.py` now deletes `__pycache__` and `build.py` sets `sys.dont_write_bytecode`, but if you
ever see IDs that disagree with the source, that is the cause — `verify.py`'s ID-parity check
catches it.

**Hashes are not a diff.** `.xlsx` is a zip and zips embed per-entry timestamps, so two builds of
identical content hash differently. Never use a checksum to decide whether a rebuild changed
anything — compare cell values.

## Publishing

The workbook lives in the `dlptest-downloads` R2 bucket (prod and staging share it) and is served
at `/downloads/?file=<key>`:

```bash
npx wrangler r2 object put \
  "dlptest-downloads/DLPTest-com_Endpoint_DLP_Use_Case_Test_Plan.xlsx" \
  --file scripts/dlp-test-plan/DLPTest-com_Endpoint_DLP_Use_Case_Test_Plan.xlsx \
  --content-type "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" \
  --remote
```

The key is already allow-listed in `src/lib/downloads.ts`; a request for a key not in that Set
returns 404.

**After every upload, bump `VERSION` in `build.py` and `TEST_PLAN_VERSION` in `src/data/test-plan.ts` together** — `verify.py` fails if they disagree. The downloads route
sends `cache-control: immutable, max-age=31536000`, so a browser that already has the file will
not re-request it for a year. The page links with `&v=<version>`; without the bump, readers
silently keep the old workbook. Cloudflare's edge does pick up a new object on its own — it is
only browser cache that sticks.

While you are in `src/data/test-plan.ts`, update the row counts and `TEST_PLAN_UPDATED` if they
changed; the page renders from that file.

## House rule

**No DLP vendor names in the content**, ever — not as capability examples, not as sources for a
technical claim. Naming some vendors annoys every vendor that does the same thing and was left
out, and the plan's value is being neutral ground. Name the *test targets* freely (ChatGPT,
Dropbox, Salesforce, Brave, USB); the rule is about security products.
