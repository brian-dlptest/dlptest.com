Archives and nested files

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
