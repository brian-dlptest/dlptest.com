"""Thin JSON-RPC client for the DLPTest MCP server (https://mcp.dlptest.com/api/mcp/).

The server is public and unauthenticated. Every response this client receives is written
to generated/raw/ by the callers, so the whole library is reproducible from provenance.
"""
import json
import os
import time
import urllib.error
import urllib.request

ENDPOINT = "https://mcp.dlptest.com/api/mcp/"
# Raw responses are provenance for a local build, not source - they are regenerated on
# every run, so they live under the gitignored generated/ folder.
RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "generated", "raw")

_id = 0


def call(tool, arguments=None, retries=4, pace=0.15):
    """Invoke an MCP tool and return its text payload."""
    global _id
    _id += 1
    body = json.dumps({
        "jsonrpc": "2.0",
        "id": _id,
        "method": "tools/call",
        "params": {"name": tool, "arguments": arguments or {}},
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
            with urllib.request.urlopen(req, timeout=60) as r:
                payload = json.loads(r.read().decode())
            if "error" in payload:
                raise RuntimeError("%s: %s" % (tool, payload["error"]))
            time.sleep(pace)
            return payload["result"]["content"][0]["text"]
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last = exc
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


def regex_test(pattern, text, flags="g", engine="re2"):
    """Run a pattern against text; returns the parsed regex_test result."""
    return json.loads(call("regex_test", {
        "pattern": pattern, "text": text, "flags": flags, "engine": engine,
    }))
