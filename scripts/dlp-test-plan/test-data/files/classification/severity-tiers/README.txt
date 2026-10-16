Severity tiers by match count

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
