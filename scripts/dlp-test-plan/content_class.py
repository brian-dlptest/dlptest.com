# Sheet 1 - Classification
# (id, use_case, test_name, what_youre_testing, how_to_test, expected_result, detection_method, tier)

UC_A = "A. Regulatory Compliance (PII / PHI / PCI)"
UC_B = "B. Intellectual Property & Source Code"
UC_C = "C. Financial Reporting & Material Nonpublic Info"
UC_D = "D. High-Risk Exports from Business Apps"

CLASSIFICATION = [
# ---------------------------------------------------------------- UC_A
("C-A01", UC_A, "US SSN detection",
 "Baseline structured-identifier detection for GDPR/HIPAA/state privacy law.",
 "Build a .docx and a .csv containing 25 SSNs from dlptest.com/sample-data/ (or /generate/). Move each file through one monitored channel.",
 "Both files match a US SSN classifier. Incident shows the correct match count and the matched values are visible (masked or unmasked per config).",
 "Pattern match", "Table stakes"),

("C-A02", UC_A, "Credit card (PCI-DSS) detection with Luhn",
 "Whether the card classifier validates the check digit instead of matching any 16 digits.",
 "Generate Visa / Mastercard / Amex / Discover numbers at dlptest.com/generate/. Then hand-edit one digit of each so Luhn fails and re-test.",
 "Valid numbers match. Luhn-invalid numbers do NOT match. A 16-digit order number or timestamp does not match.",
 "Pattern + checksum", "Table stakes"),

("C-A03", UC_A, "PHI detection (HIPAA)",
 "Healthcare identifiers beyond SSN - the ones most tools miss.",
 "Test a file containing MRN, NPI (10-digit Luhn), DEA number, ICD-10 codes, and patient name + DOB together. dlptest.com/generate/ produces NPI/DEA pairs.",
 "PHI classifier fires. Ideally the incident names which PHI element matched, not just 'PHI'.",
 "Pattern + dictionary", "Table stakes"),

("C-A04", UC_A, "International identifier coverage",
 "Non-US regulatory scope - most programs discover the gap after go-live.",
 "Test UK NI number + NHS number, Canadian SIN, EU VAT + IBAN, passport numbers. All available at dlptest.com/generate/.",
 "Each jurisdiction has a working classifier. Note any you have to build yourself.",
 "Pattern match", "Table stakes"),

("C-A05", UC_A, "Unique vs total match counting  (run this before C-A06)",
 "Whether the count that drives severity is UNIQUE matches or raw occurrences. The single most common cause of inflated severity, and it has to be settled before any match-count tiering means anything.",
 "File 1: one SSN repeated 100 times. File 2: 100 distinct SSNs. Send both and compare the reported match counts. Cheap to build, two minutes to run.",
 "File 1 reports a unique count of 1. File 2 reports 100. If both report 100 the tool is counting occurrences, not unique values - stop and resolve that, because every severity tier in C-A06 is meaningless until you do.",
 "Counting logic", "Table stakes"),

("C-A06", UC_A, "Severity tiers by match count",
 "Volume-based severity so a 3-record leak and a 30,000-record leak are not the same alert.",
 "PREREQUISITE: C-A05 must pass first. Then configure Low = 1-9, Medium = 10-49, High = 50+ unique matches and send files with 5 / 25 / 100 distinct records. Finally re-send the file containing one SSN repeated 100 times as a regression check.",
 "Three incidents at three severities, from one rule - tiering should not require three separate policies. The repeated-value file still lands in Low. If it lands in High, the tiering is reporting file length rather than exposure.",
 "Counting logic", "Table stakes"),

("C-A07", UC_A, "Confidence level / threshold tuning",
 "The precision dial - and the control most often mistaken for a percentage. It is not 'how much of the pattern matched'. It is how much SUPPORTING EVIDENCE sits near the identifier. Platforms express it two ways: as named low / medium / high levels with numeric values attached (65 / 75 / 85 is one such scheme), or as a match threshold combined with weighted keyword phrases. Same idea, different vocabulary.",
 "Build one rule per level. Send (a) a bare 9-digit number, (b) the same number formatted 123-45-6789, (c) the number preceded by 'SSN:' within 10 characters, (d) the number in a document titled 'Social Security'.",
 "(a) matches at 65 only. (c) and (d) match at 85. Low confidence returns the fewest false negatives and the most false positives; high confidence the reverse. The standard technique is to pair high confidence with low instance counts (5-10) and low confidence with high counts (20+) - confirm you can set confidence and count INDEPENDENTLY on one rule, because pairing them is the whole technique.",
 "Confidence scoring", "Table stakes"),

("C-A08", UC_A, "Exact Data Match (EDM)",
 "Matching your actual customer records, not anything SSN-shaped. The highest-precision technique available.",
 "Upload a hashed index of 10,000 real (or realistic) records. Send a file with 50 records that ARE in the index and 50 that are not.",
 "Only the indexed 50 match. Measure index refresh time and the max supported index size.",
 "EDM", "Differentiator"),

("C-A09", UC_A, "AI Classification of a business-specific document type",
 "Whether you can build a classifier for a document type only your organisation has, described in plain language rather than expressed as a pattern. This is becoming the primary classification method, and the authoring loop is what decides whether it is usable in practice.",
 "Pick a document type no out-of-box classifier will know - your MSA template, your incident post-mortems, your pricing approvals. Describe it in natural language, add a structural constraint if the tool supports one (an extension or path that must also match), and add an exclusion for templates and test files. Run it against ten real examples and ten near-misses: documents from the same team that are NOT that type. Time the whole loop, from request to a label you would deploy.",
 "At least nine of the ten real examples labelled and no more than one near-miss, with the loop taking minutes rather than a support ticket. Confirm you can test against sample files BEFORE the label goes live - a classifier you can only evaluate in production is not tunable. If the tool supports sub-labels, confirm a child only matches when the parent does too.",
 "AI Classification", "Advanced"),

("C-A10", UC_A, "OCR on images",
 "Screenshot exfiltration - the single most common way PII leaves without tripping a text classifier.",
 "Screenshot a table of SSNs and save as .png. Also test a photo-quality .jpg and a rotated image.",
 "OCR extracts the identifiers and the normal pattern rules apply. Note the file-size and resolution limits.",
 "OCR + pattern", "Advanced"),

("C-A11", UC_A, "Archives and nested files",
 "Depth of container inspection.",
 "Send a .zip containing a .docx with SSNs. Then a .zip inside a .zip. Then a password-protected .zip. Then a 7z and a .tar.gz.",
 "Nested content is inspected to at least 2-3 levels. Encrypted archives are detected as encrypted and handled by policy (block or flag), not silently passed.",
 "Container inspection", "Table stakes"),

# ---------------------------------------------------------------- UC_B
("C-B01", UC_B, "Secrets and credentials in code",
 "API keys, tokens, private keys, connection strings.",
 "Use the credential patterns in the dlptest.com/regex/ library (AWS keys, GitHub tokens, private key headers, JWTs, connection strings) to build a test file.",
 "Each secret type is detected. Ideally the tool distinguishes a live-looking secret from an obvious placeholder.",
 "Pattern match", "Table stakes"),

("C-B02", UC_B, "Origin-based sensitivity (data lineage)",
 "THE differentiating test for this use case. The same token is low risk from a public repo and high risk from an internal one.",
 "Clone a file from an internal Git repo and a near-identical file from a public GitHub repo. Move both to the same destination.",
 "The internal-origin file is classified higher, or is the only one blocked. If both are treated identically, the tool has no lineage.",
 "Data lineage", "Differentiator"),

("C-B03", UC_B, "Lineage survival through obfuscation",
 "Whether origin-based classification survives the things people actually do to files.",
 "Take a file from the internal repo, then: rename it, change its extension, zip it, copy its contents into a new blank file, and paste a section into a chat app. Attempt egress after each step.",
 "Classification persists through rename, re-container, and copy/paste. Note the first step where the trace is lost.",
 "Data lineage", "Differentiator"),

("C-B04", UC_B, "Project codenames and trade-secret terms",
 "Business-specific vocabulary that no out-of-box classifier knows.",
 "Build a dictionary of 20 internal project names and test how long it takes to create, deploy, and tune it. Include one term with an everyday meaning (e.g. 'Mercury') to test false positives.",
 "Dictionary deploys in minutes, supports weighting, and the ambiguous term can be disambiguated by context rather than removed.",
 "Dictionary + AI context", "Table stakes"),

# ---------------------------------------------------------------- UC_C
("C-C01", UC_C, "Earnings and board material detection",
 "Recognising finance documents by structure and language, not just by folder.",
 "Send a draft earnings release, a board deck, a cap table, and a three-statement model. Include a routine expense report as a negative control.",
 "Sensitive finance material is detected; routine finance files are not. If everything in Finance matches, precision is unusable.",
 "AI Classification", "Advanced"),

("C-C02", UC_C, "Time-boxed sensitivity: pre- vs post-publication",
 "The core MNPI problem, from two directions. A draft 10-Q is material nonpublic information before filing and ordinary public data after, so sensitivity has to change with the calendar - and the tool has to be able to tell a forecast from a published result in the first place.",
 "Two parts. (1) Apply a policy with an effective date window, then move the same file inside the window and again after it closes. (2) Send a file of projected FY27 revenue and a file of already-published FY25 results, formatted alike and with similar numbers.",
 "(1) Enforcement changes with the date without the policy being rewritten - most tools cannot do this, so record the workaround. (2) The forward-looking file is treated as more sensitive; a keyword-only tool will treat the two identically.",
 "Policy scheduling / AI Classification", "Differentiator"),

("C-C03", UC_C, "Insider-list / need-to-know scoping",
 "Restricting deal material to the deal team, including people who legitimately have file access.",
 "Grant two users file access, put only one on the insider list, and have both attempt egress.",
 "Only the insider-list member is permitted. Policy scope is independent of file permissions.",
 "Policy scoping + identity", "Differentiator"),

# ---------------------------------------------------------------- UC_D
("C-D01", UC_D, "Bulk CRM export detection",
 "Catching the volume, not just the content. Thousands of records concentrated into one file.",
 "Export 50,000 records from a CRM (or simulate with a generated CSV from dlptest.com/generate/) and move the file.",
 "Detected as a bulk export, at a severity above a 20-record file with the same columns.",
 "Volume + structure", "Table stakes"),

("C-D02", UC_D, "Origin-based classification from SaaS apps",
 "Lineage from the system of record: 'this came out of Salesforce, therefore it is customer data.'",
 "Export from Salesforce / Workday / ServiceNow. Rename the file to something innocuous and move it.",
 "Still classified as customer/HR data on origin alone, with no content match required.",
 "Data lineage", "Differentiator"),

("C-D03", UC_D, "HRIS export with compensation data",
 "Employee data - often the most sensitive export and the least policed.",
 "Export a roster with name, SSN, salary, and performance rating.",
 "Detected as HR data. Confirm HR staff who legitimately run this export are handled by scope, not by an exception that disables the rule.",
 "Pattern + lineage", "Table stakes"),

("C-D04", UC_D, "Direct database extracts",
 "Bypassing the application entirely - the most common blind spot in this use case.",
 "Run a SELECT in DBeaver / pgAdmin / SSMS and use 'export results to file'. Then pipe a query to a file from the CLI.",
 "Both are visible and attributable to the process. CLI extraction is where most tools lose sight.",
 "Process context", "Differentiator"),

]
