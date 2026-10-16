Secrets and credentials in code

The two payloads for this row are NOT committed. GitHub push protection rejects
credential-shaped strings on shape alone, so they are built locally:

    python3 scripts/dlp-test-plan/test-data/tools/build.py local

and land in test-data/generated/classification/secrets-and-credentials/:

secrets_live-looking.env
  One value for each credential pattern in dlptest.com's library, generated through the
  MCP server's regex_generate_matches so each provably matches its published regex.
  Score per secret TYPE, not per file.

secrets_obvious-placeholder_negative-ish.env
  The same variables filled with YOUR_KEY_HERE / xxxxx / REPLACE_ME / <token>. Record
  in Notes whether the tool scores these lower than the live-looking file. Three
  placeholders still satisfy a published pattern's shape, which is why the file is
  "negative-ish" - it is the entropy test rather than a clean negative:
    GITHUB_TOKEN     ghp_ followed by 36 x's           matches github-token
    SLACK_BOT_TOKEN  xoxb-000000000000-...-REPLACE     matches slack-token
    DATABASE_URL     postgresql://USER:PASSWORD@...    matches password-in-url
  A hit on any other line is a false positive.
