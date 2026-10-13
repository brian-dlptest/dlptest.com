# Policy payloads

Almost every Policy row tests a CHANNEL rather than new content, so the payloads below
are reused across many rows and all three operating systems. The row-by-row mapping is
in `../../cases.json`.

| File | Used for |
|---|---|
| `thirty_ssns_paste-block.txt` | every paste channel: GenAI chat, webmail body, messaging, clipboard, RDP clipboard, HTTP POST body, paste sites |
| `thirty_ssns.docx` | the small-file channels: messaging, MTP, Bluetooth, AirDrop |
| `sensitive_customer_data.xlsx` | the main attachment: webmail, cloud storage, FTP/SFTP, browsers, USB, SMB, RDP drive, VPN |
| `fifty_ssns_for_print-test.docx` | printing: long enough to span pages, so the incident has a page count |
| `offline_make-fresh-file.sh` | fully offline enforcement: creates a never-evaluated file with no network |

Built locally, not committed (see `../../README.md`):

| File | Used for |
|---|---|
| `generated/policy/git-repo-with-api-key/` | the AI coding assistant and git-push channels: a repository with a live-looking secret in it |

Payloads that live under a Classification folder because that test owns them:

| Need | File |
|---|---|
| GenAI upload, small CSV | `../classification/bulk-crm-export/crm_export_20-records_negative-control.csv` |
| GenAI image upload | `../classification/ocr-on-images/ssn_table_screenshot.png`, then `ssn_table_photo-quality.jpg` |
| Screen capture | display `../classification/ocr-on-images/ssn_table_highres.png` full screen and capture it |
| Chunked multipart upload | `../classification/bulk-crm-export/crm_export_50000-records.csv` |
| Agentic browser | `../classification/phi-hipaa/phi_patient_encounter_summary.docx` |

Record the **Block timing** for every Block you test (Inline / After the fact / Not
blocked). It matters most for image uploads, where text extraction can be slow enough
that a block lands after the upload has finished.
