---
title: "Strac Launches Claude DLP for Chat, Desktop, Code, and MCP"
slug: "strac-launches-claude-dlp-for-chat-desktop-code-and-mcp"
pubDate: 2026-06-06T12:00:00+00:00
categories: ["News", "data protection", "DLP", "Endpoint DLP", "AI Security"]
excerpt: "Strac released Claude DLP coverage across Claude Chat, Desktop, Code, Cowork, and MCP connectors, adding browser, endpoint, and inline redaction controls for sensitive data before it reaches Claude."
sourceUrl: "https://www.strac.io/blog/claude-dlp"
---

**Strac** published a Claude-focused DLP release covering **Claude Chat**, **Claude Desktop**, **Claude Code**, **Claude Cowork**, and **MCP** connectors. The company says the controls detect sensitive data before it reaches Claude, with block, warn, audit, and inline redaction patterns depending on the surface.

The scope is notable because Claude now spans several different exfiltration paths. Browser DLP may see prompts in claude.ai, but it will not automatically cover a native desktop app, a terminal-based coding agent, or an MCP server pulling data from SaaS tools and databases.

### MCP Makes This More Than Prompt Scanning

Strac's MCP DLP claim is the most interesting part for practitioners. The company says its control sits between Claude and connected data sources, intercepting tool-call responses and redacting sensitive values before the content enters the model context window.

That matters because MCP turns data loss into a machine-to-machine flow. A user can ask an agent to retrieve payroll, customer, or source-code data from a connected system without manually copying it into a prompt. Traditional endpoint or proxy controls may not see that path cleanly unless the DLP layer is inserted into the agent-tool workflow.

### What To Validate

Buyers should test how consistently Strac covers each Claude surface, whether endpoint controls catch Claude Code and Desktop activity without excessive noise, and how MCP redaction handles large documents, images, and structured data. The bigger signal is clear: GenAI DLP is moving from chatbot prompt monitoring toward full coverage of browser, endpoint, developer, and connector workflows.
