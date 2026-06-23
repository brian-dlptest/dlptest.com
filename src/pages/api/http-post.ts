// Legacy alias for the renamed accept-and-discard endpoint at /api/https-post/.
// Kept so existing callers (saved scripts, curl commands, automation) that POST
// to /api/http-post/ keep working. A 301 in public/_redirects would not do:
// curl downgrades POST→GET on a redirect and drops the body. Re-exporting the
// real handlers serves the request in place, preserving method, body, and the
// 200 JSON response. Remove once we're confident no traffic hits the old path.
export { GET, POST, OPTIONS } from "./https-post";
