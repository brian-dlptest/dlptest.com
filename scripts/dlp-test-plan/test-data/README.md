# Test data for the Endpoint DLP Test Plan

The files the test plan asks a tester to use, so nobody has to assemble them before each
run. Everything here is **synthetic**. It was generated through the
[DLPTest MCP server](https://dlptest.com/mcp/) and validated against dlptest.com's own DLP
pattern library. Nothing here is real customer, employee, patient or company data.

| | |
|---|---|
| [`cases.json`](cases.json) | **The database.** One entry per workbook row: its ID, its name, the files it uses or a `no_file_reason`. `readme_requirements` covers data a Read Me instruction needs but no row does. |
| [`VALIDATION.md`](VALIDATION.md) | Every file checked against dlptest.com's DLP patterns through the MCP server's `regex_test`, negative controls included. |
| `files/` | The committed payloads. |
| `generated/` | Built locally, gitignored. See below. |
| `tools/` | The generators, the build script and the validator. |

## Layout

Folders are named by **content**, not by row ID: `files/classification/ocr-on-images/`.
Row IDs are reassigned whenever a row is added or removed, so they appear
only in `cases.json`, and the READMEs here describe tests by name. `verify.py` enforces
both. See [`../TEST-DATA-REVIEW.md`](../TEST-DATA-REVIEW.md).

```
files/
  classification/           one folder per Classification test
  policy/                   shared payloads for the Policy channels
  block-method-checks/      the Read Me's "repeat a passing Block" check
  investigations-usability/ the few capability rows that need a file, plus RUNBOOK.md
```

To find the files for a row, look it up in `cases.json` by ID or by name:

```bash
python3 -c "import json,sys; q=sys.argv[1]; print(json.dumps([c for c in json.load(open('cases.json'))['cases'] if q in (c['id'], c['name'])], indent=2))" "OCR on images"
```

## Not committed: `generated/`

Two kinds of file cannot live in git:

- **Credential-shaped files.** GitHub push protection rejects fake key-shaped strings
  as readily as real ones. These are the secrets `.env` pair and the `config.py` in the
  git-push repository.
- **Nested git repositories.** The origin-lineage pair and the git-push repository need
  a real `.git`, with a remote set.

Build them after cloning:

```bash
pip install python-docx openpyxl python-pptx Pillow py7zr
python3 tools/build.py ip shared
```

## Rebuilding and validating

```bash
python3 tools/build.py              # every stage; ~1 minute, about 200 MCP calls
python3 tools/validate.py           # rewrites VALIDATION.md; exits non-zero on failure
```

The MCP server returns fresh random values on every call, so a full rebuild produces a
different set of files with the same shape. Commit a full rebuild only when the payloads
actually need to change; a single stage (`build.py exports`) keeps the diff small.

`verify.py` in the parent folder runs offline and needs neither command. It only reads
`cases.json` and the committed files.

## Findings about dlptest.com's own data

`VALIDATION.md` records where the MCP server's output and the site's published patterns
disagree. Examples: MRNs written `MRN-12345678` where `mrn-labeled` wants `MRN:`; spaced
UK NI and French INSEE numbers where the patterns want them contiguous; NI prefixes HMRC
never issues. The payloads work around each one. They are worth fixing on the site.
