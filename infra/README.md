# infra/

Infrastructure-as-code for dlptest.com. Currently just Cloudflare rate-limit
rules; expand as more zone / account config moves out of the dashboard.

## What's here

| File | Purpose |
|---|---|
| `cloudflare-rate-limits.tf` | Per-endpoint rate limits for `/api/*` (closes security-audit finding M2). |
| `.gitignore` | Excludes `*.tfstate*` and `.terraform/` from git. `.terraform.lock.hcl` is committed. |

## Applying

One-time prerequisites:

```bash
brew install opentofu                                 # or: brew install hashicorp/tap/terraform
```

Per-apply:

```bash
# Create a Cloudflare API token at https://dash.cloudflare.com/profile/api-tokens
# Permissions: Zone > Zone WAF > Edit  scoped to dlptest.com only
export CLOUDFLARE_API_TOKEN='...'

# Zone ID is on the Cloudflare dashboard Overview tab, right sidebar, under "API"
export TF_VAR_zone_id='484b917cb842cc9aacdca4269dd20321'

cd infra
tofu init       # first time only, or after provider version bumps
tofu plan       # review what will change
tofu apply      # type 'yes' to confirm
```

Verify the rules landed:

```bash
curl -sS "https://api.cloudflare.com/client/v4/zones/$TF_VAR_zone_id/rulesets" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | python3 -m json.tool | grep -A2 http_ratelimit
```

## State file

`terraform.tfstate` lands in this directory on first `apply` and is gitignored.
Today this means whoever ran the last `apply` is the only person who can
reapply cleanly. If a second person needs to edit these rules, options:

- **Easy:** copy `terraform.tfstate` between machines (it's not secret but
  treat it as sensitive — it mirrors your live Cloudflare config).
- **Better:** configure a remote backend (Terraform Cloud, R2 via S3-compat,
  S3, etc.) before the second person needs it.
- **Always-works fallback:** `tofu import` to rebuild state from the live
  resource if the local state file is lost.

## Drift

If someone edits these rules in the Cloudflare dashboard, the next
`tofu plan` will show drift and `tofu apply` will reconcile back to what's
in `cloudflare-rate-limits.tf`. The dashboard is **not** the source of truth
once Terraform owns the resource — change the `.tf` and reapply, don't edit
in the UI.

## Plan / provider notes

- Tuned for the Cloudflare **Pro plan**:
  - **2 rules max** per zone in the `http_ratelimit` phase (this is the
    binding constraint — Business raises it).
  - 60s max period.
  - `characteristics` must include `cf.colo.id` (counters are per-colo).
  - `requests_per_period` only — score-based limiting is Business+.
- Uses provider `cloudflare/cloudflare ~> 4.40`. v5.x has breaking schema
  changes; if upgrading, regenerate this file rather than auto-migrating.
- OpenTofu and Terraform both work — same provider, same `.tf` syntax.

## What's NOT rate-limited (and why)

- **`/api/generate-custom`** — already enforces hard caps in code
  (`MAX_COUNT = 500`, `MAX_FIELDS = 20`, plus type allow-listing in
  [`src/pages/api/generate-custom.ts`](../src/pages/api/generate-custom.ts)),
  and Worker CPU is auto-scaled with no external billable resource.
  If volume becomes a problem, free up a slot here (e.g. drop the
  combined contact+subscribe rule or move it into a WAF custom rule)
  or upgrade to Business.
- **All non-`/api/*` routes** — static prerendered pages, served from
  Cloudflare cache. No per-request cost; not a rate-limit target.
