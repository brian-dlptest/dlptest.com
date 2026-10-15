#!/usr/bin/env python3
"""Build the test data from the DLPTest MCP server (https://mcp.dlptest.com/api/mcp/).

    python3 build.py local                       # after a clone: generated/ only
    python3 build.py refresh STAGE [STAGE ...]   # rewrite committed payloads
    python3 build.py refresh all [--refetch]

`local` writes only the gitignored ../generated/ folder: the credential-shaped files and
the nested git repositories that cannot be committed. It never touches a tracked file,
so it is the one command to run after a fresh clone.

`refresh` regenerates the committed payloads under ../files/ for the named stages. It is
a deliberate act: the result is a diff to review and commit, and VALIDATION.md has to be
regenerated with validate.py afterwards. Refresh only the stages whose generator changed.

MCP responses are cached under generated/mcp-cache/ (see mcp_client.py), so a refresh
replays the values the last build used. `--refetch` ignores the cache and pulls new
random values, which rewrites every payload in those stages.
"""
import sys
import time

sys.dont_write_bytecode = True

import mcp_client as mcp  # noqa: E402

# Order matters: archives wrap the SSN .docx from `regulatory`, and `shared` reads the
# credential samples written by `ip`.
STAGES = ["regulatory", "msa", "ip", "finance", "exports", "shared"]
# Stages with outputs under generated/. Each module's run_local() writes only those.
LOCAL_STAGES = ["ip", "shared"]

USAGE = __doc__.split("\n\n")[1]


def _run(stages, entry):
    for stage in stages:
        start = time.time()
        print("==> %s %s" % (entry, stage), flush=True)
        getattr(__import__("gen_" + stage), entry)()
        print("    done in %.1fs" % (time.time() - start), flush=True)
    print("MCP calls: %(network)d network, %(cache)d from cache" % mcp.CALLS)


def _check_outputs():
    """Every path cases.json may cite under generated/ must exist after a local build."""
    import os
    from outputs import GENERATED_OUTPUTS
    missing = [p for p in GENERATED_OUTPUTS if not os.path.isfile(os.path.join(mcp.TEST_DATA, p))]
    if missing:
        sys.exit("build.py local did not write: %s" % ", ".join(missing))
    print("generated/: all %d outputs in outputs.py present" % len(GENERATED_OUTPUTS))


def main(argv):
    if "--refetch" in argv:
        mcp.REFETCH = True
        argv = [a for a in argv if a != "--refetch"]
    if not argv or argv[0] not in ("local", "refresh"):
        sys.exit(USAGE)
    command, names = argv[0], argv[1:]
    if command == "local":
        if names:
            sys.exit("`local` takes no stage names; it builds generated/ for %s"
                     % ", ".join(LOCAL_STAGES))
        _run(LOCAL_STAGES, "run_local")
        _check_outputs()
        return
    if names == ["all"]:
        names = STAGES
    unknown = [s for s in names if s not in STAGES]
    if not names or unknown:
        sys.exit("refresh needs stage names or `all` (choose from %s)%s"
                 % (", ".join(STAGES), "; unknown: " + ", ".join(unknown) if unknown else ""))
    stages = [s for s in STAGES if s in names]
    _run(stages, "run")
    if set(LOCAL_STAGES) <= set(stages):
        _check_outputs()


if __name__ == "__main__":
    main(sys.argv[1:])
