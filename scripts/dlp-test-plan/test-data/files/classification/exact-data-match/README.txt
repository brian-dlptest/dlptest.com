Exact Data Match (EDM)

edm_source_index_10000-records.csv  ingest through your product's own EDM tooling
                                    (it hashes the file; do not send it as-is)
edm_test-upload_50in-50out.csv      SEND THIS - 100 rows, 50 in the index, 50 not
edm_answer-key_DO-NOT-SEND.csv      grading key. Keep it out of the test run.

Pass = exactly the indexed 50 match. Then measure index refresh time and ask for the
maximum supported index size.
