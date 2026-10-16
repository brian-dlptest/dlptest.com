# Fully offline enforcement - Windows. On macOS and Linux use offline_make-fresh-file.sh.
#
#   powershell -ExecutionPolicy Bypass -File .\offline_make-fresh-file.ps1
#
# Run this with networking DISABLED, then immediately copy the file it writes to a USB
# drive. Every run writes content no agent has evaluated before: the SSNs and dates of
# birth are generated here at run time and a run ID is stamped into the file, so there is
# no prior verdict - for the file or for its contents - to reuse from a cache.

$runId = "{0}-{1}-{2}" -f [DateTimeOffset]::UtcNow.ToUnixTimeSeconds(), $PID, (Get-Random -Maximum 100000)
$out = "fresh_30_ssns_$runId.txt"
$names = @'
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
'@ -split "`r?`n" | Where-Object { $_ }

$lines = @("Customer verification batch - created offline, never evaluated", "Run ID: $runId", "")
foreach ($name in $names) {
    # SSN area 001-665: never 000, 666 or the 9xx range, so every value is well formed.
    $ssn = "{0:D3}-{1:D2}-{2:D4}" -f (Get-Random -Minimum 1 -Maximum 666), (Get-Random -Minimum 1 -Maximum 100), (Get-Random -Minimum 1 -Maximum 10000)
    $dob = "{0}/{1}/{2}" -f (Get-Random -Minimum 1 -Maximum 13), (Get-Random -Minimum 1 -Maximum 29), (Get-Random -Minimum 1950 -Maximum 2000)
    $lines += "{0,-24}  {1}  {2}" -f $name, $ssn, $dob
}
Set-Content -Path $out -Value $lines -Encoding UTF8
Write-Output "wrote $out"
