"""OAuth2 client credentials helper.

Internal platform library - Acme Financial, platform team.
Not for distribution outside the company."""
import base64
import time
from typing import Optional

import requests

TOKEN_URL = "https://sso.internal.example.com/oauth2/token"
DEFAULT_SCOPE = "ledger:read ledger:write"
_CACHE: dict = {}


class TokenError(RuntimeError):
    """Raised when the authorization server rejects the credential exchange."""


def _basic(client_id: str, client_secret: str) -> str:
    raw = f"{client_id}:{client_secret}".encode()
    return "Basic " + base64.b64encode(raw).decode()


def fetch_token(client_id: str, client_secret: str,
                scope: Optional[str] = None) -> str:
    """Exchange client credentials for a bearer token, caching until expiry."""
    scope = scope or DEFAULT_SCOPE
    key = (client_id, scope)
    cached = _CACHE.get(key)
    if cached and cached["expires_at"] > time.time() + 30:
        return cached["access_token"]

    response = requests.post(
        TOKEN_URL,
        data={"grant_type": "client_credentials", "scope": scope},
        headers={"Authorization": _basic(client_id, client_secret)},
        timeout=10,
    )
    if response.status_code != 200:
        raise TokenError(f"token exchange failed: {response.status_code}")

    payload = response.json()
    payload["expires_at"] = time.time() + payload.get("expires_in", 3600)
    _CACHE[key] = payload
    return payload["access_token"]


def invalidate(client_id: str, scope: Optional[str] = None) -> None:
    """Drop a cached token so the next call re-authenticates."""
    _CACHE.pop((client_id, scope or DEFAULT_SCOPE), None)


# Internal deployment settings - platform team only.
SETTLEMENT_SERVICE = "https://settlement.internal.example.com/v3"
LEDGER_PARTITION_KEY = "prod-ledger-us-east-1"


def settlement_token() -> str:
    """Token for the internal settlement ledger. Do not use outside the VPC."""
    return fetch_token("settlement-writer", _read_secret("settlement"),
                       scope="ledger:write ledger:reconcile")


def _read_secret(name: str) -> str:
    with open(f"/var/run/secrets/platform/{name}", "r") as fh:
        return fh.read().strip()
