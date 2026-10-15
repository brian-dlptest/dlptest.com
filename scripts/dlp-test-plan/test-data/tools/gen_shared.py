"""Shared payloads: the Policy channels, the block-method repeat check, and the handful of
Investigations / Usability rows that need a file.

Most Policy rows test a channel rather than new content, so a few payloads serve many
rows. Which rows use which file is recorded in ../cases.json, not here.
"""
import json
import os
import shutil

import docgen as dg
import gen_ip
import mcp_client as mcp

POL = "files/policy"
BLK = "files/block-method-checks"
IU = "files/investigations-usability"


def _ssns(n, tag):
    return mcp.csv_rows(mcp.save("%s.csv" % tag, mcp.call(
        "generate_pii_ssn_dob", {"count": n, "format": "csv"})))


# --------------------------------------------------------------------- policy
def build_policy_payloads():
    h, rows = _ssns(30, "thirty-ssns")
    body = ["Customer verification batch - 30 records",
            "Copy everything below this line and paste it into the destination under test.",
            "-" * 64, ""]
    body += ["%-24s  %-11s  %s" % (r[0], r[1], r[2]) for r in rows]
    body += ["", "-" * 64, "End of batch. 30 records, 30 distinct SSNs."]
    dg.write_text(f"{POL}/thirty_ssns_paste-block.txt", "\n".join(body))
    dg.write_docx(f"{POL}/thirty_ssns.docx", "Customer Verification Batch",
                  ["Confidential. 30 customer records with Social Security Numbers."],
                  table=(h, rows))

    h50, rows50 = _ssns(50, "fifty-ssns")
    dg.write_docx(f"{POL}/fifty_ssns_for_print-test.docx", "Member Roster - Print Test",
                  ["50 records, long enough to span more than one printed page so the "
                   "incident has a page count to report."], table=(h50, rows50))

    hc, rc = mcp.csv_rows(mcp.save("customers.csv", mcp.call("generate_custom", {
        "fields": [{"name": "Customer ID", "type": "row-number"},
                   {"name": "Full Name", "type": "full-name"},
                   {"name": "SSN", "type": "ssn"},
                   {"name": "Date of Birth", "type": "dob"},
                   {"name": "Email", "type": "email"},
                   {"name": "Phone", "type": "phone"},
                   {"name": "Credit Card", "type": "credit-card"},
                   {"name": "Card Expiry", "type": "card-expiry"},
                   {"name": "Billing ZIP", "type": "zip"}],
        "count": 250, "format": "csv"})))
    dg.write_xlsx(f"{POL}/sensitive_customer_data.xlsx", [("Customers", hc, rc)])

    # The offline scripts embed only the names. SSNs, dates of birth and a run ID are
    # generated when the script runs, so every run writes content no agent has seen.
    names = "\n".join(r[0] for r in rows)
    dg.write_text(f"{POL}/offline_make-fresh-file.sh", OFFLINE_SH.replace("{NAMES}", names))
    os.chmod(dg.path("files", "policy", "offline_make-fresh-file.sh"), 0o755)
    dg.write_text(f"{POL}/offline_make-fresh-file.ps1", OFFLINE_PS1.replace("{NAMES}", names))
    dg.write_text(f"{POL}/README.md", POLICY_README)


def build_git_repo():
    """A repository with a live-looking secret in it, for the IDE-assistant and git-push
    channels. Credential-shaped and a nested .git, so it is built into generated/."""
    secrets = json.load(open(os.path.join(mcp.RAW_DIR, "secrets.json")))
    by_id = {s["id"]: s["sample"] for s in secrets}
    folder = "generated/policy/git-repo-with-api-key"
    root = os.path.dirname(dg.path(folder, ".keep"))
    if os.path.isdir(root):
        shutil.rmtree(root)
    os.makedirs(root)
    files = {
        "config.py": CONFIG_PY % (by_id["aws-access-key-id"], by_id["aws-secret-key"],
                                  by_id["stripe-secret-key"], by_id["generic-api-key"],
                                  by_id["password-in-url"]),
        "settlement.py": SETTLEMENT_PY,
        "README.md": REPO_README,
    }
    for name, content in files.items():
        with open(os.path.join(root, name), "w") as fh:
            fh.write(content)
    gen_ip._git_repo(folder, "git@git.internal.example.com:platform/settlement-gateway.git",
                     ".gitignore", "__pycache__/\n*.pyc\n.env\n",
                     "platform: settlement netting + gateway config")


# --------------------------------------------------------------------- block method
def build_block_method_checks():
    _, rows = mcp.csv_rows(mcp.save("mnpi-identifiers.csv", mcp.call("generate_custom", {
        "fields": [{"name": "Full Name", "type": "full-name"},
                   {"name": "SSN", "type": "ssn"},
                   {"name": "Routing Number", "type": "routing-number"},
                   {"name": "Account Number", "type": "account-number"}],
        "count": 3, "format": "csv"})))
    dg.write_text(f"{BLK}/mnpi_500-words.txt", MNPI_500)
    # The contrast case is the same memo with identifiers embedded in it, so the only
    # difference between the two files is something a regex can find.
    head, tail = MNPI_500.split(MNPI_SPLIT)
    identifiers = MNPI_IDENTIFIERS.format(
        r0=rows[0][2], a0=rows[0][3], r1=rows[1][2], a1=rows[1][3],
        n0=rows[0][0], s0=rows[0][1], n1=rows[1][0], s1=rows[1][1],
        n2=rows[2][0], s2=rows[2][1])
    dg.write_text(f"{BLK}/mnpi_narrative_with-identifiers.txt",
                  head + identifiers + "\n\n" + MNPI_SPLIT + tail)
    dg.write_text(f"{BLK}/README.md", BLOCK_README)


# --------------------------------------------------------------------- investigations / usability
def _distinct_ssn_rows(n, tag):
    """`n` rows with distinct SSNs. The server caps a pull at 500 rows."""
    rows, seen, pulls = [], set(), 0
    while len(rows) < n:
        pulls += 1
        assert pulls <= n // 400 + 3, "could not collect %d distinct SSNs" % n
        _, batch = _ssns(min(500, n - len(rows) + 20), "%s-%d" % (tag, pulls))
        for r in batch:
            if r[1] not in seen:
                seen.add(r[1])
                rows.append(r)
    return rows[:n]


def build_alert_grouping():
    d = f"{IU}/alert-grouping-400-files"
    # 3 rows per file and no reuse, so all 400 files differ: a product that groups by
    # content hash must not be able to collapse them.
    rows = _distinct_ssn_rows(1200, "alert-grouping")
    blobs = {tuple(map(tuple, rows[i * 3:i * 3 + 3])) for i in range(400)}
    assert len(blobs) == 400, "alert-grouping files are not all distinct"

    def write(tmp):
        for i in range(400):
            dg.write_csv("%s/customer_record_%03d.csv" % (tmp, i + 1),
                         ["full_name", "ssn", "dob"], rows[i * 3:i * 3 + 3])
        dg.write_text(f"{tmp}/README.txt", ALERT_GROUPING_README)
    dg.replace_dir(d, write)


def build_intervention_fatigue():
    d = f"{IU}/intervention-fatigue-30-files"
    rows = _distinct_ssn_rows(90, "intervention-fatigue")

    def write(tmp):
        for i in range(30):
            dg.write_csv("%s/attempt_%02d.csv" % (tmp, i + 1), ["full_name", "ssn", "dob"],
                         rows[i * 3:i * 3 + 3])
        dg.write_text(f"{tmp}/README.txt", INTERVENTION_README)
    dg.replace_dir(d, write)


def build_redaction_payload():
    """Redaction needs a remainder to arrive. Every other paste payload here is pure
    identifiers, where a successful redaction looks identical to a plain block."""
    prose = mcp.save("redaction-prose.txt", mcp.call("generate_prompt_context", {
        "scenario": "customer-list", "count": 3, "format": "text"}))
    _, rows = _ssns(6, "redaction")
    accounts = "\n".join("    %s  SSN %s  DOB %s" % (r[0], r[1], r[2]) for r in rows)
    dg.write_text(f"{IU}/redaction-mixed-content.txt", REDACTION % (accounts, prose.strip()))


def build_agent_session_task():
    d = f"{IU}/agent-session-task"
    _, rows = _ssns(12, "agent-session")
    dg.write_csv(f"{d}/workspace/data/customers_export.csv", ["full_name", "ssn", "dob"], rows)
    dg.write_text(f"{d}/workspace/reconcile.py", RECONCILE_PY)
    dg.write_text(f"{d}/workspace/notes.md",
                  "# Reconciliation notes\n\nThe export in `data/` is a customer extract. It "
                  "should not leave this\nworkspace. `reconcile.py` is unfinished.\n")
    dg.write_text(f"{d}/TASK.md", AGENT_TASK)


def build_paste_latency():
    _, rows = mcp.csv_rows(mcp.save("paste-latency.csv", mcp.call(
        "generate_pii_ssn_ccn", {"count": 500, "format": "csv"})))
    block = ["Paste-latency payload - 500 records with SSN and card number.",
             "Time the paste. Anything a user can perceive will be escalated.", ""]
    block += ["%-26s  %-11s  %s" % (r[0], r[1], r[2]) for r in rows]
    dg.write_text(f"{IU}/paste-latency-500-records.txt", "\n".join(block))


def run_local():
    """generated/ only - the git-push repository. Needs gen_ip.run_local() first."""
    build_git_repo()


def run():
    build_policy_payloads()
    build_git_repo()
    build_block_method_checks()
    build_alert_grouping()
    build_intervention_fatigue()
    build_redaction_payload()
    build_agent_session_task()
    build_paste_latency()
    dg.write_text(f"{IU}/RUNBOOK.md", RUNBOOK)


# ===================================================================== text

POLICY_README = """# Policy payloads

Almost every Policy row tests a CHANNEL rather than new content, so the payloads below
are reused across many rows and all three operating systems. The row-by-row mapping is
in `../../cases.json`.

| File | Used for |
|---|---|
| `thirty_ssns_paste-block.txt` | every paste channel: GenAI chat, webmail body, messaging, clipboard, RDP clipboard, HTTP POST body, paste sites |
| `thirty_ssns.docx` | the small-file channels: messaging, MTP, Bluetooth, AirDrop |
| `sensitive_customer_data.xlsx` | the main attachment: webmail, cloud storage, FTP/SFTP, browsers, USB, SMB, RDP drive, VPN |
| `fifty_ssns_for_print-test.docx` | printing: long enough to span pages, so the incident has a page count |
| `offline_make-fresh-file.sh` | fully offline enforcement on macOS and Linux: writes a never-evaluated file with no network |
| `offline_make-fresh-file.ps1` | the same on Windows: `powershell -ExecutionPolicy Bypass -File .\\offline_make-fresh-file.ps1` |

Built locally with `tools/build.py local`, not committed (see `../../README.md`):

| File | Used for |
|---|---|
| `generated/policy/git-repo-with-api-key/` | the AI coding assistant and git-push channels: a repository with a live-looking secret in it |

Payloads that live under a Classification folder because that test owns them:

| Need | File |
|---|---|
| GenAI upload, small CSV | `../classification/bulk-crm-export/crm_export_20-records_negative-control.csv` |
| GenAI image upload | `../classification/ocr-on-images/ssn_table_screenshot.png`, then `ssn_table_photo-quality.jpg` |
| Screen capture | display `../classification/ocr-on-images/ssn_table_highres.png` full screen and capture it |
| Chunked multipart upload | `../classification/bulk-crm-export/crm_export_50000-records.csv` |
| Agentic browser | `../classification/phi-hipaa/phi_patient_encounter_summary.docx` |

Record the **Block timing** for every Block you test (Inline / After the fact / Not
blocked). It matters most for image uploads, where text extraction can be slow enough
that a block lands after the upload has finished.
"""

BLOCK_README = """# Block-method repeat check

The Read Me's *Classification method matters for blocking* line asks: "When a Block passes
on the Policy sheet, repeat it once with content each of those methods identifies, and
record the result in Notes." The methods it names are exact data match, AI classification
and origin. This folder is that repeat, one payload per method:

| Method | Repeat the Block with |
|---|---|
| Exact data match | `../classification/exact-data-match/edm_test-upload_50in-50out.csv` |
| AI classification | `mnpi_500-words.txt` (here) |
| Origin / lineage | `../classification/lineage-obfuscation-chain/step3_zipped.zip` |

`mnpi_500-words.txt` contains nothing a regex can match - no SSN, card number, email or
MRN - so a tool that blocks it is not pattern matching. `mnpi_narrative_with-identifiers.txt`
is the contrast case: the same memo with one paragraph added that carries two bank routing
and account numbers and three SSNs. The only difference between the two files is
something a regex can find.
"""

MNPI_500 = """CONFIDENTIAL - PRE-ANNOUNCEMENT MEMORANDUM
Acme Financial Holdings, Inc. - Finance and Investor Relations
Circulation: insider list only

This memorandum summarises the fourth quarter before the results are released, and is
material nonpublic information until the release crosses the wire at 16:05 ET on
4 February 2027.

Revenue for the quarter was $412.7 million against guidance of $395-405 million, an
increase of 18.4 per cent year over year. The beat was concentrated in Payments, which
grew 21 per cent, and was helped by roughly $6 million of revenue that landed in the
quarter rather than the next one because two enterprise renewals signed earlier than
forecast. Investor Relations should expect that question and should not characterise the
beat as wholly organic.

Non-GAAP operating margin was 21.7 per cent, up 310 basis points. Roughly 70 basis
points of the expansion is a hiring lag rather than durable leverage; the FY27 plan
assumes that reverses in the first half. Free cash flow of $284.6 million represents 92
per cent conversion.

Three items in this memorandum are not yet public and are the reason for its
classification. First, the Board has authorised a $250 million share repurchase
programme, to be announced concurrently with the release. Second, the Board has approved
a goodwill impairment of $47.2 million relating to the 2024 acquisition, which will be
recorded in the fourth quarter and will reduce GAAP operating income accordingly.
Third, diligence on Project Kingfisher is complete and the SPA is in drafting, with
signing targeted for the week of 22 March 2027 at an enterprise value of approximately
EUR 340 million.

Guidance for the first quarter will be given as revenue of $421-431 million and non-GAAP
operating margin of 21.0-22.0 per cent. Full year guidance will be $1.78-1.81 billion.
Both ranges were set deliberately wide because the Kingfisher close date is uncertain
and no contribution from it is included.

The FY27 plan assumes headcount of 3,140, up from 2,905. Separately, Project Nettlebed
modelling contemplates a 6 to 9 per cent workforce reduction in the second half if the
Payments growth rate falls below 14 per cent for two consecutive quarters. That
modelling has not been shared outside the executive team and must not be referenced in
any external communication.

Two further matters are for the Audit Committee only. The external auditor has raised a
significant deficiency in revenue cut-off controls arising from the early renewals
described above. Management does not expect it to rise to a material weakness, but that
conclusion will not be final until the audit opinion is signed. In addition, the largest
Payments customer has given informal notice that it will run a competitive tender when
its contract term ends next year. The account represented roughly eleven per cent of
fourth-quarter revenue, and its loss is not reflected in the guidance ranges above.
Neither matter may be discussed with analysts, investors or the press.

Recipients are reminded that they are on the Company's insider list and are subject to
dealing restrictions until the second trading day after the release.
"""

MNPI_SPLIT = "Recipients are reminded"

MNPI_IDENTIFIERS = """Settlement instructions for the repurchase programme are attached for Treasury. The
broker will draw on the operating account at routing number {r0}, account {a0}, and
the Kingfisher escrow is held at routing number {r1}, account {a1}. Pre-clearance for
the plan amendments has been granted to three insiders, identified to the transfer
agent by Social Security number: {n0} (SSN {s0}), {n1} (SSN {s1}) and {n2}
(SSN {s2})."""

OFFLINE_SH = """#!/bin/bash
# Fully offline enforcement - macOS and Linux. On Windows use offline_make-fresh-file.ps1.
#
# Run this with networking DISABLED, then immediately copy the file it writes to a USB
# drive. Every run writes content no agent has evaluated before: the SSNs and dates of
# birth are generated here at run time and a run ID is stamped into the file, so there is
# no prior verdict - for the file or for its contents - to reuse from a cache.

RUN_ID="$(date +%s)-$$-$RANDOM"
OUT="fresh_30_ssns_${RUN_ID}.txt"
{
  echo "Customer verification batch - created offline, never evaluated"
  echo "Run ID: ${RUN_ID}"
  echo
  while IFS= read -r NAME; do
    # SSN area 001-665: never 000, 666 or the 9xx range, so every value is well formed.
    printf '%-24s  %03d-%02d-%04d  %d/%d/%d\n' "$NAME" \
      $(( RANDOM % 665 + 1 )) $(( RANDOM % 99 + 1 )) $(( RANDOM % 9999 + 1 )) \
      $(( RANDOM % 12 + 1 )) $(( RANDOM % 28 + 1 )) $(( RANDOM % 50 + 1950 ))
  done <<'NAMES'
{NAMES}
NAMES
} > "$OUT"
echo "wrote $OUT"
"""

OFFLINE_PS1 = """# Fully offline enforcement - Windows. On macOS and Linux use offline_make-fresh-file.sh.
#
#   powershell -ExecutionPolicy Bypass -File .\\offline_make-fresh-file.ps1
#
# Run this with networking DISABLED, then immediately copy the file it writes to a USB
# drive. Every run writes content no agent has evaluated before: the SSNs and dates of
# birth are generated here at run time and a run ID is stamped into the file, so there is
# no prior verdict - for the file or for its contents - to reuse from a cache.

$runId = "{0}-{1}-{2}" -f [DateTimeOffset]::UtcNow.ToUnixTimeSeconds(), $PID, (Get-Random -Maximum 100000)
$out = "fresh_30_ssns_$runId.txt"
$names = @'
{NAMES}
'@ -split "`r?`n" | Where-Object { $_ }

$lines = @("Customer verification batch - created offline, never evaluated", "Run ID: $runId", "")
foreach ($name in $names) {
    # SSN area 001-665: never 000, 666 or the 9xx range, so every value is well formed.
    $ssn = "{0:D3}-{1:D2}-{2:D4}" -f (Get-Random -Minimum 1 -Maximum 666), (Get-Random -Minimum 1 -Maximum 100), (Get-Random -Minimum 1 -Maximum 10000)
    $dob = "{0}/{1}/{2}" -f (Get-Random -Minimum 1 -Maximum 13), (Get-Random -Minimum 1 -Maximum 29), (Get-Random -Minimum 1950 -Maximum 2000)
    $lines += "{0,-24}  {1}  {2}" -f $name, $ssn, $dob
}
Set-Content -Path $out -Value $lines -Encoding UTF8
Write-Output "wrote $out"
"""

ALERT_GROUPING_README = """Alert grouping and deduplication

400 small files, each holding 3 customer records with SSNs. Each one matches a plain SSN
rule on its own, and no two files are alike: all 1,200 SSNs are distinct, so a product
cannot collapse the files by content hash.

Select all 400 and copy them to a USB drive IN ONE ACTION, then count the incidents.

  Pass     one case, or one incident with a count of 400
  Partial  grouped, but only after a delay or a manual merge
  Fail     400 separate alerts

Leave this README out of the selection; it is not a sensitive file.
"""

INTERVENTION_README = """Intervention fatigue

30 files, each matching the SAME rule. Move them one at a time through the same blocked
or warned channel, as the same user, within one day.

  Fail     an identical prompt all 30 times
  Partial  the prompt changes or is suppressed, but an administrator cannot see or tune it
  Pass     the tool suppresses, escalates or adapts, and an admin can see and tune the
           frequency

They are 30 distinct files rather than 30 copies of one on purpose: a tool that
deduplicates on file hash would suppress the prompt for the wrong reason.
"""

CONFIG_PY = '''"""Settlement gateway configuration.

Acme Financial - platform team. Internal use only.
"""
import os

# Production credentials. Rotated quarterly; see the platform runbook.
AWS_ACCESS_KEY_ID = "%s"
AWS_SECRET_ACCESS_KEY = "%s"
STRIPE_SECRET_KEY = "%s"
SETTLEMENT_API_KEY = "%s"
DATABASE_URL = "%s"

SETTLEMENT_ENDPOINT = "https://settlement.internal.example.com/v3"
LEDGER_PARTITION_KEY = "prod-ledger-us-east-1"


def credentials() -> dict:
    """Resolve credentials, preferring the environment over these defaults."""
    return {
        "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID", AWS_ACCESS_KEY_ID),
        "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY", AWS_SECRET_ACCESS_KEY),
        "stripe_secret_key": os.getenv("STRIPE_SECRET_KEY", STRIPE_SECRET_KEY),
        "settlement_api_key": os.getenv("SETTLEMENT_API_KEY", SETTLEMENT_API_KEY),
    }
'''

SETTLEMENT_PY = '''"""Proprietary settlement netting - Acme Financial platform team."""
from decimal import Decimal
from typing import Iterable, NamedTuple


class Leg(NamedTuple):
    counterparty: str
    currency: str
    amount: Decimal
    value_date: str


def net(legs: Iterable[Leg]) -> dict:
    """Net legs by counterparty and currency within a single value date. A counterparty
    in arrears on a previous window is excluded from netting until the arrears clear."""
    buckets: dict = {}
    for leg in legs:
        key = (leg.counterparty, leg.currency, leg.value_date)
        buckets[key] = buckets.get(key, Decimal("0")) + leg.amount
    return {k: v for k, v in buckets.items() if v != 0}
'''

REPO_README = """# settlement-gateway

Internal Acme Financial service. Not open source. Not for distribution.

`config.py` contains live-looking credentials, so there is content to match on, and the
remote is a corporate origin, so there is a destination to judge.

- AI coding assistant: open both files in an IDE with an assistant attached, let it index
  the workspace, and accept an inline completion.
- Git push: push this repository to a corporate org, a personal account, then an unknown
  remote. Only the destination differs; the corporate push must pass silently.
"""

REDACTION = """Modify the action rather than stop it

Paste this whole block into an unsanctioned destination. Most of it is ordinary business
prose that should arrive intact; only the identifiers should be removed.

----------------------------- paste from here -----------------------------

Team,

Following up on yesterday's call about the Q4 migration. The short version is that we
are on track for the 14th, with two caveats worth flagging before we commit publicly.

First, the data mapping took longer than planned because the legacy export does not
carry a stable key. We worked around it, but it means the reconciliation step is manual
for the first cycle. Second, the vendor has asked for a named contact for escalations
during the cutover weekend, which we have not yet agreed internally.

The six accounts flagged for manual review during reconciliation are:

%s

Everything else reconciled automatically. I have asked Priya to own the escalation
contact question and come back by Thursday, and I will circulate the revised runbook
once the vendor confirms the maintenance window. No action needed from anyone else
before then.

Thanks,
Dan

%s

------------------------------ to here ------------------------------

  Pass      the identifiers are removed and the rest of the message arrives
  Partial   the whole paste is blocked
  Fail      the paste completes with the identifiers intact
"""

RECONCILE_PY = '''"""Reconcile the customer export against the ledger.

Deliberately incomplete: the agent has to edit this file to finish the task.
"""
import csv
import sys


def load(path):
    with open(path) as fh:
        return list(csv.DictReader(fh))


def summarise(records):
    # TODO: return a dict with the record count and the number of distinct SSNs
    raise NotImplementedError


if __name__ == "__main__":
    records = load(sys.argv[1] if len(sys.argv) > 1 else "data/customers_export.csv")
    print(summarise(records))
'''

AGENT_TASK = """# Agent session task

Give an AI coding agent the `workspace/` folder and this exact task:

> In `workspace/`, read `notes.md` and `data/customers_export.csv`, implement the
> `summarise` function in `reconcile.py` so it returns the record count and the number of
> distinct SSNs, then run `python reconcile.py` and tell me the output.

That one instruction produces, in a single session:

- a **file read** of a file containing live-looking PII
- a **shell command** (`python reconcile.py`)
- a **file edit** (`reconcile.py`)
- a **prompt and response** pair

## The AI Agent Activity rows it serves

- **Agent and tool inventory**: before running anything, ask for the inventory of agents,
  assistants, local model runtimes, plugins and MCP servers the tool found.
- **Structured capture of agent sessions**: run the task. Pass = the prompt, responses,
  each tool call and command, and each file change recorded as structured events tied to
  ONE session, not only as process activity.
- **Agent, person and account attribution**: re-run signed in with a personal account,
  then with an API key, and check which identity the actions are attributed to.
- **Agent tool chain: MCP servers and sub-agents**: point the agent at an MCP server with
  filesystem access and confirm each call is recorded with its input and output.
"""

RUNBOOK = """# Investigations and Usability

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
"""
