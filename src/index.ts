export interface Env {
  ENVIRONMENT: string;
}

/** Treat hostname or wrangler env as non-indexable (staging / preview hosts). */
function shouldBlockIndexing(env: Env, hostname: string): boolean {
  if (env.ENVIRONMENT === "staging") return true;
  if (hostname.startsWith("staging.")) return true;
  return false;
}

/** Signals for crawlers and AI indexers — not legally binding, but widely honored. */
const NO_INDEX_HEADERS: Record<string, string> = {
  "X-Robots-Tag":
    "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate",
};

function withIndexingPolicy(
  response: Response,
  env: Env,
  hostname: string
): Response {
  if (!shouldBlockIndexing(env, hostname)) return response;
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(NO_INDEX_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    if (
      url.pathname === "/robots.txt" &&
      shouldBlockIndexing(env, hostname)
    ) {
      const body =
        "# Staging — do not crawl\nUser-agent: *\nDisallow: /\n\n# Common AI crawlers\nUser-agent: GPTBot\nDisallow: /\nUser-agent: Google-Extended\nDisallow: /\nUser-agent: ClaudeBot\nDisallow: /\nUser-agent: Bytespider\nDisallow: /\nUser-agent: CCBot\nDisallow: /\n";
      return new Response(body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=600",
          ...NO_INDEX_HEADERS,
        },
      });
    }

    if (url.pathname === "/health" || url.pathname === "/") {
      const res = Response.json({
        ok: true,
        service: "dlptest",
        environment: env.ENVIRONMENT ?? "unknown",
      });
      return withIndexingPolicy(res, env, hostname);
    }

    const notFound = new Response("Not found", { status: 404 });
    return withIndexingPolicy(notFound, env, hostname);
  },
};
