# Data Security News — editorial bar (dlptest.com)

Posts in `src/content/news/` are **practitioner notes for DLP/DSPM buyers**, not a general cybersecurity blog. Match the tone and topic mix of existing posts (funding, M&A, DLP/DSPM/insider-risk vendors, product direction).

## Publish these (priority)

- **Funding** and **valuations** for DLP, DSPM, insider risk, CASB/SSE data security, DDR, AI data security vendors
- **Acquisitions** and **M&A** in the same space (e.g. Cyera/Trail, Proofpoint/Normalyze)
- **Product launches** that change DLP, endpoint DLP, email/web DLP, or GenAI data controls
- **Stealth / launch** of vendors clearly in data loss prevention or data security platforms
- Reputable trade press (**Calcalist**, **SecurityWeek**, **Help Net Security**, vendor PR) with a clear security-vendor angle

## Usually skip (unless extraordinary)

- Generic **data governance** or **data virtualization** without a DLP/DSPM/insider-risk vendor as the subject
- **Survey / talent / readiness** reports (Linux Foundation, analyst “state of” pieces)
- **Academic research** (LLM backdoors, novel attacks) with no vendor product or enterprise DLP tie-in
- **Compliance-only** news (IRAP, FedRAMP, regional cloud attestations) unless tied to a major data-security platform buyers evaluate for DLP/DSPM
- **Hyperscaler + partner integration** posts (e.g. “vendor X integrates with AWS SageMaker”) that are not a security-product story

## Style

- Frontmatter per `src/content.config.ts`: `title`, `slug`, `pubDate` (ISO with offset), `categories`, `excerpt` (~200–280 chars), `sourceUrl` (**canonical external URL**, not dlptest.com)
- Categories: always include **`News`** plus lowercase topical tags used elsewhere: `data protection`, `DLP`, `DSPM`, `Endpoint DLP`, `Insider Risk Management`, `Data Security Posture Management`, etc.
- Body: short synthesis; **bold** company names on first mention; optional `###` subheads; no press-release paste
- Voice: informed practitioner (see `cyera-is-acquiring-trail-security`, `orion-security-raises-32-million-series-a-autonomous-dlp`) — may ask what a deal means for DLP channels
- **One story per file**; slug is kebab-case matching filename

## Examples

| Good | Poor fit (PR #12-style) |
|------|-------------------------|
| Cyera acquires Genie Security ($50M, endpoint DLP) | Denodo AWS agentic data integrations |
| Orion $32M Series A autonomous DLP | Linux Foundation AI security readiness survey |
| Proofpoint acquires Normalyze | MetaBackdoor LLM research paper |
| Cyberhaven Series D at $1B | Snowflake IRAP assessment in Melbourne |

## When nothing qualifies

Do **not** commit filler. Reply that no stories met the bar.
