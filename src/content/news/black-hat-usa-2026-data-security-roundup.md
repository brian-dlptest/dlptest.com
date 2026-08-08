---
title: "Black Hat USA 2026: what DLP and DSPM buyers need to know"
slug: "black-hat-usa-2026-data-security-roundup"
pubDate: 2026-08-08T12:00:00+00:00
categories: ["News", "data protection", "DLP", "DSPM", "Endpoint DLP", "Insider Risk Management", "Data Security Posture Management"]
excerpt: "A practitioner roundup of the data-security announcements from Black Hat USA 2026 — MIND's AI DLP agents, Cyera's agent runtime controls, Above Security's CrowdStrike backing, Netskope's DataSec Command Center, and more."
sourceUrl: "https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-1/"
---

Black Hat USA 2026 ran its main briefings August 5–6 at Mandalay Bay, and the data-security vendors used the week to make one thing clear: DLP and DSPM roadmaps are now built around agentic AI, not just SaaS and endpoint sprawl. Here's what's relevant if you're evaluating tools in this space.

### DLP vendors leaning into AI agents

**MIND** — the Seattle-based DLP startup covered here at its 2024 stealth launch — unveiled **AI DLP Agents**, which automate classifier creation, access-policy recommendations, data-loss investigation, and remediation suggestions that used to require an analyst. It also shipped a Model Context Protocol interface so security teams can query the platform in natural language. The framing is explicit: generative AI tools are producing and moving more sensitive data than DLP teams can triage manually.

**Cyera** launched **Agent Guardian** and **Cyera Endpoint**, giving enterprises visibility into what AI agents are doing, governing what they can access, and enforcing runtime controls to block sensitive data from leaving through an agent. It's the same acquisitive, fast-moving Cyera that's shown up repeatedly in this feed for funding rounds and tuck-in acquisitions — this is the product-side counterpart to that dealmaking.

**Sweet Security** and **Menlo Security** both shipped variants of the same idea: real-time blocking of secrets, PII, and sensitive data as it tries to leave through an agent. Menlo's is framed as "adaptive DLP" — masking sensitive content for AI assistants and coding agents rather than blocking outright.

### Insider risk and agent discovery

**Above Security** — which raised a $50M round covered here in July — announced a strategic investment from the **CrowdStrike Falcon Fund** plus a platform integration. The pitch: correlate Falcon Next-Gen SIEM telemetry with Above's insider-risk signal to produce investigation-ready cases instead of raw alerts. Worth watching for channel conflict with existing Falcon-ecosystem DLP add-ons.

**Mimecast** extended its Incydr-derived insider-risk line with **Agent Risk Center**, which discovers every AI agent operating in an org and ties each one back to the human who deployed it — a reasonable response to the "who spun this up and why" problem shadow AI creates for insider-risk teams.

### Posture and classification

**Netskope** unveiled **One DataSec Command Center**, pitched as a unified control plane to discover, classify, and protect sensitive data across SaaS, network, and AI systems — direct DSPM-market positioning against Cyera, Concentric AI, and Sentra.

**AvePoint** introduced **Kinetic Classification**, which continuously reassesses data sensitivity in Microsoft 365 and Google Workspace instead of relying on static, one-time labels — a direct jab at legacy Purview-style classification.

### The DLP angle for buyers

The through-line across nearly every announcement: vendors are racing to answer "what happens when an AI agent — not a human — is the one touching sensitive data." If you're scoping DLP or DSPM tooling now, ask vendors specifically how their agent-visibility claims are enforced (runtime blocking vs. logging-after-the-fact) and whether "agent discovery" actually inventories third-party and shadow agents, or only ones built on their own stack.

<small>Sourced from SecurityWeek's [Black Hat USA 2026 vendor announcement digest](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-1/) (parts [1](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-1/), [2](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-2/), [3](https://www.securityweek.com/black-hat-usa-2026-summary-of-vendor-announcements-part-3/)) and [Calcalist's coverage of Israeli cyber vendors at Black Hat](https://www.calcalistech.com/ctechnews/article/rygsooy8fx).</small>
