"""Row-ID prefixes, shared by renumber.py and verify.py so the two cannot disagree about
what counts as a row reference. They used to: renumber.py accepted X-, which no row has
ever used, and verify.py accepted E- but not X-.

  C-  Classification    P-  Policy    I-  Investigations    U-  Usability
  E-  Enforcement, removed in v7. No live row has it, but a reference to one is still
      matched, so renumber.py refuses it as dangling instead of passing it as plain text.
"""
import re

PREFIXES = "C|P|E|I|U"
ID_RE = re.compile(rf"\b((?:{PREFIXES})-[A-Z]?\d{{2}}[a-z]?)\b")
