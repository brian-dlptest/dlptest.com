Lineage survival through obfuscation

Run these IN ORDER, attempting egress after each step, and write down the
FIRST step where the trace is lost.

  step0  the original, straight from the internal repo
  step1  renamed to something innocuous
  step2  extension changed to .dat
  step3  zipped
  step3b the same, password-protected (TestPassword123) - the variant the
         'obfuscation chained into one story' investigation row asks for
  step4  contents copied into a new blank file (new inode, no history)
  step5  one section pasted into a chat app

Steps 4 and 5 are where most tools lose the thread: there is no file to
track any more, only content that was once somewhere else.
