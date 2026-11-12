---
title: "Top 10 Endpoint DLP Tests to Run If You Only Have an Hour"
slug: "top-10-endpoint-dlp-tests"
pubDate: 2026-11-03
description: "Ten tests that show in under an hour whether an endpoint DLP tool covers the basics, taken from our free 174-case Endpoint DLP Test Plan."
categories: ["DLP", "Endpoint DLP", "Guide"]
---

## TL;DR

We've published a free, vendor-neutral [Endpoint DLP Test Plan](/endpoint-dlp-test-plan/): 174 test cases in a scored Excel workbook, with ready-made synthetic test files. Doing all of it properly takes weeks, because parts of it need a two-week pilot. If you only have an hour, run these ten.

| # | Test | Minutes |
|---|---|---|
| 1 | **Personal cloud upload in the browser.** Upload the spreadsheet to a personal Dropbox or Google Drive. If this fails, stop and fix the deployment. | 3 |
| 2 | **Paste and attach in a GenAI chat.** Paste 30 SSNs into ChatGPT, Claude, Gemini or Copilot, then attach a CSV. | 5 |
| 3 | **USB: copy, then Save As.** Copy the spreadsheet to a USB drive, then Save As straight to the drive from a network share. | 5 |
| 4 | **Leave the browser: sync folder and curl.** Drop the spreadsheet in a synced folder, then post the SSNs with curl. | 6 |
| 5 | **Install an unmanaged browser.** Repeat the cloud upload and the chatbot paste in Brave. | 5 |
| 6 | **Wrap it in an archive.** Upload the same 25 SSNs in a zip, nested zips, a password-protected zip, a 7z and a tar.gz. | 6 |
| 7 | **Numbers that only look like cards.** Upload valid card numbers, near-misses and order numbers. Only the valid ones should match. | 5 |
| 8 | **Get off the corporate network.** Upload over a consumer VPN, then copy to USB while tethered to your phone. | 8 |
| 9 | **Try to turn the agent off.** As a local admin, stop the service, kill the process and uninstall it. | 5 |
| 10 | **Read the incidents cold.** Check that every test made an incident, then time how long it takes you to understand one. | 7 |

That's 55 minutes, which leaves five for notes.

## The full plan

The plan is a workbook with four scored sheets, each answering one question:

- **Classification** (21 rows): can the tool find the data?
- **Policy** (91 rows): can it act on what it found? It covers 32 egress channels, with one row per channel per operating system, scored for Monitor / Warn and separately for Block.
- **Investigations** (31 rows): what happens after an alert?
- **Usability** (31 rows): what does it cost to run?

It names no DLP product. Every row is rated table stakes, advanced or differentiator, and a summary sheet rolls your results up by sheet, operating system and tier. The [test data](https://github.com/brian-dlptest/dlptest.com/tree/main/scripts/dlp-test-plan/test-data) is in a public folder, and all of it is synthetic.

## How we picked the ten

- **It fits the clock.** Anything that needs a pilot, a behavioral baseline or an uploaded index is out, however valuable it is.
- **It tells you something the others don't.** Webmail, personal cloud and GenAI uploads all run through the same browser, so the list doesn't spend three slots on them.
- **A failure means something.** All ten are rated table stakes on Windows in the plan. Differentiators are excluded because few products do them well, and a low score there is information rather than a verdict.
- **It goes past channels.** A block isn't worth much if a local admin can switch off the agent, or if nobody can read the incident afterward.

## Before you start the clock

The hour is for testing, not setup. Get these ready the day before:

- **A test machine** with the agent installed, running the operating system most of your fleet uses, plus a local admin login.
- **One policy on that device:** SSN and credit card, firing on any match, in Block mode. A single run then gives you two answers, because an action that gets logged but not stopped is a Monitor pass and a Block fail. Allow time for the policy to reach the device, and confirm that it has.
- **The test files.** From the [test data folder](https://github.com/brian-dlptest/dlptest.com/tree/main/scripts/dlp-test-plan/test-data), you need `sensitive_customer_data.xlsx` and `thirty_ssns_paste-block.txt` from `files/policy`, the `credit-card-luhn` and `archives-and-nested-files` folders from `files/classification`, and `crm_export_20-records_negative-control.csv` from `files/classification/bulk-crm-export`. Never test with real customer, employee or patient data.
- **Throwaway personal accounts:** Dropbox or Google Drive with its sync client installed, and a GenAI chat account.
- **Software and hardware:** Brave, a consumer VPN app, a USB drive, a phone that can act as a hotspot, and a network share holding a copy of the .xlsx.

## Write down three things on every test

These cost no extra time and come from rows in the plan.

1. **Did the data actually get there?** Don't trust the dialog. Check the destination from another device. The workbook's Block timing column has three values: Inline (stopped before the data left), After the fact, and Not blocked.
2. **Did anything lag?** Anything over about a second on paste is a finding, because people notice delay long before they complain about it.
3. **Would an ordinary employee know what to do next?** Read the block message as if you'd never heard of DLP. It should say what to do instead, and ideally name the approved destination.

## The ten tests

Run them in this order. The first is a gate, and the last two have to come at the end.

### 1. Personal cloud upload in the browser (3 min)

In the managed browser, upload `sensitive_customer_data.xlsx` to your personal Dropbox or Google Drive. This is the baseline. If it fails, stop and fix the deployment, because nothing else you run today will mean anything.

**Pass:** the upload is stopped, the file isn't in the account, and an incident appears.

### 2. Paste and attach in a GenAI chat (5 min)

In the managed browser, paste the contents of `thirty_ssns_paste-block.txt` into ChatGPT, Claude, Gemini or Copilot. Then attach the 20-record CSV to a prompt. It holds 20 card numbers, and "negative control" in its filename refers to a different test.

**Pass:** the paste and the upload are both stopped. They're different events, so score Partial if only one is.

### 3. USB: copy, then Save As (5 min)

Copy the .xlsx to a USB drive. Then open the copy on the network share and use Save As to write it straight to the drive.

**Pass:** both are stopped. Score Partial if only the copy is. When data is never written to local disk first, many endpoint agents can't classify it.

### 4. Leave the browser: sync folder and curl (6 min)

Drop the .xlsx into the synced folder on disk, with no browser involved. Then, from the folder holding the paste block, post it from the command line:

```bash
curl -X POST "https://dlptest.com/api/http-post/" --data-binary "@thirty_ssns_paste-block.txt"
```

On Windows, type `curl.exe`, because `curl` in Windows PowerShell is an alias for a different command. Our endpoint discards what it receives. If the response says `"ok":true`, the data left the machine.

**Pass:** the sync produces the same result as the web upload in Test 1, and the curl post doesn't get through.

### 5. Install an unmanaged browser (5 min)

Through Brave, upload the .xlsx to your personal cloud account, then paste the SSN block into a GenAI chat. You'll probably get inspection, a wholesale block, or nothing, with little in between.

**Pass:** the data doesn't get out. Note which of the two ways the tool stopped it.

### 6. Wrap it in an archive (6 min)

Upload each file in `archives-and-nested-files` the same way as Test 1: a zip, a zip inside a zip, three levels of zip, a password-protected zip, a 7z and a tar.gz. Every one holds the same document with 25 SSNs, so the match count should be the same at every depth.

**Pass:** content is inspected to at least two or three levels, and the encrypted archive is detected and handled by policy rather than silently passed.

### 7. Numbers that only look like cards (5 min)

A tool that blocked everything would have passed every test so far, so this one checks that it can tell the difference. Upload all three files in `credit-card-luhn`: 40 valid card numbers, the same 40 with one digit changed so the check digit fails, and 30 sixteen-digit order numbers and timestamps.

**Pass:** only the valid file matches.

### 8. Get off the corporate network (8 min)

Turn on the consumer VPN and upload the .xlsx to your personal cloud account. Then turn the VPN off, disconnect from corporate Wi-Fi, tether to your phone, and copy the .xlsx to USB. Any control that depends on the network path or proxy inspection fails here, so this shows whether enforcement runs on the device.

**Pass:** both actions are stopped, and the events are in the console once you're back on the network.

### 9. Try to turn the agent off (5 min)

As a local administrator, try to stop the service, kill the process and uninstall the agent. A technical user who can stop the service has no DLP. Run this after the other endpoint tests, because a failure may leave you without a working agent.

**Pass:** each attempt fails, or the agent restores itself. Note whether the console shows the attempt.

### 10. Read the incidents cold (7 min)

First, compare the console with your notes. Every test above should have produced an incident, and a block with no incident is one nobody would ever hear about. Then open the USB incident as if you'd never seen it, and time yourself. The plan's target for working out what happened is under two minutes.

**Pass:** you can see the matched strings in context, with configurable masking, and the incident records the device, process, user and file details, including the USB drive's manufacturer, model and serial number.

## If you get another 15 minutes

These just missed the list. Most are advanced or differentiator rows, so a low score here is useful information rather than a failed basic.

- **An AI CLI reading a local file.** Run one in a folder of sensitive files and ask it to summarize one. There's no upload event to intercept, and few products handle this well. It was the closest call on the list.
- **GenAI desktop apps.** Repeat Test 2 in the desktop apps and compare the results with the browser.
- **Screenshots.** Upload `ssn_table_screenshot.png` from the `ocr-on-images` folder. A text classifier never sees an image.
- **A personal account inside a sanctioned service.** Sign in to a personal Google or Microsoft account next to your corporate tenant and upload there. A domain rule will let it through.
- **FTP and SFTP.** Use the targets on our [FTP test page](/ftp-test/). Cleartext FTP should be easy to inspect, and SFTP needs visibility on the endpoint.
- **Webmail drafts.** Attach a file to a draft and check whether auto-save uploads it before the policy has finished evaluating it.
- **Print to PDF.** It's an export rather than a print, and it's frequently uncontrolled.

If you have a second hour, run the ten again on your other operating system. GenAI web chat and unmanaged browsers are table stakes on Windows but advanced on macOS in the plan, so the answers may well differ.

## What an hour won't tell you

A clean run tells you the basics are in place. It doesn't tell you the tool is right for you. An hour can't measure:

- False positive rates on your real traffic, which takes a [pilot in monitor mode](/endpoint-dlp-deployment-guide/).
- Agent CPU, memory and battery use over a normal working day.
- Discovery of shadow AI and behavioral baselines, both of which need weeks of activity.
- Matching against your own records, and classifying document types only your business has.
- What the tool costs to run: triage time, tuning and rollout.

That's what the other 160 rows are for. [Download the Endpoint DLP Test Plan](/endpoint-dlp-test-plan/), use one copy per product or environment, and [tell us](/contact/) about any channel we missed, any test that doesn't survive contact with a real product, or any tier you'd score differently.
