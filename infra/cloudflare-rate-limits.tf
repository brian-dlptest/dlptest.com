###############################################################################
# Cloudflare Rate Limiting rules for /api/* endpoints
#
# Closes audit finding M2 (no per-endpoint rate limiting). Applies two rules
# in a single zone-scoped http_ratelimit ruleset:
#
#   /api/contact + /api/subscribe   — managed_challenge,  5 req / 60s, 10 min
#   /api/http-post                  — block,            600 req / 60s,  1 min
#
# Why two rules:
#   The Cloudflare Pro plan caps http_ratelimit rules at 2 per zone. We
#   prioritized the two highest-value abuse vectors:
#     1. Contact + subscribe — real side effects per request (contact sends
#        email via Microsoft Graph / O365; subscribe writes to the Railway
#        list). Combined into one rule with a soft action so real users with
#        typos pass through after a managed challenge.
#     2. http-post — highest-volume DLP test endpoint; without a ceiling
#        a malicious client can burn bandwidth / Worker invocations.
#
#   /api/generate-custom is intentionally NOT rate-limited here because
#   the endpoint already enforces hard caps in code: max 500 rows × 20
#   fields per call, and Worker CPU is auto-scaled with no external
#   billable resource. If volume becomes a problem, swap out one of the
#   rules below or upgrade to Business plan (which raises the limit).
#
# Pro plan constraints honored:
#   * 60-second period is the max Pro allows
#   * characteristics = [ip.src, cf.colo.id] — Cloudflare requires
#     cf.colo.id because rate-limit counters live at the colocation
#     level. Effect: a user's budget is per-IP-per-colo rather than
#     strictly per-IP. For typical users (sticky to one colo via
#     anycast) this is identical; for a globally-distributed attacker
#     using one IP across many colos it relaxes the limit by ~Ncolos.
#     Acceptable for our threat model.
#   * requests_per_period (not score_per_period — Business+ feature)
#   * 2 rules — at the Pro cap
#
# Setup (one-time):
#   1. Install tofu (or terraform):
#        brew install opentofu
#   2. Create a Cloudflare API token at
#        https://dash.cloudflare.com/profile/api-tokens
#      with permission: Zone > Zone WAF > Edit  scoped to dlptest.com
#   3. export CLOUDFLARE_API_TOKEN="..."
#   4. export TF_VAR_zone_id="<zone id from dlptest.com Overview tab>"
#   5. cd infra && tofu init && tofu plan && tofu apply
#
# Tweaking thresholds: edit requests_per_period / period / mitigation_timeout
# below, then `tofu apply` again. State drift from manual dashboard edits will
# be reconciled on the next apply.
#
# State file: terraform.tfstate is gitignored (see infra/.gitignore). If you
# want shared state, configure a remote backend (R2, S3, Terraform Cloud).
###############################################################################

terraform {
  required_version = ">= 1.5"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }
}

provider "cloudflare" {
  # Reads CLOUDFLARE_API_TOKEN from env automatically.
}

variable "zone_id" {
  description = "Cloudflare zone ID for dlptest.com (Overview tab → API → Zone ID)"
  type        = string
}

resource "cloudflare_ruleset" "api_rate_limits" {
  zone_id     = var.zone_id
  name        = "API rate limiting"
  description = "Per-endpoint rate limits for /api/* routes"
  kind        = "zone"
  phase       = "http_ratelimit"

  # Path expressions match BOTH the slash-less and trailing-slash form.
  # Astro's `trailingSlash: "always"` config makes the slashed form
  # canonical, but we match both so a misconfigured client doesn't
  # accidentally bypass the limit.

  # Rule 1: spam-prone form endpoints.
  # Combined budget for /api/contact + /api/subscribe. Soft action —
  # challenge real users (who pass transparently in most browsers),
  # block bots that don't render the challenge. UX cost: a user who
  # submits 6+ form posts in a minute gets challenged once.
  rules {
    description = "Throttle /api/contact + /api/subscribe"
    expression  = "(http.request.uri.path in {\"/api/contact\" \"/api/contact/\" \"/api/subscribe\" \"/api/subscribe/\"})"
    action      = "managed_challenge"
    ratelimit {
      characteristics     = ["ip.src", "cf.colo.id"]
      period              = 60
      requests_per_period = 5
      mitigation_timeout  = 600 # 10 min
    }
  }

  # Rule 2: high-volume DLP test endpoint.
  # 600/60s = 10 req/s sustained, comfortable for typical DLP regression
  # suites. OPTIONS preflights are excluded so cross-origin clients can
  # keep firing preflights for legitimate POSTs without consuming the
  # budget. Quick cooldown so a single bad-actor burst doesn't punish a
  # shared NAT for long.
  rules {
    description = "Throttle /api/http-post"
    expression  = "(http.request.uri.path in {\"/api/http-post\" \"/api/http-post/\"} and http.request.method ne \"OPTIONS\")"
    action      = "block"
    ratelimit {
      characteristics     = ["ip.src", "cf.colo.id"]
      period              = 60
      requests_per_period = 600
      mitigation_timeout  = 60
    }
  }
}

output "ruleset_id" {
  description = "ID of the deployed rate limiting ruleset"
  value       = cloudflare_ruleset.api_rate_limits.id
}
