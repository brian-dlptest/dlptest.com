Alert grouping and deduplication

400 small files, each holding 3 customer records with SSNs. Each one matches a plain SSN
rule on its own, and no two files are alike: all 1,200 SSNs are distinct, so a product
cannot collapse the files by content hash.

Select all 400 and copy them to a USB drive IN ONE ACTION, then count the incidents.

  Pass     one case, or one incident with a count of 400
  Partial  grouped, but only after a delay or a manual merge
  Fail     400 separate alerts

Leave this README out of the selection; it is not a sensitive file.
