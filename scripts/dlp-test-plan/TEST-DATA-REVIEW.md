# Test data review — required on every test plan change

**Rule: a change that adds, removes, merges or rewords a row is not finished until the
test data has been reviewed against it.** The workbook names the files a tester needs;
it does not ship them. The files live in [`test-data/`](test-data/), and
[`test-data/cases.json`](test-data/cases.json) maps every row to them.

This is step 4 of the workflow in [README.md](README.md). `verify.py` enforces most of it:
the build does not reach `ALL CHECKS PASSED` until `cases.json` matches the workbook.

## Why this exists

Row IDs are **reassigned on every build**: `renumber.py` numbers rows by sheet position,
so inserting or removing one row shifts every ID below it. Anything keyed by row ID
silently points at the wrong test afterwards. Nothing errors.

v6 → v7 shows both ways this goes wrong:

- **An ID that now names a different test.** v7 removed v6's `C-A05` and the six rows
  below it moved up one. A folder named `C-A10_ocr-on-images`, which was correct for v6,
  now resolves to v7's `C-A10`: *Archives and nested files*. OCR is `C-A09`.
- **Fourteen IDs moved, not six.** Besides those six Classification rows, eight Usability
  rows moved: v6 `U-18`…`U-25` became `U-19`…`U-21` and `U-27`…`U-31`. v6's `U-18` was
  *Policy tip clarity*; v7's `U-18` is *Approval workflow for enforcement changes*. Five
  v6 Usability IDs now name a test that did not exist in v6.

A check on the *set* of IDs passes every one of those cases, because the set is still
complete. That is why the checks below compare each row's ID **and** name.

## How the test data is laid out to survive this

- **Folders are named by content, not by row ID**: `files/classification/ocr-on-images/`,
  not `C-A09_…`. A renumber never moves a folder.
- **Row IDs appear in exactly one place: `cases.json`.** Each case records the row's ID,
  its name, the files it uses or a `no_file_reason`, and `steps_sha`, a hash of the row's
  steps at the last review. READMEs under `test-data/` describe tests by name. `verify.py`
  fails if one of them, or any file or folder name, mentions a row ID.
- **`renumber.py` renumbers `cases.json` with the content modules**, so a case follows its
  row when rows above it are inserted or removed. Without that, every ID below the change
  would point at its neighbour's files, and `verify.py` would name the wrong rows as new
  or removed. A case for a row that no longer exists stops the renumber until it is
  removed (R2).
- **Data a Read Me instruction needs but no row does** is listed under
  `readme_requirements`, so it is accounted for rather than looking orphaned.

## What verify.py checks

| Check | Fails when |
|---|---|
| Version | `reviewed_for_version` in `cases.json` differs from `VERSION` in `build.py` |
| Missing row | a workbook row has no case: a new row nobody has mapped |
| Moved row | a case's name differs from the workbook's name for that ID |
| Steps changed | a row's *How to Test* (*What to Test* on Policy, plus *Expected Result* on Classification) no longer matches the case's `steps_sha` |
| Stale case | a case names an ID the workbook no longer has: a removed row |
| Duplicate case | two cases share an ID. Only one could be checked, and the other's files would never show as orphans |
| Unexplained row | a case has no files and no `no_file_reason` |
| Missing file | a case names a committed file that does not exist, or a `generated/` path that `build.py local` does not write (`test-data/tools/outputs.py`) |
| Orphan | a committed file is used by no case and no Read Me requirement |
| Read Me requirement | its instruction is no longer in the workbook's rendered Read Me sheet |
| ID in docs | a README, RUNBOOK, TASK or VALIDATION file under `test-data/`, or a file or folder name under `files/`, names a row |

These are mechanical. The decisions they force are not, so apply these rules to each
failure. They are meant to produce one decision per row, not an opinion:

| | Condition | Decision |
|---|---|---|
| **R1** | The row's test is unchanged and its files exist | **Keep.** Update the case's ID if it moved. |
| **R2** | A file serves no row and no Read Me requirement | **Remove** it, unless another row still needs that content, in which case **re-home** it and record where it went. |
| **R3** | The row is new, or its *How to Test* now names a file the data does not have | **Create** the file, or record why none is needed. |

## Which rewording counts

Only rewording that changes the **steps, or the files a test names**. Wording cleanup
does not. `verify.py` flags every change to a row's steps, cleanup included, because a
hash cannot tell the two apart. The review decides which kind each one is, and
`verify.py --stamp` records the decision. v7 changed the *How to Test* text of 35 rows, counting each Policy channel once,
almost all of it cleanup under one "All sheets" Change Log entry. Three of those changes
altered the files needed:

- *GenAI web chat* and *GenAI desktop apps* stopped using an image. The image upload
  became its own channel, *GenAI image upload*.
- *Severity tiers by match count* absorbed the unique-vs-total counting step, so its
  files now include the repeated-SSN and 100-distinct files.

A rewording can also keep the ID and change what is tested. v7's `U-06` went from *AI
review of user override justifications* to *Justification as a control, not a log
entry*, and the ID map marks it re-score. `verify.py` catches that one by name.

## What v7 needed, row by row

New rows in v7: *GenAI image upload* (three OS rows), the four AI Agent Activity rows,
*Approval workflow for enforcement changes*, and five End-User Experience rows. Three
needed files the data did not have:

- *Structured capture of agent sessions*, which needs a workspace and a task that make
  an agent read a PII file, run a command and edit a file. The other three AI Agent
  Activity rows reuse it.
- *Modify the action rather than stop it*, which needs a paste that is mostly prose, so
  the remainder can be seen arriving once the identifiers are redacted.
- *Intervention fatigue*, which needs 30 distinct files that trigger the same rule.

*GenAI image upload* needed no new file: it uses the OCR images. The rest are capability
questions with no payload.

**A review also finds gaps that predate the change.** Two v6 rows had no matching file in
the library, and neither changed in v7: *Obfuscation chained into one story* asks for a
password-protected zip, and *Alert grouping and deduplication* asks for 400 files. Both
have asked for those since the build scripts were first committed. Both gaps are now
filled. They are recorded here so they are not mistaken for v7 changes.

### Where the Enforcement sheet's data went

v7 deleted the Enforcement sheet. The Read Me line *Classification method matters for
blocking* keeps part of it: "When a Block passes on the Policy sheet, repeat it once with
content each of those methods identifies, and record the result in Notes." The methods
are exact data match, AI classification and origin, which are v6's `E-01`, `E-02` and
`E-04`. It does not cover `E-03`, `E-05` or `E-06`.

| v6 row | v7 home | Its data now |
|---|---|---|
| `E-01` Exact data match | Read Me requirement | `files/classification/exact-data-match/`, unchanged |
| `E-02` AI classification | Read Me requirement | Used the MSA set, `files/classification/ai-classification-msa/`, unchanged. The Read Me repeat uses the MNPI file below instead, because one payload with nothing a regex can match isolates AI classification from pattern matching. |
| `E-04` Data lineage / origin | Read Me requirement | `files/classification/lineage-obfuscation-chain/step3_zipped.zip`, unchanged |
| `E-03` AI classification with a cached verdict | none | Its file, `mnpi_500-words.txt`, moved to `files/block-method-checks/` and now serves the Read Me's AI-classification repeat. |
| `E-05` Behavioural / intent | none | Its 50,000-record export still serves *Behavioural baseline and deviation* and *Bulk CRM export detection*. |
| `E-06` Agentic / autonomous AI decisioning | none | Had no file. Nothing to move. |

## What the plan owes the review

Every build that changes rows should leave the Change Log complete: an entry for every
added, removed or merged row; an entry for rewording that changes the steps or the files
a test names; an ID-map row for every ID that differs from the previous version; and a
`re-score` note where an old result should not be copied forward. The ID map is the
quickest way to see what moved.

**It is not the only record.** The R2 object at the download URL is overwritten on
every publish, and the `v=` parameter is a cache-buster the downloads route never reads,
so the previous workbook cannot be fetched from the site. But the workbook is generated
from committed source, so any earlier version rebuilds from git:

```bash
git worktree add /tmp/plan-v6 22e0667
python3 /tmp/plan-v6/scripts/dlp-test-plan/build.py
```

There are no tags today, so finding that commit takes `git log`. Tagging the commit each
published version was built from (`test-plan-v7`, and so on) would make it a one-liner.

## Running the review

1. Make the plan change, then run `renumber.py`, `build.py` and `verify.py`.
2. For each test-data failure `verify.py` reports, apply R1, R2 or R3, and edit
   `test-data/cases.json`.
3. If you created or changed files, add or change the generator in `test-data/tools/`,
   run `tools/build.py refresh <stage>`, then `tools/validate.py`. It checks the files
   against dlptest.com's DLP patterns and RE2 engine, and rewrites `VALIDATION.md`.
4. Run `verify.py --stamp`. It records each row's current steps hash and sets
   `reviewed_for_version` to `VERSION`. Then re-run `verify.py`.

See [test-data/README.md](test-data/README.md) for the layout, and for the files that are
built locally rather than committed.
