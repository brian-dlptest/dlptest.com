---
title: "Microsoft Purview Adds Runtime DLP for AI Agent Prompts in Foundry"
slug: "microsoft-purview-adds-runtime-dlp-for-ai-agent-prompts"
pubDate: 2026-06-03T12:00:00+00:00
categories: ["News", "data protection", "DLP", "DSPM", "AI Security"]
excerpt: "Microsoft is adding Purview controls that inspect, block, and audit sensitive data in AI agent prompts before model processing, extending familiar DLP workflows into Foundry-built apps and agents."
sourceUrl: "https://www.helpnetsecurity.com/2026/06/03/microsoft-ai-agent-security-capabilities/"
---

**Microsoft** is adding **Purview** data protection controls for AI agents, including runtime **DLP** for prompts in **Microsoft Foundry** and visibility into how agents access sensitive data, according to Help Net Security's coverage of the company's latest AI security updates.

The practical change for data-security teams is that DLP policy is moving closer to the agent execution path. Microsoft says the Foundry capability can detect, block, and audit sensitive data before a prompt is processed by an agent. Purview data-risk signals are also being surfaced in the **Foundry Control Plane**, giving developers earlier feedback when an app or agent could expose confidential information.

### Why This Is Different From AI Governance Checklists

Many AI security announcements stop at inventory, policy language, or general governance posture. This one is more relevant to DLP buyers because it extends familiar controls into a new exfiltration path: prompts and tool calls submitted to AI agents.

If a user or workflow places customer data, financial records, source code, or other regulated content into an agent prompt, runtime inspection can apply the same basic control pattern security teams already use elsewhere: detect sensitive information, decide whether the action is allowed, block when required, and preserve an audit trail for investigation.

### What To Watch

The key implementation details will be scope and friction. Teams should verify which Foundry authentication patterns are enforceable, whether controls apply uniformly across custom agents and supported first-party agents, how exceptions are handled, and whether audit events land cleanly in existing Purview investigations.

For DLP practitioners, the bigger signal is clear: AI-agent data protection is becoming an enforcement problem, not just a discovery or governance problem. Vendors that already own DLP policy workflows have an advantage if they can project those controls into agentic applications without forcing developers to bolt on separate guardrail stacks.
