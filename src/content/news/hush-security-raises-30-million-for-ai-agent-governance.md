---
title: "Hush Security raises $30M Series A with Akamai investing"
slug: "hush-security-raises-30-million-for-ai-agent-governance"
pubDate: 2026-07-28T12:00:00+00:00
categories: ["News", "data protection", "Insider Risk Management", "DSPM", "AI agent security"]
excerpt: "Hush Security closed a $30M Series A with Akamai joining as a strategic investor. It's betting AI agents need real identity governance: enrollment, scoped just-in-time permissions, and a kill switch, not long-lived API keys."
sourceUrl: "https://www.securityweek.com/hush-security-raises-30-million-for-ai-agent-governance/"
---

**Hush Security** raised a $30 million Series A on July 28, bringing total funding to $41 million less than a year after leaving stealth. **Akamai Technologies** joined as a strategic investor along with existing backers **Battery Ventures** and **YL Ventures**, the same firm that seeded [MIND](/a-new-stealth-dlp-vendor-emerges-mind/).

The Tel Aviv company was founded in 2024 by Alon Horowitz, Micha Rave, Chen Nisnkorn, and Shmulik Ladkani, the team behind Meta Networks, which **Proofpoint** acquired in 2019. So this team has already sold infrastructure to a DLP vendor once.

### Standing credentials are the problem

Hush says enterprises are giving autonomous software the weakest form of identity they have. An AI agent typically gets a long-lived API key, uses it indefinitely, and leaves logs that show the key acted. They don't show who deployed it, what it was scoped to, or if it should still work today.

The platform enrolls agents in a central registry, replaces standing credentials with scoped just-in-time permissions, logs every action, and gives you a central kill switch. CEO Micha Rave said: *"AI agents need strict identity, not just API keys. We solved that for non-human identities, and now we're extending governance to AI agents."*

Akamai's Ramanath Iyer was blunter about why a CDN and security company would invest here. Identity is *"the piece most companies haven't solved yet."* **Kyndryl**, the world's largest IT infrastructure services provider, is a named customer, with Adeel Saeed calling identity *"the ultimate control point for the modern agentic workforce."*

### Why this matters for a DLP program

Vendors keep citing two numbers. Omdia research says **96% of organizations** run AI agents on governance models that weren't built for them. Gartner projects the average Fortune 500 company will run **more than 150,000 AI agents by 2028**, up from fewer than 15 last year. The second number depends a lot on what counts as an "agent," but the direction seems right.

Agent identity governance and DLP are coming at the same question from opposite ends. DLP asks *what data left and who moved it.* Agent governance asks *what is this non-human actor allowed to touch, and for how long.* When an over-permissioned service account with a two-year-old key moves the data, the DLP alert isn't much help. You get an exfiltration event tied to a credential, not a person or a purpose.

**Mimecast** targeted the same gap at Black Hat by tying every discovered agent back to the human who deployed it, and **Obsidian Security** raised [$85M at a $1.1B valuation](/obsidian-security-85m-series-d-agent-governance/) to close it inside SaaS. That's three vendors coming at it from three angles. See the [Black Hat USA 2026 roundup](/black-hat-usa-2026-data-security-roundup/) for the bigger picture.

Does this stay its own category or get absorbed? IAM vendors and data security platforms both have a reason to own it, and Akamai taking a strategic stake may be a hint about where it goes.
