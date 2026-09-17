# Sheet 5 - Usability
# (id, area, capability, why_it_matters, how_to_test, tier)

B0 = "AI Classification"
B1 = "AI Policy & Tuning"
B2 = "AI Operations"
B3 = "Rollout & Change Control"
B4 = "Admin Experience"
B5 = "End-User Experience"
B6 = "Agent & Platform"

USABILITY = [
# -------------------------------------------------------- AI Classification
("U-01", B0, "AI builds business-specific classifiers for you",
 "The slowest part of every DLP programme is writing classifiers for data only you have.",
 "Point the tool at a repository of your own documents and ask it to produce a classifier. Measure time from request to a working, tuned classifier.",
 "Differentiator"),

("U-02", B0, "Classification explained in plain language",
 "An unexplainable verdict cannot be defended to a business owner.",
 "Open an AI classification and confirm it states why - which passages, which signals, which origin.",
 "Advanced"),

# -------------------------------------------------------- AI Policy & Tuning
("U-03", B1, "Policy authored from a natural-language instruction",
 "Removes the main skill barrier in running a DLP programme.",
 "Type 'stop contractors sending source code to personal cloud storage' and review the policy it generates before enabling it.",
 "Differentiator"),

("U-04", B1, "Policy recommendations from observed behaviour",
 "The tool has the telemetry; it should propose the policy.",
 "After two weeks of monitoring, ask for recommended policies and judge how many you would actually deploy.",
 "Differentiator"),

("U-05", B1, "Simulation before enforcement",
 "The question every stakeholder asks: how many people will this block?",
 "Take a monitor-mode policy and ask how many blocks it WOULD have produced last month, by team.",
 "Advanced"),

("U-06", B1, "AI review of user override justifications",
 "Justifications are usually collected and never read. This makes them a control.",
 "Submit a weak justification ('needed it') and a strong one, and confirm they are scored differently in real time.",
 "Differentiator"),

# -------------------------------------------------------- AI Operations
("U-07", B2, "AI incident investigator",
 "Triage is the largest recurring cost in running DLP.",
 "Hand the agent a real incident and compare its findings and recommended action against your own analysis.",
 "Differentiator"),

("U-08", B2, "Intent inference, not just activity detection",
 "Separates a careless employee from a departing one taking the customer list.",
 "Run the same file movement as (a) a routine workflow and (b) part of an exfiltration sequence, and confirm they are scored differently.",
 "Differentiator"),

("U-09", B2, "Automated remediation with human-in-the-loop escalation",
 "Automation you can actually authorise, because it knows when to stop.",
 "Confirm you can set which actions run automatically and which require approval, and test both paths.",
 "Advanced"),

("U-10", B2, "Natural-language / MCP interface for the security team",
 "Lets the platform be driven from the tools your team already uses.",
 "Connect the MCP endpoint to an MCP client and run a real investigative task through it.",
 "Differentiator"),

("U-11", B2, "AI-generated reporting for executives and auditors",
 "The quarterly deck is real work that nobody budgets for.",
 "Generate a monthly summary and judge whether you would send it without editing.",
 "Advanced"),

("U-12", B2, "Mean time to triage an incident",
 "Cost per incident, measured directly.",
 "Time ten real incidents end to end, from alert to a decision you would stand behind. Run them across two analysts of different experience levels - if the platform is doing the work, the gap between them should be small.",
 "Table stakes"),

# -------------------------------------------------------- Rollout & Change Control
("U-13", B3, "Policy version history and one-click rollback",
 "A bad policy at block scope is a production incident.",
 "Change a policy, confirm the previous version is retained with an author and timestamp, then roll it back.",
 "Advanced"),

("U-14", B3, "Staged rollout by group or device ring",
 "Pilot rings are how you avoid blocking the sales team on a Monday.",
 "Deploy a block policy to 10 devices, confirm the other 10,000 are unaffected, then widen.",
 "Table stakes"),

("U-15", B3, "Time to first meaningful detection",
 "The number that predicts whether the programme survives its first quarter.",
 "From a clean tenant, measure hours to a first true-positive detection on a real endpoint.",
 "Table stakes"),

# -------------------------------------------------------- Admin Experience
("U-16", B4, "Policies required to cover the use cases on this plan",
 "The most honest usability metric there is. Count them.",
 "Implement use cases A-D and count the resulting policies, rules, and classifiers.",
 "Table stakes"),

("U-17", B4, "Role-based administration and separation of duties",
 "Policy authors, approvers and investigators should be different people, and a block-mode change deserves a second pair of eyes.",
 "Create an author who cannot approve and confirm the block holds. Then confirm a policy change can be made to require approval before it reaches endpoints.",
 "Table stakes"),

# -------------------------------------------------------- End-User Experience
("U-18", B5, "Policy tip clarity",
 "A block the user does not understand becomes a helpdesk ticket and a workaround. Redirecting beats blocking - naming the sanctioned alternative prevents the next attempt too.",
 "Trigger a block and read the message as an ordinary employee would. Does it say what to do instead, and can it name the approved destination explicitly?",
 "Table stakes"),

("U-19", B5, "Business justification capture on warn",
 "Keeps people working while producing the best signal in the system - the justification a user types is often the most useful artefact in the case.",
 "Trigger a warn, submit a justification, and confirm the action proceeds, the text is searchable, and it is attached to the resulting incident.",
 "Table stakes"),

("U-20", B5, "False-positive reporting from the endpoint",
 "The user who hit the block is your best tuning signal.",
 "Report a false positive from the block dialog and confirm it reaches an admin queue.",
 "Advanced"),

# -------------------------------------------------------- Agent & Platform
("U-21", B6, "Agent resource footprint",
 "The fastest route to an agent being uninstalled is a slow laptop.",
 "Measure idle and peak CPU, RAM, and battery over a normal working day. Set a threshold before you test.",
 "Table stakes"),

("U-22", B6, "User-visible latency on common actions",
 "Any perceptible delay on paste or save will be noticed and escalated.",
 "Time paste, file save, and USB copy with the agent on and off. Lag becomes perceptible well before anyone complains about it, so set your own threshold first - anything over about a second on paste is a finding.",
 "Table stakes"),

("U-23", B6, "Deployment method coverage",
 "The agent has to reach the fleet you actually have.",
 "Confirm support for Intune, Jamf, SCCM, GPO, and non-persistent VDI.",
 "Table stakes"),

("U-24", B6, "Tamper resistance and self-healing",
 "A technical user who can stop the service has no DLP.",
 "Attempt to stop the service, kill the process, and uninstall as a local administrator.",
 "Table stakes"),

("U-25", B6, "Offline enforcement and event queueing",
 "Laptops spend real time off the network.",
 "Go offline for 24 hours, trigger events, reconnect, and confirm nothing is lost.",
 "Table stakes"),

]
