# Sheet 3 - Investigations
# (id, area, capability, why_it_matters, how_to_test, tier)

A0 = "Evidence & Context"
A1 = "Timeline & Lineage"
A2 = "Search & Pivot"
A3 = "Insider Risk & Behaviour"
A4 = "Workflow & Case Management"
A5 = "Privacy & Governance"
A6 = "Response"
A7 = "AI Agent Activity"

INVESTIGATIONS = [
# -------------------------------------------------------- Evidence & Context
("I-01", A0, "The matched content is visible in the incident",
 "Without seeing what matched, every triage decision is a guess.",
 "Open an incident and confirm you can see the matched strings in context, with configurable masking.",
 "Table stakes"),

("I-02", A0, "Forensic file capture",
 "The file itself, as it was at the moment of the incident, not a filename and a hash.",
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
 "Capture the account the data went to, and whether it is a personal account or your corporate tenant.",
 "Upload to a personal Dropbox and check whether the incident names the account, not just the domain.",
 "Advanced"),

# -------------------------------------------------------- Timeline & Lineage
("I-06", A1, "Auto-assembled incident timeline",
 "The investigation opens with the sequence of events already assembled.",
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
 "Enable always-on activity auditing. Create a new policy today and ask what that user did last month.",
 "Advanced"),

# -------------------------------------------------------- Search & Pivot
("I-11", A2, "Pivot from any point in an incident",
 "The core investigative move: from one alert, follow the person, the file, or the destination, whichever the question needs.",
 "From one alert, pivot three ways: to all activity for that user over 90 days including activity that never triggered a policy; to every user, device and destination a single file reached; and from a personal cloud account seen in the incident to everything else that reached it.",
 "Advanced"),

("I-12", A2, "Free-text and structured search across all telemetry",
 "Investigations start from questions no rule anticipated, so analysts need to search the raw telemetry directly.",
 "Search for a filename fragment, a USB serial, and a destination domain across 90 days. Time each query.",
 "Table stakes"),

("I-13", A2, "Natural-language investigation",
 "Lets a tier-1 analyst ask the question a tier-3 analyst would have written a query for.",
 "Ask, in plain English, 'show me everything this user did with customer data in the last 30 days' and verify the answer against a manual query.",
 "Differentiator"),

# -------------------------------------------------------- Insider Risk & Behaviour
("I-14", A3, "All user activity, not just DLP alerts",
 "An investigation needs the context around the alert.",
 "Confirm you can see application usage, file activity, web activity, and USB activity for a user with no policy match attached.",
 "Differentiator"),

("I-15", A3, "Behavioural baseline and deviation",
 "'Unusual for this person' is a better signal than 'over a global threshold', and 'unusual for this role' is better still. Ten thousand rows is routine for a data analyst and alarming for a recruiter.",
 "Establish two weeks of normal activity, then perform a 100x export and confirm it is scored as a deviation. Then confirm the tool also compares the user against their department or role, not only against themselves.",
 "Advanced"),

("I-16", A3, "Sequence and scenario detection",
 "The flight-risk pattern: job-site visit, mass download, cloud upload, USB copy, within days.",
 "Run that sequence over three days on a test account and confirm it surfaces as one risk case, not five alerts.",
 "Differentiator"),

("I-17", A3, "HR and identity context",
 "A resignation date turns routine activity into a priority case.",
 "Import a departing-employee list or HRIS feed and confirm those users are automatically elevated.",
 "Advanced"),

# -------------------------------------------------------- Workflow & Case Management
("I-18", A4, "Alert grouping and deduplication",
 "One person copying 400 files is one case, not 400 alerts.",
 "Copy 400 sensitive files to USB in one action and count the resulting alerts.",
 "Advanced"),

("I-19", A4, "Case management with assignment and annotation",
 "An investigation spans days and several people, so cases need owners, notes and history.",
 "Create a case, assign it, add notes and evidence, reassign it, and close it. Confirm the full history is preserved.",
 "Advanced"),

("I-20", A4, "Evidence export for HR and Legal",
 "The deliverable is usually a packet for someone outside security.",
 "Export a case as PDF or CSV with evidence attached and confirm it stands on its own.",
 "Advanced"),

("I-21", A4, "SIEM / SOAR integration",
 "Investigations that stay inside the DLP console do not scale.",
 "Forward incidents to your SIEM and confirm full fidelity (including the evidence link), not just a summary line.",
 "Table stakes"),

("I-22", A4, "Auto-close of known-good activity",
 "The only durable way to cut alert volume.",
 "Identify a repeating benign pattern and confirm you can suppress it by pattern rather than by disabling the rule. Not required for Pass. Record in Notes whether the platform spots the pattern itself, proposes the suppression, and applies it once you approve.",
 "Advanced"),

# -------------------------------------------------------- Privacy & Governance
("I-23", A5, "Pseudonymised investigation by default",
 "Required for works councils and GDPR-scope deployments in much of Europe, and it keeps the monitoring programme itself defensible.",
 "Confirm analysts see anonymised identities by default. Then attempt to reveal one as a single analyst and confirm a second approver is required.",
 "Differentiator"),

("I-24", A5, "Role-based access to evidence",
 "Not every analyst should see file contents or screen recordings.",
 "Create a triage role without evidence access and confirm the restriction holds.",
 "Table stakes"),

("I-25", A5, "Audit log of the investigators",
 "Investigator searches and file views are logged, so access to monitoring data can itself be reviewed.",
 "Run a search as an analyst, then confirm that search is itself logged and reviewable by an administrator.",
 "Advanced"),

# -------------------------------------------------------- Response
("I-26", A6, "In-console response actions",
 "Closing the loop without a ticket to another team.",
 "From an incident, attempt to revoke access, quarantine the file, force sign-out, and isolate the device.",
 "Differentiator"),

("I-27", A6, "Remote forensics without touching the device",
 "Remote and BYOD fleets make physical collection impractical.",
 "Collect evidence from a device that is off-network at the time of collection.",
 "Differentiator"),

# -------------------------------------------------------- AI Agent Activity
("I-28", A7, "AI agent and tool inventory",
 "You cannot govern agents you do not know are running. Local model runtimes and MCP servers are the ones most often missed.",
 "Over a two-week pilot, ask for every AI agent, coding assistant, local model runtime, plugin and MCP server the tool found running on endpoints, with versions and devices. Compare it with what you know is installed.",
 "Advanced"),

("I-29", A7, "Structured capture of agent sessions",
 "An agent can take dozens of actions per prompt. Record what the agent did, not only that it ran.",
 "Run an AI coding agent through a short task that reads files, runs shell commands and edits a file. Confirm the prompt, the agent's responses, each tool call and command, and each file change are recorded as structured events tied to one session, not only as process activity.",
 "Advanced"),

("I-30", A7, "Agent, person and account attribution",
 "An investigation needs to know whether a person or an agent acted, and which identity the agent used.",
 "In one agent session, confirm each action is attributed to the agent or the person. Then sign the agent in with a personal account and with an API key, and confirm the tool reports which AI account was used and flags personal or unmanaged identities. Not required for Pass. Record in Notes whether a shared or generic OS login is resolved to the person behind it.",
 "Differentiator"),

("I-31", A7, "Agent tool chain: MCP servers and sub-agents",
 "Agents reach other systems through MCP servers and hand work to sub-agents, which is often where data leaves.",
 "Have an agent call an MCP server that reads from an internal system. Confirm each call is recorded with its input and output. Not required for Pass. Record in Notes whether a task delegated to a sub-agent is attributed back to the parent session.",
 "Differentiator"),

]
