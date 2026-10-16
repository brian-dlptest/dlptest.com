International identifier coverage

uk.csv                     UK NI number + NHS number (mod-11 valid), 15 numbers whose
                           prefixes follow HMRC's allocation rules
uk_invalid-prefix_negative-control.csv
                           NEGATIVE CONTROL - 10 NI numbers with a first letter of D, F,
                           I, Q, U or V, or a second letter of D, F, Q or U. HMRC never
                           issues those, so a validating classifier rejects them.
canada.csv                 Canadian SIN (Luhn-valid, hyphenated) + province
passport.csv               passport number + issuing country
eu_vat.csv                 EU VAT number + IBAN (mod-97 check digits valid)
france_germany_japan.csv   France INSEE, German tax ID, Japan My Number
international_identifiers_all.csv   everything in one file, for a single pass

Score each jurisdiction separately and write down the ones you had to build yourself.

SEPARATORS: UK NI, NHS and French INSEE numbers are conventionally written with spaces,
and Canadian SINs with hyphens. uk.csv, canada.csv and france_germany_japan.csv also
carry a '(compact)' column with the separators stripped, because many published
patterns - including dlptest.com's own uk-nino and france-insee - accept only the
contiguous form. Matching one column and not the other is a tuning gap, not a detection
failure.
