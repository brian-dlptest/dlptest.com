"""Use case D - High-risk exports from business applications."""
import random
import shutil

import docgen as dg
import mcp_client as mcp

CL = "files/classification"
random.seed(20260917)

CRM_FIELDS = [
    {"name": "Contact ID", "type": "row-number"},
    {"name": "First Name", "type": "first-name"},
    {"name": "Last Name", "type": "last-name"},
    {"name": "Email", "type": "email"},
    {"name": "Phone", "type": "phone"},
    {"name": "Billing State", "type": "us-state"},
    {"name": "Billing ZIP", "type": "zip"},
    {"name": "Date of Birth", "type": "dob"},
    {"name": "Card on File", "type": "credit-card"},
]


def build_bulk_crm():
    """50,000 records - 100 MCP calls at the server's 500-row ceiling."""
    d = f"{CL}/bulk-crm-export"
    header, rows = None, []
    for i in range(100):
        h, r = mcp.csv_rows(mcp.save("crm-%03d.csv" % i, mcp.call("generate_custom", {
            "fields": CRM_FIELDS, "count": 500, "format": "csv"})))
        header = header or h
        rows.extend(r)
    assert len(rows) == 50000, len(rows)
    for n, row in enumerate(rows, 1):  # the server restarts row-number each call
        row[0] = str(n)

    dg.write_csv(f"{d}/crm_export_50000-records.csv", header, rows)
    dg.write_csv(f"{d}/crm_export_20-records_negative-control.csv", header, rows[:20])
    dg.write_text(
        f"{d}/README.txt",
        "Bulk CRM export detection\n\n"
        "crm_export_50000-records.csv            50,000 contacts, ~4 MB\n"
        "crm_export_20-records_negative-control.csv  the first 20 of the same rows,\n"
        "                                        identical columns\n\n"
        "Same schema, same kind of data - only the volume differs. Pass = the big file is\n"
        "detected as a BULK EXPORT at a severity above the 20-record file. A tool that\n"
        "scores them the same is matching content and ignoring concentration, which is the\n"
        "whole risk this row is about.\n\n"
        "The 50,000-record file is also the 100x export for the behavioural-baseline\n"
        "investigation row and the large file for the chunked multipart upload channel.\n")


SAAS = {
    "salesforce_opportunity-export.csv": {
        "innocuous": "q3-notes.csv",
        "fields": [
            {"name": "Opportunity ID", "type": "row-number"},
            {"name": "Account Contact First", "type": "first-name"},
            {"name": "Account Contact Last", "type": "last-name"},
            {"name": "Contact Email", "type": "email"},
            {"name": "Contact Phone", "type": "phone"},
            {"name": "Billing State", "type": "us-state"},
        ],
        "extra": ("Stage,Amount,Close Date",
                  lambda: "%s,%d,2027-%02d-%02d" % (
                      random.choice(["Prospecting", "Qualification", "Proposal",
                                     "Negotiation", "Closed Won"]),
                      random.randrange(12000, 940000, 500),
                      random.randint(1, 12), random.randint(1, 28))),
        "origin": "Salesforce - Reports > Opportunities > Export Details",
    },
    "workday_employee-export.csv": {
        "innocuous": "roster-backup.csv",
        "fields": [
            {"name": "Worker ID", "type": "row-number"},
            {"name": "First Name", "type": "first-name"},
            {"name": "Last Name", "type": "last-name"},
            {"name": "SSN", "type": "ssn"},
            {"name": "Date of Birth", "type": "dob"},
            {"name": "Work Email", "type": "email"},
        ],
        "extra": ("Cost Center,Location,Hire Date",
                  lambda: "%s,%s,20%02d-%02d-%02d" % (
                      random.choice(["4180-Sales", "3200-Engineering", "1100-Finance",
                                     "2400-Operations", "5010-Marketing"]),
                      random.choice(["Chicago", "Austin", "Remote-US", "London", "Dublin"]),
                      random.randint(17, 26), random.randint(1, 12), random.randint(1, 28))),
        "origin": "Workday - Reports > All Workers > Export to Excel",
    },
    "servicenow_ticket-export.csv": {
        "innocuous": "archive-2026.csv",
        "fields": [
            {"name": "Ticket Number", "type": "row-number"},
            {"name": "Caller First", "type": "first-name"},
            {"name": "Caller Last", "type": "last-name"},
            {"name": "Caller Email", "type": "email"},
            {"name": "Caller Phone", "type": "phone"},
            {"name": "Source IP", "type": "ip-v4"},
        ],
        "extra": ("Priority,Short Description,State",
                  lambda: "%s,%s,%s" % (
                      random.choice(["1 - Critical", "2 - High", "3 - Moderate", "4 - Low"]),
                      random.choice(["Password reset request",
                                     "VPN client will not connect",
                                     "Laptop replacement - hardware failure",
                                     "Access request - finance shared drive",
                                     "Mailbox quota exceeded"]),
                      random.choice(["New", "In Progress", "Resolved", "Closed"]))),
        "origin": "ServiceNow - Incident list > Export > CSV",
    },
}


def build_saas_exports():
    d = f"{CL}/saas-origin-lineage"
    for filename, spec in SAAS.items():
        h, rows = mcp.csv_rows(mcp.save(
            "saas-%s" % filename,
            mcp.call("generate_custom", {"fields": spec["fields"], "count": 250,
                                         "format": "csv"})))
        extra_header, extra_fn = spec["extra"]
        header = h + extra_header.split(",")
        rows = [r + extra_fn().split(",") for r in rows]
        dg.write_csv(f"{d}/{filename}", header, rows)
        shutil.copy(dg.path("files", "classification", "saas-origin-lineage", filename),
                    dg.path("files", "classification", "saas-origin-lineage", spec["innocuous"]))

    dg.write_text(
        f"{d}/README.txt",
        "Origin-based classification from SaaS apps\n\n"
        "Each export is provided twice - once under its real name and once renamed to\n"
        "something innocuous:\n\n"
        + "".join("  %-38s -> %s\n" % (k, v["innocuous"]) for k, v in SAAS.items())
        + "\nPass = still classified as customer / HR / ticket data on ORIGIN alone, with\n"
          "no content match required, even under the innocuous name.\n\n"
          "IMPORTANT CAVEAT: true origin lineage is recorded by the agent at the moment of\n"
          "download. These files were generated locally, so they carry no download\n"
          "provenance and a lineage-only tool will correctly find nothing. Use them to\n"
          "check CONTENT classification and the rename behaviour; to test lineage properly\n"
          "you have to run the real export from the real tenant:\n\n"
        + "".join("  %-38s %s\n" % (k, v["origin"]) for k, v in SAAS.items()))


def build_hris():
    d = f"{CL}/hris-compensation-export"
    h, rows = mcp.csv_rows(mcp.save("hris.csv", mcp.call("generate_custom", {
        "fields": [{"name": "Employee ID", "type": "row-number"},
                   {"name": "Full Name", "type": "full-name"},
                   {"name": "SSN", "type": "ssn"},
                   {"name": "Date of Birth", "type": "dob"},
                   {"name": "Work Email", "type": "email"}],
        "count": 180, "format": "csv"})))
    header = h + ["Job Title", "Department", "Base Salary", "Bonus Target %",
                  "Performance Rating", "Manager"]
    titles = ["Account Executive", "Senior Engineer", "Staff Engineer", "Analyst",
              "Director", "Programme Manager", "Recruiter", "Controller"]
    ratings = ["Exceeds", "Strong", "Meets", "Meets", "Meets", "Below", "Outstanding"]
    depts = ["Sales", "Engineering", "Finance", "Operations", "Marketing", "People"]
    managers = ["E. Whitlock", "R. Okonkwo", "A. Delacroix", "M. Sandoval", "P. Achebe"]
    rows = [r + [random.choice(titles), random.choice(depts),
                 random.randrange(68000, 296000, 1000),
                 random.choice([10, 12, 15, 20, 25, 35]),
                 random.choice(ratings), random.choice(managers)] for r in rows]
    dg.write_csv(f"{d}/hris_roster_name-ssn-salary-rating.csv", header, rows)
    dg.write_xlsx(f"{d}/hris_roster_name-ssn-salary-rating.xlsx",
                  [("Roster", header, rows)])
    dg.write_text(
        f"{d}/README.txt",
        "HRIS export with compensation data\n\n"
        "180 employees with name, SSN, DOB, salary, bonus target and performance rating,\n"
        "as both .csv and .xlsx - HR exports arrive in both shapes and some tools inspect\n"
        "only one.\n\n"
        "Pass = detected as HR data. Then the part that actually matters: confirm the HR\n"
        "staff who legitimately run this export are handled by POLICY SCOPE, not by an\n"
        "exception that disables the rule for everyone.\n")


def build_db_extracts():
    d = f"{CL}/direct-database-extracts"
    h, rows = mcp.csv_rows(mcp.save("db-extract.csv", mcp.call("generate_custom", {
        "fields": [{"name": "customer_id", "type": "row-number"},
                   {"name": "first_name", "type": "first-name"},
                   {"name": "last_name", "type": "last-name"},
                   {"name": "ssn", "type": "ssn"},
                   {"name": "email", "type": "email"},
                   {"name": "routing_number", "type": "routing-number"},
                   {"name": "account_number", "type": "account-number"}],
        "count": 300, "format": "csv"})))
    dg.write_csv(f"{d}/db_extract_gui-export-results-to-file.csv", h, rows)

    widths = [max(len(str(r[i])) for r in [h] + rows) for i in range(len(h))]
    def line(vals, sep="|"):
        return " " + (" %s " % sep).join(str(v).ljust(widths[i])
                                         for i, v in enumerate(vals)) + " "
    out = [
        "psql (16.2) - connected to prod-replica.internal.example.com:5432/billing",
        "billing=> SELECT customer_id, first_name, last_name, ssn, email,",
        "billing->        routing_number, account_number",
        "billing->   FROM customers.customer_payment_profile",
        "billing->  WHERE active = true",
        "billing->  ORDER BY customer_id",
        "billing->  LIMIT 300 \\g /Users/jharrington/Desktop/extract.txt",
        "",
        line(h),
        "-" + "-+-".join("-" * w for w in widths) + "-",
    ]
    out += [line(r) for r in rows]
    out += ["(300 rows)", ""]
    dg.write_text(f"{d}/db_extract_cli-piped-output.txt", "\n".join(out))

    dg.write_text(f"{d}/db_extract_cli-command.sh", """#!/bin/bash
# Direct database extracts - reproduce the CLI extraction on your own box, so the PROCESS is real.
# The .txt alongside this script is what the command below produces.

psql -h prod-replica.internal.example.com -U reporting -d billing \\
  -c "SELECT customer_id, first_name, last_name, ssn, email,
             routing_number, account_number
        FROM customers.customer_payment_profile
       WHERE active = true
       ORDER BY customer_id LIMIT 300" \\
  > ~/Desktop/extract.txt

# The point of this row is process attribution. A file dropped on the Desktop by hand
# is not the same event as one written by psql, and CLI extraction is exactly where
# most tools lose sight of the data.
""")
    dg.write_text(
        f"{d}/README.txt",
        "Direct database extracts\n\n"
        "db_extract_gui-export-results-to-file.csv  what DBeaver / pgAdmin / SSMS write\n"
        "                                           from 'export results to file'\n"
        "db_extract_cli-piped-output.txt            what a piped psql query writes,\n"
        "                                           including the query text itself\n"
        "db_extract_cli-command.sh                  run this to produce the .txt with a\n"
        "                                           REAL process behind it\n\n"
        "Pass = both are visible AND attributable to the process that created them. Run\n"
        "the .sh version if you have any database to point at - the pre-generated .txt\n"
        "tests content inspection, but only a real command tests process context, and\n"
        "process context is the whole row.\n")


def run():
    build_bulk_crm()
    build_saas_exports()
    build_hris()
    build_db_extracts()
