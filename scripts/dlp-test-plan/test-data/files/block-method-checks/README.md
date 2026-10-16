# Block-method repeat check

The Read Me's *Classification method matters for blocking* line asks: "When a Block passes
on the Policy sheet, repeat it once with content each of those methods identifies, and
record the result in Notes." The methods it names are exact data match, AI classification
and origin. This folder is that repeat, one payload per method:

| Method | Repeat the Block with |
|---|---|
| Exact data match | `../classification/exact-data-match/edm_test-upload_50in-50out.csv` |
| AI classification | `mnpi_500-words.txt` (here) |
| Origin / lineage | `../classification/lineage-obfuscation-chain/step3_zipped.zip` |

`mnpi_500-words.txt` contains nothing a regex can match - no SSN, card number, email or
MRN - so a tool that blocks it is not pattern matching. `mnpi_narrative_with-identifiers.txt`
is the contrast case: the same memo with one paragraph added that carries two bank routing
and account numbers and three SSNs. The only difference between the two files is
something a regex can find.
