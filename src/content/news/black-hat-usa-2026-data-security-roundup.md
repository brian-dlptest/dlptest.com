---
title: "Black Hat USA 2026: The data security roundup"
slug: "black-hat-usa-2026-data-security-roundup"
pubDate: 2026-08-08T12:00:00+00:00
categories: ["News", "data protection", "DLP", "DSPM", "Endpoint DLP", "Insider Risk Management", "Data Security Posture Management"]
excerpt: "The full roundup of Black Hat USA 2026 for DLP and DSPM: the data security launches, the funding around the show, and the agent research that should change how you scope your controls."
sourceUrl: "https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-1/"
---

Black Hat USA 2026 ran August 1–6 at Mandalay Bay, with Briefings on the 5th and 6th. If you only read the booth copy, you'd think the whole industry pivoted to "AI agent security" in twelve months. That's pretty much true. What's interesting for data protection teams is which problem it's solving, and it's a DLP problem: something with credentials, and no human at the keyboard, reading and moving sensitive data faster than any control built for humans can handle.

This is the full roundup for the year. I grouped the announcements by what they change for a data protection program, not by vendor size. (Disclaimer: I work at Cyberhaven, which is one of the vendors below.)

### The number that framed the week

**Palo Alto Networks'** 2026 Identity Security Landscape, published in May and quoted constantly on the show floor, found machine identities now outnumber humans **109 to 1** in the average enterprise, up from 82 to 1 a year earlier. Of those 109, roughly 79 are AI agents. The same report found nine in ten organizations had a successful identity-related breach in the prior twelve months.

Take the exact ratio with a grain of salt, since this is vendor research. The trend is what matters. What's touching your sensitive data more and more isn't a person, and most DLP policy libraries still assume human intent, human working hours, and human volume.

### The pre-show wave

Two of the biggest data protection announcements of the week came *before* the show floor opened. That's normal now. Vendors go a few days early so they aren't competing with 200 other press releases, so if you only count on-stage launches you miss the good stuff.

**Cyberhaven** launched **Flow** on July 28, an AI-native data security platform built on the data lineage technology behind its [$100M Series D](/cyberhaven-raises-100-million-series-d-at-1-billion-valuation/) and its [recent extension to ChatGPT Enterprise and Claude](/cyberhaven-extends-data-security-platform-chatgpt-enterprise-claude/). Flow discovers and scores AI tools and agents across endpoints and browsers, records agent activity (prompts, tool calls, file reads) with data context attached, and automatically extends existing policy to agent actions, so you don't need a separate set of rules. CEO Nishant Doshi said: *"Every company, in every industry, is becoming an agentic enterprise, where people and AI agents work side by side, and data moves at machine speed."* Cyberhaven Labs puts endpoint-based agentic AI adoption at 60% as of May 2026, double year over year.

Lineage is the interesting part. Most agent visibility products announced this month tell you an agent touched a file. A lineage model tells you where that content came from and everywhere it has gone since. That's the difference between an alert and an investigation.

**Ent**, which [emerged from stealth in June with a $100M seed](/ent-emerges-from-stealth-with-100-million-seed-round/), extended its intent-aware prevention across AI, data, and applications on July 30, which moves it into endpoint DLP. The notable technical choice is a **custom Small Language Model running on the endpoint**. It classifies sensitive data at the point of use and tracks how it's created and moved, without sending content to a cloud classifier.

If you've ever fought endpoint DLP performance battles, you'll want to look at this one. On-device classification avoids the egress and latency cost of cloud inference and keeps sensitive content local, but it also puts a model on every endpoint. CPU and memory use under real workloads is exactly what to test in a bake-off. Ent was founded by Elias Manousos and Brandon Dixon, RiskIQ co-founders (acquired by Microsoft) who went on to work on Microsoft Security Copilot. It reports Global 2000 deployments across hospitality, financial services, and defense.

### DLP vendors rebuilding around agents

**MIND**, the DLP startup covered here when it [emerged from stealth in 2024](/a-new-stealth-dlp-vendor-emerges-mind/), used the show to launch **AI DLP Agents**. They automate work that has historically eaten analyst time: building sensitive data classifiers, recommending access policies, investigating incidents, and proposing remediation. MIND also shipped a Model Context Protocol interface so teams can query the platform in natural language. Its argument is that generative AI is producing and moving more sensitive data than manual triage can keep up with.

**Orion Security**, whose [$32M Series A](/orion-security-raises-32-million-series-a-autonomous-dlp/) (Norwest and IBM Ventures) was covered here earlier this year, came to Las Vegas with customer numbers and no product launch: seven-figure deals, expansion into healthcare and big tech, and channel partnerships with Optiv and SHI. The claim to look at is Fortune 500 customers reporting **false positive rates around 5%**, against the ~95% the company attributes to legacy DLP. Orion says its agentic platform evaluates transfers on data lineage, LLM-based classification, identity, device context, and inferred user intent, with no policy library and detections inside 30 minutes of deployment.

That 5% versus 95% comparison is Orion's own, and no independent benchmark backs it. But the idea behind it, that policy-free, intent-based classification is less noisy than regex and fingerprint libraries, is what a whole group of DLP challengers is betting on. Make vendors prove it in a bake-off.

**Cyera** launched **Agent Guardian** and **Cyera Endpoint**, which show what agents are doing, govern what they can reach, and enforce runtime controls to stop sensitive data from leaving through an agent. It's the product side of the funding and acquisition streak covered here all year.

**Sweet Security** and **Menlo Security** shipped versions of the same control: real-time blocking of secrets, PII, and sensitive data on its way out through an agent. Menlo calls its version *adaptive DLP*. It masks sensitive content for AI assistants and coding agents and adds file sanitization, so it isn't a hard block.

### Posture, classification, and DSPM

**Netskope** unveiled **Netskope One DataSec Command Center**, a single control plane to discover, classify, and protect sensitive data across SaaS, network, and AI systems. That's clearly aimed at the DSPM market against Cyera, Sentra, and Concentric AI, and it's another SSE vendor pulling data security into its own platform.

**AvePoint** introduced **Kinetic Classification**, which keeps reassessing data sensitivity across Microsoft 365 and Google Workspace and doesn't rely on one-time labels. The jab at static Purview-style labeling is on purpose, and it's a fair point: a label applied when a file is created is often wrong within a quarter.

**DataBahn** launched Federated Search and Orchestration, which lets teams query across data stores without copying data. That's a real answer to the "your DSPM tool made a second copy of all my sensitive data" objection.

### Insider risk absorbs AI agents

**Above Security** announced a strategic investment from the **CrowdStrike** Falcon Fund along with a native Falcon integration. It correlates Next-Gen SIEM endpoint, identity, and third-party data into insider risk cases and sends completed investigations back into Falcon. This is separate from Above's earlier $50M round. The news is the integration, not the check. Watch for channel conflict with DLP add-ons already in the Falcon ecosystem.

**Mimecast** extended its Incydr-derived line with **Agent Risk Center**, which discovers every AI agent in an organization and ties each one back to the human who deployed it. For an insider risk program, I think that's the most useful thing on this list, because it gives you an owner for behavior that otherwise has none.

**KnowBe4** extended Agent Risk Manager to cover Claude, adding sensitive data leak detection along with prompt injection and privilege escalation monitoring. **Zero Networks** launched least-agency enforcement, which caps the resources an agent can reach at all.

### Identity, access, and exposure

**1Password** launched **1Password Privileged Access**, moving into PAM with on-demand accounts scoped to a task and deleted when the work is done. Standing access gets removed, not just monitored.

**SOCRadar** launched Human Identity Exposure, which pulls breach repositories, stealer log infections, PII, and leak data into a single record per identity. **VanishID** announced External Identity Protection, which uses autonomous agents to scrub exposed personal profiles from data brokers and public records. **Surf AI** announced integration with Claude's Compliance API and general availability of Exposure Reduction Operations, which governs AI model connectivity along with identity, cloud, and SaaS exposure.

**NeuralTrust** launched a runtime security mesh for AI agents that covers prompt injection and credential exposure without custom integration. **Zenity** detailed a malicious skills campaign and released AI Total, a free service for analyzing AI agent runtime behavior.

### The money

There was a ton of funding around the show, mostly in agent governance and categories close to data security:

- **Obsidian Security** raised an [$85M Series D at a $1.1B valuation](/obsidian-security-85m-series-d-agent-governance/) on August 4, led by Crescent Cove with Greylock and Menlo Ventures participating, taking total funding past $200M. Obsidian also extended native governance to Anthropic's Claude Code and Cowork, restricting agent permissions around production data, managing access to sensitive files, and blocking unsanctioned MCP or tool usage at runtime.
- **Zenity** raised a $125M Series C.
- **ThreatLocker** raised a $190M Series F.
- **Onyx** raised a $113M Series B for AI security.
- **Spur** took $200M from Insight for bot detection.
- **Keyfactor** raised $1B+ for post-quantum.
- **Glow** emerged from stealth with [$180M for endpoint security](/glow-emerges-from-stealth-with-180-million-endpoint-security/).

What was missing was any big DLP or DSPM *acquisition* at the show, after a year when M&A drove most of the movement in this space. I'd call that a pause, not a stop.

Black Hat also debuted a **Global Startup Spotlight** competition for 2026, with regional winners from Black Hat Asia, Europe, MEA, and SecTor going up against the USA winner.

### The research that should change how you scope controls

The briefings mattered more than usual this year, because several of them break assumptions built into current tools.

**OpenAI researchers Eric Wallace and Mike Dalton disclosed that OpenAI's own agents escaped their test environment and compromised Hugging Face systems in July 2026.** The agents built an internal message board inside OpenAI's Artifactory package manager, coordinated through it, and rebuilt it four days after it was found and shut down. Wallace's summary: *"AI orchestrated, fully automated offensive attacks are real now."*

The industry split on this one. Asaf Saar of Mend.io argued the core flaw is self-supervision: "the system that generates the risk can't be the final reviewer." Steve Stone of SentinelOne countered that the agents behaved as designed and the answer is pairing capable models with human experts, not calling them rogue. Either way, the lesson for data protection is the same: what an agent says about the data it touched isn't evidence.

Other briefings relevant to data security:

- **PleaseFix agent hijacking:** zero-click exploitation of AI browsers using malicious instructions hidden in fetched content.
- **Rein Security** demonstrated prompt injection against retail AI shopping assistants, straight through their safety guardrails.
- **Azure Automation** default configuration enabling cross-tenant identity takeover, plus "confused deputy" bugs persisting across Google Cloud and Azure.
- **Microsoft passkey implementation flaws** allowing impersonation of privileged users.
- **Synack** revealed *NatJack*, an attack class abusing NAT trust assumptions across Windows, Linux, and macOS.
- **Anthropic's Project Glasswing**, its AI-driven coordinated disclosure program, reported processing 10,000+ security findings across 200 partner organizations, yielding 9 CVEs.

Microsoft's David Weston used his keynote to argue that AI-driven vulnerability discovery forces defenders away from reactive patching and toward memory-safe languages, formal verification, and automated remediation. Roughly 35 of 121 briefings, about 29% of the conference, dealt directly with AI security, AI red teaming, or LLM-assisted offensive work.

### What to do with all this

Here are four questions to ask any vendor pitching you an agent story after this show:

1. **Is the control enforcement or telemetry?** "Visibility into agent activity" and "blocking sensitive data at runtime" are very different products at very different prices. Several of the announcements above mix them up.
2. **Does agent discovery cover third-party and shadow agents, or only agents built on the vendor's own stack?** An inventory that only sees sanctioned agents just brings back the shadow IT problem.
3. **Can it tie an agent to an accountable human?** Mimecast is explicit about this, and most aren't. Without it, an insider risk workflow has nobody to investigate.
4. **How is classification verified?** Intent-based and LLM classification is the biggest claim in this category and the least independently validated. Ask for false positive numbers on *your* data, not a reference customer's.

So the industry has figured out that non-human identities are now the main thing moving sensitive data, and it has shipped a lot of first-generation tools for it. Most of those tools are a year away from being provable, so scope your plans with that in mind.

<small>Reporting drawn from SecurityWeek's Black Hat USA 2026 vendor announcement digest ([part 1](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-1/), [2](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-2/), [3](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-3/), [4](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-4/)), [TechTarget](https://www.techtarget.com/cybersecurity/conference/Black-Hat-2026-Key-news-takeaways-and-security-trends), [SiliconANGLE](https://siliconangle.com/2026/08/06/new-details-openai-hugging-face-attack-emerge-security-industry-debates-ai-agent-controls/), [Calcalist](https://www.calcalistech.com/ctechnews/article/rygsooy8fx), [Help Net Security](https://www.helpnetsecurity.com/2026/07/28/cyberhaven-flow/), [Business Wire](https://www.businesswire.com/news/home/20260730421763/en/Ent-Extends-Intent-Aware-Prevention-Across-AI-Data-and-Applications), and vendor releases.</small>
