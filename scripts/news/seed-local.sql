-- Local-only sample data for previewing /admin/news. NOT applied in prod.
-- Apply with: wrangler d1 execute dlptest-news --local --file=scripts/news/seed-local.sql
INSERT INTO news_candidates
  (slug, title, pub_date, categories, excerpt, source_url, body, why, status, discovered_at)
VALUES
  (
    'acme-dlp-raises-40m-series-b',
    'Acme DLP Raises $40M Series B to Expand Endpoint Coverage',
    '2026-06-17T09:00:00-04:00',
    '["News","DLP","Endpoint DLP","data protection"]',
    'Acme DLP closed a $40M Series B led by Example Ventures to expand its endpoint agent and add GenAI prompt inspection, signaling continued investor appetite for data-loss-prevention startups.',
    'https://www.securityweek.com/acme-dlp-series-b',
    '**Acme DLP** has raised a $40M Series B led by **Example Ventures**, with participation from existing backers.

The round will fund expansion of Acme''s endpoint agent and a new GenAI prompt-inspection capability aimed at catching sensitive data before it reaches third-party LLMs.

### What this means for DLP
For buyers, this is another signal that endpoint-resident DLP is where the money is going.',
    'Vendor funding in core DLP with an endpoint + GenAI angle; clears the bar.',
    'pending',
    '2026-06-18T13:00:00-04:00'
  ),
  (
    'globex-acquires-dspm-vendor-securedata',
    'Globex Acquires DSPM Vendor SecureData in $220M Deal',
    '2026-06-16T11:30:00-04:00',
    '["News","DSPM","Data Security Posture Management"]',
    'Globex will acquire data-security-posture-management startup SecureData for $220M, folding DSPM scanning into its broader data-protection platform.',
    'https://www.calcalistech.com/globex-securedata',
    '**Globex** has agreed to acquire **SecureData**, a data-security-posture-management vendor, for a reported $220M.

The deal continues the wave of DSPM consolidation as platform vendors race to add data discovery and classification to their portfolios.',
    'M&A in the DSPM space buyers are actively evaluating; on-topic.',
    'pending',
    '2026-06-18T13:05:00-04:00'
  );
