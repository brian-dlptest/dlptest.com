"""Use case B - Intellectual property and source code.

Two outputs here cannot be committed, so they are written to the gitignored generated/
folder at build time instead of files/:

  * the secrets .env pair - credential-shaped strings, which GitHub push protection
    rejects on shape alone, fake or not;
  * the origin-lineage git repositories - a nested .git directory cannot live inside
    this repository.

Every credential-shaped literal in THIS file is assembled from fragments with syn(), for
the same reason.
"""
import json
import os
import random
import re
import shutil
import string
import subprocess

import docgen as dg
import mcp_client as mcp
from docgen import syn

random.seed(20260917)  # fixes the secret-sample variation, so a cached rebuild repeats it

CL = "files/classification"
GEN = "generated/classification"

INTERNAL_REMOTE = "git@git.internal.example.com:platform/auth-service.git"
PUBLIC_REMOTE = "https://github.com/openauth-project/auth-client.git"


def _secret_samples():
    """One realistic, verified sample per credential pattern in dlptest.com's library.

    regex_generate_matches satisfies a pattern at its minimum length, which produces
    regex-valid but obviously fake strings (a JWT of `eyJU.iyr.rZY`). The live-looking
    file has to look live, so: take the longest of 15 samples, and hand-compose the few
    whose realism is structural - each verified against the site's own pattern with
    regex_test before it is written.
    """
    handmade = {
        "jwt": syn("eyJhbGciOiJIUzI1NiIs", "InR5cCI6IkpXVCJ9", ".",
                   "eyJzdWIiOiJzdmMtbGVkZ2VyLXdyaXRlciIsIm5hbWUiOiJTZXR0bGVtZW50IFdvcmtlciIs",
                   "InNjb3BlIjoibGVkZ2VyOndyaXRlIiwiaWF0IjoxNzg4OTE0NDAwLCJleHAiOjE3ODg5MTgwMDB9",
                   ".", "K3qN8wZ2vY7xR4tB1mH6", "cL0pS9dF5gA2jU7nE3oQ8wI"),
        "password-in-url": syn("postgresql://", "svc_ledger", ":", "Hq7-Tn2x", "V9mR4bK8",
                               "@db-primary.internal.example.com:5432/ledger_prod"),
        "ssh-public-key": syn("ssh-", "ed25519 ", "AAAAC3NzaC1lZDI1NTE5AAAAI",
                              "K7vQ2mN8xR4tY6bF1hD9sG0aC5eL8nU3iO7qW2rX4tZ"),
        "bearer-token": syn("Bear", "er ", "eyJhbGciOiJSUzI1NiIsImtpZCI6ImF1dGgtMjAyNi0wOSJ9",
                            ".", "eyJhdWQiOiJzZXR0bGVtZW50Iiwic3ViIjoiYXBpLWdhdGV3YXkifQ",
                            ".", "Nv4rT8kQ2mX7wB1y", "H5cJ0pL9sD6gF3aZ"),
        "basic-auth": syn("Bas", "ic ", "c3ZjX2xlZGdlcl93cml0ZXI6", "SHE3LVRuMnhWOW1SNGJLOA=="),
        "slack-token": syn("xo", "xb-", "2947103856721-2951877640483-",
                           "Wq7Tn2xV9mR4", "bK8jL3pH6dYz"),
        "private-key-pem": syn("-----BEGIN RSA ", "PRIVATE KEY-----"),
    }
    pats = mcp.patterns(category="Credentials / Secrets")
    out = []
    for p in pats:
        if p["id"] in handmade:
            sample = handmade[p["id"]]
        else:
            res = json.loads(mcp.call("regex_generate_matches",
                                      {"pattern": p["pattern"], "count": 15}))
            sample = _vary(p, max(res.get("samples") or [p.get("example", "")], key=len))
        hit = mcp.regex_test(p["pattern"], sample, flags=p.get("flags", "g"),
                             engine="ecmascript")
        assert hit["match_count"] >= 1, "sample misses %s: %r" % (p["id"], sample)
        out.append((p, sample))
    mcp.save("secrets.json",
             json.dumps([{"id": p["id"], "sample": s} for p, s in out], indent=2))
    return out


def _literal_prefix(pattern):
    """The literal characters a pattern starts with: `\\bghp_[A-Za-z0-9]{36}` -> `ghp_`."""
    body = re.sub(r"^(\^|\\b)", "", pattern)
    m = re.match(r"[A-Za-z0-9_-]*", body)
    prefix = m.group(0)
    if prefix and body[len(prefix):len(prefix) + 1] in ("*", "+", "?", "{"):
        prefix = prefix[:-1]   # the last character carries a quantifier
    return prefix


def _vary(p, sample, attempts=8):
    """regex_generate_matches is seeded deterministically, so two patterns with the same
    body class (the GitHub and npm tokens) come back with the same body, and the values
    never change between builds. Re-randomise the tail of the sample - each character
    within its own class, hex staying hex - and keep the variant only if the site's
    pattern still matches it. The pattern's literal prefix (ghp_, AKIA, ...) is kept."""
    keep = len(_literal_prefix(p["pattern"]))
    for _ in range(attempts):
        tail = []
        for c in sample[keep:]:
            if c.isdigit():
                tail.append(random.choice(string.digits))
            elif c in "abcdef":
                tail.append(random.choice("abcdef"))
            elif c in "ABCDEF":
                tail.append(random.choice("ABCDEF"))
            elif c.islower():
                tail.append(random.choice(string.ascii_lowercase))
            elif c.isupper():
                tail.append(random.choice(string.ascii_uppercase))
            else:
                tail.append(c)
        variant = sample[:keep] + "".join(tail)
        hit = mcp.regex_test(p["pattern"], variant, flags=p.get("flags", "g"),
                             engine="ecmascript")
        if hit["match_count"] >= 1:
            return variant
    return sample


ENV_NAMES = {
    "aws-access-key-id": "AWS_ACCESS_KEY_ID", "aws-secret-key": "AWS_SECRET_ACCESS_KEY",
    "github-token": "GITHUB_TOKEN", "github-fine-grained": "GITHUB_PAT",
    "gitlab-pat": "GITLAB_TOKEN", "slack-token": "SLACK_BOT_TOKEN",
    "google-api-key": "GOOGLE_MAPS_API_KEY", "stripe-secret-key": "STRIPE_SECRET_KEY",
    "openai-key": "OPENAI_API_KEY", "twilio-account-sid": "TWILIO_ACCOUNT_SID",
    "npm-token": "NPM_TOKEN", "jwt": "SERVICE_JWT", "generic-api-key": "INTERNAL_SERVICE_KEY",
}


def build_secrets():
    """Writes to generated/ - see the module docstring."""
    pairs = _secret_samples()
    by_id = {p["id"]: s for p, s in pairs}
    d = f"{GEN}/secrets-and-credentials"

    lines = ["# service-api / .env.production",
             "# DO NOT COMMIT. Synthetic values generated from the dlptest.com DLP pattern",
             "# library, so each one is known to match its published regex.", ""]
    lines += ["%s=%s" % (ENV_NAMES[p["id"]], s) for p, s in pairs if p["id"] in ENV_NAMES]
    lines += ["", "# Connection strings",
              "DATABASE_URL=%s" % by_id["password-in-url"],
              "REDIS_URL=" + syn("redis://", "cache-admin:", "Hv3rT9xQ", "m2Lp",
                                 "@redis.internal.example.com:6379/0"),
              "", "# Authorization headers captured from a working request",
              "AUTH_HEADER=%s" % by_id["bearer-token"],
              "LEGACY_AUTH_HEADER=%s" % by_id["basic-auth"],
              "", "# Deploy key",
              "DEPLOY_PUBLIC_KEY=%s deploy@build-runner" % by_id["ssh-public-key"], "",
              by_id["private-key-pem"],
              syn("MIIEowIBAAKCAQEAwJ3kQ8mN", "2pR7vT4xY6bF1hD9sG0aC5eL8nU3iO7qW2rX4tZ5"),
              syn("yV6mB1cH8jK0lP9dS2fA7gN4", "uE6oQ3wR5tY8xZ1vC0bM7nJ4kL2hG9fD6sA3pQ8w"),
              syn("-----END RSA ", "PRIVATE KEY-----")]
    dg.write_text(f"{d}/secrets_live-looking.env", "\n".join(lines))

    placeholder = [
        "# .env.example", "# Template checked into the repo. Every value is a placeholder.",
        "", "AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID_HERE",
        "AWS_SECRET_ACCESS_KEY=<your-secret-access-key>",
        "GITHUB_TOKEN=" + syn("gh", "p_") + "x" * 36,
        "STRIPE_SECRET_KEY=" + syn("sk", "_test_") + "REPLACE_ME",
        "OPENAI_API_KEY=" + syn("sk", "-") + "CHANGEME",
        "DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/dbname",
        "SLACK_BOT_TOKEN=" + syn("xo", "xb-") + "000000000000-000000000000-REPLACE",
        "GOOGLE_MAPS_API_KEY=" + syn("AI", "za") + "YOUR_GOOGLE_API_KEY",
        "TWILIO_ACCOUNT_SID=" + syn("A", "C") + "x" * 32,
        "SERVICE_JWT=<paste-a-service-jwt-here>",
        "AUTH_HEADER=Bearer <token>"]
    dg.write_text(f"{d}/secrets_obvious-placeholder_negative-ish.env", "\n".join(placeholder))
    return pairs


def write_secrets_readme():
    """The committed README for the secrets row. Separate from build_secrets() so that
    `build.py local` never rewrites a tracked file."""
    dg.write_text(f"{CL}/secrets-and-credentials/README.txt", """Secrets and credentials in code

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
""")


# --------------------------------------------------------------------------- B02
AUTH_CLIENT = '''"""OAuth2 client credentials helper."""
import base64
import os
import time
from typing import Optional

import requests

TOKEN_URL = os.environ.get("OAUTH_TOKEN_URL", "https://auth.example.com/oauth2/token")
DEFAULT_SCOPE = "read write"
_CACHE: dict = {}


class TokenError(RuntimeError):
    """Raised when the authorization server rejects the credential exchange."""


def _basic(client_id: str, client_secret: str) -> str:
    raw = f"{client_id}:{client_secret}".encode()
    return "Basic " + base64.b64encode(raw).decode()


def fetch_token(client_id: str, client_secret: str,
                scope: Optional[str] = None) -> str:
    """Exchange client credentials for a bearer token, caching until expiry."""
    scope = scope or DEFAULT_SCOPE
    key = (client_id, scope)
    cached = _CACHE.get(key)
    if cached and cached["expires_at"] > time.time() + 30:
        return cached["access_token"]

    response = requests.post(
        TOKEN_URL,
        data={"grant_type": "client_credentials", "scope": scope},
        headers={"Authorization": _basic(client_id, client_secret)},
        timeout=10,
    )
    if response.status_code != 200:
        raise TokenError(f"token exchange failed: {response.status_code}")

    payload = response.json()
    payload["expires_at"] = time.time() + payload.get("expires_in", 3600)
    _CACHE[key] = payload
    return payload["access_token"]


def invalidate(client_id: str, scope: Optional[str] = None) -> None:
    """Drop a cached token so the next call re-authenticates."""
    _CACHE.pop((client_id, scope or DEFAULT_SCOPE), None)
'''

def _git_repo(folder, remote, filename, content, commit_msg):
    root = dg.path(folder, ".keep")
    root = os.path.dirname(root)
    if os.path.isdir(os.path.join(root, ".git")):
        shutil.rmtree(os.path.join(root, ".git"))
    with open(os.path.join(root, filename), "w") as fh:
        fh.write(content)
    env = dict(os.environ, GIT_AUTHOR_NAME="DLP Test Library",
               GIT_AUTHOR_EMAIL="library@dlptest.invalid",
               GIT_COMMITTER_NAME="DLP Test Library",
               GIT_COMMITTER_EMAIL="library@dlptest.invalid")
    run = lambda *a: subprocess.run(a, cwd=root, check=True, env=env,
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    run("git", "init", "-q", "-b", "main")
    run("git", "remote", "add", "origin", remote)
    run("git", "add", "-A")
    run("git", "-c", "commit.gpgsign=false", "commit", "-q", "-m", commit_msg)
    return os.path.join(root, filename)


def build_lineage():
    """Writes git repositories to generated/ - see the module docstring.

    The two files are byte-identical; only the repository they sit in differs. Any
    content difference would let a classifier with no lineage capability rank the
    internal copy higher and pass the test for the wrong reason."""
    d = f"{GEN}/origin-based-lineage"
    _git_repo(f"{d}/from_internal-repo", INTERNAL_REMOTE, "auth_client.py", AUTH_CLIENT,
              "platform: cache client-credential tokens until expiry")
    _git_repo(f"{d}/from_public-github", PUBLIC_REMOTE, "auth_client.py", AUTH_CLIENT,
              "cache client-credential tokens until expiry")


def write_lineage_readme():
    dg.write_text(f"{CL}/origin-based-lineage/README.txt",
                  "Origin-based sensitivity (data lineage)\n\n"
                  "Two byte-identical files. Only the origin differs.\n\n"
                  "  from_internal-repo/auth_client.py   origin %s\n"
                  "  from_public-github/auth_client.py   origin %s\n\n"
                  "Both are REAL git repositories with the remote already set, so a\n"
                  "lineage-aware agent has something to read. A nested .git cannot be\n"
                  "committed, so they are built locally into\n"
                  "test-data/generated/classification/origin-based-lineage/ by\n"
                  "    python3 scripts/dlp-test-plan/test-data/tools/build.py local\n\n"
                  "Pass = the internal-origin file is classified higher, or is the only one\n"
                  "blocked. Identical treatment means the tool has no lineage. The content\n"
                  "is identical, so a content classifier cannot produce a difference.\n"
                  % (INTERNAL_REMOTE, PUBLIC_REMOTE))


def build_obfuscation_chain(internal_source=AUTH_CLIENT):
    d = f"{CL}/lineage-obfuscation-chain"
    dg.write_text(f"{d}/step0_original_from-internal-repo.py", internal_source)
    dg.write_text(f"{d}/step1_renamed_quarterly-notes.py", internal_source)
    dg.write_text(f"{d}/step2_extension-changed.dat", internal_source)
    src = dg.path(d, "step2_extension-changed.dat")
    dg.make_zip(f"{d}/step3_zipped.zip", [("quarterly-notes.dat", src)])
    # The "obfuscation chained into one story" investigation row asks for the zip to be
    # password-protected; the lineage row asks only for a zip. Ship both.
    dg.make_zip(f"{d}/step3b_zipped-password-protected.zip", [("quarterly-notes.dat", src)],
                password="TestPassword123")
    dg.write_text(f"{d}/step4_contents-copied-into-new-blank-file.py", internal_source)
    section = "\n".join(internal_source.splitlines()[20:46])
    dg.write_text(f"{d}/step5_pasted-section-into-chat-app.txt",
                  "hey - can you take a look at this, the token cache is misbehaving\n\n"
                  + section + "\n")
    dg.write_text(f"{d}/README.txt",
                  "Lineage survival through obfuscation\n\n"
                  "Run these IN ORDER, attempting egress after each step, and write down the\n"
                  "FIRST step where the trace is lost.\n\n"
                  "  step0  the original, straight from the internal repo\n"
                  "  step1  renamed to something innocuous\n"
                  "  step2  extension changed to .dat\n"
                  "  step3  zipped\n"
                  "  step3b the same, password-protected (TestPassword123) - the variant the\n"
                  "         'obfuscation chained into one story' investigation row asks for\n"
                  "  step4  contents copied into a new blank file (new inode, no history)\n"
                  "  step5  one section pasted into a chat app\n\n"
                  "Steps 4 and 5 are where most tools lose the thread: there is no file to\n"
                  "track any more, only content that was once somewhere else.\n")


# --------------------------------------------------------------------------- B04
CODENAMES = [
    ("Cobaltine", "Project", "Pre-announcement payments platform"),
    ("Halberd", "Project", "Datacentre consolidation programme"),
    ("Kingfisher", "Project", "EMEA acquisition workstream"),
    ("Saltmarsh", "Project", "Core ledger re-platform"),
    ("Thornbury", "Project", "Q4 restructuring plan"),
    ("Ravenglass", "Project", "Competitor displacement campaign"),
    ("Pennyroyal", "Project", "Pricing model overhaul"),
    ("Blackthorn", "Project", "Security incident response retainer"),
    ("Windlass", "Project", "Supply chain renegotiation"),
    ("Marchmont", "Project", "Board succession planning"),
    ("Quillon", "Programme", "Next-generation risk engine"),
    ("Silverbeck", "Programme", "Customer data unification"),
    ("Ferrograde", "Codename", "Unreleased hardware revision"),
    ("Ombersley", "Codename", "Legal settlement workstream"),
    ("Nettlebed", "Codename", "Workforce reduction modelling"),
    ("Cindermoor", "Codename", "Divestiture of the logistics arm"),
    ("Aldermist", "Codename", "Undisclosed partnership discussions"),
    ("Bramblewick", "Codename", "Patent portfolio consolidation"),
    ("Verrocchio", "Codename", "Executive compensation review"),
    ("Mercury", "Codename", "AMBIGUOUS - also the planet, the element, the car marque, "
                            "Freddie Mercury, and Mercury Insurance"),
]


def build_codenames():
    d = f"{CL}/project-codenames"
    dg.write_csv(f"{d}/project-codename-dictionary_20-terms.csv",
                 ["term", "type", "what_it_refers_to"],
                 [[t, k, w] for t, k, w in CODENAMES])
    dg.write_docx(
        f"{d}/sample_doc_using_codenames.docx",
        "Programme Status - Confidential",
        [("b", "Restricted. Internal codenames throughout."),
         "Cobaltine remains on track for the January window; Saltmarsh has slipped two "
         "sprints and is now gating Quillon. Halberd closed under budget.",
         "Kingfisher diligence is complete and Marchmont has been briefed. Thornbury "
         "modelling is with Legal alongside Ombersley and Nettlebed.",
         "Pennyroyal pricing has been socialised with the Ravenglass campaign team. "
         "Silverbeck and Ferrograde both need a decision before the Windlass "
         "renegotiation opens.",
         "Blackthorn retainer renews in March. Cindermoor, Aldermist, Bramblewick and "
         "Verrocchio are all tracking to plan.",
         ("h", "Mercury"),
         "Mercury is the only term in the dictionary with an everyday meaning. It appears "
         "here as a genuine internal reference and should match.",
         ])
    dg.write_docx(
        f"{d}/mercury_false-positive-control.docx",
        "Facilities Bulletin - Thermometer Disposal",
        ["A reminder that mercury thermometers may not be placed in general waste. "
         "Mercury is a heavy metal and the site licence requires separate collection.",
         "Unrelated: the Mercury Insurance renewal quote arrived this week, and the "
         "planet Mercury will be visible before dawn for most of next month. The Ford "
         "Mercury in bay 14 has been reported abandoned.",
         "None of the above is a reference to the internal programme of that name. A "
         "dictionary that cannot disambiguate by context will flag every line here."])
    dg.write_text(
        f"{d}/README.txt",
        "Project codenames and trade-secret terms\n\n"
        "project-codename-dictionary_20-terms.csv  load this as a dictionary/keyword list\n"
        "sample_doc_using_codenames.docx           uses 19 unambiguous terms + Mercury\n"
        "mercury_false-positive-control.docx       Mercury five times, never the programme\n\n"
        "Time the create -> deploy -> tune loop; the plan expects minutes.\n"
        "Pass = the dictionary supports weighting AND the ambiguous term can be\n"
        "disambiguated by context rather than removed from the list.\n")


def run_local():
    """generated/ only: the secrets .env pair and the lineage repositories."""
    build_secrets()
    build_lineage()


def run():
    run_local()
    write_secrets_readme()
    write_lineage_readme()
    build_obfuscation_chain()
    build_codenames()
