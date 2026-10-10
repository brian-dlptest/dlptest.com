/**
 * Tests for checkPolish() — the guard that decides whether the no-ai-slop
 * edit of a drafted post is kept or thrown away in favor of the draft.
 *
 * The edit runs unattended and a reviewer skimming /admin/news would not spot
 * a changed dollar figure, so an edit that touches facts must be rejected.
 * Just as important, ordinary prose edits must pass, or the pass silently
 * becomes a no-op.
 *
 * Extracts the real function from discover.mjs rather than reimplementing it,
 * so these cannot pass against a stale copy.
 */
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./discover.mjs", import.meta.url), "utf8");
const block = src.slice(
  src.indexOf("/**\n * Guard for the editing pass"),
  src.indexOf("async function ingest("),
);
const { checkPolish } = new Function(`${block}; return { checkPolish };`)();

let fail = 0;
function check(name, got, want) {
  const ok = got === want;
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (got ${got}, want ${want})`}`);
}

const draft = {
  title: "Rein Security raises $25M Series A for AI agent runtime controls",
  excerpt:
    "Rein Security raised a $25 million Series A co-led by Glilot Capital and Sienna Venture " +
    "Capital, bringing total funding to $35 million for runtime controls on AI agents.",
  body:
    "**Rein Security** has raised a $25 million Series A, bringing total funding to $35 million. " +
    "The news was first reported by [SecurityWeek](https://www.securityweek.com/rein-security-25m/).\n\n" +
    "Calcalist reports revenue has grown eightfold since January — concrete signal of production " +
    "deployment rather than pilot-stage interest.",
};

const ok = (edited) => checkPolish(draft, edited).ok;
const reason = (edited) => checkPolish(draft, edited).reason ?? "";

// --- Prose edits: must be kept ---------------------------------------------
check(
  "plain rewrite that keeps facts and link → kept",
  ok({
    ...draft,
    body:
      "**Rein Security** raised a $25 million Series A, which brings its total to $35 million. " +
      "[SecurityWeek](https://www.securityweek.com/rein-security-25m/) reported it first.\n\n" +
      "Calcalist reports revenue grew eightfold since January, so customers are running it in production.",
  }),
  true,
);
check(
  "'$25 million' shortened to '$25M' → kept (same number)",
  ok({ ...draft, title: "Rein Security raises $25M for AI agent runtime controls" }),
  true,
);
check(
  "removing a number (cutting a sentence) → kept",
  ok({ ...draft, excerpt: "Rein Security raised a $25 million Series A for runtime controls on AI agents, co-led by Glilot Capital and Sienna Venture Capital." }),
  true,
);
check("thousands separator is not a new number", checkPolish({ ...draft, body: draft.body + " 1,200 agents." }, { ...draft, body: draft.body + " 1200 agents." }).ok, true);

// --- Fact changes: must be rejected ----------------------------------------
check(
  "changed dollar figure → rejected",
  ok({ ...draft, body: draft.body.replace("$35 million", "$45 million") }),
  false,
);
check(
  "rejection names the invented number",
  reason({ ...draft, body: draft.body.replace("$35 million", "$45 million") }).includes("45"),
  true,
);
check(
  "invented figure in the excerpt → rejected",
  ok({ ...draft, excerpt: draft.excerpt + " It has 40 customers." }),
  false,
);
check(
  "dropped source link → rejected",
  ok({ ...draft, body: draft.body.replace("[SecurityWeek](https://www.securityweek.com/rein-security-25m/)", "SecurityWeek") }),
  false,
);
check(
  "body cut to a stub → rejected",
  ok({ ...draft, body: "**Rein Security** raised $25 million." }),
  false,
);

// --- Malformed output: must be rejected ------------------------------------
check("missing body → rejected", ok({ title: draft.title, excerpt: draft.excerpt }), false);
check("empty title → rejected", ok({ ...draft, title: "  " }), false);
check("null edit → rejected", ok(null), false);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
