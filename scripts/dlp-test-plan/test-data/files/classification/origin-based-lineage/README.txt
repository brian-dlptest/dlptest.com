Origin-based sensitivity (data lineage)

Two near-identical files. The code is the same; only the origin differs.

  from_internal-repo/auth_client.py   origin git@git.internal.example.com:platform/auth-service.git
  from_public-github/auth_client.py   origin https://github.com/openauth-project/auth-client.git

Both are REAL git repositories with the remote already set, so a
lineage-aware agent has something to read. A nested .git cannot be
committed, so they are built locally into
test-data/generated/classification/origin-based-lineage/ by
    python3 scripts/dlp-test-plan/test-data/tools/build.py ip

Pass = the internal-origin file is classified higher, or is the only one
blocked. Identical treatment means the tool has no lineage.
