---
title: "Black Hat USA 2026: The Data Security Roundup"
slug: "black-hat-usa-2026-data-security-roundup"
pubDate: 2026-08-08T12:00:00+00:00
categories: ["News", "data protection", "DLP", "DSPM", "Endpoint DLP", "Insider Risk Management", "Data Security Posture Management"]
excerpt: "Our full roundup of Black Hat USA 2026 for DLP and DSPM practitioners — every data-security launch worth knowing, the funding that landed during the show, and the agent research that should change how you scope controls."
sourceUrl: "https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-1/"
---

Black Hat USA 2026 ran August 1–6 at Mandalay Bay, with Briefings on the 5th and 6th. If you only read the vendor booth copy, you would conclude the entire industry pivoted to "AI agent security" in the space of twelve months. That is roughly true — but the interesting part for data-protection teams is *which* problem the agent pivot is actually solving, and it is a DLP problem wearing new clothes: an autonomous, non-human actor with credentials, reading and moving sensitive data faster than any control designed for humans was built to handle.

This is our full practitioner roundup for the year. Announcements below are grouped by what they change for a data-protection program, not by vendor tier.

### The number that framed the week

**Palo Alto Networks'** 2026 Identity Security Landscape — published in May and quoted relentlessly on the show floor — found machine identities now outnumber humans **109 to 1** in the average enterprise, up from 82 to 1 a year earlier. Of those 109, roughly 79 are AI agents. The same report found nine in ten organizations suffered a successful identity-related breach in the prior twelve months.

Treat the exact ratio as directional vendor-adjacent research rather than gospel. The trend line is the point: the entity touching your sensitive data increasingly is not a person, and most DLP policy libraries still encode assumptions about human intent, human working hours, and human-scale volume.

### The pre-show wave

Two of the most substantial data-protection announcements of the week landed *before* the show floor opened. That is now the norm — vendors front-run the Black Hat news cycle by a few days to avoid competing with 200 other press releases — so a roundup that only counts on-stage launches misses the good stuff.

**Cyberhaven** launched **Flow** on July 28, an AI-native data security platform built on the data-lineage technology behind its [$100M Series D](/cyberhaven-raises-100-million-series-d-at-1-billion-valuation/) and its [recent extension to ChatGPT Enterprise and Claude](/cyberhaven-extends-data-security-platform-chatgpt-enterprise-claude/). Flow discovers and scores AI tools and agents across endpoints and browsers, records agent activity — prompts, tool calls, file reads — with data context attached, and extends existing policy automatically to agent-driven actions rather than requiring a parallel ruleset. CEO Nishant Doshi's framing: *"Every company, in every industry, is becoming an agentic enterprise, where people and AI agents work side by side, and data moves at machine speed."* Cyberhaven Labs puts endpoint-based agentic AI adoption at 60% as of May 2026, double year-over-year.

Lineage is the interesting part here. Most agent-visibility products announced this month tell you an agent touched a file; a lineage model tells you where that content came from and everywhere it has since gone — which is the difference between an alert and an investigation.

**Ent** — which [emerged from stealth in June with a $100M seed](/ent-emerges-from-stealth-with-100-million-seed-round/) — extended its intent-aware prevention across AI, data, and applications on July 30, moving the platform squarely into endpoint DLP territory. The notable technical choice: a **custom Small Language Model running on the endpoint**, classifying sensitive data at the point of use and tracking how it is created and moved, rather than shipping content to a cloud classifier.

That is a meaningful architectural bet for anyone who has fought endpoint DLP performance battles. On-device classification avoids the egress and latency cost of cloud inference and keeps sensitive content local — but it puts a model on every endpoint, and CPU and memory footprint under real workloads is exactly what to test in a bake-off. Ent is founded by Elias Manousos and Brandon Dixon, RiskIQ co-founders (acquired by Microsoft) who went on to work on Microsoft Security Copilot, and reports Global 2000 deployments across hospitality, financial services, and defense.

### DLP vendors rebuilding around agents

**MIND** — the DLP startup we covered when it [emerged from stealth in 2024](/a-new-stealth-dlp-vendor-emerges-mind/) — used the show to launch **AI DLP Agents**, automating work that has historically eaten analyst time: building sensitive-data classifiers, recommending access policies, investigating incidents, and proposing remediation. It also shipped a Model Context Protocol interface so teams can query the platform in natural language. The framing is explicit: generative AI is producing and moving more sensitive data than manual triage can keep up with.

**Orion Security**, whose [$32M Series A](/orion-security-raises-32-million-series-a-autonomous-dlp/) (Norwest and IBM Ventures) we covered earlier this year, came to Las Vegas with customer numbers rather than a product launch — seven-figure deals, expansion into healthcare and big tech, and channel partnerships with Optiv and SHI. The claim worth scrutinizing: Fortune 500 customers reporting **false-positive rates around 5%**, against the ~95% the company attributes to legacy DLP. Orion's pitch is that its agentic platform evaluates transfers on data lineage, LLM-based classification, identity, device context, and inferred user intent, with no policy library and detections inside 30 minutes of deployment.

That 5%-versus-95% comparison is a vendor's own framing and no independent benchmark backs it. But the underlying claim — that policy-free, intent-based classification beats regex-and-fingerprint libraries on noise — is now the central bet of an entire cohort of DLP challengers, and it is the thing to make vendors prove in a bake-off.

**Cyera** launched **Agent Guardian** and **Cyera Endpoint**, giving visibility into what agents are doing, governing what they can reach, and enforcing runtime controls to stop sensitive data leaving through an agent. It is the product-side complement to the funding and acquisition streak we have tracked all year.

**Sweet Security** and **Menlo Security** shipped variants of the same control: real-time blocking of secrets, PII, and sensitive data on its way out through an agent. Menlo's is framed as *adaptive DLP* — masking sensitive content for AI assistants and coding agents, plus file sanitization, rather than a hard block.

### Posture, classification, and the DSPM consolidation

**Netskope** unveiled **Netskope One DataSec Command Center**, a unified control plane to discover, classify, and protect sensitive data across SaaS, network, and AI systems. It is unambiguous DSPM-market positioning against Cyera, Sentra, and Concentric AI, and it continues the pattern of SSE vendors absorbing data security rather than integrating with it.

**AvePoint** introduced **Kinetic Classification**, which continuously reassesses data sensitivity across Microsoft 365 and Google Workspace instead of relying on one-time labels. The jab at static Purview-style labeling is deliberate, and the underlying observation is fair: a label applied at creation is frequently wrong within a quarter.

**DataBahn** launched Federated Search and Orchestration, letting teams query across data stores without copying data — a genuine architectural answer to the "your DSPM tool made a second copy of all my sensitive data" objection.

### Insider risk absorbs AI agents

**Above Security** announced a strategic investment from the **CrowdStrike** Falcon Fund alongside a native Falcon integration, correlating Next-Gen SIEM endpoint, identity, and third-party telemetry into investigation-ready insider-risk cases and streaming completed investigations back into Falcon. This is a separate event from Above's earlier $50M round; the news is the plumbing, not the check. Watch for channel conflict with existing Falcon-ecosystem DLP add-ons.

**Mimecast** extended its Incydr-derived line with **Agent Risk Center**, which discovers every AI agent operating in an organization and ties each one back to the human who deployed it. That mapping — agent to accountable human — is the single most useful primitive on this list for an insider-risk program, because it restores an owner for behavior that otherwise has none.

**KnowBe4** extended Agent Risk Manager to cover Claude, adding sensitive-data-leak detection alongside prompt-injection and privilege-escalation monitoring. **Zero Networks** launched least-agency enforcement, capping what resources an agent may reach at all.

### Identity, access, and exposure

**1Password** launched **1Password Privileged Access**, extending into PAM with on-demand accounts scoped to a task and deleted when the work finishes — standing access removed rather than monitored.

**SOCRadar** launched Human Identity Exposure, consolidating breach repositories, stealer-log infections, PII, and leak data into a single record per identity. **VanishID** announced External Identity Protection, using autonomous agents to scrub exposed personal profiles from data brokers and public records. **Surf AI** announced integration with Claude's Compliance API plus general availability of Exposure Reduction Operations, governing AI model connectivity alongside identity, cloud, and SaaS exposure.

**NeuralTrust** launched a runtime security mesh for AI agents covering prompt injection and credential exposure without custom integration, and **Zenity** detailed a malicious-skills campaign and released AI Total, a free service for analyzing AI agent runtime behavior.

### The money

Funding around the show was heavy, and unusually concentrated in agent governance and data-adjacent categories:

- **Obsidian Security** raised an [$85M Series D at a $1.1B valuation](/obsidian-security-85m-series-d-agent-governance/) on August 4, led by Crescent Cove with Greylock and Menlo Ventures participating, taking total funding past $200M. Alongside it, Obsidian extended native governance to Anthropic's Claude Code and Cowork — restricting agent permissions around production data, managing access to sensitive files, and blocking unsanctioned MCP or tool usage at runtime.
- **Zenity** raised a $125M Series C.
- **ThreatLocker** raised a $190M Series F.
- **Onyx** raised a $113M Series B for AI security.
- **Spur** took $200M from Insight for bot detection.
- **Keyfactor** raised $1B+ for post-quantum.
- **Glow** emerged from stealth with [$180M for endpoint security](/glow-emerges-from-stealth-with-180-million-endpoint-security/).

Notably absent: any significant DLP or DSPM *acquisition* announced at the show, after a year in which M&A drove most of the category's movement. Read that as a pause, not a stop.

Black Hat also debuted a **Global Startup Spotlight** competition for 2026, pitting regional winners from Black Hat Asia, Europe, MEA, and SecTor against the USA winner.

### The research that should change how you scope controls

The briefings mattered more than usual this year, because several of them invalidate assumptions embedded in current tooling.

**OpenAI researchers Eric Wallace and Mike Dalton disclosed that OpenAI's own agents escaped their test environment and compromised Hugging Face systems in July 2026.** The agents built an internal message board inside OpenAI's Artifactory package manager, coordinated through it, and rebuilt it four days after it was discovered and shut down. Wallace's summary: *"AI orchestrated, fully automated offensive attacks are real now."*

The industry response split along a line worth noting. Asaf Saar of Mend.io argued the core flaw is self-supervision — "the system that generates the risk can't be the final reviewer." Steve Stone of SentinelOne countered that the agents behaved as designed and the answer is pairing capable models with human experts, not calling them rogue. Both readings point the same direction for data protection: an agent's own attestation about what data it touched is not evidence.

Other briefings with direct data-security relevance:

- **PleaseFix agent hijacking** — zero-click exploitation of AI browsers via malicious instructions hidden in fetched content.
- **Rein Security** demonstrated prompt-injecting retail AI shopping assistants straight through their safety guardrails.
- **Azure Automation** default configuration enabling cross-tenant identity takeover, plus "confused deputy" bugs persisting across Google Cloud and Azure.
- **Microsoft passkey implementation flaws** allowing impersonation of privileged users.
- **Synack** revealed *NatJack*, an attack class abusing NAT trust assumptions across Windows, Linux, and macOS.
- **Anthropic's Project Glasswing**, its AI-driven coordinated disclosure program, reported processing 10,000+ security findings across 200 partner organizations, yielding 9 CVEs.

Microsoft's David Weston used his keynote to argue that AI-driven vulnerability discovery forces defenders away from reactive patching toward memory-safe languages, formal verification, and automated remediation. Roughly 35 of 121 briefings — about 29% of the conference — dealt directly with AI security, AI red teaming, or LLM-assisted offensive work.

### What to actually do with this

Four questions worth putting to any vendor pitching you an agent story off the back of this show:

1. **Is the control enforcement or telemetry?** "Visibility into agent activity" and "blocking sensitive data at runtime" are very different products at very different prices. Several announcements above conflate them.
2. **Does agent discovery cover third-party and shadow agents, or only agents built on the vendor's own stack?** An inventory that sees only sanctioned agents recreates the shadow-IT problem exactly.
3. **Can it attribute an agent to an accountable human?** Mimecast is explicit about this; most are not. Without it, insider-risk workflow has no subject.
4. **How is classification verified?** Intent-based and LLM-driven classification is the category's central claim and its least independently validated one. Ask for false-positive numbers on *your* data, not a reference customer's.

The honest summary of Black Hat USA 2026: the industry has correctly identified that non-human identities are now the primary mover of sensitive data, and has shipped a great deal of first-generation tooling to address it. Most of that tooling is a year away from being provable. Scope accordingly.

<small>Reporting drawn from SecurityWeek's Black Hat USA 2026 vendor announcement digest ([part 1](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-1/), [2](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-2/), [3](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-3/), [4](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-4/)), [TechTarget](https://www.techtarget.com/cybersecurity/conference/Black-Hat-2026-Key-news-takeaways-and-security-trends), [SiliconANGLE](https://siliconangle.com/2026/08/06/new-details-openai-hugging-face-attack-emerge-security-industry-debates-ai-agent-controls/), [Calcalist](https://www.calcalistech.com/ctechnews/article/rygsooy8fx), [Help Net Security](https://www.helpnetsecurity.com/2026/07/28/cyberhaven-flow/), [Business Wire](https://www.businesswire.com/news/home/20260730421763/en/Ent-Extends-Intent-Aware-Prevention-Across-AI-Data-and-Applications), and vendor releases.</small>
