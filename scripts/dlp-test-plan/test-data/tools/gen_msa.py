"""AI classification of a business-specific document type.

The chosen type is the company's Master Services Agreement. The near-misses are NDAs,
SOWs and DPAs from the same notional legal team: same letterhead, same defined-term
style, same signature block, same counterparties. Only the document TYPE differs.

That shared boilerplate is deliberate. A classifier that keys on letterhead, on the word
"Agreement", or on the presence of a signature block will label all twenty - which is
exactly the failure v6 asks this test to expose. The SOWs are the sharpest near-miss of
all: each one names the MSA it is issued under, so the string "Master Services Agreement"
appears in a document that is not one.
"""
import random

import docgen as dg
import mcp_client as mcp

D = "files/classification/ai-classification-msa"
random.seed(20260917)

COUNTERPARTIES = [
    ("Brightwater Logistics, Inc.", "Delaware", "1420 Harbor Point Drive, Wilmington, DE 19801"),
    ("Kestrel Analytics Ltd.", "England and Wales", "18 Finsbury Circus, London EC2M 7EB"),
    ("Pinehurst Medical Group, LLC", "North Carolina", "905 Cardinal Way, Raleigh, NC 27601"),
    ("Vantage Freight Systems Corp.", "Illinois", "3300 South Canal Street, Chicago, IL 60616"),
    ("Aurelia Retail Holdings S.A.", "Luxembourg", "12 Rue Sainte-Zithe, L-2763 Luxembourg"),
    ("Stonebridge Utilities Co.", "Texas", "700 Commerce Plaza, Houston, TX 77002"),
    ("Halcyon Biotechnics, Inc.", "Massachusetts", "44 Kendall Square, Cambridge, MA 02142"),
    ("Meridian Transit Authority", "Oregon", "610 SW Alder Street, Portland, OR 97205"),
    ("Cobourg Financial Services Ltd.", "Ontario", "155 Wellington Street West, Toronto, ON M5V 3H1"),
    ("Tamarind Hospitality Group", "Florida", "2100 Biscayne Boulevard, Miami, FL 33137"),
]

SERVICES = [
    "managed payment processing, settlement and reconciliation services",
    "data platform hosting, ingestion pipelines and analytics tooling",
    "claims intake, adjudication support and provider reconciliation services",
    "freight telemetry ingestion, routing optimisation and reporting services",
    "point-of-sale integration, tokenisation and fraud-scoring services",
    "meter data management, billing calculation and customer notification services",
    "laboratory information exchange and specimen tracking services",
    "fare collection, account-based ticketing and settlement services",
    "regulatory reporting, transaction monitoring and case management services",
    "property management system integration and guest data services",
]

COMPANY = "Acme Financial Holdings, Inc."
COMPANY_ADDR = "1 Wacker Plaza, Suite 3800, Chicago, IL 60601"
LETTERHEAD = ("ACME FINANCIAL HOLDINGS, INC.  |  LEGAL DEPARTMENT  |  "
              "1 WACKER PLAZA, SUITE 3800, CHICAGO, IL 60601")
FOOTER = ("Acme Legal - Document Control. This document is confidential and is "
          "intended only for the parties named above. Template revision 2026.3.")


def _people(n, tag):
    h, rows = mcp.csv_rows(mcp.save("msa-%s.csv" % tag, mcp.call("generate_custom", {
        "fields": [{"name": "Full Name", "type": "full-name"},
                   {"name": "Email", "type": "email"}],
        "count": n, "format": "csv"})))
    return rows


def _banks(n):
    h, rows = mcp.csv_rows(mcp.save("msa-banking.csv", mcp.call(
        "generate_banking", {"count": n, "format": "csv"})))
    return h, rows


def _signature_block(their_name, their_co, our_name):
    return [("h", "IN WITNESS WHEREOF"),
            "The parties have executed this document by their duly authorised "
            "representatives as of the Effective Date.",
            "",
            "%s" % COMPANY,
            "By: ____________________________    Name: %s    Title: General Counsel" % our_name,
            "",
            "%s" % their_co,
            "By: ____________________________    Name: %s    Title: Authorised Signatory"
            % their_name,
            "",
            FOOTER]


def build_msas(signers, counter_signers, bank_header, bank_rows):
    titles = []
    for i, (co, jurisdiction, addr) in enumerate(COUNTERPARTIES):
        n = i + 1
        cap = random.choice([500_000, 1_000_000, 2_000_000, 5_000_000])
        annual = random.randrange(180_000, 1_450_000, 5_000)
        term = random.choice([24, 36, 36, 48, 60])
        notice = random.choice([30, 60, 90])
        eff = "%d %s 2026" % (random.randint(1, 28),
                              random.choice(["January", "March", "April", "June",
                                             "July", "September", "October"]))
        bank = bank_rows[i]
        bank_line = ", ".join("%s: %s" % (bank_header[j], bank[j])
                              for j in range(1, min(4, len(bank))))

        paras = [
            LETTERHEAD,
            ("b", "MASTER SERVICES AGREEMENT"),
            "This Master Services Agreement (this \"Agreement\") is entered into as of "
            "%s (the \"Effective Date\") by and between %s, a Delaware corporation with "
            "offices at %s (\"Provider\"), and %s, organised under the laws of %s with "
            "offices at %s (\"Customer\"). Provider and Customer are each a \"Party\" "
            "and together the \"Parties\"."
            % (eff, COMPANY, COMPANY_ADDR, co, jurisdiction, addr),
            ("h", "1. Services and Statements of Work"),
            "1.1  Provider shall provide %s (the \"Services\"). The specific Services, "
            "deliverables, acceptance criteria and fees shall be described in one or more "
            "statements of work executed by both Parties and incorporated into this "
            "Agreement by reference (each, a \"Statement of Work\" or \"SOW\")."
            % SERVICES[i],
            "1.2  This Agreement governs all Statements of Work. In the event of a "
            "conflict between this Agreement and any Statement of Work, this Agreement "
            "shall control except where the Statement of Work expressly states that it "
            "amends a specified section of this Agreement.",
            "1.3  No Statement of Work shall be effective unless signed by an authorised "
            "representative of each Party.",
            ("h", "2. Term and Termination"),
            "2.1  The initial term of this Agreement is %d months from the Effective Date "
            "and shall renew automatically for successive twelve (12) month periods unless "
            "either Party gives written notice of non-renewal at least %d days before the "
            "end of the then-current term." % (term, notice),
            "2.2  Either Party may terminate this Agreement for material breach on thirty "
            "(30) days' written notice if the breach remains uncured at the end of that "
            "period. Termination of this Agreement terminates all outstanding Statements "
            "of Work unless the Parties agree otherwise in writing.",
            ("h", "3. Fees, Invoicing and Payment"),
            "3.1  Customer shall pay the fees set out in each Statement of Work. Committed "
            "annual spend under this Agreement as of the Effective Date is $%s."
            % format(annual, ","),
            "3.2  Provider shall invoice monthly in arrears. Undisputed invoices are "
            "payable within forty-five (45) days of receipt. Amounts not paid when due "
            "accrue interest at 1.0% per month or the maximum rate permitted by law, "
            "whichever is lower.",
            "3.3  Remittance details: %s." % bank_line,
            "3.4  Fees are exclusive of taxes. Customer is responsible for all sales, use "
            "and value-added taxes other than taxes on Provider's net income.",
            ("h", "4. Confidentiality"),
            "4.1  Each Party shall protect the other's Confidential Information using no "
            "less than reasonable care and shall not disclose it except to employees, "
            "advisers and contractors with a need to know who are bound by obligations no "
            "less protective than these.",
            "4.2  These obligations survive termination for five (5) years, and "
            "indefinitely with respect to trade secrets.",
            ("h", "5. Intellectual Property"),
            "5.1  Each Party retains all right, title and interest in its pre-existing "
            "intellectual property. Provider grants Customer a non-exclusive, "
            "non-transferable licence to use the Services during the term.",
            "5.2  Deliverables specifically created for Customer and identified as work "
            "product in a Statement of Work shall be owned by Customer upon full payment, "
            "excluding Provider's underlying platform, tooling and know-how.",
            ("h", "6. Data Protection"),
            "6.1  Where Provider processes personal data on Customer's behalf, the Parties "
            "shall execute a data processing addendum, which upon execution forms part of "
            "this Agreement.",
            ("h", "7. Warranties and Disclaimer"),
            "7.1  Provider warrants that the Services will be performed in a professional "
            "and workmanlike manner in accordance with the applicable Statement of Work.",
            "7.2  EXCEPT AS EXPRESSLY STATED, THE SERVICES ARE PROVIDED \"AS IS\" AND "
            "PROVIDER DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED.",
            ("h", "8. Indemnification"),
            "8.1  Provider shall defend and indemnify Customer against third-party claims "
            "that the Services infringe a patent, copyright or trade secret.",
            "8.2  Customer shall defend and indemnify Provider against third-party claims "
            "arising from Customer Data or Customer's use of the Services in breach of "
            "this Agreement.",
            ("h", "9. Limitation of Liability"),
            "9.1  NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL OR "
            "CONSEQUENTIAL DAMAGES.",
            "9.2  Each Party's aggregate liability under this Agreement shall not exceed "
            "$%s, except for breaches of confidentiality, indemnification obligations, or "
            "a Party's gross negligence or wilful misconduct." % format(cap, ","),
            ("h", "10. Insurance"),
            "10.1  Provider shall maintain commercial general liability, professional "
            "liability and cyber liability coverage of not less than $5,000,000 per "
            "occurrence during the term.",
            ("h", "11. Governing Law and Disputes"),
            "11.1  This Agreement is governed by the laws of the State of Illinois without "
            "regard to its conflict of laws rules. The Parties consent to the exclusive "
            "jurisdiction of the state and federal courts located in Cook County, Illinois.",
            ("h", "12. General"),
            "12.1  Neither Party may assign this Agreement without the other's written "
            "consent, except to a successor in interest.",
            "12.2  This Agreement, together with all Statements of Work and addenda, is "
            "the entire agreement between the Parties and supersedes all prior proposals "
            "and understandings relating to its subject matter.",
            "12.3  Notices must be in writing and delivered to the addresses above, "
            "attention: General Counsel.",
        ] + _signature_block(counter_signers[i][0], co, signers[i][0])

        dg.write_docx("%s/positive/msa_%02d_%s.docx"
                      % (D, n, co.split(",")[0].split(" ")[0].lower()),
                      "Master Services Agreement", paras)
        titles.append(co)
    return titles


def build_near_misses(signers, counter_signers):
    made = []

    # --- 4 NDAs -------------------------------------------------------------------
    for k in range(4):
        co, jur, addr = COUNTERPARTIES[k]
        paras = [
            LETTERHEAD,
            ("b", "MUTUAL NON-DISCLOSURE AGREEMENT"),
            "This Mutual Non-Disclosure Agreement (this \"Agreement\") is entered into as "
            "of %d February 2026 by and between %s, a Delaware corporation with offices "
            "at %s, and %s, organised under the laws of %s with offices at %s."
            % (k + 4, COMPANY, COMPANY_ADDR, co, jur, addr),
            "The Parties wish to explore a potential business relationship (the "
            "\"Purpose\") and in connection with it may disclose confidential information "
            "to one another.",
            ("h", "1. Confidential Information"),
            "1.1  \"Confidential Information\" means non-public information disclosed by "
            "one Party to the other, whether orally, visually or in writing, that is "
            "identified as confidential or would reasonably be understood to be "
            "confidential given its nature and the circumstances of disclosure.",
            "1.2  Confidential Information does not include information that is or becomes "
            "public through no fault of the receiving Party, was known to the receiving "
            "Party without restriction before disclosure, or is independently developed "
            "without reference to the disclosing Party's information.",
            ("h", "2. Obligations"),
            "2.1  The receiving Party shall use Confidential Information solely for the "
            "Purpose, shall protect it using no less than reasonable care, and shall limit "
            "access to those with a need to know.",
            "2.2  The receiving Party may disclose Confidential Information to the extent "
            "required by law, provided it gives prompt notice where lawful.",
            ("h", "3. No Licence, No Obligation"),
            "3.1  Nothing in this Agreement grants any licence to intellectual property.",
            "3.2  Nothing in this Agreement obliges either Party to enter into any further "
            "agreement or transaction, and no Statement of Work is created by it.",
            ("h", "4. Term"),
            "4.1  This Agreement continues for two (2) years. Confidentiality obligations "
            "survive for three (3) years from the date of disclosure, and indefinitely "
            "for trade secrets.",
            ("h", "5. Return and Destruction"),
            "5.1  On request, the receiving Party shall return or destroy Confidential "
            "Information, subject to routine backup retention and legal hold obligations.",
            ("h", "6. Remedies"),
            "6.1  The Parties acknowledge that damages may be inadequate and that "
            "injunctive relief may be sought without posting bond.",
            ("h", "7. Governing Law"),
            "7.1  This Agreement is governed by the laws of the State of Illinois. "
            "The Parties consent to the exclusive jurisdiction of the courts of Cook "
            "County, Illinois.",
        ] + _signature_block(counter_signers[k][0], co, signers[k][0])
        dg.write_docx("%s/near-miss/nda_%02d_%s.docx"
                      % (D, k + 1, co.split(",")[0].split(" ")[0].lower()),
                      "Mutual Non-Disclosure Agreement", paras)
        made.append("NDA")

    # --- 3 SOWs -------------------------------------------------------------------
    for k in range(3):
        idx = k + 4
        co, jur, addr = COUNTERPARTIES[idx]
        total = random.randrange(85_000, 620_000, 5_000)
        paras = [
            LETTERHEAD,
            ("b", "STATEMENT OF WORK NO. %d" % (k + 1)),
            "This Statement of Work (\"SOW\") is issued under and governed by the Master "
            "Services Agreement between %s (\"Provider\") and %s (\"Customer\") dated "
            "%d May 2026 (the \"Master Services Agreement\"). Capitalised terms not "
            "defined here have the meanings given in the Master Services Agreement."
            % (COMPANY, co, k + 9),
            ("h", "1. Scope of this SOW"),
            "1.1  Provider shall deliver the following in respect of %s:" % SERVICES[idx],
            "  (a) discovery and current-state assessment;",
            "  (b) environment provisioning in two regions;",
            "  (c) integration with Customer's existing identity provider;",
            "  (d) two rounds of user acceptance testing support;",
            "  (e) production cutover and thirty (30) days of hypercare.",
            ("h", "2. Deliverables and Acceptance"),
            "2.1  Each deliverable is deemed accepted ten (10) business days after "
            "delivery unless Customer gives written notice of non-conformance.",
            ("h", "3. Project Schedule"),
            "3.1  Kick-off within fifteen (15) days of signature; discovery complete at "
            "week 4; integration complete at week 10; cutover at week 14.",
            ("h", "4. Fees for this SOW"),
            "4.1  Total fixed fee: $%s, invoiced 30%% at kick-off, 40%% at integration "
            "complete, 30%% at acceptance. Travel is billed at cost with prior approval."
            % format(total, ","),
            ("h", "5. Assumptions"),
            "5.1  Customer will provide test data, environment access and a named project "
            "sponsor within five (5) business days of kick-off.",
            ("h", "6. Change Control"),
            "6.1  Changes to scope, schedule or fees require a written change order signed "
            "by both Parties. This SOW does not amend the Master Services Agreement.",
            ("h", "7. Key Personnel"),
            "7.1  Provider's engagement lead is %s. Customer's sponsor is %s."
            % (signers[idx][0], counter_signers[idx][0]),
        ] + _signature_block(counter_signers[idx][0], co, signers[idx][0])
        dg.write_docx("%s/near-miss/sow_%02d_%s.docx"
                      % (D, k + 1, co.split(",")[0].split(" ")[0].lower()),
                      "Statement of Work", paras)
        made.append("SOW")

    # --- 3 DPAs -------------------------------------------------------------------
    for k in range(3):
        idx = k + 7
        co, jur, addr = COUNTERPARTIES[idx]
        paras = [
            LETTERHEAD,
            ("b", "DATA PROCESSING ADDENDUM"),
            "This Data Processing Addendum (\"DPA\") supplements the agreement between %s "
            "(\"Processor\") and %s (\"Controller\") and applies where Processor processes "
            "Personal Data on Controller's behalf." % (COMPANY, co),
            ("h", "1. Definitions"),
            "1.1  \"Personal Data\", \"processing\", \"controller\", \"processor\" and "
            "\"data subject\" have the meanings given in Regulation (EU) 2016/679 (GDPR).",
            ("h", "2. Scope and Roles"),
            "2.1  Controller determines the purposes and means of processing. Processor "
            "processes Personal Data only on documented instructions from Controller.",
            "2.2  Annex I sets out the subject matter, duration, nature and purpose of "
            "processing, the categories of data subject and the categories of Personal Data.",
            ("h", "3. Confidentiality and Personnel"),
            "3.1  Processor ensures that persons authorised to process Personal Data are "
            "bound by confidentiality obligations.",
            ("h", "4. Security"),
            "4.1  Processor implements the technical and organisational measures set out "
            "in Annex II, including encryption in transit and at rest, access control, "
            "logging and regular testing.",
            ("h", "5. Sub-processors"),
            "5.1  Controller grants general authorisation for the sub-processors listed in "
            "Annex III. Processor shall give thirty (30) days' notice of any intended "
            "change and Controller may object on reasonable data-protection grounds.",
            ("h", "6. Data Subject Rights"),
            "6.1  Processor shall assist Controller by appropriate technical and "
            "organisational measures in responding to data subject requests.",
            ("h", "7. Personal Data Breach"),
            "7.1  Processor shall notify Controller without undue delay and in any event "
            "within forty-eight (48) hours of becoming aware of a Personal Data Breach.",
            ("h", "8. International Transfers"),
            "8.1  Transfers outside the EEA rely on the Standard Contractual Clauses "
            "(Commission Implementing Decision (EU) 2021/914), Module Two, incorporated "
            "by reference.",
            ("h", "9. Audit"),
            "9.1  Processor shall make available information necessary to demonstrate "
            "compliance and allow for audits no more than once per year on thirty (30) "
            "days' notice.",
            ("h", "10. Deletion and Return"),
            "10.1  On termination, Processor shall delete or return Personal Data at "
            "Controller's election, subject to legal retention requirements.",
            ("h", "Annex I - Details of Processing"),
            "Subject matter: provision of %s. Duration: the term of the underlying "
            "agreement. Categories of data subject: Controller's customers and employees. "
            "Categories of Personal Data: identifiers, contact details, transaction "
            "records." % SERVICES[idx],
        ] + _signature_block(counter_signers[idx][0], co, signers[idx][0])
        dg.write_docx("%s/near-miss/dpa_%02d_%s.docx"
                      % (D, k + 1, co.split(",")[0].split(" ")[0].lower()),
                      "Data Processing Addendum", paras)
        made.append("DPA")
    return made


def run():
    signers = _people(10, "our-signers")
    counter = _people(10, "counter-signers")
    bank_header, bank_rows = _banks(10)
    build_msas(signers, counter, bank_header, bank_rows)
    build_near_misses(signers, counter)

    dg.write_text("%s/README.txt" % D, """AI classification of a business-specific document type

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
""")
