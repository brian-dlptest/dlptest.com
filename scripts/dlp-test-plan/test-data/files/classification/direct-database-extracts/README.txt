Direct database extracts

db_extract_gui-export-results-to-file.csv  what DBeaver / pgAdmin / SSMS write
                                           from 'export results to file'
db_extract_cli-piped-output.txt            what a piped psql query writes,
                                           including the query text itself
db_extract_cli-command.sh                  run this to produce the .txt with a
                                           REAL process behind it

Pass = both are visible AND attributable to the process that created them. Run
the .sh version if you have any database to point at - the pre-generated .txt
tests content inspection, but only a real command tests process context, and
process context is the whole row.
