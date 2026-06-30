// Encode/decode the regex workbench state to/from the URL hash so a test case
// can be shared or bookmarked. Kept dependency-free and pure.

export interface RegexState {
  pattern: string;
  flags: string;
  engine: string;
  test: string;
  /** Active tab (e.g. "match" | "replace"); optional for forward compatibility. */
  tab?: string;
  /** Replacement template for the substitution tab; optional. */
  replace?: string;
}

const KEYS: (keyof RegexState)[] = ["pattern", "flags", "engine", "test", "tab", "replace"];

/** Serialize state to a URL hash body (no leading "#"). Empty fields are omitted. */
export function encodeState(state: Partial<RegexState>): string {
  const params = new URLSearchParams();
  for (const key of KEYS) {
    const value = state[key];
    if (value) params.set(key, value);
  }
  return params.toString();
}

/** Parse a URL hash (with or without leading "#") back into partial state. */
export function decodeState(hash: string): Partial<RegexState> {
  const body = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(body);
  const out: Partial<RegexState> = {};
  for (const key of KEYS) {
    const value = params.get(key);
    if (value !== null) out[key] = value;
  }
  return out;
}
