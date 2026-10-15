# Validation report

Every regex assertion below runs a pattern from dlptest.com's own DLP library (`src/lib/regex/dlp-patterns.ts`, the source of the MCP server's `list_dlp_patterns`) through the same RE2 engine as the server's `regex_test` (`src/lib/regex/engines.ts`), locally via `tools/scan.mjs`. One assertion sends a file to the live MCP server and confirms it reports the same result. Checksum and allocation rules (Luhn, mod-97, HMRC prefixes), file hashes and word counts are computed in Python.

Regenerate with `python3 tools/validate.py`.

**KNOWN-DEFECT** marks an assertion about a defect in dlptest.com itself (see Findings). It does not fail the run. When the site is fixed, the assertion reports PASS and asks for the Findings to be updated.

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
| KNOWN-DEFECT | `files/classification/phi-hipaa/phi_encounters.csv` | mrn-labeled matches | 0 while the defect stands, 15 once fixed | 0 | FINDING 1 - the MCP server writes MRN-12345678; dlptest.com's own mrn-labeled pattern accepts only MRN: / MRN# / Record |
| PASS | `files/classification/phi-hipaa/phi_patient_encounter_summary.docx` | MRN values present | 15 | 15 | survives the Word table round-trip |
| PASS | `files/classification/phi-hipaa/phi_mrn_format-variants.csv` | mrn-labeled matches | >= 30 | 45 | the colon / hash / Record presentations DO match - this is the file to use if your MRN classifier follows the same convention |
| PASS | `files/classification/phi-hipaa/providers_npi_dea.csv` | dea matches | 6 | 6 |  |
| PASS | `files/classification/international-identifiers/uk.csv` | uk-nhs matches | >= 15 | 30 |  |
| PASS | `files/classification/international-identifiers/uk.csv` | uk-nino matches | >= 15 | 15 | matches only via the '(compact)' column - FINDING 2 |
| PASS | `files/classification/international-identifiers/canada.csv` | canada-sin matches | >= 15 | 30 |  |
| PASS | `files/classification/international-identifiers/eu_vat.csv` | iban matches | >= 15 | 15 |  |
| PASS | `files/classification/international-identifiers/passport.csv` | us-passport matches | >= 15 | 15 |  |
| PASS | `files/classification/international-identifiers/france_germany_japan.csv` | france-insee matches | >= 15 | 15 | matches only via the '(compact)' column - FINDING 2 |
| PASS | `files/classification/international-identifiers/uk.csv` | NI prefixes HMRC can issue | 15 | 15 | first letter not D/F/I/Q/U/V, second not D/F/I/O/Q/U/V, pair not BG/GB/KN/NK/NT/TN/ZZ - FINDING 3 |
| PASS | `files/classification/international-identifiers/uk_invalid-prefix_negative-control.csv` | NI prefixes HMRC can issue | 0 | 0 | NEGATIVE CONTROL - every prefix breaks HMRC's letter rules |
| PASS | `files/classification/international-identifiers/uk_invalid-prefix_negative-control.csv` | uk-nino matches | 0 | 0 | NEGATIVE CONTROL - the letters used are ones the published pattern rejects too |
| PASS | `files/classification/international-identifiers/eu_vat.csv` | IBANs passing mod-97 | 15 | 15 | a checksum-validating classifier must accept all 15 - FINDING 4 |
| PASS | `files/classification/international-identifiers/canada.csv` | 'SIN (compact)' values, 9 digits | 15 | 15 |  |
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
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | AWS_ACCESS_KEY_ID placeholder line present | True | True |  |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | aws-access-key-id matches | 0 | 0 | NEGATIVE CONTROL - the placeholder cannot satisfy the pattern |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | GOOGLE_MAPS_API_KEY placeholder line present | True | True |  |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | google-api-key matches | 0 | 0 | NEGATIVE CONTROL - the placeholder cannot satisfy the pattern |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | TWILIO_ACCOUNT_SID placeholder line present | True | True |  |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | twilio-account-sid matches | 0 | 0 | NEGATIVE CONTROL - the placeholder cannot satisfy the pattern |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | SERVICE_JWT placeholder line present | True | True |  |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | jwt matches | 0 | 0 | NEGATIVE CONTROL - the placeholder cannot satisfy the pattern |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | github-token matches | 1 | 1 | EXPECTED MATCH - ghp_ + 36 x's satisfies the shape. This is why the file is 'negative-ish': it is the entropy test, not a clean negative |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | slack-token matches | 1 | 1 | EXPECTED MATCH - xoxb-000000000000-...-REPLACE satisfies the shape. This is why the file is 'negative-ish': it is the entropy test, not a clean negative |
| PASS | `generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env` | password-in-url matches | 1 | 1 | EXPECTED MATCH - postgresql://USER:PASSWORD@ satisfies the shape. This is why the file is 'negative-ish': it is the entropy test, not a clean negative |
| PASS | `files/classification/project-codenames/mercury_false-positive-control.docx` | 'Mercury' occurrences | >= 4 | 4 |  |
| PASS | `files/classification/project-codenames/mercury_false-positive-control.docx` | other codenames present | 0 | 0 | NEGATIVE CONTROL - only the ambiguous term appears, never the programme |
| PASS | `generated/classification/origin-based-lineage` | the two auth_client.py files are byte-identical | True | True | only the origin may differ, or a content classifier passes for the wrong reason |
| PASS | `generated/classification/origin-based-lineage` | the two git remotes differ | True | True | git@git.internal.example.com:platform/auth-service.git vs https://github.com/openauth-project/auth-client.git |
| PASS | `files/classification/ai-classification-msa/positive` | documents containing a literal '%%' | 0 | 0 | an unformatted-string artifact would separate the two classes on its own |
| PASS | `files/classification/ai-classification-msa/near-miss` | documents containing a literal '%%' | 0 | 0 | an unformatted-string artifact would separate the two classes on its own |
| PASS | `files/classification/bulk-crm-export/crm_export_50000-records.csv` | card patterns (grouped + amex) | 50000 | 50000 | full scan - the volume IS the signal for this row |
| PASS | `files/classification/bulk-crm-export/crm_export_20-records_negative-control.csv` | card patterns (grouped + amex) | 20 | 20 | same columns, 1/2500th the volume |
| PASS | `files/classification/hris-compensation-export/hris_roster_name-ssn-salary-rating.csv` | ssn-dashed distinct | 180 | 180 |  |
| PASS | `files/classification/hris-compensation-export/hris_roster_name-ssn-salary-rating.xlsx` | ssn-dashed distinct | 180 | 180 |  |
| PASS | `files/classification/direct-database-extracts/db_extract_gui-export-results-to-file.csv` | ssn-dashed distinct | 300 | 300 |  |
| PASS | `files/classification/direct-database-extracts/db_extract_cli-piped-output.txt` | ssn-dashed distinct | 300 | 300 |  |
| PASS | `files/classification/lineage-obfuscation-chain/step3b_zipped-password-protected.zip` | flagged encrypted | True | True | the obfuscation-chained-into-one-story row asks for a PASSWORD-protected zip |
| PASS | `files/investigations-usability/alert-grouping-400-files` | sensitive files to copy in one action | 400 | 400 | the alert-grouping row asks for 400 |
| PASS | `files/investigations-usability/alert-grouping-400-files` | files carrying 3 distinct SSNs | 400 | 400 | each file must match the rule on its own, or the grouping test proves nothing |
| PASS | `files/investigations-usability/alert-grouping-400-files` | distinct file contents | 400 | 400 | NEGATIVE CONTROL - duplicates would let a hash-deduplicating product report fewer events for a reason the test does not measure |
| PASS | `files/investigations-usability/alert-grouping-400-files` | distinct SSNs across all 400 | 1200 | 1200 |  |
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
| PASS | `files/policy/offline_make-fresh-file.sh` | ssn-dashed matches in the script itself | 0 | 0 | the SSNs are generated when the script runs, so no copy of them exists to have been evaluated before |
| PASS | `files/policy/offline_make-fresh-file.ps1` | ssn-dashed matches in the script itself | 0 | 0 | the SSNs are generated when the script runs, so no copy of them exists to have been evaluated before |
| PASS | `files/policy/offline_make-fresh-file.sh` | ssn-dashed distinct per run | [30, 30] | [30, 30] |  |
| PASS | `files/policy/offline_make-fresh-file.sh` | two runs write different content | True | True |  |
| PASS | `generated/policy/git-repo-with-api-key/config.py` | aws-access-key-id matches | >= 1 | 1 |  |
| PASS | `generated/policy/git-repo-with-api-key/config.py` | stripe-secret-key matches | >= 1 | 1 |  |
| PASS | `generated/policy/git-repo-with-api-key/config.py` | password-in-url matches | >= 1 | 1 |  |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | word count | >= 480 | 505 |  |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | ssn-dashed matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | cc-grouped matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | email matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | mrn-labeled matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/block-method-checks/mnpi_500-words.txt` | aba-routing matches | 0 | 0 | NEGATIVE CONTROL - the AI-classification repeat check needs content with nothing a regex can find |
| PASS | `files/block-method-checks/mnpi_narrative_with-identifiers.txt` | contains the whole MNPI memo | True | True | the contrast case must differ from the clean memo only by the identifiers |
| PASS | `files/block-method-checks/mnpi_narrative_with-identifiers.txt` | ssn-dashed distinct | 3 | 3 |  |
| PASS | `files/block-method-checks/mnpi_narrative_with-identifiers.txt` | aba-routing matches | >= 2 | 2 |  |
| PASS | `files/investigations-usability/paste-latency-500-records.txt` | ssn-dashed distinct | >= 490 | 500 |  |
| PASS | `files/classification/us-ssn-detection/ssns_25.csv` | live MCP server regex_test agrees with the local engine | True | True | the one production call in a validation run: ssn-dashed, 25 matches locally, 25 from the server |

**108 passed, 1 known defects, 0 failed, 109 total.**

Not run: files/policy/offline_make-fresh-file.ps1: `pwsh` not installed.

---

## Findings about dlptest.com's own data

Four mismatches between what the MCP server generates and what is valid or what the site's published patterns accept. Each is mitigated in this library, and recorded here because it would otherwise look like a DLP product failing a test.

1. **MRN.** `generate_hipaa_phi` emits `MRN-12345678`. The `mrn-labeled` pattern is `\b(?:MRN|MR|Record)#?:?\s*\d{6,10}\b`, which accepts `MRN:`, `MRN#` and `Record ` but not a hyphen. Mitigated by `classification/phi-hipaa/phi_mrn_format-variants.csv`, which carries all five presentations.
2. **UK NI and French INSEE.** `generate_uk_identity` emits `WQ 77 61 17 D` and `generate_custom` emits `1 18 01 64 386 886 22` - the conventional spaced forms. `uk-nino` and `france-insee` both require the contiguous form. Mitigated by the `(compact)` columns in `classification/international-identifiers/uk.csv` and `france_germany_japan.csv`.
3. **UK NI prefix letters.** `generate_uk_identity` draws the first letter from the valid set, but its second-letter set includes D, F, Q and U, which HMRC never issues in that position (4 of its 20 letters, so about one number in five), and leaves out C, K and M, which HMRC does issue. It never checks the banned pairs BG, GB, KN, NK, NT, TN and ZZ. The site's `uk-nino` pattern rejects the bad letters but accepts the banned pairs. Mitigated: `uk.csv` keeps only numbers that pass all of HMRC's rules, and `uk_invalid-prefix_negative-control.csv` is built locally from letter-rule violations, so the pair tests whether a classifier validates the allocation rules or only matches the shape - the same design as the Luhn pair in `credit-card-luhn`.
4. **IBAN check digits.** `generate_eu_vat` picks the two IBAN check digits at random, so almost no IBAN it emits passes the ISO 13616 mod-97 check a validating classifier applies. Mitigated: the generator here recomputes the check digits before writing `eu_vat.csv`.

All four are worth fixing on dlptest.com: a visitor who copies a generated identifier into a real classifier, or into the Regex Test page with the matching library pattern, sees it rejected.

Also worth knowing, though not a defect: `cc-grouped` matches `4-4-4-4` only. Amex is grouped `4-6-5` and needs `cc-amex-grouped`, so any card count that uses `cc-grouped` alone runs about 25% light.
