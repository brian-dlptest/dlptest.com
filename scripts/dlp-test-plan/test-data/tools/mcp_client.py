"""Thin JSON-RPC client for the DLPTest MCP server (https://mcp.dlptest.com/api/mcp/).

The server is public and unauthenticated, and it returns fresh random data on every call.

Every response is cached under the gitignored generated/mcp-cache/, keyed by the tool,
its arguments and how many times this run has made that exact call. A rebuild replays
the cache, so changing how a generator *formats* its data does not also change the data.
`build.py refresh --refetch` ignores the cache and pulls new values.
"""
import hashlib
import http.client
import json
import os
import time
import urllib.error
import urllib.request

ENDPOINT = "https://mcp.dlptest.com/api/mcp/"
TEST_DATA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Raw responses are provenance for a local build, not source, so they live under the
# gitignored generated/ folder.
RAW_DIR = os.path.join(TEST_DATA, "generated", "raw")
CACHE_DIR = os.path.join(TEST_DATA, "generated", "mcp-cache")

REFETCH = False      # set by build.py --refetch
CALLS = {"network": 0, "cache": 0}

_id = 0
_seen = {}


class ToolError(RuntimeError):
    """The server ran the tool and reported a failure (`isError: true`)."""


def _cache_path(tool, arguments):
    key = json.dumps([tool, arguments], sort_keys=True)
    n = _seen.get(key, 0)
    _seen[key] = n + 1
    digest = hashlib.sha256(key.encode()).hexdigest()[:24]
    return os.path.join(CACHE_DIR, "%s-%s-%d.txt" % (tool, digest, n))


def call(tool, arguments=None, retries=4, pace=0.15, cache=True):
    """Invoke an MCP tool and return its text payload."""
    arguments = arguments or {}
    cpath = _cache_path(tool, arguments) if cache else None
    if cpath and not REFETCH and os.path.exists(cpath):
        CALLS["cache"] += 1
        with open(cpath) as fh:
            return fh.read()
    text = _fetch(tool, arguments, retries, pace)
    if cpath:
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cpath, "w") as fh:
            fh.write(text)
    return text


def _fetch(tool, arguments, retries, pace):
    global _id
    _id += 1
    body = json.dumps({
        "jsonrpc": "2.0",
        "id": _id,
        "method": "tools/call",
        "params": {"name": tool, "arguments": arguments},
    }).encode()
    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "User-Agent": "dlptest-test-data-builder/1.0",
        },
    )
    last = None
    for attempt in range(retries):
        try:
            CALLS["network"] += 1
            with urllib.request.urlopen(req, timeout=60) as r:
                raw = r.read().decode()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")[:500]
            # 429 and 5xx are worth another try; any other 4xx is our request, and
            # repeating it cannot help.
            if exc.code != 429 and exc.code < 500:
                raise RuntimeError("%s: HTTP %d: %s" % (tool, exc.code, detail))
            last = "HTTP %d: %s" % (exc.code, detail)
        except (urllib.error.URLError, http.client.HTTPException, ConnectionError,
                TimeoutError) as exc:
            last = exc
        else:
            payload = json.loads(raw)
            if "error" in payload:
                raise RuntimeError("%s: %s" % (tool, payload["error"]))
            result = payload["result"]
            text = result["content"][0]["text"]
            # The server reports a tool failure as a JSON-RPC success with isError set,
            # so the error message arrives where the data would. Never treat it as data.
            if result.get("isError"):
                raise ToolError("%s %s: %s" % (tool, json.dumps(arguments)[:200], text))
            time.sleep(pace)
            return text
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError("%s failed after %d attempts: %s" % (tool, retries, last))


def save(name, text):
    """Persist a raw MCP response under generated/raw/ and return it unchanged."""
    os.makedirs(RAW_DIR, exist_ok=True)
    with open(os.path.join(RAW_DIR, name), "w") as fh:
        fh.write(text)
    return text


def csv_rows(text):
    """Split a CSV payload into a header list and a list of row lists."""
    import csv
    import io
    rows = [r for r in csv.reader(io.StringIO(text.strip())) if r]
    if len(rows) < 2:
        raise RuntimeError("expected CSV with data rows, got: %r" % text[:200])
    return rows[0], rows[1:]


def patterns(category=None, search=None):
    """Return dlptest.com's DLP regex library as a list of dicts."""
    args = {"format": "json"}
    if category:
        args["category"] = category
    if search:
        args["search"] = search
    data = json.loads(call("list_dlp_patterns", args))
    return data["patterns"] if isinstance(data, dict) and "patterns" in data else data


def regex_test(pattern, text, flags="g", engine="re2", cache=True):
    """Run a pattern against text; returns the parsed regex_test result. The result is
    deterministic, so it is cached like any other call unless `cache` is False."""
    return json.loads(call("regex_test", {
        "pattern": pattern, "text": text, "flags": flags, "engine": engine,
    }, cache=cache))
