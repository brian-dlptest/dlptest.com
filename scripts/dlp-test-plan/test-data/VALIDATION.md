# Validation report

Every assertion below was evaluated by sending the file's text to the **DLPTest MCP server** (`regex_test`, RE2 engine) using a pattern from that server's own `list_dlp_patterns` library. Nothing here is checked with a local regex except the Luhn arithmetic, which no regex can do.

Regenerate with `python3 tools/validate.py`.

| Result | File | Assertion | Expected | Actual | Note |
|---|---|---|---|---|---|
| PASS | `files/classification/us-ssn-detection/ssns_25.csv` | ssn-dashed matches | 25 | 25 |  |
| PASS | `files/classification/us-ssn-detection/ssns_25.csv` | ssn-dashed distinct | 25 | 25 |  |
| PASS | `files/classification/us-ssn-detection/ssns_25.docx` | ssn-dashed matches | 25 | 25 |  |
| PASS | `files/classification/us-ssn-detection/ssns_25.docx` | ssn-dashed distinct | 25 | 25 |  |
| PASS | `files/classification/credit-card-luhn/cards_valid.csv` | card patterns (grouped + amex) | 40 | 40 |  |
| PASS | `files/classification/credit-card-luhn/cards_valid.csv` | Luhn-valid cards | 40 | 40 | the positive case |
| PASS | `files/classification/credit-card-luhn/cards_luhn_invalid.csv` | card patterns (grouped + amex) | 40 | 40 | shape preserved on purpose - that is what makes the test meaningful |
| PASS | `files/classification/credit-card-luhn/cards_luhn_invalid.csv` | Luhn-valid cards | 0 | 0 | NEGATIVE CONTROL - a Luhn-aware classifier must reject all 40 |
| PASS | `files/classification/credit-card-luhn/negative_control_non-card-16digit.csv` | cc-grouped matches | 0 | 0 | NEGATIVE CONTROL - order numbers and timestamps, not cards |
| PASS | `files/classification/credit-card-luhn/negative_control_non-card-16digit.csv` | Luhn-valid values | 0 | 0 | NEGATIVE CONTROL |
| PASS | `files/classification/phi-hipaa/phi_encounters.csv` | MRN values present | 15 | 15 |  |
| PASS | `files/classification/phi-hipaa/phi_encounters.csv` | mrn-labeled matches | 0 | 0 | FINDING 1 - the MCP server writes MRN-12345678; dlptest.com's own mrn-labeled pattern accepts only MRN: / MRN# / Record. See Findings below |
| PASS | `files/classification/phi-hipaa/phi_patient_encounter_summary.docx` | MRN values present | 15 | 15 | survives the Word table round-trip |
| PASS | `files/classification/phi-hipaa/phi_mrn_format-variants.csv` | mrn-labeled matches | >= 30 | 45 | the colon / hash / Record presentations DO match - this is the file to use if your MRN classifier follows the same convention |
| PASS | `files/classification/phi-hipaa/providers_npi_dea.csv` | dea matches | 6 | 6 |  |
| PASS | `files/classification/international-identifiers/uk.csv` | uk-nhs matches | >= 15 | 30 |  |
| PASS | `files/classification/international-identifiers/uk.csv` | uk-nino matches | >= 15 | 15 | matches only via the '(compact)' column - FINDING 2 |
| PASS | `files/classification/international-identifiers/canada.csv` | canada-sin matches | >= 15 | 15 |  |
| PASS | `files/classification/international-identifiers/eu_vat.csv` | iban matches | >= 15 | 15 |  |
| PASS | `files/classification/international-identifiers/passport.csv` | us-passport matches | >= 15 | 15 |  |
| PASS | `files/classification/international-identifiers/france_germany_japan.csv` | france-insee matches | >= 15 | 15 | matches only via the '(compact)' column - FINDING 2 |
| PASS | `files/classification/international-identifiers/uk_invalid-prefix_negative-control.csv` | uk-nino matches | 0 | 0 | NEGATIVE CONTROL - prefixes containing D/F/I/Q/U/V, which HMRC never issues. FINDING 4 |
| PASS | `files/classification/severity-tiers/file1_one-ssn-repeated-x100.csv` | ssn-dashed total | 100 | 100 |  |
| PASS | `files/classification/severity-tiers/file1_one-ssn-repeated-x100.csv` | ssn-dashed DISTINCT | 1 | 1 | the whole point of the counting step |
| PASS | `files/classification/severity-tiers/file2_100-distinct-ssns.csv` | ssn-dashed total | 100 | 100 |  |
| PASS | `files/classification/severity-tiers/file2_100-distinct-ssns.csv` | ssn-dashed DISTINCT | 100 | 100 |  |
| PASS | `files/classification/severity-tiers/low_5-distinct-records.csv` | ssn-dashed distinct | 5 | 5 |  |
| PASS | `files/classification/severity-tiers/medium_25-distinct-records.csv` | ssn-dashed distinct | 25 | 25 |  |
| PASS | `files/classification/severity-tiers/high_100-distinct-records.csv` | ssn-dashed distinct | 100 | 100 |  |
| PASS | `files/classification/confidence-threshold-tuning/a_bare-9-digit-number.txt` | ssn-dashed matches | 0 | 0 | unformatted on purpose - only a flexible pattern should see it |
| PASS | `files/classification/confidence-threshold-tuning/a_bare-9-digit-number.txt` | ssn-flexible matches | >= 1 | 1 |  |
| PASS | `files/classification/confidence-threshold-tuning/b_formatted-123-45-6789.txt` | ssn-dashed matches | 1 | 1 |  |
| PASS | `files/classification/confidence-threshold-tuning/c_labeled-within-10-chars.txt` | ssn-labeled matches | 1 | 1 | the proximity-label case |
| PASS | `files/classification/confidence-threshold-tuning/d_titled-social-security.docx` | ssn-dashed matches | 1 | 1 |  |
| PASS | `files/classification/confidence-threshold-tuning/d_titled-social-security.docx` | 'Social Security' in title | >= 1 | 2 |  |
| PASS | `files/classification/exact-data-match/edm_source_index_10000-records.csv` | ssn-dashed distinct | 10000 | 10000 |  |
| PASS | `files/classification/exact-data-match/edm_test-upload_50in-50out.csv` | ssn-dashed distinct | 100 | 100 |  |
| PASS | `files/classification/exact-data-match/edm_test-upload_50in-50out.csv` | rows marked in-index | 50 | 50 |  |
| PASS | `files/classification/exact-data-match/edm_test-upload_50in-50out.csv` | answer key agrees with the index | True | True |  |
| PASS | `files/classification/ai-classification-msa` | positive examples | 10 | 10 |  |
| PASS | `files/classification/ai-classification-msa` | near-misses | 10 | 10 |  |
| PASS | `files/classification/ai-classification-msa/positive` | carry the MSA heading | 10 | 10 |  |
| PASS | `files/classification/ai-classification-msa/near-miss` | SOWs naming an MSA | 3 | 3 | THE TRAP - a keyword rule on 'Master Services Agreement' cannot pass this test |
| PASS | `files/classification/archives-and-nested-files/level1_single-zip.zip` | ssn-dashed inside the container | 25 | 25 |  |
| PASS | `files/classification/archives-and-nested-files/archive.tar.gz` | ssn-dashed inside the container | 25 | 25 |  |
| PASS | `files/classification/archives-and-nested-files/archive.7z` | ssn-dashed inside the container | 25 | 25 |  |
| PASS | `files/classification/archives-and-nested-files/password-protected.zip` | flagged encrypted | True | True | must be DETECTED AS ENCRYPTED, not silently passed |
| PASS | `generated/classification/secrets-and-credentials/secrets_live-looking.env` | credential patterns present (of 18) | 18 | 18 |  |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | aws-access-key-id matches | 0 | 0 | NEGATIVE CONTROL - high-entropy pattern, placeholder cannot satisfy it |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | google-api-key matches | 0 | 0 | NEGATIVE CONTROL - high-entropy pattern, placeholder cannot satisfy it |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | twilio-account-sid matches | 0 | 0 | NEGATIVE CONTROL - high-entropy pattern, placeholder cannot satisfy it |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | jwt matches | 0 | 0 | NEGATIVE CONTROL - high-entropy pattern, placeholder cannot satisfy it |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | github-token matches | >= 1 | 1 | EXPECTED FALSE POSITIVE - ghp_xxxxx... satisfies the shape. This is why the file is named 'negative-ish': it is the entropy test, not a clean negative |
| PASS | `files/classification/project-codenames/mercury_false-positive-control.docx` | 'Mercury' occurrences | >= 4 | 4 |  |
| PASS | `files/classification/project-codenames/mercury_false-positive-control.docx` | other codenames present | 0 | 0 | NEGATIVE CONTROL - only the ambiguous term appears, never the programme |
| PASS | `files/classification/bulk-crm-export/crm_export_50000-records.csv` | card patterns (grouped + amex) | 50000 | 50000 | full scan - the volume IS the signal for this row |
| PASS | `files/classification/bulk-crm-export/crm_export_20-records_negative-control.csv` | card patterns (grouped + amex) | 20 | 20 | same columns, 1/2500th the volume |
| PASS | `files/classification/hris-compensation-export/hris_roster_name-ssn-salary-rating.csv` | ssn-dashed distinct | 180 | 180 |  |
| PASS | `files/classification/hris-compensation-export/hris_roster_name-ssn-salary-rating.xlsx` | ssn-dashed distinct | 180 | 180 |  |
| PASS | `files/classification/direct-database-extracts/db_extract_gui-export-results-to-file.csv` | ssn-dashed distinct | 300 | 300 |  |
| PASS | `files/classification/direct-database-extracts/db_extract_cli-piped-output.txt` | ssn-dashed distinct | 300 | 300 |  |
| PASS | `files/classification/lineage-obfuscation-chain/step3b_zipped-password-protected.zip` | flagged encrypted | True | True | the obfuscation-chained-into-one-story row asks for a PASSWORD-protected zip |
| PASS | `files/investigations-usability/alert-grouping-400-files` | sensitive files to copy in one action | 400 | 400 | the alert-grouping row asks for 400 |
| PASS | `files/investigations-usability/alert-grouping-400-files` | every sampled file carries SSNs | True | True | each file must match the rule on its own, or the grouping test proves nothing |
| PASS | `files/investigations-usability/intervention-fatigue-30-files` | separate triggering files | 30 | 30 | the intervention-fatigue row asks for thirty |
| PASS | `files/investigations-usability/intervention-fatigue-30-files` | all 30 files are distinct | 30 | 30 | NEGATIVE CONTROL - identical files would let hash dedup suppress the prompt for the wrong reason and score a Pass the product has not earned |
| PASS | `files/investigations-usability/redaction-mixed-content.txt` | ssn-dashed matches in the paste block | >= 6 | 6 |  |
| PASS | `files/investigations-usability/redaction-mixed-content.txt` | paste block is substantial | True | True | there has to be enough prose that its arrival is unambiguous |
| PASS | `files/investigations-usability/redaction-mixed-content.txt` | identifiers under 10% of the paste block | True | True | redaction needs a REMAINDER to arrive after redaction - in a block of pure identifiers, a successful redaction and a plain block look identical. Actual: 6 identifiers in 214 words |
| PASS | `files/investigations-usability/agent-session-task/workspace/data/customers_export.csv` | ssn-dashed distinct | 12 | 12 | the agent must read something worth recording |
| PASS | `files/policy/thirty_ssns_paste-block.txt` | ssn-dashed distinct | 30 | 30 |  |
| PASS | `files/policy/thirty_ssns.docx` | ssn-dashed distinct | 30 | 30 |  |
| PASS | `files/policy/fifty_ssns_for_print-test.docx` | ssn-dashed distinct | 50 | 50 |  |
| PASS | `files/policy/sensitive_customer_data.xlsx` | ssn-dashed distinct | 250 | 250 |  |
| PASS | `files/policy/sensitive_customer_data.xlsx` | card patterns (grouped + amex) | 250 | 250 | cc-grouped alone undercounts - Amex groups 4-6-5, not 4-4-4-4 |
| PASS | `generated/policy/git-repo-with-api-key/config.py` | aws-access-key-id matches | >= 1 | 1 |  |
| PASS | `generated/policy/git-repo-with-api-key/config.py` | stripe-secret-key matches | >= 1 | 1 |  |
| PASS | `generated/policy/git-repo-with-api-key/config.py` | password-in-url matches | >= 1 | 1 |  |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | ssn-dashed matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | cc-grouped matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | email matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | mrn-labeled matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/investigations-usability/paste-latency-500-records.txt` | ssn-dashed distinct | >= 490 | 500 |  |

**83 passed, 0 failed, 83 total.**

---

## Findings about dlptest.com's own data

Four mismatches turned up between what the MCP server generates and what the site's published patterns accept. None of them is a problem with this library - the generated values are realistic, and the patterns are simply narrower than the formats people actually write. They are recorded here because they would otherwise look like a DLP product failing a test.

1. **MRN.** `generate_hipaa_phi` emits `MRN-12345678`. The `mrn-labeled` pattern is `\b(?:MRN|MR|Record)#?:?\s*\d{6,10}\b`, which accepts `MRN:`, `MRN#` and `Record ` but not a hyphen. Mitigated here by `classification/phi-hipaa/phi_mrn_format-variants.csv`, which carries all five presentations.
2. **UK NI and French INSEE.** `generate_uk_identity` emits `WQ 77 61 17 D` and `generate_custom` emits `1 18 01 64 386 886 22` - the conventional spaced forms. `uk-nino` and `france-insee` both require the contiguous form. Mitigated by the `(compact)` columns added to `classification/international-identifiers/uk.csv` and `france_germany_japan.csv`.
3. **UK NI prefix letters.** `generate_uk_identity` assigns prefix letters freely, so roughly a third of any pull contains D, F, I, Q, U or V - letters HMRC never issues, and which the site's own `uk-nino` pattern correctly rejects. Turned to advantage here: `uk.csv` holds 15 valid-prefix numbers and `uk_invalid-prefix_negative-control.csv` holds 10 invalid ones, so the pair tests whether a classifier validates the allocation rules or just matches the shape - the same design as the Luhn pair in credit-card-luhn.
4. **Amex card grouping.** `cc-grouped` matches `4-4-4-4` only; Amex is grouped `4-6-5` and needs `cc-amex-grouped`. Any card count that uses only `cc-grouped` will run about 25% light. Not a defect - just a pair of patterns that have to be used together.

The first three are worth fixing on dlptest.com: a visitor who copies a generated identifier into the Regex Test page and picks the matching pattern from the library will see no match. The NI prefix one also matters on its own terms - those numbers would fail a real UK classifier, not just this library's check.
