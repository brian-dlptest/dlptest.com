# Test data for the Endpoint DLP Test Plan

The files the test plan asks a tester to use, so nobody has to assemble them before each
run. Everything here is **synthetic**. It was generated through the
[DLPTest MCP server](https://dlptest.com/mcp/) and validated against dlptest.com's own DLP
pattern library. Nothing here is real customer, employee, patient or company data.

| | |
|---|---|
| [`cases.json`](cases.json) | **The database.** One entry per workbook row: its ID, its name, the files it uses or a `no_file_reason`. `readme_requirements` covers data a Read Me instruction needs but no row does. |
| [`VALIDATION.md`](VALIDATION.md) | Every file checked against dlptest.com's DLP patterns and RE2 engine, negative controls included. |
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

Build them after cloning. This writes only `generated/` and never changes a tracked
file:

```bash
pip install python-docx openpyxl python-pptx Pillow py7zr
python3 tools/build.py local
```

## Rebuilding and validating

```bash
python3 tools/build.py refresh exports     # rewrite one stage's committed payloads
python3 tools/validate.py                  # rewrites VALIDATION.md; exits non-zero on FAIL
```

`refresh` is the only command that writes under `files/`. Its result is a diff to review
and commit, so refresh only the stages whose generator you changed. The stages are
`regulatory`, `msa`, `ip`, `finance`, `exports` and `shared`, or `all`.

MCP responses are cached in `generated/mcp-cache/`, so a refresh replays the values from
the last build, and a change to how a generator formats its data does not also change
the data. Office files and archives are written with a fixed timestamp, so a replayed
refresh is byte-identical. The exception is the two password-protected zips: ZipCrypto
salts every archive. `refresh --refetch` ignores the cache and pulls new random values,
which rewrites every payload in those stages. Without a cache (a fresh clone, say) a
refresh pulls new values anyway.

Requirements beyond the pip packages:

- **`zip`** (Info-ZIP) for the password-protected archives. It ships with macOS. On
  Debian or Ubuntu run `apt install zip`; on Windows, build under WSL.
- **Node >= 22.18** for `validate.py`. It loads the site's own pattern library and RE2
  engine from `src/lib/regex/` through `tools/scan.mjs`, so a full run makes one
  production call: a single comparison against the live MCP server. `--offline` skips
  that call.
- `pwsh` is optional. When it's installed, `validate.py` also runs the Windows
  offline-enforcement script.

`verify.py` in the parent folder runs offline and needs neither command. It only reads
`cases.json` and the committed files.

## Findings about dlptest.com's own data

`VALIDATION.md` records where the MCP server's output is invalid or disagrees with the
site's published patterns:

- MRNs written `MRN-12345678`, where `mrn-labeled` wants `MRN:`.
- Spaced UK NI and French INSEE numbers, where the patterns want them contiguous.
- NI prefixes HMRC never issues.
- IBANs with random check digits.

The payloads work around each one, and they are worth fixing on the site. The MRN check
is reported as KNOWN-DEFECT, so fixing the site turns it into a PASS rather than a
failure.
