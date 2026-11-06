# Voice: how Brian writes

Read this before writing or editing any copy on dlptest.com. It applies to everything except the legal pages (privacy policy, terms, security policy).

The goal is for the site to sound like Brian Hileman wrote it, because he is the person behind it.

## The one rule: never invent Brian

Everything else in this file is about style. This part is about honesty.

- Don't write a first-person experience, opinion, prediction, or story he hasn't actually told. Use what's on record in the sources below, or ask him.
- A short take that clearly follows from something he's said is fine, but point it out to him when you hand the work over.
- **Asking is easy.** He's a slow typer and would rather talk it through. If a page needs his take, ask him to talk about it, then write from what he says, in his words as much as you can. Fix the grammar and keep the rest.
- Automated drafts (the news pipeline) never use "I". Only a person can sign off on "I".
- Say when he has a stake. In 2024 he wrote that he worked for one of the vendors he was discussing. Keep doing that when a piece is about his employer or judges vendors in his market.

## Where this comes from

Ranked by how much to trust each source:

1. **His talk, "Securing Data in the GenAI Era" (2025).** About 8,000 words of him speaking: https://www.youtube.com/watch?v=LjQQ4D4rCAw. Best source for how he thinks and explains things.
2. **"The data protection platform race is on!" (Oct 2024).** `src/content/guides/the-data-protection-platform-race-is-on.md`. Best source for his long-form writing.
3. **His short 2024 notes.** `cyera-is-acquiring-trail-security`, `cyera-is-announcing-a-massive-round-of-funding...`. Best source for news.
4. **The old WordPress tool pages (2016 to 2024).** FTP, HTTP POST, and sample data on the Wayback Machine or in `backup/`. Best source for tool pages.

**Not sources:** the press-release summaries posted from 2024 to 2026, the news pipeline posts, and the 2026 pillar guides. That's the writing this file is moving away from.

He says in the talk that he has an engineer's brain and runs his writing through Grammarly, so his written samples are a bit smoothed. When speech and writing disagree on tone, trust the speech. On grammar and punctuation, trust the writing.

## What the numbers show

| | Brian, 2024 writing | News posts, June 2026 on |
|---|---|---|
| Average sentence | 19 words | 27 words |
| Sentences of 30+ words | 11% | 38% |
| First person, per 1,000 words | 21 | 0.1 |
| Questions, per 1,000 words | 2.9 | 0.8 |
| Em dashes, per 1,000 words | 0 | 12.3 |
| "rather than", per 1,000 words | 0 | 4.3 |

In the talk, "rather than", "however", and "for example" each come up zero times. He says "I don't know" 12 times and "think about" 20 times.

## How he sounds

**Plain first.** He says what the thing is and how to use it, then stops. His tool pages are a couple of sentences and a table.

**"I" and "you".** He talks to one reader. "I" is Brian. "You" is the person testing their DLP. Use "we" only for a group he was really part of, like the people writing regexes back when he started, or a team at a job he held.

**He starts from what he's seen.** Dates, jobs, and counts come before the conclusion, like the years he spent at a DLP consulting company and the 250+ implementations done there.

**He asks the question, then answers it.** This is his most recognizable habit. Why is that bad? What does that mean? Who is the winner? Then a short, direct answer starting with "Well" or just the answer. When a vendor announcement is vague, he asks what it covers and lists the options: cloud, SaaS, email, web, endpoint?

**A specific scenario, not an abstraction.** He doesn't say "data exfiltration risk." He walks through it: a developer runs a git clone, opens the code, pastes it into a personal ChatGPT account, and that's the moment to block. "Think about" is how he gets there.

**He has an opinion and says how sure he is.** "For me", "in my opinion", "I like this tool", "if I am going to hedge my bets", "as of now". He says "I don't know" out loud. He's not a lawyer and says so. He doubts stats in public, even on his own slides: if a number seems high, he says it seems high.

**He names vendors and has opinions about them.** He'd rather say who's doing what than stay generic. He also gives credit: he'll say a competitor is good at something, and that nothing's wrong with a product before he raises a problem with it.

**Everyday comparisons.** The hammer approach, whack-a-mole, garbage in and garbage out, the new kid on the block, going rogue. Short, common, and not extended past one sentence.

**Humor at his own expense.** Bad at English, terrible at coding, barely counts as a millennial, his robot vacuum bothers his dog. It's dry and quick, and it never makes fun of the reader.

**Recommendations are simple.** Give people a tool. Start with visibility. Educate first, then block. He numbers the steps and doesn't dress them up.

### His words

Use these where they fit: pretty (pretty simple, pretty remarkable), a ton, stood out, interesting, wild, old school, shady, bummed, claim to fame, DLP nerd, use case, sensitive data, at least from a funding standpoint.

## By type of page

**Tool pages.** One or two plain sentences, then the table or form. No opinion and no jokes. It's fine to say "I" where it matters, like who to contact about the IP block list.

**FAQ and how-to.** Lead with what to do. Steps stay as steps. Add what he's actually said about the topic where it applies.

**News.** Two or three short paragraphs. What happened and the numbers, then what the company is known for. Then, if there's something real to say, a question or a short opinion. If not, stop. No section about what it means for the market.

**Guides and opinion.** First person. Start from experience. Sections can be short: he once covered a whole pillar in one line because he'd already covered it.

**Labels, buttons, and meta descriptions.** Say what it does. Sentence case.

## What to take out

These are in the current copy and are not how he writes:

- **Em dashes.** He uses periods, commas, and parentheses.
- **"X rather than Y" and "not X, but Y".** Just say what it is.
- **The closing paragraph about what it means.** 21 of the last 30 news posts have a "For practitioners..." line. End when you're done.
- **Market-analyst words.** Signal, worth tracking, appetite, traction, comparable, lands amid, consolidation play, line item, strategic logic, the economics.
- **Long stacked sentences.** Three facts joined with commas, then a clause explaining why they matter. Split them.
- **Marketing lines.** "Test Your DLP. Prove It Actually Blocks." is a slogan. He'd ask a question or just say what the site does.
- **Passive, faceless sentences.** "An IP block list is enforced" hides the person. Compare the two below.
- **Punchy closers.** "The wire is the truth." He doesn't write those.

Same paragraph, then and now:

> **His, on the old WordPress site:** Due to scripts uploading excess data and increasing costs to host the FTP server, an IP block list has been added. If you feel that I am blocking an IP incorrectly please use the contact page to reach me.
>
> **Before this rewrite:** To limit hosting costs from automated upload abuse, an IP block list is enforced. If you believe your address has been blocked in error, use the contact page.

## Don't overdo it

This is a voice, not a costume.

- Speech tics stay in speech. He says "right?" 61 times in the talk, plus "actually" 58 times and "literally" 19 times. Those don't go on the page. An occasional "actually" is fine.
- At most one joke in a long piece, none on tool pages, and none in news about someone's layoffs or breach.
- Don't reuse his comparisons as filler. If whack-a-mole is on every page, it's a tic.
- Keep the swearing on stage.
- Don't add typos or broken grammar to seem human. Clean up, but keep it plain.

## Rules that still apply

- Keep facts, numbers, commands, and URLs exactly right. A rewrite changes how something is said, never what's true.
- Don't cut an existing claim or target just because you can't find a source for it. Brian stands behind the site's numbers as his opinions, and if a vendor contacts him about a claim, he'll fix it then. New claims still need a source.
- The Endpoint DLP Test Plan stays vendor-neutral, and the page says so. Its workbook has its own process, so see `CLAUDE.md` before changing any row text.
