"""What `build.py local` writes under the gitignored generated/ folder.

cases.json may point a row at any of these. verify.py checks every generated/ path in
cases.json against this list, because a clean clone has no generated/ folder to look
in, and build.py checks after every local build that each path was written. Paths are
relative to test-data/.
"""
GENERATED_OUTPUTS = [
    "generated/classification/secrets-and-credentials/secrets_live-looking.env",
    "generated/classification/secrets-and-credentials/secrets_obvious-placeholder_negative-ish.env",
    "generated/classification/origin-based-lineage/from_internal-repo/auth_client.py",
    "generated/classification/origin-based-lineage/from_public-github/auth_client.py",
    "generated/policy/git-repo-with-api-key/config.py",
    "generated/policy/git-repo-with-api-key/settlement.py",
    "generated/policy/git-repo-with-api-key/README.md",
    "generated/policy/git-repo-with-api-key/.gitignore",
]
