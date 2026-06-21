#!/usr/bin/env node
/**
 * Inject `assets.run_worker_first` into the wrangler config that the
 * @astrojs/cloudflare adapter generates at build time
 * (dist/server/wrangler.json).
 *
 * Why this is needed: Cloudflare Workers Assets serves static files (and the
 * 404) for any request that looks like an asset — notably extension-bearing
 * paths like /downloads/sample-data.csv — WITHOUT invoking the Worker. Our R2
 * file downloads under /downloads/* are served by the Worker (src/middleware.ts),
 * so the Worker must run first for those paths. The adapter doesn't expose this
 * knob, so we patch the generated config before `wrangler deploy`.
 *
 * Run automatically by the `build` / `build:staging` npm scripts.
 */
import { readFileSync, writeFileSync } from "node:fs";

const CONFIG_PATH = "dist/server/wrangler.json";
const RUN_WORKER_FIRST = ["/downloads/*"];

let config;
try {
  config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
} catch (error) {
  console.error(`[patch-wrangler-assets] cannot read ${CONFIG_PATH}:`, error.message);
  process.exit(1);
}

if (!config.assets) {
  // Non-fatal: don't break the whole deploy over the downloads knob. Warn loudly
  // so it's caught, but let the build proceed.
  console.warn(
    `[patch-wrangler-assets] WARNING: ${CONFIG_PATH} has no "assets" block — ` +
      "skipping run_worker_first patch (downloads under /downloads/* may 404). " +
      "Did the adapter's generated config change shape?",
  );
  process.exit(0);
}

config.assets.run_worker_first = RUN_WORKER_FIRST;
writeFileSync(CONFIG_PATH, JSON.stringify(config));
console.log(
  `[patch-wrangler-assets] set assets.run_worker_first = ${JSON.stringify(RUN_WORKER_FIRST)}`,
);
