#!/bin/bash
# Fully offline enforcement.
#
# Run this with networking DISABLED. It writes a file the agent has never seen, from data
# embedded here rather than fetched, so there is no network call and no prior verdict to
# cache. Then immediately copy the output to a USB drive.

OUT="fresh_30_ssns_$(date +%s).txt"
cat > "$OUT" <<'DATA'
Customer verification batch - created offline, never evaluated
Daniel Scott              188-22-3807  12/25/1969
Elizabeth Baker           596-35-6333  5/26/1970
George Garcia             024-94-9953  6/14/2005
Karen Torres              299-34-7322  9/11/2002
Amanda Nguyen             485-61-2755  8/10/2003
Betty Nguyen              533-58-7823  7/9/1999
Donna Lee                 785-18-8729  2/22/1990
Ashley Jones              688-22-8444  9/14/1961
Donna Moore               752-67-3998  2/10/2001
Michael Miller            424-97-3328  8/19/1948
Deborah Davis             856-47-4012  6/28/1989
Mark Jones                721-47-7034  12/15/2000
Andrew Roberts            341-14-4933  9/4/1948
Robert Martin             094-07-1196  12/10/1974
Donald Carter             123-85-2965  10/18/1957
Kimberly Taylor           590-26-5383  1/5/1962
Nancy Hill                592-33-6737  3/24/1959
Joseph Walker             431-76-3077  1/2/1950
Christopher Lewis         635-50-3567  8/21/1977
Jennifer Allen            768-58-2126  3/14/1952
Jennifer Carter           188-39-6790  2/3/1952
Melissa Sanchez           163-84-1905  2/1/1950
Deborah Perez             609-40-8218  6/25/1951
John Jackson              542-40-1119  5/26/1976
Sandra Adams              068-87-1157  10/25/2002
Michael Jones             133-33-7633  12/25/1999
Patricia Taylor           791-75-5600  12/3/1999
Kevin Green               277-51-3388  2/22/1954
Elizabeth Martinez        063-29-2877  12/6/1999
Amanda Young              067-96-5848  7/22/1979
DATA
echo "wrote $OUT"
