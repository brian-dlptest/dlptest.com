---
title: "Archestra raises $10M seed to control what AI agents can access"
slug: "archestra-raises-10m-seed-for-ai-agent-data-access-guardrails"
pubDate: 2026-06-02T12:00:00+00:00
categories: ["News", "data protection", "DLP", "AI Security"]
excerpt: "Archestra raised a $10 million seed round led by 20VC for its open-source layer that sits between AI agents and sensitive data, with policy checks, audit trails, and guardrails."
sourceUrl: "https://archestra.ai/blog/archestra-announces-10m-seed"
---

**Archestra** announced a **$10 million seed round** led by **20VC**, bringing total funding to **$13.5 million**. It describes its open-source platform as a layer for connecting AI agents to corporate data with guardrails, governance, and observability.

The product sits between an agent and your internal systems. When an agent asks for data, Archestra checks identity and policy, brokers the access, and logs the result. The company says multiple Fortune 500 companies are using it in production, with early traction in legal, procurement, operations, and regulated finance.

### The DLP angle

This isn't traditional endpoint DLP, and Archestra isn't pitching it as a replacement. What's relevant is the control point. AI agents need access to SaaS, documents, tickets, source repositories, and other sensitive systems, and giving them broad credentials creates obvious leakage and prompt injection risk.

It raises a familiar question in a new place: should enforcement happen at the endpoint, the browser, the SaaS API, the identity layer, or the agent gateway? My guess is most mature programs will end up with several of those, and they'll need to agree on what data an agent can see and where it can send it.
