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
 "Advanced"),

("U-05", B1, "Simulation before enforcement",
 "The question every stakeholder asks: how many people will this block?",
 "Take a monitor-mode policy and ask how many blocks it WOULD have produced last month, by team. Previewing what an intervention will look like is not simulation. Pass requires a count of would-be blocks calculated from real historical activity.",
 "Advanced"),

("U-06", B1, "Justification as a control, not a log entry",
 "Justifications are usually collected and never read. The sentence a user writes when asked why is often the most useful artefact in a case, and it is worth nothing if nothing acts on it.",
 "First confirm the user can enter free text rather than only choosing from a list. Then submit a weak justification ('needed it') and a considered one, and establish what the tool does with the difference. Any of these counts: scored or classified in real time, routed to a review queue, escalated to an analyst, or ranked for the operator. Ask whether the text is searchable and whether repeated weak justifications from one person show up as a pattern. A picklist with no free-text option is a Fail.",
 "Advanced"),

# -------------------------------------------------------- AI Operations
("U-07", B2, "AI incident investigator",
 "Triage is the largest recurring cost in running DLP.",
 "Hand the agent a real incident and compare its findings and recommended action against your own analysis.",
 "Advanced"),

("U-08", B2, "Intent inference, not just activity detection",
 "Separates a careless employee from a departing one taking the customer list.",
 "Run the same file movement as (a) a routine workflow and (b) part of an exfiltration sequence, and confirm they are scored differently.",
 "Advanced"),

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
 "Policy authors, approvers and investigators should be different people.",
 "Create a role that can author policies but cannot change enforcement settings or view evidence, and a role that can investigate but cannot change policy. Confirm both restrictions hold.",
 "Table stakes"),

("U-18", B4, "Approval workflow for enforcement changes",
 "A block-mode change is a production change and deserves a second pair of eyes.",
 "Change a rule from monitor to block and confirm the change can be made to require a second administrator's approval before it reaches endpoints.",
 "Advanced"),

# -------------------------------------------------------- End-User Experience
("U-19", B5, "Policy tip clarity",
 "A block the user does not understand becomes a helpdesk ticket and a workaround. Redirecting beats blocking - naming the sanctioned alternative prevents the next attempt too.",
 "Trigger a block and read the message as an ordinary employee would. Does it say what to do instead, and can it name the approved destination explicitly?",
 "Table stakes"),

("U-20", B5, "Business justification capture on warn",
 "Keeps people working while producing the best signal in the system - the justification a user types is often the most useful artefact in the case.",
 "Trigger a warn, submit a justification, and confirm the action proceeds, the text is searchable, and it is attached to the resulting incident.",
 "Table stakes"),

("U-21", B5, "False-positive reporting from the endpoint",
 "The user who hit the block is your best tuning signal.",
 "Report a false positive from the block dialog and confirm it reaches an admin queue.",
 "Advanced"),

("U-22", B5, "Working redirect to the sanctioned alternative",
 "Naming the approved destination helps. Getting the user there in one step is what stops the next attempt.",
 "Trigger a block or warn that offers an approved alternative. Follow it and confirm the user can finish the original task through the sanctioned path without raising a ticket.",
 "Advanced"),

("U-23", B5, "Request approval before proceeding",
 "Some actions should be neither blocked outright nor allowed on a justification alone.",
 "Trigger an action that requires approval. Confirm the user can request it from the prompt and see what they are waiting on, and that both approval and denial reach the user and the record. Test what happens when nobody responds.",
 "Advanced"),

("U-24", B5, "Time-bound exceptions",
 "Permanent exceptions pile up until the policy means nothing.",
 "After a justified or approved override, confirm access can be granted for a set period or a single action, and that the prompt returns when it expires.",
 "Advanced"),

("U-25", B5, "Modify the action rather than stop it",
 "Many risky actions can continue safely once the sensitive part is removed. Stopping work entirely is the most expensive outcome.",
 "Paste text containing sensitive identifiers into an unsanctioned destination and confirm the identifiers can be redacted while the rest of the paste completes. Better still: during a screen share to an external participant, sensitive content on screen can be obscured.",
 "Differentiator"),

("U-26", B5, "Intervention fatigue",
 "A prompt shown thirty times a day gets clicked through unread, and that teaches users to ignore the agent.",
 "Trigger the same rule thirty times in one day as the same user. Confirm the tool suppresses, escalates or adapts rather than showing an identical prompt every time, and that an administrator can see and tune the frequency.",
 "Advanced"),

# -------------------------------------------------------- Agent & Platform
("U-27", B6, "Agent resource footprint",
 "The fastest route to an agent being uninstalled is a slow laptop.",
 "Measure idle and peak CPU, RAM, and battery over a normal working day. Set a threshold before you test.",
 "Table stakes"),

("U-28", B6, "User-visible latency on common actions",
 "Any perceptible delay on paste or save will be noticed and escalated.",
 "Time paste, file save, and USB copy with the agent on and off. Lag becomes perceptible well before anyone complains about it, so set your own threshold first - anything over about a second on paste is a finding.",
 "Table stakes"),

("U-29", B6, "Deployment method coverage",
 "The agent has to reach the fleet you actually have.",
 "Confirm support for Intune, Jamf, SCCM, GPO, and non-persistent VDI.",
 "Table stakes"),

("U-30", B6, "Tamper resistance and self-healing",
 "A technical user who can stop the service has no DLP.",
 "Attempt to stop the service, kill the process, and uninstall as a local administrator.",
 "Table stakes"),

("U-31", B6, "Offline enforcement and event queueing",
 "Laptops spend real time off the network.",
 "Go offline for 24 hours, trigger events, reconnect, and confirm nothing is lost.",
 "Table stakes"),

]
