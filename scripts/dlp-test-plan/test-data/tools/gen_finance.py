"""Use case C - Financial reporting and material nonpublic information."""
import random

import docgen as dg
import mcp_client as mcp

CL = "files/classification"
random.seed(20260917)

HOLDERS = [
    ("Meridian Growth Partners III, L.P.", "Series B Preferred", 14_250_000),
    ("Northgate Venture Fund II", "Series B Preferred", 9_100_000),
    ("Ashcombe Capital", "Series A Preferred", 7_400_000),
    ("Braeburn Seed Fund", "Seed Preferred", 3_950_000),
    ("E. Whitlock (Founder)", "Common", 11_800_000),
    ("R. Okonkwo (Founder)", "Common", 11_800_000),
    ("Employee Option Pool", "Common (reserved)", 8_600_000),
    ("Strategic Investor - Caldera Industries", "Series B Preferred", 4_200_000),
]


def build_earnings():
    d = f"{CL}/earnings-and-board-material"

    dg.write_docx(
        f"{d}/draft_earnings-release.docx",
        "DRAFT - NOT FOR RELEASE",
        [("b", "EMBARGOED UNTIL 16:05 ET, 4 FEBRUARY 2027. MATERIAL NONPUBLIC INFORMATION."),
         ("h", "Acme Financial Reports Fourth Quarter and Full Year 2026 Results"),
         "Acme Financial Holdings today reported results for the quarter and year ended "
         "31 December 2026. Fourth quarter revenue was $412.7 million, an increase of "
         "18.4% year over year, ahead of the guidance range of $395-405 million issued "
         "in November.",
         "GAAP operating income was $61.3 million, compared with $38.9 million in the "
         "prior-year quarter. Non-GAAP operating margin expanded 310 basis points to "
         "21.7%. Diluted earnings per share were $0.94 on a GAAP basis and $1.21 on a "
         "non-GAAP basis.",
         "Full year revenue was $1.53 billion, up 16.1%. Free cash flow was $284.6 "
         "million, representing a conversion rate of 92% of non-GAAP net income.",
         ("h", "Guidance"),
         "For the first quarter of 2027 the Company expects revenue of $421-431 million "
         "and non-GAAP operating margin of 21.0-22.0%. For the full year 2027 the "
         "Company expects revenue of $1.78-1.81 billion.",
         ("h", "Board actions not yet disclosed"),
         "The Board has authorised a $250 million share repurchase programme, to be "
         "announced concurrently with this release, and has approved the impairment of "
         "$47.2 million of goodwill associated with the 2024 acquisition.",
         ("b", "Distribution of this draft outside Finance, Legal and Investor Relations "
               "is a violation of the Company's insider trading policy.")])

    dg.write_pptx(f"{d}/board_deck.pptx", [
        ("Q4 2026 Board Meeting", ["Confidential - Board of Directors only"]),
        ("Financial Summary", [
            "Q4 revenue $412.7M, +18.4% YoY - ahead of guidance",
            "  Non-GAAP operating margin 21.7%, +310bps",
            "  FY26 revenue $1.53B, FCF $284.6M",
            "  Q4 net revenue retention 117%"]),
        ("Matters for Board Approval", [
            "$250M share repurchase authorisation",
            "  Goodwill impairment of $47.2M (2024 acquisition)",
            "  FY27 executive compensation framework",
            "  Project Kingfisher - EMEA acquisition, non-binding LOI"]),
        ("Project Kingfisher", [
            "Target: EMEA payments processor, ~EUR 340M enterprise value",
            "  Indicative range EUR 310-355M, 4.1x forward revenue",
            "  Diligence complete; SPA drafting underway",
            "  Announcement targeted for the week of 22 March 2027"]),
        ("Risk Register - Material Items", [
            "Ongoing regulatory review of interchange practices",
            "  Settlement discussions - Project Ombersley - reserve $18.5M",
            "  Key-person exposure in the platform organisation",
            "  Project Nettlebed workforce modelling: 6-9% reduction scenario"]),
        ("FY27 Plan", [
            "Revenue $1.78-1.81B, +16-18%",
            "  Operating margin 21-22%, expanding to 24% by FY29",
            "  Headcount plan 3,140 (from 2,905)"]),
    ])

    total = sum(h[2] for h in HOLDERS)
    cap_rows = [[n, c, s, "%.2f%%" % (100.0 * s / total)] for n, c, s in HOLDERS]
    cap_rows.append(["TOTAL", "", total, "100.00%"])
    dg.write_xlsx(f"{d}/cap_table.xlsx", [
        ("Cap Table", ["Holder", "Security", "Shares", "Fully Diluted %"], cap_rows),
        ("Preferred Terms", ["Series", "Price/Share", "Liquidation Pref", "Raised"],
         [["Seed Preferred", 0.412, "1x non-participating", 1_627_400],
          ["Series A Preferred", 1.840, "1x non-participating", 13_616_000],
          ["Series B Preferred", 6.275, "1x non-participating", 174_531_250]]),
        ("409A", ["Valuation Date", "Common FMV", "Preferred FMV", "Provider"],
         [["2026-09-30", 2.81, 6.275, "Vantage Valuations"],
          ["2026-03-31", 2.34, 6.275, "Vantage Valuations"]]),
    ])

    years = ["FY24A", "FY25A", "FY26A", "FY27P", "FY28P", "FY29P"]
    dg.write_xlsx(f"{d}/three-statement-model.xlsx", [
        ("Income Statement", ["Line Item ($000s)"] + years, [
            ["Revenue", 1_016_400, 1_318_200, 1_530_100, 1_795_000, 2_100_000, 2_457_000],
            ["Cost of Revenue", 284_600, 356_000, 398_000, 457_000, 525_000, 602_000],
            ["Gross Profit", 731_800, 962_200, 1_132_100, 1_338_000, 1_575_000, 1_855_000],
            ["Sales & Marketing", 356_000, 447_000, 489_000, 556_000, 630_000, 712_000],
            ["Research & Development", 203_000, 251_000, 291_000, 341_000, 399_000, 467_000],
            ["General & Administrative", 118_000, 141_000, 156_000, 179_000, 205_000, 233_000],
            ["Operating Income", 54_800, 123_200, 196_100, 262_000, 341_000, 443_000],
            ["Net Income", 31_200, 84_600, 141_700, 191_000, 251_000, 328_000],
        ]),
        ("Balance Sheet", ["Line Item ($000s)"] + years, [
            ["Cash & Equivalents", 291_000, 348_000, 512_000, 641_000, 812_000, 1_040_000],
            ["Accounts Receivable", 148_000, 191_000, 219_000, 257_000, 301_000, 352_000],
            ["Goodwill", 412_000, 412_000, 364_800, 364_800, 364_800, 364_800],
            ["Total Assets", 1_104_000, 1_248_000, 1_402_000, 1_611_000, 1_884_000, 2_221_000],
            ["Total Liabilities", 496_000, 531_000, 548_000, 571_000, 598_000, 622_000],
            ["Stockholders Equity", 608_000, 717_000, 854_000, 1_040_000, 1_286_000, 1_599_000],
        ]),
        ("Cash Flow", ["Line Item ($000s)"] + years, [
            ["Net Income", 31_200, 84_600, 141_700, 191_000, 251_000, 328_000],
            ["Depreciation & Amortisation", 61_000, 68_000, 74_000, 81_000, 89_000, 97_000],
            ["Change in Working Capital", -18_400, -24_100, -21_300, -27_000, -31_000, -36_000],
            ["Capital Expenditure", -42_000, -48_000, -51_000, -58_000, -66_000, -75_000],
            ["Free Cash Flow", 178_400, 229_500, 284_600, 348_000, 431_000, 538_000],
        ]),
    ])

    dg.write_docx(
        f"{d}/routine_expense-report_negative-control.docx",
        "Expense Report - October 2026",
        [("b", "NEGATIVE CONTROL. This is an ordinary Finance document and should NOT match."),
         "Employee: J. Harrington, Regional Sales. Cost centre 4180.",
         "Submitted 3 November 2026. Approved by line manager 5 November 2026."],
        table=(["Date", "Category", "Description", "Amount"],
               [["2026-10-03", "Airfare", "ORD-DEN round trip, customer visit", "$412.60"],
                ["2026-10-03", "Lodging", "Two nights, Denver", "$388.00"],
                ["2026-10-04", "Meals", "Client dinner, four attendees", "$186.42"],
                ["2026-10-11", "Mileage", "142 miles at $0.67", "$95.14"],
                ["2026-10-18", "Software", "Annual CRM seat renewal", "$1,188.00"],
                ["2026-10-24", "Meals", "Team lunch, quarterly review", "$94.80"],
                ["", "", "TOTAL", "$2,364.96"]]))

    dg.write_text(
        f"{d}/README.txt",
        "Earnings and board material detection\n\n"
        "draft_earnings-release.docx    unreleased results, guidance, buyback, impairment\n"
        "board_deck.pptx                6 slides incl. an undisclosed acquisition\n"
        "cap_table.xlsx                 holders, preferred terms, 409A\n"
        "three-statement-model.xlsx     IS / BS / CF with forward projections\n"
        "routine_expense-report_negative-control.docx   NEGATIVE CONTROL - must not match\n\n"
        "Pass = the four sensitive files match and the expense report does not. If\n"
        "everything in Finance matches, precision is unusable and this row is a Fail even\n"
        "though the recall looks perfect.\n")


def build_time_boxed():
    d = f"{CL}/time-boxed-mnpi"
    quarters = ["Q1", "Q2", "Q3", "Q4"]
    header = ["Segment"] + quarters + ["Full Year"]

    published = [
        ["Payments", 271_400, 288_900, 301_200, 318_700, 1_180_200],
        ["Platform Services", 61_800, 66_400, 71_900, 78_100, 278_200],
        ["Professional Services", 17_200, 18_100, 19_300, 20_600, 75_200],
        ["Other", 3_900, 4_100, 4_200, 4_400, 16_600],
        ["TOTAL", 354_300, 377_500, 396_600, 421_800, 1_550_200],
    ]
    projected = [
        ["Payments", 331_900, 349_700, 368_200, 389_400, 1_439_200],
        ["Platform Services", 84_600, 91_200, 98_800, 107_300, 381_900],
        ["Professional Services", 21_400, 22_600, 23_900, 25_400, 93_300],
        ["Other", 4_600, 4_800, 5_000, 5_200, 19_600],
        ["TOTAL", 442_500, 468_300, 495_900, 527_300, 1_934_000],
    ]
    dg.write_xlsx(f"{d}/published_fy25-results.xlsx", [
        ("Revenue by Segment", header, published),
        ("Notes", ["Note"], [["Filed with the 10-K on 12 February 2026."],
                             ["Public information. Reproduced from the investor site."],
                             ["Figures in $000s."]]),
    ])
    dg.write_xlsx(f"{d}/projected_fy27-revenue.xlsx", [
        ("Revenue by Segment", header, projected),
        ("Notes", ["Note"], [["Board plan case, approved 14 December 2026."],
                             ["MATERIAL NONPUBLIC INFORMATION. Not filed. Not disclosed."],
                             ["Figures in $000s."]]),
    ])
    dg.write_text(
        f"{d}/README.txt",
        "Time-boxed sensitivity: pre- vs post-publication\n\n"
        "Two parts, and the files below serve part (2).\n\n"
        "(1) Effective-date window\n"
        "    Apply a policy with a start and end date, move ANY file from this library\n"
        "    inside the window, then again after it closes. Pass = enforcement changes\n"
        "    with the calendar and the policy is not rewritten. Most tools cannot do this,\n"
        "    so write down the workaround you had to use.\n\n"
        "(2) Forecast vs published\n"
        "    projected_fy27-revenue.xlsx   MNPI - board plan case, never filed\n"
        "    published_fy25-results.xlsx   public - filed with the 10-K\n\n"
        "    Same workbook shape, same sheet names, same segments, similar magnitudes.\n"
        "    Only the Notes sheet and the forward-looking nature differ. A keyword-only\n"
        "    tool will treat them identically; that is the point of the pair.\n")


def build_insider_list():
    d = f"{CL}/insider-list"
    h, rows = mcp.csv_rows(mcp.save(
        "insider-people.csv",
        mcp.call("generate_pii_email", {"count": 12, "format": "csv"})))
    insiders = rows[:4]
    others = rows[4:10]

    dg.write_csv(f"{d}/insider-list_project-kingfisher.csv",
                 ["first_name", "last_name", "email", "role_on_deal"],
                 [[r[0], r[1], r[3], role] for r, role in zip(
                     insiders, ["Deal lead", "CFO", "General Counsel", "Corp Dev"])])
    dg.write_csv(f"{d}/has-file-access_not-on-insider-list.csv",
                 ["first_name", "last_name", "email", "why_they_have_access"],
                 [[r[0], r[1], r[3], why] for r, why in zip(
                     others, ["Finance shared drive owner", "IT backup operator",
                              "Departmental admin", "Data room administrator",
                              "Internal audit", "Records management"])])
    dg.write_docx(
        f"{d}/project-kingfisher_board-update.docx",
        "Project Kingfisher - Board Update",
        [("b", "RESTRICTED - INSIDER LIST ONLY. Recipients are on the Company's insider "
               "list for this transaction and are subject to dealing restrictions."),
         "Target: EMEA payments processor, enterprise value approximately EUR 340 million.",
         "Indicative range EUR 310-355 million, implying 4.1x forward revenue. Diligence "
         "is complete with no material adverse findings. SPA drafting is underway with "
         "signing targeted for the week of 22 March 2027.",
         "Financing is committed: EUR 180 million cash on hand, EUR 160 million from the "
         "revolving facility. No equity issuance is contemplated.",
         "Retention packages for the target's senior team total EUR 11.4 million over "
         "three years and are not yet disclosed to the target's employees.",
         ("b", "Do not forward. Do not discuss outside the deal team.")])
    dg.write_text(
        f"{d}/README.txt",
        "Insider-list / need-to-know scoping\n\n"
        "project-kingfisher_board-update.docx  the restricted document\n"
        "insider-list_project-kingfisher.csv   4 people who MAY move it\n"
        "has-file-access_not-on-insider-list.csv  6 people who have legitimate file\n"
        "                                      access but are NOT on the insider list\n\n"
        "Grant two users file access - one from each list - and have both attempt egress.\n"
        "Pass = only the insider-list member is permitted, and the policy scope is\n"
        "independent of the file permissions. If the tool can only express this as an NTFS\n"
        "or Drive permission, it has failed the row: the whole point is that file access\n"
        "and dealing permission are different questions.\n")


def run():
    build_earnings()
    build_time_boxed()
    build_insider_list()
