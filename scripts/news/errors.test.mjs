/**
 * Tests for discovery's error classification — which failures fail the run
 * (red) and which are skipped quietly (green).
 *
 * This is the logic that decides whether an outage is VISIBLE. Getting it
 * wrong is what let the 2026-07-26 credit exhaustion report SUCCESS every
 * morning for ~13 days, so it is worth a guard rather than a code comment.
 *
 * Extracts the real functions from discover.mjs rather than reimplementing
 * them, so these cannot pass against a stale copy.
 */
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./discover.mjs", import.meta.url), "utf8");
const block = src.slice(
  src.indexOf("/** Flatten an SDK error's message"),
  src.indexOf("async function main()"),
);
const { isBillingError, isTransientCapacityError } = new Function(
  `${block}; return { isBillingError, isTransientCapacityError };`,
)();

let fail = 0;
function check(name, got, want) {
  const ok = got === want;
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (got ${got}, want ${want})`}`);
}

// Shape of a real Anthropic SDK error: message is nested under error.error.
const sdkErr = (message, status) => ({ status, error: { error: { message } } });

// --- Billing: must fail red -------------------------------------------------
check(
  "credit balance exhausted → billing (red)",
  isBillingError(sdkErr("Your credit balance is too low to access the Anthropic API.")),
  true,
);
check("flattened .message form also detected", isBillingError({ message: "credit balance is too low" }), true);
check("quota exceeded → billing", isBillingError(sdkErr("Monthly quota exceeded")), true);
check("insufficient credit → billing", isBillingError(sdkErr("insufficient credit on account")), true);
check("billing keyword → billing", isBillingError(sdkErr("A billing issue blocked this request")), true);

// --- Capacity: safe to skip -------------------------------------------------
check("429 → capacity (soft)", isTransientCapacityError({ status: 429 }), true);
check("529 → capacity (soft)", isTransientCapacityError({ status: 529 }), true);
check("429 is NOT billing", isBillingError({ status: 429 }), false);

// --- Everything else: must fail red ----------------------------------------
// The timeout is the specific regression from run 31264538594. It indicated a
// real bug, so it must never be swallowed as a "blip".
check(
  "connection timeout → NOT capacity (stays red)",
  isTransientCapacityError({ name: "APIConnectionTimeoutError", message: "Request timed out." }),
  false,
);
check(
  "connection timeout → NOT billing (stays red)",
  isBillingError({ name: "APIConnectionTimeoutError", message: "Request timed out." }),
  false,
);
check("500 → NOT capacity", isTransientCapacityError({ status: 500 }), false);
check("TypeError → NOT billing", isBillingError(new TypeError("x is not a function")), false);
check("null → NOT billing", isBillingError(null), false);
check("string → NOT billing", isBillingError("boom"), false);

// --- Precedence -------------------------------------------------------------
// A billing error tagged 429 must still fail red: billing is checked first in
// the handler, and erring toward visible is the safe direction.
check(
  "billing error carrying status 429 is still billing",
  isBillingError(sdkErr("Your credit balance is too low", 429)),
  true,
);

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
