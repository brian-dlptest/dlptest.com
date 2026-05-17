#!/usr/bin/env bash
#
# Upload the legacy DLP test files from the WordPress backup into the
# Cloudflare R2 bucket `dlptest-downloads`. This populates the bucket that
# `src/middleware.ts` proxies at /<key> and /downloads/<key>.
#
# Idempotent: re-running re-uploads (R2 overwrites the object). Wrangler
# handles multipart automatically for files >100 MiB.
#
# Requires:
#   - `wrangler login` (or CLOUDFLARE_API_TOKEN in env) with R2 write perms
#   - R2 enabled on the account
#   - bucket `dlptest-downloads` to exist (this script will create it if not)
#
# Usage:
#   ./scripts/upload-r2.sh                  # use default backup path
#   BACKUP_ROOT=/custom/path ./scripts/upload-r2.sh

set -euo pipefail

BUCKET="${BUCKET:-dlptest-downloads}"
BACKUP_ROOT="${BACKUP_ROOT:-backup/mnt/c126686.sgvps.net/dlptest.com/1776983420/home/www/dlptest.com/public_html}"

# Keep this list in sync with src/lib/downloads.ts (DOWNLOAD_KEYS).
KEYS=(
  "sample-data.csv"
  "sample-data.xls"
  "sample-data.xlsx"
  "sample-data.pdf"
  "1-MB-Test.docx"
  "10-MB-Test.docx"
  "1-MB-Test.xlsx"
  "10-MB-Test.xlsx"
  "30-MB-Test.xlsx"
  "103-MB-Test.xlsx"
  "111-MB-Test.csv"
  "334-MB-Test-CSV.csv"
  "AIP_Test_Doc.docx"
  "DLP_Test_FTP_FileZilla.xml"
  "DLP_Test_FTP_FileZilla_old.xml"
  "DLP-Test-State-Data.zip"
)

# Content types must match src/lib/downloads.ts so the bucket-provided
# metadata is correct even if a caller bypasses the middleware fallback.
content_type_for() {
  case "$1" in
    *.csv) echo "text/csv; charset=utf-8" ;;
    *.pdf) echo "application/pdf" ;;
    *.xls) echo "application/vnd.ms-excel" ;;
    *.xlsx) echo "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ;;
    *.docx) echo "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ;;
    *.zip) echo "application/zip" ;;
    *.xml) echo "application/xml; charset=utf-8" ;;
    *) echo "application/octet-stream" ;;
  esac
}

# Ensure the bucket exists. `bucket create` is idempotent-ish — it errors if
# the bucket exists, which we swallow.
echo "→ Ensuring bucket $BUCKET exists..."
npx wrangler r2 bucket create "$BUCKET" 2>&1 \
  | grep -vE "(already exists|10004|Created bucket)" \
  || true

if [ ! -d "$BACKUP_ROOT" ]; then
  echo "ERROR: BACKUP_ROOT does not exist: $BACKUP_ROOT" >&2
  echo "Set BACKUP_ROOT=... if the WordPress public_html is elsewhere." >&2
  exit 1
fi

echo ""
echo "→ Uploading ${#KEYS[@]} files from $BACKUP_ROOT"
echo ""

failed=()
for key in "${KEYS[@]}"; do
  src="$BACKUP_ROOT/$key"
  if [ ! -f "$src" ]; then
    echo "  ✗ $key — not found at $src, skipping"
    failed+=("$key")
    continue
  fi

  size=$(ls -lh "$src" | awk '{print $5}')
  ct=$(content_type_for "$key")
  echo "  ↑ $key ($size, $ct)"
  npx wrangler r2 object put "$BUCKET/$key" \
    --file "$src" \
    --content-type "$ct" \
    --remote \
    2>&1 \
    | grep -vE "^(Resource location|⛅️|Uploading|Upload complete)" \
    || true
done

echo ""
if [ ${#failed[@]} -eq 0 ]; then
  echo "✓ All ${#KEYS[@]} files uploaded to $BUCKET"
else
  echo "⚠ ${#failed[@]} files skipped: ${failed[*]}"
  exit 1
fi
