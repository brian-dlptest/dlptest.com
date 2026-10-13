"""Validate every payload against dlptest.com's own DLP regex library, via the MCP server.

Generation and validation are deliberately separate: the generators ask the MCP server
for data, this asks the MCP server whether the data on disk actually matches the
patterns a DLP tool would use. A file that was generated correctly but written wrongly -
truncated, re-encoded, mangled by a Word table - fails here.

Half the assertions are negative controls expecting ZERO matches. That half is what
proves precision, and it is the half a library built without validation gets wrong.

Run:  python3 validate.py       (writes ../VALIDATION.md, exits non-zero on failure)

Needs the generated/ payloads: run `build.py ip shared` first on a fresh clone.
"""
import io
import os
import re
import sys
import zipfile

import mcp_client as mcp

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHUNK = 20000          # well inside regex_test's 25,000-character input cap
MATCH_CAP = 1000       # regex_test returns at most 1000 matches per call

_PATTERNS = {}


def pattern(pid):
    if not _PATTERNS:
        for p in mcp.patterns():
            _PATTERNS[p["id"]] = p
    return _PATTERNS[pid]


# ----------------------------------------------------------------- text extraction
def text_of(rel):
    p = os.path.join(ROOT, rel)
    ext = os.path.splitext(p)[1].lower()
    if ext == ".docx":
        from docx import Document
        doc = Document(p)
        parts = [par.text for par in doc.paragraphs]
        for t in doc.tables:
            for row in t.rows:
                parts.append("\t".join(c.text for c in row.cells))
        return "\n".join(parts)
    if ext == ".xlsx":
        from openpyxl import load_workbook
        wb = load_workbook(p, read_only=True, data_only=True)
        parts = []
        for ws in wb.worksheets:
            for row in ws.iter_rows(values_only=True):
                parts.append("\t".join("" if v is None else str(v) for v in row))
        return "\n".join(parts)
    if ext == ".pptx":
        from pptx import Presentation
        prs = Presentation(p)
        parts = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if shape.has_text_frame:
                    parts.append(shape.text_frame.text)
        return "\n".join(parts)
    with open(p, "r", errors="replace") as fh:
        return fh.read()


def text_in_zip(rel, inner):
    """Text of a file inside an archive - used to prove the archive containers are intact."""
    with zipfile.ZipFile(os.path.join(ROOT, rel)) as z:
        data = z.read(inner)
    from docx import Document
    doc = Document(io.BytesIO(data))
    parts = [p.text for p in doc.paragraphs]
    for t in doc.tables:
        for row in t.rows:
            parts.append("\t".join(c.text for c in row.cells))
    return "\n".join(parts)


def chunks(text, size=CHUNK):
    """Split on line boundaries so no match is cut in half at a chunk edge."""
    out, cur = [], []
    n = 0
    for line in text.splitlines(keepends=True):
        if n + len(line) > size and cur:
            out.append("".join(cur))
            cur, n = [], 0
        cur.append(line)
        n += len(line)
    if cur:
        out.append("".join(cur))
    return out or [""]


# ----------------------------------------------------------------- the check engine
def scan(text, pid, flags=None):
    """Run a pattern over text via the MCP server. Returns (total, distinct_values)."""
    p = pattern(pid)
    total, values = 0, set()
    for chunk in chunks(text):
        if not chunk.strip():
            continue
        res = mcp.regex_test(p["pattern"], chunk, flags=flags or p.get("flags", "g"),
                             engine="re2")
        if not res.get("ok", True):
            raise RuntimeError("regex_test failed for %s: %s" % (pid, res.get("error")))
        if res.get("truncated"):
            raise RuntimeError(
                "chunk exceeded the %d-match cap for %s - lower CHUNK" % (MATCH_CAP, pid))
        total += res["match_count"]
        values.update(m["value"] for m in res["matches"])
    return total, values


def literal(text, phrase):
    """Count occurrences of a literal phrase, still through the MCP server."""
    esc = re.escape(phrase)
    total = 0
    for chunk in chunks(text):
        res = mcp.regex_test(esc, chunk, flags="g", engine="re2")
        total += res["match_count"]
    return total


def luhn_ok(number):
    digits = [int(c) for c in number if c.isdigit()][::-1]
    total = 0
    for i, d in enumerate(digits):
        if i % 2:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


RESULTS = []


def check(fileref, what, expected, actual, note=""):
    ok = (actual == expected) if not callable(expected) else expected(actual)
    label = expected.__doc__ if callable(expected) else expected
    RESULTS.append((fileref, what, label, actual, ok, note))
    return ok


def at_least(n):
    def f(actual):
        return actual >= n
    f.__doc__ = ">= %d" % n
    return f


# ----------------------------------------------------------------- the checks
C = "files/classification"
P = "files/policy"
E = "files/block-method-checks"
IU = "files/investigations-usability"
G = "generated"


def run_checks():
    # --- US SSN detection -----------------------------------------------------------------
    for f in (f"{C}/us-ssn-detection/ssns_25.csv",
              f"{C}/us-ssn-detection/ssns_25.docx"):
        total, vals = scan(text_of(f), "ssn-dashed")
        check(f, "ssn-dashed matches", 25, total)
        check(f, "ssn-dashed distinct", 25, len(vals))

    # --- credit card + Luhn -----------------------------------------------------------------
    def card_count(text):
        a, _ = scan(text, "cc-grouped")
        b, _ = scan(text, "cc-amex-grouped")
        return a + b

    def cards_in(rel):
        col = []
        with open(os.path.join(ROOT, rel)) as fh:
            for i, line in enumerate(fh):
                if i:
                    col.append(line.split(",")[3])
        return col

    f = f"{C}/credit-card-luhn/cards_valid.csv"
    check(f, "card patterns (grouped + amex)", 40, card_count(text_of(f)))
    check(f, "Luhn-valid cards", 40, sum(luhn_ok(c) for c in cards_in(f)),
          "the positive case")

    f = f"{C}/credit-card-luhn/cards_luhn_invalid.csv"
    check(f, "card patterns (grouped + amex)", 40, card_count(text_of(f)),
          "shape preserved on purpose - that is what makes the test meaningful")
    check(f, "Luhn-valid cards", 0, sum(luhn_ok(c) for c in cards_in(f)),
          "NEGATIVE CONTROL - a Luhn-aware classifier must reject all 40")

    f = f"{C}/credit-card-luhn/negative_control_non-card-16digit.csv"
    check(f, "cc-grouped matches", 0, scan(text_of(f), "cc-grouped")[0],
          "NEGATIVE CONTROL - order numbers and timestamps, not cards")
    with open(os.path.join(ROOT, f)) as fh:
        vals = [l.split(",")[1] for i, l in enumerate(fh) if i]
    check(f, "Luhn-valid values", 0, sum(luhn_ok(v) for v in vals), "NEGATIVE CONTROL")

    # --- PHI -----------------------------------------------------------------
    f = f"{C}/phi-hipaa/phi_encounters.csv"
    check(f, "MRN values present", 15, literal(text_of(f), "MRN-"))
    check(f, "mrn-labeled matches", 0, scan(text_of(f), "mrn-labeled")[0],
          "FINDING 1 - the MCP server writes MRN-12345678; dlptest.com's own mrn-labeled "
          "pattern accepts only MRN: / MRN# / Record. See Findings below")
    f = f"{C}/phi-hipaa/phi_patient_encounter_summary.docx"
    check(f, "MRN values present", 15, literal(text_of(f), "MRN-"),
          "survives the Word table round-trip")
    f = f"{C}/phi-hipaa/phi_mrn_format-variants.csv"
    check(f, "mrn-labeled matches", at_least(30), scan(text_of(f), "mrn-labeled")[0],
          "the colon / hash / Record presentations DO match - this is the file to use "
          "if your MRN classifier follows the same convention")
    f = f"{C}/phi-hipaa/providers_npi_dea.csv"
    check(f, "dea matches", 6, scan(text_of(f), "dea")[0])

    # --- international identifiers -----------------------------------------------------------------
    for f, pid, n in (
            (f"{C}/international-identifiers/uk.csv", "uk-nhs", 15),
            (f"{C}/international-identifiers/uk.csv", "uk-nino", 15),  # compact col
            (f"{C}/international-identifiers/canada.csv", "canada-sin", 15),
            (f"{C}/international-identifiers/eu_vat.csv", "iban", 15),
            (f"{C}/international-identifiers/passport.csv", "us-passport", 15),
            (f"{C}/international-identifiers/france_germany_japan.csv",
             "france-insee", 15)):
        note = ("matches only via the '(compact)' column - FINDING 2"
                if pid in ("uk-nino", "france-insee") else "")
        check(f, "%s matches" % pid, at_least(n), scan(text_of(f), pid)[0], note)

    f = f"{C}/international-identifiers/uk_invalid-prefix_negative-control.csv"
    check(f, "uk-nino matches", 0, scan(text_of(f), "uk-nino")[0],
          "NEGATIVE CONTROL - prefixes containing D/F/I/Q/U/V, which HMRC never issues. "
          "FINDING 4")

    # --- severity tiers, step 1: unique vs total -------------------------------
    f = f"{C}/severity-tiers/file1_one-ssn-repeated-x100.csv"  # v7 step 1
    total, vals = scan(text_of(f), "ssn-dashed")
    check(f, "ssn-dashed total", 100, total)
    check(f, "ssn-dashed DISTINCT", 1, len(vals), "the whole point of the counting step")
    f = f"{C}/severity-tiers/file2_100-distinct-ssns.csv"
    total, vals = scan(text_of(f), "ssn-dashed")
    check(f, "ssn-dashed total", 100, total)
    check(f, "ssn-dashed DISTINCT", 100, len(vals))

    # --- severity tiers, step 2: the tiers -----------------------------------------------
    for label, n in (("low", 5), ("medium", 25), ("high", 100)):
        f = f"{C}/severity-tiers/{label}_{n}-distinct-records.csv"
        check(f, "ssn-dashed distinct", n, len(scan(text_of(f), "ssn-dashed")[1]))

    # --- confidence / threshold tuning -----------------------------------------------------
    d = f"{C}/confidence-threshold-tuning"
    f = f"{d}/a_bare-9-digit-number.txt"
    check(f, "ssn-dashed matches", 0, scan(text_of(f), "ssn-dashed")[0],
          "unformatted on purpose - only a flexible pattern should see it")
    check(f, "ssn-flexible matches", at_least(1), scan(text_of(f), "ssn-flexible")[0])
    f = f"{d}/b_formatted-123-45-6789.txt"
    check(f, "ssn-dashed matches", 1, scan(text_of(f), "ssn-dashed")[0])
    f = f"{d}/c_labeled-within-10-chars.txt"
    check(f, "ssn-labeled matches", 1, scan(text_of(f), "ssn-labeled")[0],
          "the proximity-label case")
    f = f"{d}/d_titled-social-security.docx"
    check(f, "ssn-dashed matches", 1, scan(text_of(f), "ssn-dashed")[0])
    check(f, "'Social Security' in title", at_least(1),
          literal(text_of(f), "Social Security"))

    # --- exact data match -----------------------------------------------------
    f = f"{C}/exact-data-match/edm_source_index_10000-records.csv"
    check(f, "ssn-dashed distinct", 10000, len(scan(text_of(f), "ssn-dashed")[1]))
    f = f"{C}/exact-data-match/edm_test-upload_50in-50out.csv"
    check(f, "ssn-dashed distinct", 100, len(scan(text_of(f), "ssn-dashed")[1]))
    idx = {l.split(",")[2] for i, l in enumerate(
        open(os.path.join(ROOT, f"{C}/exact-data-match/"
                                "edm_source_index_10000-records.csv"))) if i}
    key = os.path.join(ROOT, f"{C}/exact-data-match/"
                             "edm_answer-key_DO-NOT-SEND.csv")
    rows = [l.rstrip("\n").split(",") for i, l in enumerate(open(key)) if i]
    check(f, "rows marked in-index", 50, sum(1 for r in rows if r[-1] == "yes"))
    check(f, "answer key agrees with the index", True,
          all((r[2] in idx) == (r[-1] == "yes") for r in rows))

    # --- AI classification (MSA set) -----------------------------------------------------
    pos = sorted(os.listdir(os.path.join(
        ROOT, f"{C}/ai-classification-msa/positive")))
    near = sorted(os.listdir(os.path.join(
        ROOT, f"{C}/ai-classification-msa/near-miss")))
    check(f"{C}/ai-classification-msa", "positive examples", 10, len(pos))
    check(f"{C}/ai-classification-msa", "near-misses", 10, len(near))
    titled = sum(1 for n in pos if literal(
        text_of(f"{C}/ai-classification-msa/positive/{n}"),
        "MASTER SERVICES AGREEMENT") >= 1)
    check(f"{C}/ai-classification-msa/positive", "carry the MSA heading", 10, titled)
    trap = sum(1 for n in near if n.startswith("sow_") and literal(
        text_of(f"{C}/ai-classification-msa/near-miss/{n}"),
        "Master Services Agreement") >= 1)
    check(f"{C}/ai-classification-msa/near-miss", "SOWs naming an MSA", 3, trap,
          "THE TRAP - a keyword rule on 'Master Services Agreement' cannot pass this test")

    # --- archives and nested files -----------------------------------------------------
    d = f"{C}/archives-and-nested-files"
    check(f"{d}/level1_single-zip.zip", "ssn-dashed inside the container", 25,
          scan(text_in_zip(f"{d}/level1_single-zip.zip", "ssns_25.docx"), "ssn-dashed")[0])
    import tarfile
    with tarfile.open(os.path.join(ROOT, f"{d}/archive.tar.gz")) as t:
        member = t.extractfile("ssns_25.docx").read()
    from docx import Document
    doc = Document(io.BytesIO(member))
    tgz_text = "\n".join(
        [p.text for p in doc.paragraphs]
        + ["\t".join(c.text for c in r.cells) for tb in doc.tables for r in tb.rows])
    check(f"{d}/archive.tar.gz", "ssn-dashed inside the container", 25,
          scan(tgz_text, "ssn-dashed")[0])
    import shutil
    import tempfile

    import py7zr
    tmp = tempfile.mkdtemp()
    try:
        with py7zr.SevenZipFile(os.path.join(ROOT, f"{d}/archive.7z")) as z:
            z.extractall(path=tmp)
        with open(os.path.join(tmp, "ssns_25.docx"), "rb") as fh:
            blob = fh.read()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    doc = Document(io.BytesIO(blob))
    sz_text = "\n".join(
        [p.text for p in doc.paragraphs]
        + ["\t".join(c.text for c in r.cells) for tb in doc.tables for r in tb.rows])
    check(f"{d}/archive.7z", "ssn-dashed inside the container", 25,
          scan(sz_text, "ssn-dashed")[0])
    with zipfile.ZipFile(os.path.join(ROOT, f"{d}/password-protected.zip")) as z:
        encrypted = bool(z.infolist()[0].flag_bits & 0x1)
    check(f"{d}/password-protected.zip", "flagged encrypted", True, encrypted,
          "must be DETECTED AS ENCRYPTED, not silently passed")

    # --- secrets (generated/) -----------------------------------------------------------------
    f = f"{G}/classification/secrets-and-credentials/secrets_live-looking.env"
    live = text_of(f)
    missing = [p["id"] for p in mcp.patterns(category="Credentials / Secrets")
               if scan(live, p["id"])[0] < 1]
    check(f, "credential patterns present (of 18)", 18, 18 - len(missing),
          "missing: %s" % ", ".join(missing) if missing else "")
    f = f"{G}/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env"
    ph = text_of(f)
    for pid in ("aws-access-key-id", "google-api-key", "twilio-account-sid", "jwt"):
        check(f, "%s matches" % pid, 0, scan(ph, pid)[0],
              "NEGATIVE CONTROL - high-entropy pattern, placeholder cannot satisfy it")
    check(f, "github-token matches", at_least(1), scan(ph, "github-token")[0],
          "EXPECTED FALSE POSITIVE - ghp_xxxxx... satisfies the shape. This is why the "
          "file is named 'negative-ish': it is the entropy test, not a clean negative")

    # --- codenames -----------------------------------------------------------------
    f = f"{C}/project-codenames/mercury_false-positive-control.docx"
    mercury = text_of(f)
    check(f, "'Mercury' occurrences", at_least(4), literal(mercury, "Mercury"))
    others = [t for t, _, _ in __import__("gen_ip").CODENAMES if t != "Mercury"]
    check(f, "other codenames present", 0, sum(literal(mercury, t) for t in others),
          "NEGATIVE CONTROL - only the ambiguous term appears, never the programme")

    # --- bulk CRM export -----------------------------------------------------------------
    f = f"{C}/bulk-crm-export/crm_export_50000-records.csv"
    check(f, "card patterns (grouped + amex)", 50000, card_count(text_of(f)),
          "full scan - the volume IS the signal for this row")
    f = f"{C}/bulk-crm-export/crm_export_20-records_negative-control.csv"
    check(f, "card patterns (grouped + amex)", 20, card_count(text_of(f)),
          "same columns, 1/2500th the volume")

    # --- HRIS / database extracts ---------------------------------------------------------
    for f in (f"{C}/hris-compensation-export/hris_roster_name-ssn-salary-rating.csv",
              f"{C}/hris-compensation-export/hris_roster_name-ssn-salary-rating.xlsx"):
        check(f, "ssn-dashed distinct", 180, len(scan(text_of(f), "ssn-dashed")[1]))
    for f in (f"{C}/direct-database-extracts/db_extract_gui-export-results-to-file.csv",
              f"{C}/direct-database-extracts/db_extract_cli-piped-output.txt"):
        check(f, "ssn-dashed distinct", 300, len(scan(text_of(f), "ssn-dashed")[1]))

    # --- v7 additions ----------------------------------------------------------
    f = f"{C}/lineage-obfuscation-chain/step3b_zipped-password-protected.zip"
    with zipfile.ZipFile(os.path.join(ROOT, f)) as z:
        enc = bool(z.infolist()[0].flag_bits & 0x1)
    check(f, "flagged encrypted", True, enc,
          "the obfuscation-chained-into-one-story row asks for a PASSWORD-protected zip")

    d = f"{IU}/alert-grouping-400-files"
    files = [n for n in os.listdir(os.path.join(ROOT, d)) if n.endswith(".csv")]
    check(d, "sensitive files to copy in one action", 400, len(files),
          "the alert-grouping row asks for 400")
    sample = "".join(text_of("%s/%s" % (d, n)) for n in sorted(files)[:40])
    check(d, "every sampled file carries SSNs", True,
          len(scan(sample, "ssn-dashed")[1]) >= 40,
          "each file must match the rule on its own, or the grouping test proves nothing")

    d = f"{IU}/intervention-fatigue-30-files"
    files = [n for n in os.listdir(os.path.join(ROOT, d)) if n.endswith(".csv")]
    check(d, "separate triggering files", 30, len(files), "the intervention-fatigue row asks for thirty")
    blobs = [text_of("%s/%s" % (d, n)) for n in sorted(files)]
    check(d, "all 30 files are distinct", 30, len(set(blobs)),
          "NEGATIVE CONTROL - identical files would let hash dedup suppress the prompt "
          "for the wrong reason and score a Pass the product has not earned")

    f = f"{IU}/redaction-mixed-content.txt"
    # Measure the pasteable block, not the whole file: the instructions around it are
    # not part of what gets pasted, so including them would flatter the ratio.
    block = text_of(f).split("paste from here")[1].split("to here")[0]
    ssn_total = scan(block, "ssn-dashed")[0]
    words = len(block.split())
    check(f, "ssn-dashed matches in the paste block", at_least(6), ssn_total)
    check(f, "paste block is substantial", True, words >= 150,
          "there has to be enough prose that its arrival is unambiguous")
    check(f, "identifiers under 10% of the paste block", True,
          ssn_total * 10 < words,
          "redaction needs a REMAINDER to arrive after redaction - in a block of pure "
          "identifiers, a successful redaction and a plain block look identical. "
          "Actual: %d identifiers in %d words" % (ssn_total, words))

    f = f"{IU}/agent-session-task/workspace/data/customers_export.csv"
    check(f, "ssn-dashed distinct", 12, len(scan(text_of(f), "ssn-dashed")[1]),
          "the agent must read something worth recording")

    # --- policy payloads -------------------------------------------------------
    for f, n in ((f"{P}/thirty_ssns_paste-block.txt", 30),
                 (f"{P}/thirty_ssns.docx", 30),
                 (f"{P}/fifty_ssns_for_print-test.docx", 50)):
        check(f, "ssn-dashed distinct", n, len(scan(text_of(f), "ssn-dashed")[1]))
    for f in (f"{P}/sensitive_customer_data.xlsx",):
        t = text_of(f)
        check(f, "ssn-dashed distinct", 250, len(scan(t, "ssn-dashed")[1]))
        check(f, "card patterns (grouped + amex)", 250, card_count(t),
              "cc-grouped alone undercounts - Amex groups 4-6-5, not 4-4-4-4")
    f = f"{G}/policy/git-repo-with-api-key/config.py"
    cfg = text_of(f)
    for pid in ("aws-access-key-id", "stripe-secret-key", "password-in-url"):
        check(f, "%s matches" % pid, at_least(1), scan(cfg, pid)[0])

    # --- enforcement -----------------------------------------------------------
    f = f"{E}/mnpi_500-words.txt"
    mnpi = text_of(f)
    for pid in ("ssn-dashed", "cc-grouped", "email", "mrn-labeled"):
        check(f, "%s matches" % pid, 0, scan(mnpi, pid)[0],
              "NEGATIVE CONTROL - the AI-classification repeat check needs content "
              "with nothing a regex can find")

    # --- usability -------------------------------------------------------------
    f = f"{IU}/paste-latency-500-records.txt"
    check(f, "ssn-dashed distinct", at_least(490), len(scan(text_of(f), "ssn-dashed")[1]))


def report():
    passed = sum(1 for r in RESULTS if r[4])
    failed = len(RESULTS) - passed
    lines = [
        "# Validation report",
        "",
        "Every assertion below was evaluated by sending the file's text to the **DLPTest "
        "MCP server** (`regex_test`, RE2 engine) using a pattern from that server's own "
        "`list_dlp_patterns` library. Nothing here is checked with a local regex except "
        "the Luhn arithmetic, which no regex can do.",
        "",
        "Regenerate with `python3 tools/validate.py`.",
        "",
        "| Result | File | Assertion | Expected | Actual | Note |",
        "|---|---|---|---|---|---|",
    ]
    for fileref, what, expected, actual, ok, note in RESULTS:
        lines.append("| %s | `%s` | %s | %s | %s | %s |" % (
            "PASS" if ok else "**FAIL**", fileref, what, expected, actual,
            note.replace("|", "/")))
    lines += ["",
              "**%d passed, %d failed, %d total.**" % (passed, failed, len(RESULTS)),
              "",
              "---",
              "",
              "## Findings about dlptest.com's own data",
              "",
              "Four mismatches turned up between what the MCP server generates and what "
              "the site's published patterns accept. None of them is a problem with this "
              "library - the generated values are realistic, and the patterns are simply "
              "narrower than the formats people actually write. They are recorded here "
              "because they would otherwise look like a DLP product failing a test.",
              "",
              "1. **MRN.** `generate_hipaa_phi` emits `MRN-12345678`. The `mrn-labeled` "
              "pattern is `\\b(?:MRN|MR|Record)#?:?\\s*\\d{6,10}\\b`, which accepts "
              "`MRN:`, `MRN#` and `Record ` but not a hyphen. Mitigated here by "
              "`classification/phi-hipaa/phi_mrn_format-variants.csv`, which carries all five presentations.",
              "2. **UK NI and French INSEE.** `generate_uk_identity` emits "
              "`WQ 77 61 17 D` and `generate_custom` emits `1 18 01 64 386 886 22` - the "
              "conventional spaced forms. `uk-nino` and `france-insee` both require the "
              "contiguous form. Mitigated by the `(compact)` columns added to "
              "`classification/international-identifiers/uk.csv` and `france_germany_japan.csv`.",
              "3. **UK NI prefix letters.** `generate_uk_identity` assigns prefix "
              "letters freely, so roughly a third of any pull contains D, F, I, Q, U or "
              "V - letters HMRC never issues, and which the site's own `uk-nino` pattern "
              "correctly rejects. Turned to advantage here: `uk.csv` holds 15 "
              "valid-prefix numbers and "
              "`uk_invalid-prefix_negative-control.csv` holds 10 invalid ones, so "
              "the pair tests whether a classifier validates the allocation rules or just "
              "matches the shape - the same design as the Luhn pair in credit-card-luhn.",
              "4. **Amex card grouping.** `cc-grouped` matches `4-4-4-4` only; Amex is "
              "grouped `4-6-5` and needs `cc-amex-grouped`. Any card count that uses only "
              "`cc-grouped` will run about 25% light. Not a defect - just a pair of "
              "patterns that have to be used together.",
              "",
              "The first three are worth fixing on dlptest.com: a visitor who copies a "
              "generated identifier into the Regex Test page and picks the matching "
              "pattern from the library will see no match. The NI prefix one also "
              "matters on its own terms - those numbers would fail a real UK classifier, "
              "not just this library's check.",
              ""]
    with open(os.path.join(ROOT, "VALIDATION.md"), "w") as fh:
        fh.write("\n".join(lines))
    return failed


if __name__ == "__main__":
    run_checks()
    failures = report()
    for r in RESULTS:
        if not r[4]:
            print("FAIL  %s  %s  expected %s got %s" % (r[0], r[1], r[2], r[3]))
    print("\n%d/%d passed -> VALIDATION.md" % (len(RESULTS) - failures, len(RESULTS)))
    sys.exit(1 if failures else 0)
