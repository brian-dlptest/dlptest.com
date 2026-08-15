---
title: "Hush Security Raises $30M Series A to Govern AI Agent Identities, With Akamai Investing"
slug: "hush-security-raises-30-million-for-ai-agent-governance"
pubDate: 2026-07-28T12:00:00+00:00
categories: ["News", "data protection", "Insider Risk Management", "DSPM", "AI agent security"]
excerpt: "Hush Security closed a $30M Series A with Akamai joining as a strategic investor, betting that AI agents need real identity governance — enrollment, scoped just-in-time permissions, and a kill switch — rather than the long-lived API keys most enterprises hand them today."
sourceUrl: "https://www.securityweek.com/hush-security-raises-30-million-for-ai-agent-governance/"
---

**Hush Security** raised a $30 million Series A on July 28, bringing total funding to $41 million less than a year after leaving stealth. **Akamai Technologies** joined as a strategic investor alongside existing backers **Battery Ventures** and **YL Ventures** — the same firm that seeded [MIND](/a-new-stealth-dlp-vendor-emerges-mind/), which suggests a deliberate thesis about where data protection is heading rather than a one-off bet.

The Tel Aviv company was founded in 2024 by Alon Horowitz, Micha Rave, Chen Nisnkorn, and Shmulik Ladkani — the team behind Meta Networks, acquired by **Proofpoint** in 2019. That lineage is worth noting: this is a founding team that has already sold infrastructure into a DLP vendor once.

### Standing credentials are the actual problem

Hush's pitch is that enterprises are handing autonomous software the weakest form of identity they have. An AI agent typically gets a long-lived API key, uses it indefinitely, and leaves behind logs that show the key acted — not who deployed it, what it was scoped to, or whether it should still work today.

The platform enrolls agents in a central registry, strips standing credentials in favor of scoped just-in-time permissions, logs every action, and provides a centralized kill switch. CEO Micha Rave frames it as: *"AI agents need strict identity, not just API keys. We solved that for non-human identities, and now we're extending governance to AI agents."*

Akamai's Ramanath Iyer was blunter about why a CDN and security company would invest strategically here — identity is *"the piece most companies haven't solved yet."* **Kyndryl**, the world's largest IT infrastructure services provider, is a named customer, with Adeel Saeed calling identity *"the ultimate control point for the modern agentic workforce."*

### Why this matters for a DLP program

The market context vendors keep citing: Omdia research puts **96% of organizations** running AI agents on governance models that were not built for them, and Gartner projects the average Fortune 500 company will run **more than 150,000 AI agents by 2028**, up from fewer than 15 last year. Treat those as directional — the second figure in particular depends heavily on what counts as an "agent" — but the direction is not seriously disputed.

For data-protection teams, the practical read is that agent identity governance and DLP are converging on the same question from opposite ends. DLP asks *what data left and who moved it.* Agent governance asks *what is this non-human actor allowed to touch, and for how long.* When the mover is an over-permissioned service account with a two-year-old key, the DLP alert has no useful subject — you get an exfiltration event attributed to a credential rather than a person or a purpose.

This is the same gap **Mimecast** targeted at Black Hat by tying every discovered agent back to the human who deployed it, and the one **Obsidian Security** raised [$85M at a $1.1B valuation](/obsidian-security-85m-series-d-agent-governance/) to close inside SaaS environments. Three vendors, three angles, one missing primitive — see our [Black Hat USA 2026 roundup](/black-hat-usa-2026-data-security-roundup/) for the wider picture.

The buyer question is whether this stays a standalone category or gets absorbed. Identity governance for non-human actors is exactly the kind of capability that IAM incumbents and data security platforms both have reason to own, and Akamai taking a strategic position rather than a purely financial one is a reasonable hint about how that plays out.
