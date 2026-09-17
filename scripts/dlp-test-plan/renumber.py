#!/usr/bin/env python3
"""Canonical ID renumbering. Run after every content edit, BEFORE build.py.

Rewrites every ID so it is sequential within its section, then rewrites every
cross-reference in the content modules and in build.py to match. Fails loudly if
any reference points at a row that no longer exists.

  C-<A|B|C|D>NN   Classification, by use case
  P-<G|M|C|B|P|N>NN  Policy, by channel category
  E-NN            Enforcement
  I-NN            Investigations
  U-NN            Usability
"""
import os, re, sys, json, shutil, pathlib, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import content_class, content_policy, content_xp, content_use

FILES = ["content_class.py", "content_policy.py", "content_xp.py", "content_use.py", "build.py"]
ID_RE = re.compile(r"\b(?:C|P|X|E|I|U)-[A-Z]?\d{2}[a-z]?\b")

def build_map():
    """Map old base ID -> new base ID. Policy rows carry a ".<OS>" suffix; the suffix is
    never renumbered, so several rows share one base and the base advances only once."""
    m, seen = {}, set()
    counters = {}
    for row in content_class.CLASSIFICATION:
        sec = row[1].split(".")[0].strip()
        counters[sec] = counters.get(sec, 0) + 1
        m[row[0]] = f"C-{sec}{counters[sec]:02d}"
    CATLET = {"GenAI":"G", "Webmail":"M", "Cloud":"C", "Browsers":"B",
              "Physical":"P", "Network":"N"}
    counters = {}
    for row in content_policy.POLICY:
        base = row[0].split(".")[0]
        if base in m:
            continue                      # already numbered by an earlier OS row
        sec = CATLET[row[1].split()[0].rstrip("&")]
        counters[sec] = counters.get(sec, 0) + 1
        m[base] = f"P-{sec}{counters[sec]:02d}"
    for i, row in enumerate(content_xp.XPOLICY, 1):        m[row[0]] = f"E-{i:02d}"
    for i, row in enumerate(content_xp.INVESTIGATIONS, 1): m[row[0]] = f"I-{i:02d}"
    for i, row in enumerate(content_use.USABILITY, 1):     m[row[0]] = f"U-{i:02d}"
    dupes = [v for v in m.values() if v in seen or seen.add(v)]
    assert not dupes, f"duplicate new IDs: {dupes}"
    return m

def main():
    m = build_map()
    live_old = set(m)
    # every reference in every file must resolve
    dangling = {}
    for f in FILES:
        for ref in set(ID_RE.findall((pathlib.Path(HERE) / f).read_text())):
            if ref not in live_old:
                dangling.setdefault(ref, []).append(f)
    if dangling:
        print("DANGLING REFERENCES - fix these before renumbering:")
        for ref, fs in sorted(dangling.items()):
            print(f"  {ref}  in {', '.join(sorted(set(fs)))}")
        sys.exit(1)

    changed = {k: v for k, v in m.items() if k != v}
    for f in FILES:
        p = pathlib.Path(HERE) / f
        p.write_text(ID_RE.sub(lambda mo: m.get(mo.group(0), mo.group(0)), p.read_text()))
    # Renumbered IDs are the same length, so a rewritten module keeps its byte size.
    # With an mtime that can land in the same second, Python's __pycache__ validity
    # check passes and the next process compiles from a STALE .pyc. Drop the cache.
    shutil.rmtree(os.path.join(HERE, "__pycache__"), ignore_errors=True)
    print(f"renumbered {len(changed)} of {len(m)} IDs across {len(FILES)} files")
    for k, v in list(changed.items())[:12]:
        print(f"    {k:<8} -> {v}")
    if len(changed) > 12:
        print(f"    ... and {len(changed)-12} more")

if __name__ == "__main__":
    main()
