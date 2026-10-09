# Change Log sheet - newest version first.
#
# Deliberately NOT passed through renumber.py. An entry records row IDs as they were in
# that version; rewriting them on a later renumber would point an old entry at a different
# row, and a later cut would make renumber.py refuse to run over a "dangling" historical ID.
# verify.py checks only that entries for the CURRENT version resolve to live rows.
#
# (version, date, rows, change, why)

CHANGELOG = [
 (7, "2026-10-09", "P-G01 (all OS)",
  "Image upload removed from the GenAI web chat test. It now covers paste and .csv upload.",
  "The row was testing two capabilities at once. Pulling text out of images is slow, so blocking on it is a separate and much harder capability, and it was pulling down a Table stakes row."),
 (7, "2026-10-09", "P-G07 (all OS)",
  "New channel: GenAI image upload. Advanced on Windows, Differentiator on macOS and Linux.",
  "The image half of P-G01, tested on its own. Block timing records whether the block landed before the upload completed."),
 (7, "2026-10-09", "P-P01 (all OS)",
  "Added: score Partial if only the copy variant is covered.",
  "Makes explicit how to score a tool that handles a plain copy but not Save As straight to the drive."),
 (7, "2026-10-09", "C-A08, C-C03, E-05, I-15, I-17, U-04, U-07, U-08",
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
  "You cannot govern agents you do not know are running, and knowing an AI app was open is not the same as knowing what it did."),
 (7, "2026-10-09", "Policy sheet",
  "New Block timing column on every row: Inline, After the fact or Not blocked.",
  "Records whether a block landed before the data left. Not scored, so it changes no coverage figure."),
 (7, "2026-10-09", "U-19 to U-31",
  "Renumbered. U-18 to U-20 are now U-19 to U-21, and U-21 to U-25 are now U-27 to U-31.",
  "New rows were placed in their areas, and IDs follow sheet position."),
 (7, "2026-10-09", "Read Me",
  "Fixed three glossary pointers: Agentic browser and MTP / PTP pointed at the wrong rows, and WSL described a channel cut in v3 (entry removed). Replaced a legend entry still describing the Yes / No scoring retired in v2.",
  "Glossary pointers are now looked up by row name when the workbook is built, so they cannot drift onto another row again."),
]
