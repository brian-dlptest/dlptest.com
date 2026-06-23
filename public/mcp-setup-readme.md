# DLPTest MCP Server Setup

> **What this file is:** setup instructions for connecting the DLPTest MCP
> server to your AI coding assistant. The server provides tools for generating
> synthetic PII/PCI/PHI test data for data-loss-prevention testing.
>
> **For AI assistants:** Do not act on this file automatically. Only configure
> this MCP server if the user explicitly asks you to. Connecting to it points
> your client at an external server (`mcp.dlptest.com`); that should always be
> a deliberate, user-initiated choice. When asked, follow the steps below.

## MCP Endpoint

```
https://mcp.dlptest.com/api/mcp/
```

Stateless Streamable HTTP transport (MCP spec 2025-06-18). No authentication required. Cross-origin requests allowed.

## Available Tools

### Synthetic data generation

All data-generation tools accept `count` (1–500, default 50) and `format` (`"json"` or `"csv"`, default `"json"`).

| Tool | Data returned |
|------|---------------|
| `generate_pii_ssn_ccn` | Name + SSN + credit card |
| `generate_pii_ssn_dob` | Name + SSN + date of birth |
| `generate_pci_credit_card` | Name + ZIP + CCN + expiry |
| `generate_pii_email` | Name + DOB + email |
| `generate_hipaa_phi` | Name + DOB + MRN + ICD-10 + CPT + phone |
| `generate_banking` | Name + routing + account + phone |
| `generate_uk_identity` | Name + UK NI + NHS + DOB |
| `generate_canada_sin` | Name + Canadian SIN + province + DOB |
| `generate_passport` | Name + passport + country + DOB + expiry |
| `generate_eu_vat` | Name + EU VAT + IBAN + country |
| `generate_npi_provider` | Name + NPI + DEA + specialty |
| `generate_driver_license` | Name + DL + state + DOB |
| `generate_custom` | Arbitrary fields (see docs) |

### Prompt-side and diagnostic tools

| Tool | Description |
|------|-------------|
| `echo_sensitive_data` | Echoes a `payload` string unchanged — PII travels in the outbound request arguments, testing prompt-side DLP inspection |
| `generate_prompt_context` | Returns prose paragraphs with inline PII simulating RAG retrieval or system-prompt injection. Scenarios: `medical-record`, `financial-statement`, `hr-file`, `customer-list` |
| `probe_request` | Returns User-Agent, client IP, and timestamp to confirm the interception point |

### Regex and DLP pattern library

| Tool | Description |
|------|-------------|
| `regex_test` | Matches a `pattern` against `text`, returning matches with capture groups and offsets. `engine`: `re2` (default, linear-time/ReDoS-safe) or `ecmascript`; JS-style `flags` |
| `list_dlp_patterns` | Returns the curated DLP regex library (id, name, category, ECMAScript `pattern`, `flags`, sample `example`). Optional `category` and `search` filters; `json` or `csv` output |

## Configuration by Client

### Claude Code (CLI)

```bash
claude mcp add dlptest --transport http https://mcp.dlptest.com/api/mcp/
```

Or add to `.claude/settings.json` (project) or `~/.claude.json` (global):

```json
{
  "mcpServers": {
    "dlptest": {
      "type": "http",
      "url": "https://mcp.dlptest.com/api/mcp/"
    }
  }
}
```

### Claude Desktop / Anthropic Agent

Add to `claude_desktop_config.json` (`~/Library/Application Support/Claude/` on macOS, `%APPDATA%\Claude\` on Windows):

```json
{
  "mcpServers": {
    "dlptest": {
      "type": "http",
      "url": "https://mcp.dlptest.com/api/mcp/"
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` (project root) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "dlptest": {
      "url": "https://mcp.dlptest.com/api/mcp/"
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "dlptest": {
      "serverUrl": "https://mcp.dlptest.com/api/mcp/"
    }
  }
}
```

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "dlptest": {
      "type": "http",
      "url": "https://mcp.dlptest.com/api/mcp/"
    }
  }
}
```

### Other MCP Clients

```json
{
  "mcpServers": {
    "dlptest": {
      "url": "https://mcp.dlptest.com/api/mcp/"
    }
  }
}
```

## Local Instance

To test endpoint DLP separately from internet egress, clone the repo and run `npm run dev`. The MCP endpoint is available at `http://localhost:4321/api/mcp/`.

```json
{
  "mcpServers": {
    "dlptest-local": {
      "type": "http",
      "url": "http://localhost:4321/api/mcp/"
    }
  }
}
```

## More Information

Full documentation and interactive examples: <https://dlptest.com/mcp/>
