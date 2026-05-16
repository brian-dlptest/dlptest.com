#!/usr/bin/env node
/**
 * Smoke-test CURSOR_API_KEY against Cursor Cloud Agents API (GET /v1/me).
 *
 * Usage:
 *   export CURSOR_API_KEY='cursor_...'
 *   npm run news:test-key
 *
 * Does not print the key. On success prints apiKeyName + userEmail + createdAt.
 */

const apiKey = process.env.CURSOR_API_KEY?.trim();
if (!apiKey) {
  console.error("CURSOR_API_KEY is not set.");
  process.exit(1);
}

const auth = Buffer.from(`${apiKey}:`, "utf8").toString("base64");

const res = await fetch("https://api.cursor.com/v1/me", {
  headers: {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  },
});

const bodyText = await res.text();
let body;
try {
  body = JSON.parse(bodyText);
} catch {
  body = bodyText;
}

if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`);
  console.error(typeof body === "string" ? body : JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log("CURSOR_API_KEY is valid.");
console.log(JSON.stringify(body, null, 2));
