---
title: "Microsoft Power Platform Advanced Connector Policies Reach GA"
slug: "microsoft-power-platform-advanced-connector-policies-ga"
pubDate: 2026-06-04T12:00:00+00:00
categories: ["News", "data protection", "DLP", "AI Security"]
excerpt: "Microsoft made Power Platform advanced connector policies generally available, replacing classic business/non-business DLP buckets with allowlist controls for connectors, actions, and MCP servers used by apps, flows, and agents."
sourceUrl: "https://www.microsoft.com/en-us/power-platform/blog/2026/06/04/advanced-connector-policies-are-generally-available/"
---

**Microsoft** made **advanced connector policies** generally available for **Power Platform**, giving administrators a simpler control model for apps, flows, and agents than the classic business / non-business / blocked connector buckets used by older DLP policies.

The practical shift is from categorization to allowlisting. Admins can define which connectors and actions are permitted in an environment or environment group, block new connectors by default, and govern **MCP servers** as another path through which agents can reach enterprise data.

### Why DLP Teams Should Care

Power Platform has always created a hard DLP problem: business users can build useful automations quickly, but each connector can become a data-movement path. That gets more important as Copilot and agents make connector use less manual and more autonomous.

Advanced connector policies move enforcement earlier in the build process. Microsoft says makers can get feedback when adding a connector or action, instead of discovering at runtime that an app, flow, or agent violates policy. For large tenants with many personal developer environments, environment-group inheritance also reduces the operational drift that classic DLP scopes can create.

### Important Limitations

This is not a full replacement for every Power Platform DLP scenario yet. Microsoft says classic DLP should still be used alongside ACP where customers need custom connector and endpoint filtering coverage. For practitioners, the near-term value is narrower but meaningful: a cleaner default-deny model for certified connectors, action-level controls, and explicit governance for MCP-connected agent workflows.
