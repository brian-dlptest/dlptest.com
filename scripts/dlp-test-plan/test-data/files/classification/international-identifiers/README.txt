International identifier coverage

uk.csv                     UK NI number + NHS number (mod-11 valid), 15 valid prefixes
uk_invalid-prefix_negative-control.csv
                           NEGATIVE CONTROL - NI prefixes containing D, F, I, Q, U or V,
                           which HMRC never issues. A validating classifier rejects them.
canada.csv                 Canadian SIN (Luhn-valid) + province
passport.csv               passport number + issuing country
eu_vat.csv                 EU VAT number + IBAN
france_germany_japan.csv   France INSEE, German tax ID, Japan My Number
international_identifiers_all.csv   everything in one file, for a single pass

Score each jurisdiction separately and write down the ones you had to build yourself.

SEPARATORS: UK NI, NHS, Canadian SIN and French INSEE numbers are conventionally written
with spaces. Each file also carries a '(compact)' column with separators stripped,
because many published patterns - including dlptest.com's own uk-nino and france-insee -
accept only the contiguous form. Matching one column and not the other is a tuning gap,
not a detection failure.
