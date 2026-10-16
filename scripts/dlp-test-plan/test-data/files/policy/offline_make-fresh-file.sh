#!/bin/bash
# Fully offline enforcement - macOS and Linux. On Windows use offline_make-fresh-file.ps1.
#
# Run this with networking DISABLED, then immediately copy the file it writes to a USB
# drive. Every run writes content no agent has evaluated before: the SSNs and dates of
# birth are generated here at run time and a run ID is stamped into the file, so there is
# no prior verdict - for the file or for its contents - to reuse from a cache.

RUN_ID="$(date +%s)-$$-$RANDOM"
OUT="fresh_30_ssns_${RUN_ID}.txt"
{
  echo "Customer verification batch - created offline, never evaluated"
  echo "Run ID: ${RUN_ID}"
  echo
  while IFS= read -r NAME; do
    # SSN area 001-665: never 000, 666 or the 9xx range, so every value is well formed.
    printf '%-24s  %03d-%02d-%04d  %d/%d/%d
' "$NAME"       $(( RANDOM % 665 + 1 )) $(( RANDOM % 99 + 1 )) $(( RANDOM % 9999 + 1 ))       $(( RANDOM % 12 + 1 )) $(( RANDOM % 28 + 1 )) $(( RANDOM % 50 + 1950 ))
  done <<'NAMES'
Margaret Hill
Nancy Baker
Timothy Gonzalez
John Thomas
Betty Thomas
Anthony Jackson
Deborah Williams
Amanda Martin
Susan Rodriguez
Linda Thompson
Carol Williams
Margaret Robinson
Emily Baker
Michael Green
Patricia Johnson
William Hill
Mark Nelson
Christopher Martin
Linda Adams
Mark Carter
Melissa Lopez
Christopher Jackson
Dorothy Thomas
Sandra Johnson
Emily Gonzalez
Christopher Ramirez
Kimberly Davis
Mary Martinez
Michelle Anderson
Andrew Rodriguez
NAMES
} > "$OUT"
echo "wrote $OUT"
