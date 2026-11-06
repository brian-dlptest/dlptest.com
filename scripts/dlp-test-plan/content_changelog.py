# Change Log sheet - newest version first.
#
# Deliberately NOT passed through renumber.py. An entry records row IDs as they were in
# that version; rewriting them on a later renumber would point an old entry at a different
# row, and a later cut would make renumber.py refuse to run over a "dangling" historical ID.
# verify.py checks entries for the CURRENT version only: each ID they cite must resolve to
# a live row whose name matches CITED below.
#
# (version, date, rows, change, why)

CHANGELOG = [
 (8, "2026-11-03", "P-C06 (all OS)",
  "The curl step now posts to dlptest.com/api/http-post/ over both http:// and https://. The browser step still uses the forms on dlptest.com/http-post/ and dlptest.com/https-post/.",
  "Those two URLs are the form pages. A direct POST to either one returns HTTP 405, so the curl step in v7 failed whether or not the tool acted. Re-score this row rather than copying the v7 result."),
 (7, "2026-10-09", "P-G01 (all OS)",
  "Image upload removed from the GenAI web chat test. It now covers paste and .csv upload.",
  "The row was testing two capabilities at once. Pulling text out of images is slow, so blocking on it is a separate and much harder capability, and it was pulling down a Table stakes row."),
 (7, "2026-10-09", "P-G07 (all OS)",
  "New channel: GenAI image upload. Advanced on Windows, Differentiator on macOS and Linux.",
  "The image half of P-G01, tested on its own. Block timing records whether the block landed before the upload completed."),
 (7, "2026-10-09", "P-P01 (all OS)",
  "Added: score Partial if only the copy variant is covered.",
  "Makes explicit how to score a tool that handles a plain copy but not Save As straight to the drive."),
 (7, "2026-10-09", "C-A07, C-C03, I-15, I-17, U-04, U-07, U-08",
  "Re-tiered from Differentiator to Advanced.",
  "These capabilities are now common in mature products, so they no longer meet the Differentiator definition of \"few products do this well\"."),
 (7, "2026-10-09", "U-17, U-18",
  "U-17 narrowed to separation of duties. The approval workflow for enforcement changes is now its own row, U-18 (Advanced).",
  "The row bundled a basic control with an approval workflow, so one capability could fail a product on a Table stakes row."),
 (7, "2026-10-09", "U-05",
  "Pass now requires a count of would-be blocks calculated from real historical activity.",
  "Previewing what an intervention will look like is not simulation."),
 (7, "2026-10-09", "U-06",
  "Reworked as \"Justification as a control, not a log entry\". Differentiator to Advanced.",
  "The old row demanded one implementation; this one accepts several, and makes free text the requirement."),
 (7, "2026-10-09", "U-22 to U-26",
  "New End-User Experience rows: working redirect to the sanctioned alternative, request approval before proceeding, time-bound exceptions, modify the action rather than stop it, and intervention fatigue.",
  "Tests the options between allowing and blocking, and whether a prompt keeps its meaning when it is shown repeatedly."),
 (7, "2026-10-09", "I-28 to I-31",
  "New Investigations area, AI Agent Activity: agent and tool inventory, structured capture of agent sessions, agent / person / account attribution, and MCP servers and sub-agents.",
  "You cannot govern agents you do not know are running, and an open AI app says nothing about what the agent did."),
 (7, "2026-10-09", "Policy sheet",
  "New Block timing column on every row: Inline, After the fact or Not blocked.",
  "Records whether a block landed before the data left. Not scored, so it changes no coverage figure."),
 (7, "2026-10-09", "Read Me",
  "Fixed three glossary pointers: Agentic browser and MTP / PTP pointed at the wrong rows, and WSL described a channel cut in v3 (entry removed). Replaced a legend entry still describing the Yes / No scoring retired in v2.",
  "Glossary pointers are now looked up by row name when the workbook is built, so they cannot drift onto another row again."),
 (7, "2026-10-09", "C-A05",
  "Unique vs total match counting (C-A05 in v6) is now the first step of the severity tiers row, which is C-A05 in v7.",
  "C-A05 duplicated the first step of the unique-match tiering row."),
 (7, "2026-10-09", "C-A06",
  "Rewrote what the confidence test measures and its expected result, which no longer names specific confidence values.",
  "The confidence expected result assumed one numbering scheme."),
 (7, "2026-10-09", "P-G01, P-G02, P-G04 (all OS)",
  "Rewrote the test steps so any control within the product under test counts, whatever its mechanism.",
  "P-G01, P-G02 and P-G04 now test outcomes rather than mechanisms."),
 (7, "2026-10-09", "Enforcement sheet",
  "Removed the Enforcement sheet; its six rows are listed in the ID map below. Investigations and Usability are now sheets 3 and 4. A new Read Me line asks you to repeat a passing Block with content identified by exact data match, AI classification or origin.",
  "The Enforcement sheet overlapped the Block timing column and favoured particular architectures."),
 (7, "2026-10-09", "Read Me",
  "New guidance: Check Linux first, Short on time, Endpoint controls only, and Classification method matters for blocking.",
  "The new Read Me lines help evaluators prioritise."),
 (7, "2026-10-09", "All sheets, including C-C02, C-D03, C-D04, I-10 and I-28",
  "Rewrote unsupported claims and one-line sayings, marked optional checks as not required for Pass, and replaced spaced dashes and emphasis caps.",
  "Wording cleanup: unsupported claims removed, optional checks marked as not required for Pass, and dashes and emphasis caps removed."),
 (7, "2026-10-09", "Read Me",
  "The regex test-data line printed raw template code instead of a row ID; it now prints C-B01. The Linux note now says Fail or blank, and refers to Linux rows rather than columns.",
  "The template bug and the stale \"No\" wording are fixed."),
 (7, "2026-10-09", "See ID map",
  "Row IDs changed in Classification and Usability, and rows were added or removed on other sheets. The ID map below lists every row whose ID differs from v6.",
  "New rows were placed in their areas and removed rows closed their gaps, and IDs follow sheet position. The map lets a scored v6 workbook be ported to v7 by lookup."),
]

# Row names for every ID the current version's entries cite (rows, change and why). The
# entries hold literal IDs and renumber.py leaves this file alone, so a renumber within
# the version would leave an entry naming whatever row now has that number. verify.py
# fails if a cited ID is missing here, or if the workbook's name for it differs; fix the
# entry's ID by hand, and the key here with it. Policy IDs are cited by base, so the name
# has no OS. An entry that names an earlier version's row writes it as "C-A05 in v6";
# that ID is not checked and is not recorded here. Empty this when VERSION goes up: older
# entries keep the IDs they had and are not checked.
CITED = {
 "P-C06": "HTTP and HTTPS POST to an arbitrary endpoint",
}

# ID map from the previous version, so a scored workbook can be ported by lookup:
# (previous ID, current ID, row name). "New" / "Removed" mark added and cut rows. A row
# can also appear with an unchanged ID when it was reworded enough that its old result
# should be re-scored rather than copied; its name says so.
# IDMAP_FROM is (previous version, its row count); verify.py checks the map reconciles:
# previous rows - removed + new == current rows.
# The row name is checked too: verify.py fails if a current ID no longer names that row,
# which is what a renumber within the version does, since renumber.py leaves this file
# alone. Fix the ID by hand; the failure says where the row went. Write the name as the
# sheet does, with "(<OS>)" on Policy rows; a trailing "(...)" note is allowed after it.
IDMAP_FROM = (7, 174)
IDMAP = [
 ("P-C06.Windows", "P-C06.Windows", "HTTP and HTTPS POST to an arbitrary endpoint (Windows) (curl step now targets /api/http-post/; re-score, do not copy the v7 result)"),
 ("P-C06.macOS", "P-C06.macOS", "HTTP and HTTPS POST to an arbitrary endpoint (macOS) (curl step now targets /api/http-post/; re-score, do not copy the v7 result)"),
 ("P-C06.Linux", "P-C06.Linux", "HTTP and HTTPS POST to an arbitrary endpoint (Linux) (curl step now targets /api/http-post/; re-score, do not copy the v7 result)"),
]
