"""Validate every payload against dlptest.com's own DLP regex library.

Generation and validation are deliberately separate: the generators ask the MCP server
for data, this checks whether the data on disk actually matches the patterns a DLP tool
would use. A file that was generated correctly but written wrongly - truncated,
re-encoded, mangled by a Word table - fails here.

The patterns and the RE2 engine are the site's own source (src/lib/regex/), the same
modules behind the MCP server's list_dlp_patterns and regex_test tools. They run locally
in one Node process (tools/scan.mjs), so a full run makes no production calls. One
assertion still sends a file to the live MCP server and checks it returns the same
result as the local engine; --offline skips it.

Half the assertions are negative controls expecting ZERO matches. That half is what
proves precision, and it is the half a library built without validation gets wrong.

Run:  python3 validate.py [--offline]   (writes ../VALIDATION.md, exits non-zero on FAIL)

Needs Node >= 22.18 on PATH (or in $NODE), and the generated/ payloads: run
`build.py local` first on a fresh clone.
"""
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

import mcp_client as mcp

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
SCAN_JS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scan.mjs")
OFFLINE = "--offline" in sys.argv


class LocalRegex:
    """A long-lived `node scan.mjs`, one JSON request and response per line."""

    def __init__(self):
        node = os.environ.get("NODE") or shutil.which("node")
        if not node:
            sys.exit("validate.py needs Node >= 22.18 on PATH (or set $NODE)")
        version = subprocess.run([node, "--version"], capture_output=True,
                                 text=True).stdout.strip()
        major, minor = (int(x) for x in version.lstrip("v").split(".")[:2])
        if (major, minor) < (22, 18):
            sys.exit("validate.py needs Node >= 22.18 to load the site's TypeScript "
                     "regex modules; %s has %s. On this repo's dev machines: "
                     "export PATH=/opt/homebrew/opt/node@22/bin:$PATH" % (node, version))
        self.proc = subprocess.Popen(
            [node, "--disable-warning=ExperimentalWarning", SCAN_JS],
            cwd=REPO, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    def ask(self, req):
        self.proc.stdin.write(json.dumps(req) + "\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        if not line:
            raise RuntimeError("scan.mjs exited unexpectedly")
        return json.loads(line)


_ENGINE = None
_PATTERNS = {}


def engine():
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = LocalRegex()
    return _ENGINE


def pattern(pid):
    if not _PATTERNS:
        for p in engine().ask({"op": "patterns"}):
            _PATTERNS[p["id"]] = p
    return _PATTERNS[pid]


def patterns_in(category):
    pattern("ssn-dashed")  # load the library
    return [p for p in _PATTERNS.values() if p["category"] == category]


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


def scan(text, pid, flags=None):
    """Run a library pattern over text. Returns (total, distinct_values)."""
    p = pattern(pid)
    res = engine().ask({"op": "match", "pattern": p["pattern"], "engine": "re2",
                        "flags": flags or p.get("flags", "g"), "text": text})
    if not res["ok"]:
        raise RuntimeError("regex failed for %s: %s" % (pid, res["error"]))
    if res["truncated"]:
        raise RuntimeError("match cap hit for %s - raise LIMITS in scan.mjs" % pid)
    return res["match_count"], set(res["values"])


def literal(text, phrase):
    """Count non-overlapping occurrences of a literal phrase."""
    return text.count(phrase)


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
PASS, FAIL, KNOWN = "PASS", "**FAIL**", "KNOWN-DEFECT"


def check(fileref, what, expected, actual, note=""):
    ok = (actual == expected) if not callable(expected) else expected(actual)
    label = expected.__doc__ if callable(expected) else expected
    RESULTS.append((fileref, what, label, actual, PASS if ok else FAIL, note))
    return ok


def check_defect(fileref, what, defective, fixed, actual, note):
    """An assertion about a known defect in dlptest.com itself. While the defect stands,
    the result is KNOWN-DEFECT, which does not fail the run. Once the site is fixed the
    result is PASS and the note says to update the Findings section; anything else is a
    FAIL."""
    if actual == defective:
        status = KNOWN
    elif actual == fixed:
        status, note = PASS, "DEFECT RESOLVED on the site - update Findings below. " + note
    else:
        status = FAIL
    RESULTS.append((fileref, what, "%s while the defect stands, %s once fixed"
                    % (defective, fixed), actual, status, note))


def at_least(n):
    def f(actual):
        return actual >= n
    f.__doc__ = ">= %d" % n
    return f


def sha(rel):
    with open(os.path.join(ROOT, rel), "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def csv_column(rel, name):
    import csv
    with open(os.path.join(ROOT, rel), newline="") as fh:
        rows = list(csv.reader(fh))
    if name not in rows[0]:
        return None
    i = rows[0].index(name)
    return [r[i] for r in rows[1:] if r]


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
    check_defect(f, "mrn-labeled matches", 0, 15, scan(text_of(f), "mrn-labeled")[0],
                 "FINDING 1 - the MCP server writes MRN-12345678; dlptest.com's own "
                 "mrn-labeled pattern accepts only MRN: / MRN# / Record")
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

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from gen_regulatory import iban_ok, ni_prefix_ok
    f = f"{C}/international-identifiers/uk.csv"
    check(f, "NI prefixes HMRC can issue", 15,
          sum(ni_prefix_ok(v) for v in csv_column(f, "NI Number")),
          "first letter not D/F/I/Q/U/V, second not D/F/I/O/Q/U/V, pair not "
          "BG/GB/KN/NK/NT/TN/ZZ - FINDING 3")
    f = f"{C}/international-identifiers/uk_invalid-prefix_negative-control.csv"
    check(f, "NI prefixes HMRC can issue", 0,
          sum(ni_prefix_ok(v) for v in csv_column(f, "NI Number")),
          "NEGATIVE CONTROL - every prefix breaks HMRC's letter rules")
    check(f, "uk-nino matches", 0, scan(text_of(f), "uk-nino")[0],
          "NEGATIVE CONTROL - the letters used are ones the published pattern rejects too")
    f = f"{C}/international-identifiers/eu_vat.csv"
    check(f, "IBANs passing mod-97", 15, sum(iban_ok(v) for v in csv_column(f, "IBAN")),
          "a checksum-validating classifier must accept all 15 - FINDING 4")
    f = f"{C}/international-identifiers/canada.csv"
    compact = csv_column(f, "SIN (compact)") or []
    check(f, "'SIN (compact)' values, 9 digits", 15,
          sum(len(v) == 9 and v.isdigit() for v in compact))

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
    creds = patterns_in("Credentials / Secrets")
    missing = [p["id"] for p in creds if scan(live, p["id"])[0] < 1]
    check(f, "credential patterns present (of %d)" % len(creds), len(creds),
          len(creds) - len(missing), "missing: %s" % ", ".join(missing) if missing else "")
    f = f"{G}/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env"
    ph = text_of(f)
    for pid, var in (("aws-access-key-id", "AWS_ACCESS_KEY_ID="),
                     ("google-api-key", "GOOGLE_MAPS_API_KEY="),
                     ("twilio-account-sid", "TWILIO_ACCOUNT_SID="),
                     ("jwt", "SERVICE_JWT=")):
        # A negative control only means something if the placeholder line is there.
        check(f, "%s placeholder line present" % var.rstrip("="), True, var in ph)
        check(f, "%s matches" % pid, 0, scan(ph, pid)[0],
              "NEGATIVE CONTROL - the placeholder cannot satisfy the pattern")
    for pid, why in (("github-token", "ghp_ + 36 x's satisfies the shape"),
                     ("slack-token", "xoxb-000000000000-...-REPLACE satisfies the shape"),
                     ("password-in-url", "postgresql://USER:PASSWORD@ satisfies the shape")):
        check(f, "%s matches" % pid, 1, scan(ph, pid)[0],
              "EXPECTED MATCH - %s. This is why the file is 'negative-ish': it is the "
              "entropy test, not a clean negative" % why)

    # --- codenames -----------------------------------------------------------------
    f = f"{C}/project-codenames/mercury_false-positive-control.docx"
    mercury = text_of(f)
    check(f, "'Mercury' occurrences", at_least(4), literal(mercury, "Mercury"))
    others = [t for t, _, _ in __import__("gen_ip").CODENAMES if t != "Mercury"]
    check(f, "other codenames present", 0, sum(literal(mercury, t) for t in others),
          "NEGATIVE CONTROL - only the ambiguous term appears, never the programme")

    # --- origin-based lineage (generated/) -------------------------------------------------
    d = f"{G}/classification/origin-based-lineage"
    a, b = f"{d}/from_internal-repo/auth_client.py", f"{d}/from_public-github/auth_client.py"
    check(d, "the two auth_client.py files are byte-identical", True, sha(a) == sha(b),
          "only the origin may differ, or a content classifier passes for the wrong reason")
    remotes = [subprocess.run(["git", "-C", os.path.join(ROOT, d, r), "remote", "get-url",
                               "origin"], capture_output=True, text=True).stdout.strip()
               for r in ("from_internal-repo", "from_public-github")]
    check(d, "the two git remotes differ", True, len(set(remotes)) == 2 and all(remotes),
          " vs ".join(remotes))

    # --- AI classification: no rendering artifacts -----------------------------------------
    for sub in ("positive", "near-miss"):
        folder = f"{C}/ai-classification-msa/{sub}"
        hits = [n for n in sorted(os.listdir(os.path.join(ROOT, folder)))
                if "%%" in text_of(f"{folder}/{n}")]
        check(folder, "documents containing a literal '%%'", 0, len(hits),
              "an unformatted-string artifact would separate the two classes on its own")

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
    per_file = [len(scan(text_of("%s/%s" % (d, n)), "ssn-dashed")[1]) for n in files]
    check(d, "files carrying 3 distinct SSNs", 400, sum(1 for c in per_file if c == 3),
          "each file must match the rule on its own, or the grouping test proves nothing")
    check(d, "distinct file contents", 400, len({sha("%s/%s" % (d, n)) for n in files}),
          "NEGATIVE CONTROL - duplicates would let a hash-deduplicating product report "
          "fewer events for a reason the test does not measure")
    everything = "".join(text_of("%s/%s" % (d, n)) for n in files)
    check(d, "distinct SSNs across all 400", 1200, len(scan(everything, "ssn-dashed")[1]))

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
    for f in (f"{P}/offline_make-fresh-file.sh", f"{P}/offline_make-fresh-file.ps1"):
        check(f, "ssn-dashed matches in the script itself", 0, scan(text_of(f), "ssn-dashed")[0],
              "the SSNs are generated when the script runs, so no copy of them exists to "
              "have been evaluated before")
    outputs = run_offline_script(f"{P}/offline_make-fresh-file.sh", ["bash"])
    if outputs:
        f = f"{P}/offline_make-fresh-file.sh"
        check(f, "ssn-dashed distinct per run", [30, 30],
              [len(scan(o, "ssn-dashed")[1]) for o in outputs])
        check(f, "two runs write different content", True, outputs[0] != outputs[1])
    outputs = run_offline_script(f"{P}/offline_make-fresh-file.ps1",
                                 ["pwsh", "-NoProfile", "-File"])
    if outputs:
        f = f"{P}/offline_make-fresh-file.ps1"
        check(f, "ssn-dashed distinct per run", [30, 30],
              [len(scan(o, "ssn-dashed")[1]) for o in outputs])
        check(f, "two runs write different content", True, outputs[0] != outputs[1])
    f = f"{G}/policy/git-repo-with-api-key/config.py"
    cfg = text_of(f)
    for pid in ("aws-access-key-id", "stripe-secret-key", "password-in-url"):
        check(f, "%s matches" % pid, at_least(1), scan(cfg, pid)[0])

    # --- block-method repeat check ---------------------------------------------
    f = f"{E}/mnpi_500-words.txt"
    mnpi = text_of(f)
    check(f, "word count", at_least(480), len(mnpi.split()))
    for pid in ("ssn-dashed", "cc-grouped", "email", "mrn-labeled", "aba-routing"):
        check(f, "%s matches" % pid, 0, scan(mnpi, pid)[0],
              "NEGATIVE CONTROL - the AI-classification repeat check needs content "
              "with nothing a regex can find")
    f = f"{E}/mnpi_narrative_with-identifiers.txt"
    narrative = text_of(f)
    check(f, "contains the whole MNPI memo", True,
          all(p.strip() in narrative for p in mnpi.split("\n\n") if p.strip()),
          "the contrast case must differ from the clean memo only by the identifiers")
    check(f, "ssn-dashed distinct", 3, len(scan(narrative, "ssn-dashed")[1]))
    check(f, "aba-routing matches", at_least(2), scan(narrative, "aba-routing")[0])

    # --- usability -------------------------------------------------------------
    f = f"{IU}/paste-latency-500-records.txt"
    check(f, "ssn-dashed distinct", at_least(490), len(scan(text_of(f), "ssn-dashed")[1]))


def run_offline_script(rel, command):
    """Run an offline payload script twice in a scratch folder and return what it wrote,
    or None when the interpreter is not installed (pwsh is optional)."""
    if not shutil.which(command[0]):
        SKIPPED.append("%s: `%s` not installed" % (rel, command[0]))
        return None
    outputs = []
    for _ in range(2):
        tmp = tempfile.mkdtemp()
        try:
            subprocess.run(command + [os.path.join(ROOT, rel)], cwd=tmp, check=True,
                           capture_output=True)
            (name,) = os.listdir(tmp)
            with open(os.path.join(tmp, name)) as fh:
                outputs.append(fh.read())
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    return outputs


SKIPPED = []


def server_agrees():
    """The one production call: send a file to the live MCP server's regex_test and
    confirm it reports what the local engine does."""
    f = f"{C}/us-ssn-detection/ssns_25.csv"
    if OFFLINE:
        SKIPPED.append("live MCP server comparison (--offline)")
        return
    p = pattern("ssn-dashed")
    text = text_of(f)
    remote = mcp.regex_test(p["pattern"], text, flags=p.get("flags", "g"), engine="re2",
                            cache=False)
    local = scan(text, "ssn-dashed")
    same = (remote["match_count"] == local[0]
            and {m["value"] for m in remote["matches"]} == local[1])
    check(f, "live MCP server regex_test agrees with the local engine", True, same,
          "the one production call in a validation run: ssn-dashed, %d matches locally, "
          "%d from the server" % (local[0], remote["match_count"]))


def report():
    counts = {k: sum(1 for r in RESULTS if r[4] == k) for k in (PASS, FAIL, KNOWN)}
    lines = [
        "# Validation report",
        "",
        "Every regex assertion below runs a pattern from dlptest.com's own DLP library "
        "(`src/lib/regex/dlp-patterns.ts`, the source of the MCP server's "
        "`list_dlp_patterns`) through the same RE2 engine as the server's `regex_test` "
        "(`src/lib/regex/engines.ts`), locally via `tools/scan.mjs`. One assertion sends "
        "a file to the live MCP server and confirms it reports the same result. Checksum "
        "and allocation rules (Luhn, mod-97, HMRC prefixes), file hashes and word counts "
        "are computed in Python.",
        "",
        "Regenerate with `python3 tools/validate.py`.",
        "",
        "**KNOWN-DEFECT** marks an assertion about a defect in dlptest.com itself (see "
        "Findings). It does not fail the run. When the site is fixed, the assertion "
        "reports PASS and asks for the Findings to be updated.",
        "",
        "| Result | File | Assertion | Expected | Actual | Note |",
        "|---|---|---|---|---|---|",
    ]
    for fileref, what, expected, actual, status, note in RESULTS:
        lines.append("| %s | `%s` | %s | %s | %s | %s |" % (
            status, fileref, what, expected, actual, note.replace("|", "/")))
    lines += ["",
              "**%d passed, %d known defects, %d failed, %d total.**"
              % (counts[PASS], counts[KNOWN], counts[FAIL], len(RESULTS))]
    if SKIPPED:
        lines += ["", "Not run: " + "; ".join(SKIPPED) + "."]
    lines += ["",
              "---",
              "",
              "## Findings about dlptest.com's own data",
              "",
              "Four mismatches between what the MCP server generates and what is valid or "
              "what the site's published patterns accept. Each is mitigated in this "
              "library, and recorded here because it would otherwise look like a DLP "
              "product failing a test.",
              "",
              "1. **MRN.** `generate_hipaa_phi` emits `MRN-12345678`. The `mrn-labeled` "
              "pattern is `\\b(?:MRN|MR|Record)#?:?\\s*\\d{6,10}\\b`, which accepts "
              "`MRN:`, `MRN#` and `Record ` but not a hyphen. Mitigated by "
              "`classification/phi-hipaa/phi_mrn_format-variants.csv`, which carries all "
              "five presentations.",
              "2. **UK NI and French INSEE.** `generate_uk_identity` emits "
              "`WQ 77 61 17 D` and `generate_custom` emits `1 18 01 64 386 886 22` - the "
              "conventional spaced forms. `uk-nino` and `france-insee` both require the "
              "contiguous form. Mitigated by the `(compact)` columns in "
              "`classification/international-identifiers/uk.csv` and "
              "`france_germany_japan.csv`.",
              "3. **UK NI prefix letters.** `generate_uk_identity` draws the first letter "
              "from the valid set, but its second-letter set includes D, F, Q and U, "
              "which HMRC never issues in that position (4 of its 20 letters, so about "
              "one number in five), and leaves out C, K and M, which HMRC does issue. It "
              "never checks the banned pairs BG, GB, KN, NK, NT, TN and ZZ. The site's "
              "`uk-nino` pattern rejects the bad letters but accepts the banned pairs. "
              "Mitigated: `uk.csv` keeps only numbers that pass all of HMRC's rules, and "
              "`uk_invalid-prefix_negative-control.csv` is built locally from letter-rule "
              "violations, so the pair tests whether a classifier validates the "
              "allocation rules or only matches the shape - the same design as the Luhn "
              "pair in `credit-card-luhn`.",
              "4. **IBAN check digits.** `generate_eu_vat` picks the two IBAN check digits "
              "at random, so almost no IBAN it emits passes the ISO 13616 mod-97 check a "
              "validating classifier applies. Mitigated: the generator here recomputes "
              "the check digits before writing `eu_vat.csv`.",
              "",
              "All four are worth fixing on dlptest.com: a visitor who copies a generated "
              "identifier into a real classifier, or into the Regex Test page with the "
              "matching library pattern, sees it rejected.",
              "",
              "Also worth knowing, though not a defect: `cc-grouped` matches `4-4-4-4` "
              "only. Amex is grouped `4-6-5` and needs `cc-amex-grouped`, so any card "
              "count that uses `cc-grouped` alone runs about 25% light.",
              ""]
    with open(os.path.join(ROOT, "VALIDATION.md"), "w") as fh:
        fh.write("\n".join(lines))
    return counts[FAIL]


if __name__ == "__main__":
    run_checks()
    server_agrees()
    failures = report()
    for r in RESULTS:
        if r[4] != PASS:
            print("%-12s %s  %s  expected %s got %s" % (r[4].strip("*"), r[0], r[1], r[2], r[3]))
    for s in SKIPPED:
        print("SKIPPED      %s" % s)
    print("\n%d assertions, %d failed -> VALIDATION.md" % (len(RESULTS), failures))
    sys.exit(1 if failures else 0)
