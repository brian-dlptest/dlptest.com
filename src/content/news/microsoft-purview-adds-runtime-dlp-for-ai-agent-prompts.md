---
title: "Microsoft Purview adds runtime DLP for AI agent prompts in Foundry"
slug: "microsoft-purview-adds-runtime-dlp-for-ai-agent-prompts"
pubDate: 2026-06-03T12:00:00+00:00
categories: ["News", "data protection", "DLP", "DSPM", "AI Security"]
excerpt: "Microsoft is adding Purview controls that inspect, block, and audit sensitive data in AI agent prompts before the model processes them, in apps and agents built on Foundry."
sourceUrl: "https://www.helpnetsecurity.com/2026/06/03/microsoft-ai-agent-security-capabilities/"
---

**Microsoft** is adding **Purview** data protection controls for AI agents, including runtime **DLP** for prompts in **Microsoft Foundry** and visibility into how agents access sensitive data, according to Help Net Security's coverage of the company's latest AI security updates.

DLP policy is moving closer to where the agent runs. Microsoft says the Foundry capability can detect, block, and audit sensitive data before an agent processes a prompt. Purview data risk signals also show up in the **Foundry Control Plane**, so developers get earlier feedback when an app or agent could expose confidential information.

### Why this is more than a governance checklist

A lot of AI security announcements stop at inventory, policy language, or general governance. This one matters for DLP buyers because it takes familiar controls to a new way for data to leave: prompts and tool calls going to AI agents.

If a user or workflow puts customer data, financial records, source code, or other regulated content into an agent prompt, runtime inspection works the way DLP does everywhere else. Detect the sensitive data, decide if the action is allowed, block it if needed, and keep an audit trail.

### What to watch

It comes down to scope and friction. Check which Foundry authentication patterns can be enforced, if controls apply the same way across custom agents and supported first-party agents, how exceptions work, and if audit events land cleanly in your existing Purview investigations.

AI agent data protection is becoming an enforcement problem and not just a discovery or governance problem. Vendors that already own DLP policy workflows have an advantage if they can extend those controls to agents without making developers add a separate set of guardrails.
