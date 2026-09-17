#!/usr/bin/env python3
"""
Build the Endpoint DLP Test Plan workbook from the content modules.

Writes DLPTest-com_Endpoint_DLP_Use_Case_Test_Plan.xlsx next to this script.
Run renumber.py FIRST — see README.md.

Usage:
  python3 scripts/dlp-test-plan/build.py
"""
import math, os, sys, datetime

sys.dont_write_bytecode = True  # content modules are rewritten between runs

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.comments import Comment
from openpyxl.chart import BarChart, Reference

from content_class import CLASSIFICATION
from content_policy import POLICY
from content_xp import XPOLICY, INVESTIGATIONS
from content_use import USABILITY

OUT = os.path.join(HERE, "DLPTest-com_Endpoint_DLP_Use_Case_Test_Plan.xlsx")

# Shown on the Read Me sheet. Keep in step with TEST_PLAN_VERSION in src/data/test-plan.ts,
# which cache-busts the download URL.
VERSION = 6

FONT = "Arial"
NAVY = "0B1220"
BLUE = "1F6FEB"
BAND = "E8F0FE"
ALT  = "F6F8FB"
GREY = "5B6678"
RULE = "C9D2DF"

H_FONT  = Font(name=FONT, size=10, bold=True, color="FFFFFF")
H_FILL  = PatternFill("solid", fgColor=NAVY)
G_FONT  = Font(name=FONT, size=10, bold=True, color="FFFFFF")
G_FILL  = PatternFill("solid", fgColor=BLUE)
B_FONT  = Font(name=FONT, size=10)
BB_FONT = Font(name=FONT, size=10, bold=True)
MUTED   = Font(name=FONT, size=9, color=GREY)
TITLE   = Font(name=FONT, size=16, bold=True, color=NAVY)
SUB     = Font(name=FONT, size=11, bold=True, color=BLUE)

THIN = Side(style="thin", color=RULE)
BOX  = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

TOP   = Alignment(vertical="top", wrap_text=True)
TOPL  = Alignment(vertical="top", horizontal="left", wrap_text=True)
CTR   = Alignment(vertical="center", horizontal="center", wrap_text=True)
HDRA  = Alignment(vertical="center", horizontal="left", wrap_text=True)

RESULT_OPTS  = '"Pass,Partial,Fail,N/A"'

# Table stakes coverage below this means a product cannot cover the basics. It replaced an
# older "any Fail is disqualifying" rule, which disqualified the market leaders it was scored on.
TS_FLOOR = 0.70

GOOD = ("D6EFD8", "10651B")
WARN = ("FDF0CE", "8A5A00")
BAD  = ("FADBD6", "9C2415")
NEUT = ("EEEEEE", "666666")


def est_height(cells, base=12.6, cap=190):
    """cells: list of (text, col_width)."""
    lines = 1
    for text, width in cells:
        if not text:
            continue
        cpl = max(8, int(width * 1.02))
        n = 0
        for para in str(text).split("\n"):
            n += max(1, math.ceil(len(para) / cpl))
        lines = max(lines, n)
    return min(cap, lines * base + 4)


def style_header(ws, row, ncols, height=30):
    ws.row_dimensions[row].height = height
    for c in range(1, ncols + 1):
        cell = ws.cell(row=row, column=c)
        cell.font = H_FONT
        cell.fill = H_FILL
        cell.alignment = HDRA
        cell.border = BOX


def set_widths(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


def add_dv(ws, formula, cell_range):
    dv = DataValidation(type="list", formula1=formula, allow_blank=True, showDropDown=False)
    dv.error = "Pick a value from the list."
    dv.errorTitle = "Invalid entry"
    ws.add_data_validation(dv)
    dv.add(cell_range)


def add_cf(ws, cell_range, mapping):
    for value, (fill, font) in mapping.items():
        ws.conditional_formatting.add(
            cell_range,
            CellIsRule(operator="equal", formula=[f'"{value}"'],
                       fill=PatternFill("solid", bgColor=fill),
                       font=Font(name=FONT, size=10, bold=True, color=font)),
        )


RESULT_CF  = {"Pass": GOOD, "Partial": WARN, "Fail": BAD, "N/A": NEUT}

TIER_FILL = {
    "Table stakes":   PatternFill("solid", fgColor="E7F1FF"),
    "Advanced":       PatternFill("solid", fgColor="EDE7FF"),
    "Differentiator": PatternFill("solid", fgColor="FFF1E0"),
}

wb = Workbook()

# ══════════════════════════════════════════════════════ Read Me
ws = wb.active
ws.title = "Read Me"
ws.sheet_view.showGridLines = False
set_widths(ws, [3, 30, 108])

def rm(row, label, text, label_font=BB_FONT, text_font=B_FONT, h=None):
    ws.cell(row=row, column=2, value=label).font = label_font
    ws.cell(row=row, column=2).alignment = TOP
    c = ws.cell(row=row, column=3, value=text)
    c.font = text_font
    c.alignment = TOP
    ws.row_dimensions[row].height = h or est_height([(text, 108)])

ws["B2"] = "Endpoint DLP Use Case Test Plan"
ws["B2"].font = TITLE
ws.merge_cells("B2:C2")
ws.row_dimensions[2].height = 24

ws["B3"] = "A vendor-neutral plan for evaluating or validating an endpoint DLP deployment."
ws["B3"].font = Font(name=FONT, size=11, color=GREY)
ws.merge_cells("B3:C3")
ws.row_dimensions[3].height = 18

ws["B4"] = f"dlptest.com  ·  version {VERSION}  ·  {datetime.date.today().isoformat()}"
ws["B4"].font = MUTED
ws.merge_cells("B4:C4")

r = 6
ws.cell(row=r, column=2, value="HOW TO USE THIS WORKBOOK").font = SUB
r += 1
rm(r, "Fill in the white cells", "Every sheet has a Result column and a Notes column - Pass / Partial / Fail / N/A, from a dropdown. Everything else is the plan. Use one copy of the workbook per product you are evaluating, or per environment you are validating."); r += 1
rm(r, "Work the sheets in order", "Classification first: if the tool cannot find the data, no policy on the Policy sheet can act on it. Then Policy, then Enforcement, then Investigations, then Usability."); r += 1
rm(r, "Test the negative cases", "Several rows carry a deliberate negative control - Luhn-invalid card numbers that must not match, a routine expense report alongside the board material, a 20-record file alongside the bulk export. A tool that matches everything is not a passing tool, and precision only shows up if you test for it."); r += 1
rm(r, "Record the gaps, do not hide them", "The retyping row on the Policy sheet exists so the residual risk is written down rather than assumed away - nothing catches a person reading data off the screen and typing it somewhere else. The same goes for every cell you mark Fail: that is a finding, not a blank."); r += 1

r += 1
ws.cell(row=r, column=2, value="SHEETS").font = SUB
r += 1
for label, text in [
    ("1. Classification", f"Can the tool find the data? {len(CLASSIFICATION)} tests across four use cases: regulatory PII/PHI/PCI, intellectual property and source code, financial reporting and MNPI, and bulk exports from business applications."),
    ("2. Policy", f"Can the tool act on it? {len(POLICY)} rows - one per egress channel per operating system, scored for Monitor / Warn together and for Block separately, because seeing a channel is the easy half."),
    ("3. Enforcement", "Why some classifications cannot be enforced inline. Each row says what Pass means for that detection method - usually that the product blocks in the moment rather than alerting once the data has gone."),
    ("4. Investigations", "What happens after an alert. Evidence, lineage, pivoting, insider-risk context, case workflow, privacy controls, and response."),
    ("5. Usability", "What it costs to run. AI-assisted classification, policy authoring and triage, rollout and change control, agent footprint and user-visible latency, and the end-user experience that decides whether people route around the agent."),
    ("Scoring Summary", "Rolls up every Result column - by sheet, by operating system and by maturity tier - and lists every table stakes row that failed. Formulas, not typed values: it updates as you fill the sheets in."),
]:
    rm(r, label, text); r += 1

r += 1
ws.cell(row=r, column=2, value="LEGEND").font = SUB
r += 1
for label, text in [
    ("Result", "Pass = works as described.  Partial = works with caveats, record them in Notes.  Fail = does not work, or requires an unacceptable workaround.  N/A = not applicable to your environment (excluded from scoring)."),
    ("Support (Policy sheet)", "Yes / Partial / No / N/A for each operating system and each enforcement action. Leave blank for anything you did not test - blank and No mean different things."),
    ("Maturity tier", f"Table stakes = the basics. Table stakes coverage below {TS_FLOOR:.0%} means the product cannot cover the basics, whatever its differentiator score. Individual Fails here belong in your findings rather than averaged into a percentage - the Scoring Summary lists them by row.  Advanced = where mature products separate from adequate ones.  Differentiator = few products pass many of these; a low score is information, not a verdict."),
    ("Blank", "Not yet tested. Blanks are excluded from the coverage percentage on the Scoring Summary."),
]:
    rm(r, label, text); r += 1

r += 1
ws.cell(row=r, column=2, value="GLOSSARY").font = SUB
r += 1
ws.cell(row=r, column=3, value="Abbreviations used in this workbook. DLP vocabulary is not standardised across vendors - where a term is one vendor's name for a general idea, that is said explicitly.").font = Font(name=FONT, size=9, italic=True, color=GREY)
ws.cell(row=r, column=3).alignment = TOP
r += 1

GLOSSARY = [
 (None, "Detection and classification"),
 ("Classifier", "Any named detector the tool matches content against - a regular expression, a keyword dictionary, a checksum-validated identifier, or a trained model. Every vendor has its own word for this. Where this workbook means the regular-expression kind specifically, it says pattern."),
 ("EDM", "Exact data match - matching against a hashed index of your own records, so only real customers match rather than anything SSN-shaped. See C-A08."),
 ("Confidence level", "How much supporting evidence sits near an identifier. Usually exposed as three named levels, sometimes with numbers attached (65 / 75 / 85 is one common scheme). It is NOT a percentage of the pattern matched. See C-A07."),
 ("Proximity", "The character distance between a primary element and its supporting keyword - the mechanism underneath confidence. See C-A07."),
 ("Weighted dictionary", "A keyword list where phrases carry different weights toward a match threshold, so strong evidence counts for more than weak - the second way platforms express the idea in C-A07."),
 ("Data lineage", "Recording where data came from and following it through copies, renames and pastes, so sensitivity is inferred from ORIGIN rather than content. See C-B02 and E-04."),
 ("AI Classification", "An LLM labelling what a file IS - a contract, source code, a billing record - from a natural-language description rather than a pattern. Usually combined with structural constraints (an extension or path that must also match) and exclusion rules, and tested against sample files before deployment. The term DSPM vendors use, now arriving at the endpoint. See E-02."),
 ("Trainable classifier", "The older supervised form of the same idea - a detector trained on example documents rather than described in a prompt. Being displaced by AI Classification."),
 ("OCR", "Optical character recognition - reading text out of images, so screenshots can be classified. See C-A10."),
 (None, "Investigation and risk"),
 ("UEBA", "User and entity behaviour analytics - baselining normal activity per user and flagging deviation from it."),
 ("UAM", "User activity monitoring - recording what users do independently of any policy match. See I-14."),
 ("IRM", "Insider risk management - risk arising from people inside the organisation, whether malicious, negligent, or compromised."),
 ("SIEM / SOAR", "Log aggregation and response-automation platforms. See I-21."),
 ("MCP", "Model Context Protocol - an open standard that lets AI clients call external tools. Some DLP platforms expose one as a natural-language admin interface. See U-10."),
 (None, "Identifiers used in the test data"),
 ("PII / PHI / PCI", "Personally identifiable information / protected health information / payment card data."),
 ("MNPI", "Material nonpublic information - company information not yet public that would move the share price. Use case C on the Classification sheet."),
 ("SSN / CCN / DOB", "Social security number / credit card number / date of birth."),
 ("MRN", "Medical record number."),
 ("NPI / DEA", "US National Provider Identifier and Drug Enforcement Administration registration number - both healthcare provider identifiers."),
 ("NI / NHS", "UK National Insurance number and NHS number."),
 ("SIN", "Canadian Social Insurance Number."),
 ("VAT / IBAN", "EU VAT registration number and International Bank Account Number."),
 ("Luhn", "The check-digit algorithm that validates credit card numbers. A tool that does not apply it will match any 16 digits. See C-A02."),
 (None, "Channels and platforms"),
 ("Shadow browser", "Any browser outside the managed one - Brave, Vivaldi, Tor, a portable build. Usually blocked wholesale or invisible, rarely inspected. See P-B01."),
 ("Agentic browser", "A browser that acts on the user's behalf (Comet, Atlas, Dia). The agent performs the egress, which breaks both attribution and intent. See P-G06."),
 ("MTP / PTP", "Media and Picture Transfer Protocol - how phones and cameras appear over USB. Not mass storage, so USB policy often misses them entirely. See P-P03."),
 ("VDI / AVD", "Virtual desktop infrastructure / Azure Virtual Desktop."),
 ("WSL", "Windows Subsystem for Linux - file writes there bypass many Windows agents. See P-N04."),
 ("HRIS", "Human resources information system, such as Workday. See C-D03."),
]
for term, text in GLOSSARY:
    if term is None:
        ws.cell(row=r, column=2, value=text).font = Font(name=FONT, size=10, bold=True, color=BLUE)
        ws.cell(row=r, column=2).alignment = TOP
        ws.row_dimensions[r].height = 16
        r += 1
        continue
    rm(r, term, text)
    r += 1

r += 1
ws.cell(row=r, column=2, value="TEST DATA AND TEST TARGETS").font = SUB
r += 1
for label, text in [
    ("dlptest.com/sample-data/", "Ready-made tables of synthetic PII: name + SSN + CCN, name + SSN + DOB, name + CCN + ZIP, name + DOB + email."),
    ("dlptest.com/generate/", "Generates synthetic datasets on demand, including Luhn-valid card numbers, NPI and DEA numbers, UK NI and NHS numbers, Canadian SIN, EU VAT and IBAN, passport and driver's licence numbers."),
    ("dlptest.com/http-post/ and /https-post/", "Live POST endpoints for testing cleartext and TLS web upload detection."),
    ("dlptest.com/ftp-test/", "Public FTP and S3 test targets for file-transfer channel tests."),
    ("dlptest.com/regex/", "A library of 103 DLP-relevant regex patterns with worked examples - useful for building the credential and secret test files in C-B01."),
    ("Important", "All data on dlptest.com is synthetic. Never use real customer, employee, or patient data to test a DLP tool."),
]:
    rm(r, label, text); r += 1

r += 1
ws.cell(row=r, column=2, value="NOTES ON SOURCES").font = SUB
r += 1
rm(r, "Vendor neutrality", "This plan names no DLP product. Every row is written as a capability to test rather than a feature to look for, so it applies equally to any endpoint DLP tool - and so that no product is advantaged or disadvantaged by being listed or left out. Where a capability is genuinely rare, the Maturity Tier column says so instead."); r += 1
rm(r, "Platform parity", "Several rows note that a control is commonly Windows-only - some print sub-features, RDP copy, Recall snapshot exclusion, just-in-time protection. Platform parity is the exception rather than the rule in endpoint DLP. Treat every macOS and Linux cell as unproven until you have tested it yourself rather than read it off a datasheet."); r += 1
rm(r, "Linux", "Linux columns are included because Linux endpoints exist in most engineering organisations. Coverage across the market is far thinner than for Windows and macOS - expect most Linux cells to be No or blank, and treat that as a finding rather than an omission."); r += 1

# ══════════════════════════════════════════════════════ 1. Classification
ws = wb.create_sheet("1. Classification")
W = [9, 26, 30, 44, 56, 50, 20, 15, 11, 30]
set_widths(ws, W)
hdrs = ["ID", "Use Case", "Test", "What You're Testing", "How to Test",
        "Expected Result / What Good Looks Like", "Detection Method", "Maturity Tier", "Result", "Notes"]
ws.append(hdrs)
style_header(ws, 1, len(hdrs))
for i, row in enumerate(CLASSIFICATION, start=2):
    ws.append(list(row) + ["", ""])
    for c in range(1, len(hdrs) + 1):
        cell = ws.cell(row=i, column=c)
        cell.font = B_FONT
        cell.alignment = TOP
        cell.border = BOX
    ws.cell(row=i, column=1).font = BB_FONT
    ws.cell(row=i, column=3).font = BB_FONT
    ws.cell(row=i, column=8).fill = TIER_FILL.get(row[7], PatternFill())
    ws.cell(row=i, column=8).alignment = CTR
    ws.cell(row=i, column=9).alignment = CTR
    ws.row_dimensions[i].height = est_height(
        [(row[3], W[3]), (row[4], W[4]), (row[5], W[5]), (row[2], W[2])])
last = len(CLASSIFICATION) + 1
add_dv(ws, RESULT_OPTS, f"I2:I{last}")
add_cf(ws, f"I2:I{last}", RESULT_CF)
ws.freeze_panes = "D2"
ws.auto_filter.ref = f"A1:J{last}"
ws.sheet_view.zoomScale = 100
CLASS_LAST = last

# ══════════════════════════════════════════════════════ 2. Policy
ws = wb.create_sheet("2. Policy")
W = [17, 22, 40, 11, 82, 14, 11, 15, 26]
set_widths(ws, W)

ws.merge_cells("A1:A2"); ws["A1"] = "ID"
ws.merge_cells("B1:B2"); ws["B1"] = "Channel Category"
ws.merge_cells("C1:C2"); ws["C1"] = "Channel / Vector"
ws.merge_cells("D1:D2"); ws["D1"] = "OS"
ws.merge_cells("E1:E2"); ws["E1"] = "What to Test"
ws.merge_cells("F1:G1"); ws["F1"] = "Result"
ws.merge_cells("H1:H2"); ws["H1"] = "Maturity Tier"
ws.merge_cells("I1:I2"); ws["I1"] = "Notes"
ws["F2"] = "Monitor / Warn"
ws["G2"] = "Block"

style_header(ws, 1, 9, height=26)
style_header(ws, 2, 9, height=30)
for col in "FG":
    for r_ in (1, 2):
        ws[f"{col}{r_}"].fill = PatternFill("solid", fgColor=BLUE)
        ws[f"{col}{r_}"].alignment = CTR
ws["F1"].alignment = CTR

OS_FILL = {"Windows": PatternFill("solid", fgColor="E7F1FF"),
           "macOS":   PatternFill("solid", fgColor="EFEAFB"),
           "Linux":   PatternFill("solid", fgColor="FFF0E6")}

for i, (pid, cat, chan, os_name, test, tier) in enumerate(POLICY, start=3):
    for c, v in ((1, pid), (2, cat), (3, chan), (4, os_name), (5, test), (8, tier)):
        ws.cell(row=i, column=c, value=v)
    for c in range(1, 10):
        cell = ws.cell(row=i, column=c)
        cell.font = B_FONT
        cell.alignment = TOP
        cell.border = BOX
    ws.cell(row=i, column=1).font = BB_FONT
    ws.cell(row=i, column=3).font = BB_FONT
    ws.cell(row=i, column=4).fill = OS_FILL[os_name]
    ws.cell(row=i, column=4).alignment = CTR
    for c in (6, 7, 8):
        ws.cell(row=i, column=c).alignment = CTR
    ws.cell(row=i, column=8).fill = TIER_FILL.get(tier, PatternFill())
    ws.row_dimensions[i].height = est_height([(test, W[4]), (chan, W[2])])

last = len(POLICY) + 2
add_dv(ws, RESULT_OPTS, f"F3:G{last}")
add_cf(ws, f"F3:G{last}", RESULT_CF)
ws.freeze_panes = "F3"
ws.auto_filter.ref = f"A2:I{last}"
POLICY_LAST = last

# ══════════════════════════════════════════════════════ 3. Enforcement
ws = wb.create_sheet("3. Enforcement")
W = [8, 36, 92, 11, 15, 28]
set_widths(ws, W)
note = ("The Policy sheet asks whether a channel can be controlled. This sheet asks what the tool can "
        "control it ON. Each row says what Pass means for that detection method - usually that the "
        "product blocks the action in the moment rather than alerting after the data has gone. This "
        "is where you find out why a team that can block PII going to a GenAI tool often cannot block "
        "AI-classified data going to the same tool.")
ws["A1"] = note
ws.merge_cells("A1:F1")
ws["A1"].font = Font(name=FONT, size=10, italic=True, color=GREY)
ws["A1"].alignment = TOP
ws["A1"].fill = PatternFill("solid", fgColor=BAND)
ws.row_dimensions[1].height = est_height([(note, 300)], base=14)

hdrs = ["ID", "Classification Method", "What to Test", "Result", "Maturity Tier", "Notes"]
for c, h in enumerate(hdrs, start=1):
    ws.cell(row=2, column=c, value=h)
style_header(ws, 2, len(hdrs), height=30)
for i, (xid, method, test, tier) in enumerate(XPOLICY, start=3):
    for c, v in ((1, xid), (2, method), (3, test), (5, tier)):
        ws.cell(row=i, column=c, value=v)
    for c in range(1, len(hdrs) + 1):
        cell = ws.cell(row=i, column=c)
        cell.font = B_FONT
        cell.alignment = TOP
        cell.border = BOX
    ws.cell(row=i, column=1).font = BB_FONT
    ws.cell(row=i, column=2).font = BB_FONT
    for c in (4, 5):
        ws.cell(row=i, column=c).alignment = CTR
    ws.cell(row=i, column=5).fill = TIER_FILL.get(tier, PatternFill())
    ws.row_dimensions[i].height = est_height([(test, W[2]), (method, W[1])])
last = len(XPOLICY) + 2
add_dv(ws, RESULT_OPTS, f"D3:D{last}")
add_cf(ws, f"D3:D{last}", RESULT_CF)
ws.freeze_panes = "C3"
ws.auto_filter.ref = f"A2:F{last}"
XP_LAST = last

# ══════════════════════════════════════════════════════ 3. Investigations
ws = wb.create_sheet("4. Investigations")
W = [8, 26, 40, 56, 62, 15, 11, 30]
set_widths(ws, W)
hdrs = ["ID", "Capability Area", "Capability", "Why It Matters", "How to Test / What to Ask",
        "Maturity Tier", "Result", "Notes"]
ws.append(hdrs)
style_header(ws, 1, len(hdrs))
for i, row in enumerate(INVESTIGATIONS, start=2):
    ws.append(list(row) + ["", ""])
    for c in range(1, len(hdrs) + 1):
        cell = ws.cell(row=i, column=c)
        cell.font = B_FONT
        cell.alignment = TOP
        cell.border = BOX
    ws.cell(row=i, column=1).font = BB_FONT
    ws.cell(row=i, column=3).font = BB_FONT
    ws.cell(row=i, column=6).fill = TIER_FILL.get(row[5], PatternFill())
    ws.cell(row=i, column=6).alignment = CTR
    ws.cell(row=i, column=7).alignment = CTR
    ws.row_dimensions[i].height = est_height(
        [(row[3], W[3]), (row[4], W[4]), (row[2], W[2])])
last = len(INVESTIGATIONS) + 1
add_dv(ws, RESULT_OPTS, f"G2:G{last}")
add_cf(ws, f"G2:G{last}", RESULT_CF)
ws.freeze_panes = "D2"
ws.auto_filter.ref = f"A1:H{last}"
INV_LAST = last

# ══════════════════════════════════════════════════════ 4. Usability
ws = wb.create_sheet("5. Usability")
W = [8, 24, 40, 54, 62, 15, 11, 30]
set_widths(ws, W)
hdrs = ["ID", "Area", "Capability", "Why It Matters", "How to Test / What to Ask",
        "Maturity Tier", "Result", "Notes"]
ws.append(hdrs)
style_header(ws, 1, len(hdrs))
for i, row in enumerate(USABILITY, start=2):
    ws.append(list(row) + ["", ""])
    for c in range(1, len(hdrs) + 1):
        cell = ws.cell(row=i, column=c)
        cell.font = B_FONT
        cell.alignment = TOP
        cell.border = BOX
    ws.cell(row=i, column=1).font = BB_FONT
    ws.cell(row=i, column=3).font = BB_FONT
    ws.cell(row=i, column=6).fill = TIER_FILL.get(row[5], PatternFill())
    ws.cell(row=i, column=6).alignment = CTR
    ws.cell(row=i, column=7).alignment = CTR
    ws.row_dimensions[i].height = est_height(
        [(row[3], W[3]), (row[4], W[4]), (row[2], W[2])])
last = len(USABILITY) + 1
add_dv(ws, RESULT_OPTS, f"G2:G{last}")
add_cf(ws, f"G2:G{last}", RESULT_CF)
ws.freeze_panes = "D2"
ws.auto_filter.ref = f"A1:H{last}"
USE_LAST = last

# ══════════════════════════════════════════════════════ Table stakes Fail helpers
# One hidden column per data sheet: the row's ID when it is a table stakes row scored Fail,
# otherwise blank. The Scoring Summary TEXTJOINs these into a per-sheet list. A plain range
# argument means no array formula, so it works in merged cells and needs no Ctrl-Shift-Enter.
TS_HELPERS = {}

def add_ts_fail_helper(ws, helper_col, id_col, tier_col, res_col, first, last, hdr_rows):
    L = get_column_letter
    for hr in hdr_rows:
        c = ws.cell(row=hr, column=helper_col)
        c.font, c.fill, c.alignment, c.border = H_FONT, H_FILL, HDRA, BOX
    ws.cell(row=hdr_rows[-1], column=helper_col, value="Table stakes Fail (auto)")
    for r_ in range(first, last + 1):
        ws.cell(row=r_, column=helper_col,
                value=f'=IF(AND({L(tier_col)}{r_}="Table stakes",{L(res_col)}{r_}="Fail"),{L(id_col)}{r_},"")')
    ws.column_dimensions[L(helper_col)].width = 18
    ws.column_dimensions[L(helper_col)].hidden = True
    TS_HELPERS[ws.title] = (L(helper_col), first, last)

#                                sheet                  helper  id  tier  result  first  last         header rows
add_ts_fail_helper(wb["1. Classification"], 11, 1, 8, 9, 2, CLASS_LAST, [1])
add_ts_fail_helper(wb["2. Policy"],         10, 1, 8, 7, 3, POLICY_LAST, [1, 2])   # Block
add_ts_fail_helper(wb["3. Enforcement"],     7, 1, 5, 4, 3, XP_LAST, [2])
add_ts_fail_helper(wb["4. Investigations"],  9, 1, 6, 7, 2, INV_LAST, [1])
add_ts_fail_helper(wb["5. Usability"],       9, 1, 6, 7, 2, USE_LAST, [1])

# ══════════════════════════════════════════════════════ Scoring Summary
ws = wb.create_sheet("Scoring Summary")
ws.sheet_view.showGridLines = False
set_widths(ws, [3, 34, 11, 11, 11, 11, 11, 13, 50])

ws["B2"] = "Scoring Summary"
ws["B2"].font = TITLE
ws.row_dimensions[2].height = 22
ws["B3"] = ("Every figure below is a formula over the Result columns. It updates as you fill the "
            "sheets in. One vocabulary throughout: Pass / Partial / Fail / N/A, blank = not yet tested.")
ws["B3"].font = Font(name=FONT, size=10, color=GREY)
ws.merge_cells("B3:I3")

RES = ["Pass", "Partial", "Fail", "N/A"]
HDR = ["Pass", "Partial", "Fail", "N/A", "Untested", "Coverage"]

def section_header(row, first_label, trailing):
    for c, h in enumerate([first_label] + HDR + [trailing], start=2):
        ws.cell(row=row, column=c, value=h)
    style_header(ws, row, 9, height=26)
    ws.cell(row=row, column=1).fill = PatternFill()
    ws.cell(row=row, column=1).border = Border()

def score_row(row, label, counts, total, meaning, bold_label=True):
    ws.cell(row=row, column=2, value=label).font = BB_FONT if bold_label else B_FONT
    for i, f in enumerate(counts):
        ws.cell(row=row, column=3 + i, value=f)
    ws.cell(row=row, column=7, value=f"={total}-SUM(C{row}:F{row})")
    ws.cell(row=row, column=8, value=f'=IFERROR((C{row}+0.5*D{row})/(C{row}+D{row}+E{row}),"-")')
    if meaning is not None:
        ws.cell(row=row, column=9, value=meaning)
        ws.cell(row=row, column=9).font = Font(name=FONT, size=9, color=GREY)
    for c in range(2, 10):
        cell = ws.cell(row=row, column=c)
        if c != 9: cell.font = BB_FONT if c == 2 else B_FONT
        cell.border = BOX
        cell.alignment = CTR if 3 <= c <= 8 else TOP
    ws.cell(row=row, column=8).number_format = "0.0%"

# ---- ranges on the source sheets -------------------------------------------
CLS = ("'1. Classification'", f"$I$2:$I${CLASS_LAST}", f"$H$2:$H${CLASS_LAST}", CLASS_LAST - 1)
POL = ("'2. Policy'", f"$F$3:$G${POLICY_LAST}", f"$H$3:$H${POLICY_LAST}", (POLICY_LAST - 2) * 2)
ENF = ("'3. Enforcement'", f"$D$3:$D${XP_LAST}", f"$E$3:$E${XP_LAST}", XP_LAST - 2)
INV = ("'4. Investigations'", f"$G$2:$G${INV_LAST}", f"$F$2:$F${INV_LAST}", INV_LAST - 1)
USE = ("'5. Usability'", f"$G$2:$G${USE_LAST}", f"$F$2:$F${USE_LAST}", USE_LAST - 1)

# ---- section 1: by sheet ----------------------------------------------------
section_header(5, "Section", "What the score means")
CHART_FIRST = 6
for i, (label, (sheet, rng, _tier, total), meaning) in enumerate([
    ("1. Classification", CLS, "Can the tool find your data? A low score here caps every other sheet."),
    ("2. Policy",         POL, f"{POLICY_LAST - 2} channel x OS rows, scored for Monitor / Warn and for Block - {(POLICY_LAST - 2) * 2} cells."),
    ("3. Enforcement",    ENF, "What the tool can enforce in real time, as opposed to detect after the fact."),
    ("4. Investigations", INV, "What it costs you per incident, in analyst hours."),
    ("5. Usability",      USE, "Whether the programme is still running in a year."),
]):
    r = CHART_FIRST + i
    score_row(r, label, [f'=COUNTIF({sheet}!{rng},"{v}")' for v in RES], total, meaning)
    ws.row_dimensions[r].height = est_height([(meaning, 50)])
CHART_LAST = CHART_FIRST + 4

# ---- section 2: policy by operating system ---------------------------------
r = CHART_LAST + 2
ws.cell(row=r, column=2, value="2. Policy - by operating system").font = SUB
r += 1
section_header(r, "OS / action", f"Out of {POLICY_LAST - 2} channel x OS rows")
hdr_row = r
r += 1
OS_ROWCOUNT = {}
for os_name in ("Windows", "macOS", "Linux"):
    OS_ROWCOUNT[os_name] = sum(1 for x in POLICY if x[3] == os_name)
for os_name in ("Windows", "macOS", "Linux"):
    n = OS_ROWCOUNT[os_name]
    for action, col in (("Monitor / Warn", "F"), ("Block", "G")):
        counts = [f'=COUNTIFS(\'2. Policy\'!$D$3:$D${POLICY_LAST},"{os_name}",'
                  f'\'2. Policy\'!${col}$3:${col}${POLICY_LAST},"{v}")' for v in RES]
        score_row(r, f"{os_name} - {action}", counts, n, None)
        ws.row_dimensions[r].height = 16
        r += 1
ws.cell(row=hdr_row + 1, column=9,
        value="Channel counts differ by OS because not every channel exists everywhere - "
              f"Windows {OS_ROWCOUNT['Windows']}, macOS {OS_ROWCOUNT['macOS']}, Linux {OS_ROWCOUNT['Linux']}.")
ws.cell(row=hdr_row + 1, column=9).font = Font(name=FONT, size=9, color=GREY)
ws.cell(row=hdr_row + 1, column=9).alignment = TOP

# ---- section 3: by maturity tier -------------------------------------------
r += 1
ws.cell(row=r, column=2, value="All sheets - by maturity tier").font = SUB
r += 1
section_header(r, "Maturity tier", "Why it matters")
tier_hdr = r
r += 1
TIER_SRC = [(CLS[0], CLS[2], CLS[1]), (POL[0], POL[2], f"$G$3:$G${POLICY_LAST}"),
            (ENF[0], ENF[2], ENF[1]), (INV[0], INV[2], INV[1]), (USE[0], USE[2], USE[1])]
TIER_TOTALS = {}
for tier in ("Table stakes", "Advanced", "Differentiator"):
    n = (sum(1 for x in CLASSIFICATION if x[7] == tier) + sum(1 for x in POLICY if x[5] == tier)
         + sum(1 for x in XPOLICY if x[3] == tier) + sum(1 for x in INVESTIGATIONS if x[5] == tier)
         + sum(1 for x in USABILITY if x[5] == tier))
    TIER_TOTALS[tier] = n
MEANING = {
 "Table stakes": f"Table stakes coverage below {TS_FLOOR:.0%} means the product cannot cover the basics, whatever its differentiator score. Individual Fails here belong in your findings rather than averaged into a percentage - they are listed by row below.",
 "Advanced": "Where mature products separate from adequate ones.",
 "Differentiator": "Few products pass many of these. A low score is information, not a verdict.",
}
for tier in ("Table stakes", "Advanced", "Differentiator"):
    counts = ["=" + "+".join(
        f'COUNTIFS({sh}!{tr},"{tier}",{sh}!{rr},"{v}")' for sh, tr, rr in TIER_SRC)
        for v in RES]
    score_row(r, tier, counts, TIER_TOTALS[tier], MEANING[tier])
    if tier == "Table stakes":
        TS_TIER_ROW = r
    ws.cell(row=r, column=2).fill = TIER_FILL[tier]
    ws.row_dimensions[r].height = est_height([(MEANING[tier], 50)])
    r += 1
ws.cell(row=tier_hdr, column=9, value="Why it matters")
ws.cell(row=tier_hdr, column=9).font = H_FONT

# coverage under the floor turns red; "-" (nothing scored yet) is left alone
ws.conditional_formatting.add(
    f"H{TS_TIER_ROW}",
    FormulaRule(formula=[f"AND(ISNUMBER($H${TS_TIER_ROW}),$H${TS_TIER_ROW}<{TS_FLOOR})"],
                fill=PatternFill("solid", bgColor=BAD[0]),
                font=Font(name=FONT, size=10, bold=True, color=BAD[1])))

# ---- section 4: which table stakes rows failed -----------------------------
r += 1
ws.cell(row=r, column=2, value="Table stakes failures - by row").font = SUB
r += 1
for c, h in enumerate(["Sheet", "Table stakes rows", "Fails", "Failed row IDs"], start=2):
    ws.cell(row=r, column=c, value=h)
style_header(ws, r, 9, height=30)
ws.cell(row=r, column=1).fill = PatternFill()
ws.cell(row=r, column=1).border = Border()
ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=9)
r += 1
FAIL_SRC = [
    ("1. Classification", "1. Classification", CLS[0], CLS[2], CLS[1], CLASSIFICATION, 7),
    ("2. Policy",         "2. Policy (Block)", POL[0], POL[2], f"$G$3:$G${POLICY_LAST}", POLICY, 5),
    ("3. Enforcement",    "3. Enforcement",    ENF[0], ENF[2], ENF[1], XPOLICY, 3),
    ("4. Investigations", "4. Investigations", INV[0], INV[2], INV[1], INVESTIGATIONS, 5),
    ("5. Usability",      "5. Usability",      USE[0], USE[2], USE[1], USABILITY, 5),
]
FAIL_LIST_ROWS = {}
for sheet_name, label, sh, tier_rng, res_rng, rows_, tier_idx in FAIL_SRC:
    hcol, hfirst, hlast = TS_HELPERS[sheet_name]
    worst_case = ", ".join(x[0] for x in rows_ if x[tier_idx] == "Table stakes")
    ws.cell(row=r, column=2, value=label)
    ws.cell(row=r, column=3, value=f'=COUNTIF({sh}!{tier_rng},"Table stakes")')
    ws.cell(row=r, column=4, value=f'=COUNTIFS({sh}!{tier_rng},"Table stakes",{sh}!{res_rng},"Fail")')
    ws.cell(row=r, column=5,
            value=f'=IF(D{r}=0,"None recorded",_xlfn.TEXTJOIN(", ",TRUE,{sh}!${hcol}${hfirst}:${hcol}${hlast}))')
    ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=9)
    for c in range(2, 10):
        cell = ws.cell(row=r, column=c)
        cell.font = BB_FONT if c == 2 else B_FONT
        cell.border = BOX
        cell.alignment = CTR if c in (3, 4) else TOP
    # size for the case where every table stakes row on the sheet fails, so nothing clips
    ws.row_dimensions[r].height = max(18, est_height([(worst_case, 96)]))
    FAIL_LIST_ROWS[sheet_name] = r
    r += 1

r += 1
ws.cell(row=r, column=2, value=f"Coverage = (Pass + 0.5 x Partial) / (Pass + Partial + Fail). N/A and untested rows are excluded. Table stakes coverage below {TS_FLOOR:.0%} is highlighted. The tier rollup and the failures list both score the Policy sheet on its Block column, the stricter of its two result columns.").font = MUTED
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=9)
NOTE_ROW = r

# ---- stacked bar over section 1 --------------------------------------------
chart = BarChart()
chart.type = "col"
chart.grouping = "stacked"
chart.overlap = 100
chart.title = "Results by sheet"
chart.y_axis.title = "Test cells"
chart.height, chart.width = 8.5, 20
data = Reference(ws, min_col=3, max_col=7, min_row=5, max_row=CHART_LAST)
cats = Reference(ws, min_col=2, min_row=CHART_FIRST, max_row=CHART_LAST)
chart.add_data(data, titles_from_data=True)
chart.set_categories(cats)
for series, colour in zip(chart.series, ("D6EFD8", "FDF0CE", "FADBD6", "EEEEEE", "FFFFFF")):
    series.graphicalProperties.solidFill = colour
    series.graphicalProperties.line.solidFill = "B8C2D0"
    series.graphicalProperties.line.width = 9525
ws.add_chart(chart, f"B{NOTE_ROW + 2}")

for s in wb.worksheets:
    s.page_setup.orientation = "landscape"
    s.page_setup.fitToWidth = 1
    s.sheet_properties.tabColor = BLUE

wb.active = 0
wb.save(OUT)
print("wrote", OUT)
