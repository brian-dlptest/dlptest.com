# no-ai-slop (vendored)

`SKILL.md` and `eval.md` are copied verbatim from
[petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) at commit
`000650b` (2026-09-01), under the MIT license in `LICENSE`.

`scripts/news/discover.mjs` loads both files as the system prompt for its
editing pass, which runs over every drafted candidate before it is queued for
review.

**Don't edit these files.** House rules and Brian's voice live in
`scripts/news/VOICE.md`, which the editing pass reads after the skill and
which wins where the two disagree. Keeping the upstream files untouched means
updating is a straight re-copy:

```bash
git clone --depth 1 https://github.com/petergyang/no-ai-slop /tmp/no-ai-slop
cp /tmp/no-ai-slop/skills/no-ai-slop/{SKILL.md,eval.md} scripts/news/no-ai-slop/
```

Then update the commit hash above.
