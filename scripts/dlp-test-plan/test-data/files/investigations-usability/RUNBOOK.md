# Investigations and Usability

These two sheets are capability questionnaires, not payload tests. Most rows are answered
against incidents the Classification and Policy sheets already produced, or by asking the
vendor to demonstrate something, so run them last.

This runbook names rows by **capability**, not by ID. IDs move whenever a row is added
or removed; the current ID for each capability is in `../../cases.json`.

## Capabilities that need a payload

**Obfuscation chained into one story.** Run
`../classification/lineage-obfuscation-chain/` steps 0-2, then
`step3b_zipped-password-protected.zip` (password `TestPassword123`), then upload it. Pass =
one connected sequence in the console.

**Behavioural baseline and deviation.** Two weeks of normal activity, then the 100x
export: `../classification/bulk-crm-export/crm_export_50000-records.csv`.

**Sequence and scenario detection.** As one user, over about three days: visit two job
sites; copy `../classification/bulk-crm-export/crm_export_50000-records.csv` to the
desktop; upload `../policy/sensitive_customer_data.xlsx` to personal cloud storage; copy
`../policy/thirty_ssns.docx` to USB; paste `../policy/thirty_ssns_paste-block.txt` into a
GenAI chat. Pass = one risk case, not five alerts.

**Alert grouping and deduplication.** `alert-grouping-400-files/`: copy all 400 to USB
in one action and count the incidents.

**AI Agent Activity (four rows).** `agent-session-task/`; read its `TASK.md`.

**Modify the action rather than stop it.** `redaction-mixed-content.txt`: paste the
whole block. Pass = identifiers redacted, the rest arrives.

**Intervention fatigue.** `intervention-fatigue-30-files/`: 30 distinct files, same rule,
same user, one day.

**User-visible latency on common actions.** `paste-latency-500-records.txt`: time paste,
file save and USB copy with the agent on and off.

**AI builds business-specific classifiers for you.** Reuse the timing from
`../classification/ai-classification-msa/`.

Every other row on these two sheets needs no file; `cases.json` records each one as
such, with the reason.
