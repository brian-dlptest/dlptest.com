Origin-based classification from SaaS apps

Each export is provided twice - once under its real name and once renamed to
something innocuous:

  salesforce_opportunity-export.csv      -> q3-notes.csv
  workday_employee-export.csv            -> roster-backup.csv
  servicenow_ticket-export.csv           -> archive-2026.csv

Pass = still classified as customer / HR / ticket data on ORIGIN alone, with
no content match required, even under the innocuous name.

IMPORTANT CAVEAT: true origin lineage is recorded by the agent at the moment of
download. These files were generated locally, so they carry no download
provenance and a lineage-only tool will correctly find nothing. Use them to
check CONTENT classification and the rename behaviour; to test lineage properly
you have to run the real export from the real tenant:

  salesforce_opportunity-export.csv      Salesforce - Reports > Opportunities > Export Details
  workday_employee-export.csv            Workday - Reports > All Workers > Export to Excel
  servicenow_ticket-export.csv           ServiceNow - Incident list > Export > CSV
