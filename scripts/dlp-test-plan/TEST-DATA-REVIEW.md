# Test data review — required on every test plan change

**Rule: a change to the test plan is not finished until the test data library has been
reviewed against it.** Adding, removing, retiering or rewording a row can change what
files a tester needs. The workbook names the files it wants; it does not ship them.

This is step 4 of the workflow in [README.md](README.md). It is not optional, and it is
not a tidy-up for later — a library that points at the wrong rows is worse than no
library, because the row IDs still resolve and the mistake is invisible.

## Why this exists

The plan tells a tester to "send a file containing 25 SSNs" or "zip it with a password"
but ships no such file, so a test data library is maintained alongside it (see
[Where the library lives](#where-the-library-lives)). That library is keyed by row ID.

Row IDs are **regenerated on every build** — `renumber.py` assigns them by sheet
position, so inserting one row shifts every ID below it. A library folder named
`C-A09_ocr-on-images` keeps resolving after OCR moves to `C-A09`→`C-A10`; it just points
at the wrong test now, and nothing errors.

The v6 → v7 change is the worked example. It renumbered six Classification rows, merged
one row into another, deleted an entire sheet, and added thirteen rows. Four of those
additions needed files that did not exist. None of it would have surfaced on its own.

**There is no way to diff the workbook against its predecessor after the fact.** The `v=`
parameter on the download URL is a cache-buster, not a version selector (see
[README.md § Publishing](README.md#publishing)) — `&v=6` serves whatever the current
object is. Once a new workbook is uploaded, the previous one is gone. The Change Log
sheet and its ID map are therefore the *only* record of what moved, which is why the
next section is a hard requirement rather than a nicety.

## What the plan owes the library

Every build that changes rows must leave the Change Log complete, because the library
migration is driven from it, not from a reconstruction:

- an entry for every added, removed, merged or reworded row, with the reason;
- an **ID map** row for every ID that differs from the previous version, including
  `Removed` and `New` entries;
- a `re-score` note on any row whose wording changed enough that an old result should
  not be copied forward.

If the ID map is incomplete, the library cannot be migrated mechanically and someone has
to diff 174 rows by hand.

## The review

Work through every changed row and apply these three rules. They are meant to be
mechanical — the output is a decision per row, not an opinion.

| | Condition | Decision |
|---|---|---|
| **R1** | The row's test is unchanged and a payload already exists | **Keep.** Rename the folder if the ID moved. |
| **R2** | A payload's row no longer exists in the new version | **Remove** — unless another row still requires that exact content, in which case **re-home** it and say where it went. |
| **R3** | The row is new, or its *How to Test* names an artefact the library does not have | **Create.** |

R3 is the one that gets missed, and it is not only about new rows. A reworded *How to
Test* on an existing row can create a need: v7 left `I-08` in place but changed "zip it"
to "zip it **with a password**", which no file in the library satisfied.

Two traps worth naming:

- **A new row does not always mean new data.** v7 added `P-G07` (GenAI image upload), but
  it reuses the OCR images that were already there. The manifest changed; the library
  did not.
- **A deleted sheet does not always mean deleted data.** v7 removed the Enforcement
  sheet, but its question survived as a Read Me instruction ("repeat a passing Block with
  content identified by exact data match, AI classification or origin"), so its payloads
  were re-homed rather than deleted.

## Finishing the review

- Regenerate the library's manifest so every row ID in the new version maps to a file or
  to an explicit "no file needed, because…". The manifest build asserts that every ID on
  every sheet appears exactly once; an unmapped row fails it.
- Re-run the library's validation pass. Payloads are validated against the published
  regex library through the MCP server, and renaming a folder breaks those paths.
- Fix cross-references. Folder names, per-folder READMEs and the manifest all carry row
  IDs, and all three drift independently.

## Where the library lives

Not in this repo — it is ~14 MB of synthetic payloads, including credential-shaped
strings that GitHub push protection rejects (see [CLAUDE.md](../../CLAUDE.md)). It is
built and kept locally, alongside a `_generation/` folder holding the scripts and the raw
generator responses, so it can be rebuilt or migrated from source.

Ask the maintainer for the current location rather than assuming a path; what matters
here is that **the review happens**, and that the Change Log is complete enough for
whoever holds the library to act on it.
