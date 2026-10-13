#!/usr/bin/env python3
"""Build the test data from the DLPTest MCP server (https://mcp.dlptest.com/api/mcp/).

    python3 build.py                 # every stage
    python3 build.py ip shared       # only the named stages

Committed payloads are written under ../files/. Credential-shaped files and nested git
repositories are written under ../generated/, which is gitignored - run `build.py ip
shared` after a fresh clone to materialise them.

The MCP server returns fresh random data on every call, so a full rebuild produces a
different set of values with the same shape. Run validate.py afterwards; it rewrites
../VALIDATION.md.
"""
import sys
import time

sys.dont_write_bytecode = True

# Order matters: archives wrap the SSN .docx from `regulatory`, and `shared` reads the
# credential samples written by `ip`.
STAGES = ["regulatory", "msa", "ip", "finance", "exports", "shared"]


def main(argv):
    unknown = [s for s in argv if s not in STAGES]
    if unknown:
        sys.exit("unknown stage(s): %s (choose from %s)" % (", ".join(unknown), ", ".join(STAGES)))
    for stage in [s for s in STAGES if not argv or s in argv]:
        start = time.time()
        print("==> %s" % stage, flush=True)
        module = __import__("gen_" + stage)
        module.run()
        print("    done in %.1fs" % (time.time() - start), flush=True)


if __name__ == "__main__":
    main(sys.argv[1:])
