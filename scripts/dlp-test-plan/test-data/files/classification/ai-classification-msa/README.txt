AI classification of a business-specific document type

The document type under test is the company's MASTER SERVICES AGREEMENT.

  positive/    10 filled MSAs - 10 counterparties, varying term, jurisdiction, committed
               spend, liability cap, payment terms and remittance details
  near-miss/   10 documents from the SAME legal team that are NOT MSAs:
                 4 x mutual NDA
                 3 x Statement of Work
                 3 x Data Processing Addendum

Every one of the twenty shares the Acme Legal letterhead, the defined-term style, the
"IN WITNESS WHEREOF" signature block, the Illinois governing-law clause and the same
ten counterparties. Only the document TYPE differs.

That is deliberate. A classifier keying on letterhead, on the word "Agreement", or on
the presence of a signature block will label all twenty. The three SOWs are the sharpest
near-miss in the set: each one names the Master Services Agreement it is issued under,
so the exact phrase "Master Services Agreement" appears in a document that is not one.
A keyword rule cannot pass this test. That is the point.

HOW TO RUN IT

1. Describe the type in natural language - do not write a pattern. Something like:
   "A master services agreement: the umbrella contract between Acme and a customer that
    governs all statements of work, setting out term, fees, confidentiality, IP
    ownership, indemnification and limitation of liability. Not a statement of work, not
    an NDA, not a data processing addendum."
2. Add a structural constraint if the tool supports one (e.g. must be .docx, must live
   under a contracts path).
3. Add an exclusion for templates and test files.
4. Run it against all 20 files.
5. TIME THE WHOLE LOOP, from request to a label you would deploy.

PASS

  >= 9 of the 10 positives labelled, and <= 1 of the 10 near-misses.
  The loop takes minutes, not a support ticket.
  You can test against sample files BEFORE the label goes live - a classifier you can
  only evaluate in production is not tunable, and that alone is a Fail.
  If the tool supports sub-labels, confirm a child only matches when the parent does.

Note there is no answer key file here on purpose: the folder names are the answer key,
so score straight from positive/ vs near-miss/.
