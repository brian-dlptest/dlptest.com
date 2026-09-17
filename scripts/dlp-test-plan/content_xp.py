# Sheet 3 - Enforcement
# (id, method, what_to_test, tier)
# The Result column is left blank for the tester.

XPOLICY = [
("E-01", "Keyword / dictionary",
 "Add a dictionary term and time how long until an endpoint enforces it. Pass = the term reaches endpoints and blocks within a window you would accept.",
 "Table stakes"),

("E-02", "Regex / pattern match",
 "Block a file containing 30 SSNs to USB. Pass = the block happens in the moment, before the copy completes.",
 "Table stakes"),

("E-03", "Exact Data Match (EDM)",
 "Attempt egress of 50 records that are in the index and 50 that are not. Ask whether the endpoint holds a local copy of the hash index or calls home for every check. Pass = only the indexed 50 are caught, and the check is fast enough to block rather than alert.",
 "Differentiator"),

("E-04", "Trainable classifier / small ML model",
 "Test a trainable-classifier rule and ask explicitly where the model executes - cloud-scored ML and on-device ML get described in the same language. Pass = it blocks in the moment rather than alerting after the fact.",
 "Advanced"),

("E-05", "Data lineage / origin",
 "Download a file from an internal repo, rename it, zip it, then attempt egress. The agent records the origin as it happens, so enforcement is a local lookup rather than a call out - which is why lineage can block in real time where AI classification usually cannot. Pass = the zip is blocked on origin alone.",
 "Differentiator"),

("E-06", "LLM / AI semantic classification",
 "Paste 500 words of MNPI into a GenAI prompt. Ask for the p95 classification latency and whether the action can be held pending the verdict. Pass = the paste is actually held; if the verdict only ever arrives after the prompt is gone, that is a Fail for inline enforcement even when the detection itself is accurate.",
 "Differentiator"),

("E-07", "AI classification with a cached verdict",
 "Score a file once, then attempt egress of the same content again. Ask how long verdicts are cached and what invalidates them. Pass = the second attempt is blocked locally, without a round trip.",
 "Differentiator"),

("E-08", "Behavioural / intent (UEBA)",
 "Perform a 100x export and confirm the anomaly surfaces. This is investigation and risk scoring rather than prevention, so Pass = it surfaces promptly and is not sold to you as a blocking control.",
 "Differentiator"),

("E-09", "Agentic / autonomous AI decisioning",
 "Ask for a demonstration of a real-time block that an AI agent decided, rather than one a static rule decided. Pass = the agent itself makes the call in the moment; writing a rule that later blocks is a different thing, and should be scored Partial.",
 "Differentiator"),

]
# Sheet 4 - Investigations
# (id, area, capability, why_it_matters, how_to_test, tier)

A0 = "Evidence & Context"
A1 = "Timeline & Lineage"
A2 = "Search & Pivot"
A3 = "Insider Risk & Behaviour"
A4 = "Workflow & Case Management"
A5 = "Privacy & Governance"
A6 = "Response"

INVESTIGATIONS = [
# -------------------------------------------------------- Evidence & Context
("I-01", A0, "The matched content is visible in the incident",
 "Without seeing what actually matched, every triage decision is a guess.",
 "Open an incident and confirm you can see the matched strings in context, with configurable masking.",
 "Table stakes"),

("I-02", A0, "Forensic file capture",
 "The file itself, as it was at the moment of the incident - not a filename and a hash.",
 "Trigger an incident and confirm you can retrieve and open the captured copy.",
 "Advanced"),

("I-03", A0, "Screen recording or screenshot around the event",
 "Shows intent. A 30-second clip settles arguments that metadata cannot.",
 "Trigger an incident and confirm a capture of the seconds before it exists and is retrievable.",
 "Differentiator"),

("I-04", A0, "Full activity metadata on the event",
 "Device, process, user, destination, USB serial, printer name, file hash, size, previous filename.",
 "Copy a file to USB and confirm the incident records the removable-media manufacturer, model, and serial number.",
 "Table stakes"),

("I-05", A0, "Destination detail, not just a category",
 "Knowing that data went to 'cloud storage' is not actionable. Capturing the account it went to - and that it is a personal account rather than your corporate tenant - is.",
 "Upload to a personal Dropbox and check whether the incident names the account, not just the domain.",
 "Advanced"),

# -------------------------------------------------------- Timeline & Lineage
("I-06", A1, "Auto-assembled incident timeline",
 "The investigation should open with the story already told, not with a query box.",
 "Open an incident cold and time how long until you can state what happened. Target: under two minutes with no manual log correlation.",
 "Differentiator"),

("I-07", A1, "Full data lineage from origin to egress",
 "Answers 'where did this data come from', which is the question that decides severity.",
 "Trace a file from its origin system through every copy, rename, and app to the point of egress.",
 "Differentiator"),

("I-08", A1, "Obfuscation chained into one story",
 "Rename, re-extension, zip, and encrypt should be one narrative, not four unrelated events.",
 "Rename a sensitive file, change its extension, zip it with a password, then upload it. Confirm the incident presents this as a single connected sequence.",
 "Differentiator"),

("I-09", A1, "Trace through AI tools and agents",
 "Prompt content, file uploads, and agent actions as first-class timeline events.",
 "Paste sensitive data into a GenAI tool and confirm the prompt content (or a redacted form of it) appears in the timeline.",
 "Differentiator"),

("I-10", A1, "Events before the policy existed",
 "Most investigations start after the fact. Retroactive visibility decides whether you can answer at all.",
 "Enable always-on activity auditing. Create a NEW policy today and ask what that user did last month.",
 "Advanced"),

# -------------------------------------------------------- Search & Pivot
("I-11", A2, "Pivot from any point in an incident",
 "The core investigative move: from one alert, follow the person, the file, or the destination - whichever the question needs.",
 "From one alert, pivot three ways: to all activity for that user over 90 days including activity that never triggered a policy; to every user, device and destination a single file reached; and from a personal cloud account seen in the incident to everything else that reached it.",
 "Advanced"),

("I-12", A2, "Free-text and structured search across all telemetry",
 "Investigations are questions you did not anticipate.",
 "Search for a filename fragment, a USB serial, and a destination domain across 90 days. Time each query.",
 "Table stakes"),

("I-13", A2, "Natural-language investigation",
 "Lets a tier-1 analyst ask the question a tier-3 analyst would have written a query for.",
 "Ask, in plain English, 'show me everything this user did with customer data in the last 30 days' and verify the answer against a manual query.",
 "Differentiator"),

# -------------------------------------------------------- Insider Risk & Behaviour
("I-14", A3, "All user activity, not just DLP alerts",
 "This is what separates modern DLP from a policy engine. An investigation needs the context around the alert.",
 "Confirm you can see application usage, file activity, web activity, and USB activity for a user with no policy match attached.",
 "Differentiator"),

("I-15", A3, "Behavioural baseline and deviation",
 "'Unusual for this person' is a better signal than 'over a global threshold' - and 'unusual for this role' is better still. Ten thousand rows is routine for a data analyst and alarming for a recruiter.",
 "Establish two weeks of normal activity, then perform a 100x export and confirm it is scored as a deviation. Then confirm the tool also compares the user against their department or role, not only against themselves.",
 "Differentiator"),

("I-16", A3, "Sequence and scenario detection",
 "The flight-risk pattern: job-site visit, mass download, cloud upload, USB copy, within days.",
 "Run that sequence over three days on a test account and confirm it surfaces as one risk case, not five alerts.",
 "Differentiator"),

("I-17", A3, "User risk score with contributing factors and decay",
 "A score you cannot explain is a score you cannot act on.",
 "Open a risk score and confirm you can see every event contributing to it, its weight, and how the score decays over time.",
 "Advanced"),

("I-18", A3, "HR and identity context",
 "A resignation date turns routine activity into a priority case.",
 "Import a departing-employee list or HRIS feed and confirm those users are automatically elevated.",
 "Differentiator"),

("I-19", A3, "AI-generated incident narrative",
 "Turns a timeline into something you can forward to HR or Legal.",
 "Generate a summary for a real incident and check it against the raw evidence for accuracy and hallucination.",
 "Differentiator"),

# -------------------------------------------------------- Workflow & Case Management
("I-20", A4, "Alert grouping and deduplication",
 "One person copying 400 files is one case, not 400 alerts.",
 "Copy 400 sensitive files to USB in one action and count the resulting alerts.",
 "Advanced"),

("I-21", A4, "Case management with assignment and annotation",
 "Investigations span days and people.",
 "Create a case, assign it, add notes and evidence, reassign it, and close it. Confirm the full history is preserved.",
 "Advanced"),

("I-22", A4, "Evidence export for HR and Legal",
 "The deliverable is usually a packet for someone outside security.",
 "Export a case as PDF or CSV with evidence attached and confirm it stands on its own.",
 "Advanced"),

("I-23", A4, "Chain of custody",
 "Required if a case may ever support a termination or litigation.",
 "Confirm evidence is hashed, timestamped, tamper-evident, and that access to it is itself logged.",
 "Differentiator"),

("I-24", A4, "SIEM / SOAR integration",
 "Investigations that stay inside the DLP console do not scale.",
 "Forward incidents to your SIEM and confirm full fidelity - including the evidence link - not just a summary line.",
 "Table stakes"),

("I-25", A4, "Auto-close of known-good activity",
 "The only durable way to cut alert volume.",
 "Identify a repeating benign pattern and confirm you can suppress it by pattern rather than by disabling the rule. Better still: confirm the platform spots the pattern itself, proposes the suppression, and applies it once you approve.",
 "Advanced"),

# -------------------------------------------------------- Privacy & Governance
("I-26", A5, "Pseudonymised investigation by default",
 "Required for works councils and GDPR-scope deployments in much of Europe, and it keeps the monitoring programme itself defensible.",
 "Confirm analysts see anonymised identities by default. Then attempt to reveal one as a single analyst and confirm a second approver is required.",
 "Differentiator"),

("I-27", A5, "Role-based access to evidence",
 "Not every analyst should see file contents or screen recordings.",
 "Create a triage role without evidence access and confirm the restriction holds.",
 "Table stakes"),

("I-28", A5, "Audit log of the investigators",
 "Someone has to watch the watchers.",
 "Run a search as an analyst, then confirm that search is itself logged and reviewable by an administrator.",
 "Advanced"),

# -------------------------------------------------------- Response
("I-29", A6, "In-console response actions",
 "Closing the loop without a ticket to another team.",
 "From an incident, attempt to revoke access, quarantine the file, force sign-out, and isolate the device.",
 "Differentiator"),

("I-30", A6, "Remote forensics without touching the device",
 "Remote and BYOD fleets make physical collection impractical.",
 "Collect evidence from a device that is off-network at the time of collection.",
 "Differentiator"),

]
