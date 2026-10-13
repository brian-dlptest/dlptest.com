Bulk CRM export detection

crm_export_50000-records.csv            50,000 contacts, ~4 MB
crm_export_20-records_negative-control.csv  the first 20 of the same rows,
                                        identical columns

Same schema, same kind of data - only the volume differs. Pass = the big file is
detected as a BULK EXPORT at a severity above the 20-record file. A tool that
scores them the same is matching content and ignoring concentration, which is the
whole risk this row is about.

The 50,000-record file is also the 100x export for the behavioural-baseline
investigation row and the large file for the chunked multipart upload channel.
