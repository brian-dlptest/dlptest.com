"""Use case A - Regulatory compliance (PII / PHI / PCI).

Folder names describe content, not row IDs. Which rows each folder serves is recorded in
../cases.json and nowhere else, so a renumber never moves a folder.
"""
import csv
import os
import random

import docgen as dg
import mcp_client as mcp

random.seed(20260917)  # fixes the local choices (which digit to alter, which rows to sample)

CL = "files/classification"


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


def break_luhn(number):
    """Alter one interior digit so the check digit no longer validates."""
    chars = list(number)
    positions = [i for i, c in enumerate(chars) if c.isdigit()]
    for i in positions[4:-1]:
        original = chars[i]
        chars[i] = str((int(original) + 1) % 10)
        if not luhn_ok("".join(chars)):
            return "".join(chars)
        chars[i] = original
    raise AssertionError("could not break Luhn for %s" % number)


def custom(fields, count, name):
    text = mcp.save(name, mcp.call("generate_custom",
                                   {"fields": fields, "count": count, "format": "csv"}))
    return mcp.csv_rows(text)


# --------------------------------------------------------------------- SSN family
def build_ssn_family():
    """One pull of 100 distinct people feeds SSN detection, the severity tiers and the
    confidence test, so the severity row's regression step re-sends genuinely the same
    data its counting step used."""
    header, rows = mcp.csv_rows(mcp.save(
        "ssn-dob-100.csv", mcp.call("generate_pii_ssn_dob", {"count": 100, "format": "csv"})))
    assert len({r[1] for r in rows}) == 100, "MCP returned duplicate SSNs"
    h = ["full_name", "ssn", "dob"]

    d = f"{CL}/us-ssn-detection"
    dg.write_csv(f"{d}/ssns_25.csv", h, rows[:25])
    dg.write_docx(f"{d}/ssns_25.docx", "Member Eligibility Extract - Q3",
                  ["Confidential. Contains 25 member records with Social Security Numbers.",
                   "Generated for DLP classifier testing. Every identifier below is synthetic."],
                  table=(["Full Name", "SSN", "Date of Birth"], rows[:25]))
    dg.write_text(f"{d}/README.txt", """US SSN detection

ssns_25.csv    25 distinct SSNs with name and date of birth
ssns_25.docx   the same 25, in a Word table

Move each file through one monitored channel. Both should match a US SSN classifier,
and the incident should report a match count of 25.
""")

    d = f"{CL}/severity-tiers"
    one = rows[0]
    dg.write_csv(f"{d}/file1_one-ssn-repeated-x100.csv", h, [one] * 100)
    dg.write_csv(f"{d}/file2_100-distinct-ssns.csv", h, rows)
    for label, n in (("low", 5), ("medium", 25), ("high", 100)):
        dg.write_csv(f"{d}/{label}_{n}-distinct-records.csv", h, rows[:n])
    dg.write_text(f"{d}/README.txt", """Severity tiers by match count

Three steps, in order. The counting check comes first, because every tier after it is
meaningless until it passes.

STEP 1 - is the count unique or raw?
  file1_one-ssn-repeated-x100.csv   100 rows, ONE distinct SSN
  file2_100-distinct-ssns.csv       100 rows, 100 distinct SSNs
  File 1 must report 1 unique match and file 2 must report 100. If both report 100 the
  tool is counting occurrences, not unique values - stop and resolve that first.

STEP 2 - the tiers
  Configure Low = 1-9, Medium = 10-49, High = 50+ unique matches, then send:
  low_5-distinct-records.csv        expect Low
  medium_25-distinct-records.csv    expect Medium
  high_100-distinct-records.csv     expect High
  Three incidents at three severities, from ONE rule.

STEP 3 - the regression check
  Re-send file1_one-ssn-repeated-x100.csv. It must still land in Low. If it lands in
  High, the tiering is reporting file length rather than exposure.

All five files are sliced from one generated pull.
""")

    ssn = rows[1][1]
    d = f"{CL}/confidence-threshold-tuning"
    dg.write_text(f"{d}/a_bare-9-digit-number.txt",
                  "Reference number for the account below.\n\n%s\n\n"
                  "No label, no formatting, no supporting evidence nearby.\n"
                  % ssn.replace("-", ""))
    dg.write_text(f"{d}/b_formatted-123-45-6789.txt",
                  "Reference number for the account below.\n\n%s\n\n"
                  "Formatted like an SSN, but still unlabelled.\n" % ssn)
    dg.write_text(f"{d}/c_labeled-within-10-chars.txt",
                  "Applicant record\n\nSSN: %s\n\n"
                  "The label sits within 10 characters of the identifier.\n" % ssn)
    dg.write_docx(f"{d}/d_titled-social-security.docx", "Social Security Verification Form",
                  ["Applicant: %s" % rows[1][0], "Social Security Number: %s" % ssn,
                   "Date of Birth: %s" % rows[1][2], "",
                   "The title, a proximate label and correct formatting all supply "
                   "supporting evidence. This file should match at the highest level."])
    dg.write_text(f"{d}/README.txt", """Confidence level / threshold tuning

All four files carry the SAME number (%s); only the surrounding evidence changes.

  a  bare 9 digits            matches at the lowest level, or not at all
  b  formatted ###-##-####    low, probably medium
  c  'SSN:' within 10 chars   matches at the highest level
  d  titled 'Social Security' matches at the highest level

Confidence should rise as evidence is added. Then confirm confidence and instance count
can be set independently on one rule.
""" % ssn)
    return rows


# --------------------------------------------------------------------- cards
def build_cards():
    header, rows = mcp.csv_rows(mcp.save(
        "cards.csv", mcp.call("generate_pci_credit_card", {"count": 40, "format": "csv"})))
    ci = header.index("Credit Card Number")
    assert all(luhn_ok(r[ci]) for r in rows), "MCP emitted a non-Luhn card"

    d = f"{CL}/credit-card-luhn"
    dg.write_csv(f"{d}/cards_valid.csv", header, rows)
    invalid = []
    for r in rows:
        r2 = list(r)
        r2[ci] = break_luhn(r[ci])
        invalid.append(r2)
    dg.write_csv(f"{d}/cards_luhn_invalid.csv", header, invalid)

    controls = []
    for i in range(30):
        while True:
            n = "".join(str(random.randint(0, 9)) for _ in range(16))
            if not luhn_ok(n) and n[0] in "12789":
                break
        kind = "order number" if i % 2 else "epoch timestamp (ms) + sequence"
        controls.append(["ORD-%d" % (2026000 + i), n, kind])
    dg.write_csv(f"{d}/negative_control_non-card-16digit.csv",
                 ["reference", "sixteen_digit_value", "what_it_actually_is"], controls)
    dg.write_text(f"{d}/README.txt", """Credit card (PCI-DSS) detection with Luhn

cards_valid.csv                         40 Luhn-valid Visa / Mastercard / Amex / Discover
cards_luhn_invalid.csv                  the same 40, one interior digit altered so the
                                        check digit fails
negative_control_non-card-16digit.csv   30 sixteen-digit order numbers and timestamps

Pass = the valid file matches and NEITHER of the other two does.
""")


# --------------------------------------------------------------------- PHI
def build_phi():
    ph, prows = mcp.csv_rows(mcp.save(
        "phi.csv", mcp.call("generate_hipaa_phi", {"count": 15, "format": "csv"})))
    nh, nrows = mcp.csv_rows(mcp.save(
        "npi.csv", mcp.call("generate_npi_provider", {"count": 6, "format": "csv"})))
    prose = mcp.save("phi-prose.txt", mcp.call("generate_prompt_context", {
        "scenario": "medical-record", "count": 4, "format": "text"}))

    d = f"{CL}/phi-hipaa"
    dg.write_docx(f"{d}/phi_patient_encounter_summary.docx",
                  "Patient Encounter Summary - Ambulatory Clinic",
                  [("b", "PROTECTED HEALTH INFORMATION - HIPAA"),
                   "MRN, ICD-10 diagnosis codes, CPT procedure codes and patient name with "
                   "date of birth, together.", ("h", "Patient encounters")],
                  table=(ph, prows))
    dg.write_csv(f"{d}/phi_encounters.csv", ph, prows)
    dg.write_csv(f"{d}/providers_npi_dea.csv", nh, nrows)
    dg.write_text(f"{d}/phi_narrative_note.txt", prose)

    # The generator writes MRN-12345678; dlptest.com's mrn-labeled pattern accepts only
    # MRN: / MRN# / Record. Ship every presentation so the tester sees which one their
    # classifier catches.
    mi = ph.index("MRN")
    variants = []
    for r in prows:
        digits = "".join(c for c in r[mi] if c.isdigit())
        variants.append([r[0], r[1], "MRN-" + digits, "MRN: " + digits,
                         "MRN#" + digits, "Record " + digits, digits])
    dg.write_csv(f"{d}/phi_mrn_format-variants.csv",
                 ["First Name", "Last Name", "hyphenated", "colon", "hash", "word_record",
                  "bare"], variants)
    dg.write_text(f"{d}/README.txt", """PHI detection (HIPAA)

phi_patient_encounter_summary.docx  MRN + ICD-10 + CPT + name/DOB in a table
phi_encounters.csv                  the same records, structured
providers_npi_dea.csv               NPI (10-digit Luhn) + DEA (check-digit valid)
phi_narrative_note.txt              the same class of data as prose, not a table
phi_mrn_format-variants.csv         the same 15 MRNs written five ways. Most MRN
                                    classifiers accept only one or two - find out which.
""")


# --------------------------------------------------------------------- international
def build_uk(d):
    """generate_uk_identity assigns prefix letters freely, but HMRC never issues D, F, I,
    Q, U or V. Split the pull into a valid set and a negative control instead of shipping
    a file that silently under-detects."""
    bad = set("DFIQUV")
    h, rows = mcp.csv_rows(mcp.save(
        "uk.csv", mcp.call("generate_uk_identity", {"count": 60, "format": "csv"})))
    ni, nhs = h.index("NI Number"), h.index("NHS Number")
    header = h + ["NI Number (compact)", "NHS Number (compact)"]
    full = [r + [r[ni].replace(" ", ""), r[nhs].replace(" ", "")] for r in rows]
    valid = [r for r in full if not set(r[ni].replace(" ", "")[:2]) & bad][:15]
    invalid = [r for r in full if set(r[ni].replace(" ", "")[:2]) & bad][:10]
    assert len(valid) == 15 and len(invalid) >= 5, "pull too small to split"
    dg.write_csv(f"{d}/uk.csv", header, valid)
    dg.write_csv(f"{d}/uk_invalid-prefix_negative-control.csv", header, invalid)
    return ("uk", header, valid)


def build_international():
    d = f"{CL}/international-identifiers"
    compact = {"canada": [("Social Insurance Number", "SIN (compact)")]}
    combined = [build_uk(d)]
    for name, tool in (("canada", "generate_canada_sin"), ("passport", "generate_passport"),
                       ("eu_vat", "generate_eu_vat")):
        h, r = mcp.csv_rows(mcp.save("%s.csv" % name,
                                     mcp.call(tool, {"count": 15, "format": "csv"})))
        for src, label in compact.get(name, []):
            if src in h:
                idx = h.index(src)
                h = h + [label]
                r = [row + [row[idx].replace(" ", "").replace("-", "")] for row in r]
        dg.write_csv(f"{d}/{name}.csv", h, r)
        combined.append((name, h, r))

    h, r = custom([{"name": "Full Name", "type": "full-name"},
                   {"name": "France INSEE", "type": "france-insee"},
                   {"name": "Germany Tax ID", "type": "germany-tax-id"},
                   {"name": "Japan My Number", "type": "japan-my-number"}],
                  15, "france-germany-japan.csv")
    idx = h.index("France INSEE")
    h = h + ["France INSEE (compact)"]
    r = [row + [row[idx].replace(" ", "")] for row in r]
    dg.write_csv(f"{d}/france_germany_japan.csv", h, r)
    combined.append(("france_germany_japan", h, r))

    lines = []
    for name, h, r in combined:
        lines += ["### %s" % name, ",".join(h)] + [",".join(row) for row in r] + [""]
    dg.write_text(f"{d}/international_identifiers_all.csv", "\n".join(lines))
    dg.write_text(f"{d}/README.txt", """International identifier coverage

uk.csv                     UK NI number + NHS number (mod-11 valid), 15 valid prefixes
uk_invalid-prefix_negative-control.csv
                           NEGATIVE CONTROL - NI prefixes containing D, F, I, Q, U or V,
                           which HMRC never issues. A validating classifier rejects them.
canada.csv                 Canadian SIN (Luhn-valid) + province
passport.csv               passport number + issuing country
eu_vat.csv                 EU VAT number + IBAN
france_germany_japan.csv   France INSEE, German tax ID, Japan My Number
international_identifiers_all.csv   everything in one file, for a single pass

Score each jurisdiction separately and write down the ones you had to build yourself.

SEPARATORS: UK NI, NHS, Canadian SIN and French INSEE numbers are conventionally written
with spaces. Each file also carries a '(compact)' column with separators stripped,
because many published patterns - including dlptest.com's own uk-nino and france-insee -
accept only the contiguous form. Matching one column and not the other is a tuning gap,
not a detection failure.
""")


# --------------------------------------------------------------------- EDM
def build_edm():
    d = f"{CL}/exact-data-match"
    fields = [{"name": "First Name", "type": "first-name"},
              {"name": "Last Name", "type": "last-name"},
              {"name": "SSN", "type": "ssn"},
              {"name": "Date of Birth", "type": "dob"},
              {"name": "Email", "type": "email"},
              {"name": "ZIP", "type": "zip"}]
    header, seen, index_rows = None, set(), []
    for i in range(21):
        h, r = custom(fields, 500, "edm-index-%02d.csv" % i)
        header = header or h
        for row in r:
            if row[2] not in seen:
                seen.add(row[2])
                index_rows.append(row)
    index_rows = index_rows[:10000]
    assert len(index_rows) == 10000, "index short: %d" % len(index_rows)
    seen = {r[2] for r in index_rows}
    dg.write_csv(f"{d}/edm_source_index_10000-records.csv", header, index_rows)

    in_index = random.sample(index_rows, 50)
    out_rows = []
    while len(out_rows) < 50:
        _, r = custom(fields, 100, "edm-out.csv")
        out_rows.extend(row for row in r if row[2] not in seen)
    mixed = in_index + out_rows[:50]
    random.shuffle(mixed)
    in_keys = {r[2] for r in in_index}
    dg.write_csv(f"{d}/edm_test-upload_50in-50out.csv", header, mixed)
    dg.write_csv(f"{d}/edm_answer-key_DO-NOT-SEND.csv", header + ["in_index"],
                 [row + ["yes" if row[2] in in_keys else "no"] for row in mixed])
    dg.write_text(f"{d}/README.txt", """Exact Data Match (EDM)

edm_source_index_10000-records.csv  ingest through your product's own EDM tooling
                                    (it hashes the file; do not send it as-is)
edm_test-upload_50in-50out.csv      SEND THIS - 100 rows, 50 in the index, 50 not
edm_answer-key_DO-NOT-SEND.csv      grading key. Keep it out of the test run.

Pass = exactly the indexed 50 match. Then measure index refresh time and ask for the
maximum supported index size.
""")


# --------------------------------------------------------------------- OCR
def build_ocr(ssn_rows):
    d = f"{CL}/ocr-on-images"
    header = ["Full Name", "SSN", "Date of Birth"]
    rows = ssn_rows[:18]
    dg.render_table_image(f"{d}/ssn_table_screenshot.png", header, rows, scale=1.7)
    dg.render_table_image(f"{d}/ssn_table_photo-quality.jpg", header, rows, scale=1.7,
                          jpeg_quality=38)
    dg.render_table_image(f"{d}/ssn_table_rotated.png", header, rows, scale=1.7, rotate=12)
    dg.render_table_image(f"{d}/ssn_table_highres.png", header, rows, scale=3)
    dg.write_csv(f"{d}/_source_rows.csv", ["full_name", "ssn", "dob"], rows)
    dg.write_text(f"{d}/README.txt", """OCR on images

ssn_table_screenshot.png    clean screenshot, the common case
ssn_table_photo-quality.jpg heavily re-compressed JPEG - phone-photo quality
ssn_table_rotated.png       rotated 12 degrees; many OCR paths do not deskew
ssn_table_highres.png       3x resolution, to find the file-size / pixel ceiling
_source_rows.csv            the 18 SSNs rendered above - ground truth for the count

These images also serve the GenAI image-upload channel (screenshot, then the .jpg) and
the screen-capture channel (display the high-res image full screen and capture it).
""")


# --------------------------------------------------------------------- archives
def build_archives():
    d = f"{CL}/archives-and-nested-files"
    inner = dg.path("files", "classification", "us-ssn-detection", "ssns_25.docx")
    l1 = dg.make_zip(f"{d}/level1_single-zip.zip", [("ssns_25.docx", inner)])
    dg.make_zip(f"{d}/nested_zip-in-zip.zip", [("level1_single-zip.zip", l1)])
    tmp = dg.make_zip(f"{d}/_tmp_level2.zip", [("nested.zip", l1)])
    dg.make_zip(f"{d}/nested_three-levels.zip", [("level2.zip", tmp)])
    os.remove(tmp)
    dg.make_zip(f"{d}/password-protected.zip", [("ssns_25.docx", inner)],
                password="TestPassword123")
    dg.make_7z(f"{d}/archive.7z", [("ssns_25.docx", inner)])
    dg.make_targz(f"{d}/archive.tar.gz", [("ssns_25.docx", inner)])
    dg.write_text(f"{d}/README.txt", """Archives and nested files

Every container holds the same ssns_25.docx (25 SSNs), so the match count should be
identical at every depth.

level1_single-zip.zip     .docx in a .zip
nested_zip-in-zip.zip     .zip in a .zip          (depth 2)
nested_three-levels.zip   .zip in .zip in .zip    (depth 3)
password-protected.zip    password: TestPassword123
archive.7z                7-Zip container
archive.tar.gz            gzipped tar

Pass = inspected to at least 2-3 levels, and the encrypted archive is detected as
encrypted and handled by policy, not silently passed.
""")


def run():
    rows = build_ssn_family()
    build_cards()
    build_phi()
    build_international()
    build_edm()
    build_ocr(rows)
    build_archives()
