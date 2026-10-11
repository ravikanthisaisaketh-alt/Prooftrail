"""Demo-grade login. scrypt password hashes, HMAC-signed expiring tokens (no JWT library).
Not production auth: no email verification, no password reset, in-memory rate limit."""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from collections import defaultdict, deque
from . import config

# Demo accounts. The passwords are public on purpose (README and the login page say so).
DEMO_USERS = [
    {"id": "L-001", "name": "Asha Rao", "email": "asha@demo.test", "password": "demo-pass-1",
     "progress": {"pandas": 5, "text-cleaning": 3, "data-structures": 0}},
    {"id": "L-002", "name": "Ben Carter", "email": "ben@demo.test", "password": "demo-pass-2",
     "progress": {"pandas": 2, "text-cleaning": 6, "data-structures": 1}},
    {"id": "L-003", "name": "Chen Wei", "email": "chen@demo.test", "password": "demo-pass-3",
     "progress": {"pandas": 0, "text-cleaning": 2, "data-structures": 5}},
]


def hash_password(pw: str) -> str:
    salt = os.urandom(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return salt.hex() + "$" + h.hex()


def check_password(pw: str, stored: str) -> bool:
    try:
        salt_hex, h_hex = stored.split("$")
        h = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt_hex), n=2 ** 14, r=8, p=1, dklen=32)
        return hmac.compare_digest(h.hex(), h_hex)
    except Exception:
        return False


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_token(sub: str, typ: str = "access", ttl: int | None = None) -> str:
    ttl = ttl or (config.HANDOFF_TTL_SECONDS if typ == "handoff" else config.TOKEN_TTL_SECONDS)
    body = _b64(json.dumps({"sub": sub, "typ": typ, "exp": int(time.time()) + ttl, "jti": secrets.token_hex(8)}).encode())
    sig = hmac.new(config.AUTH_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def read_token(token: str, typ: str = "access") -> dict | None:
    """Returns the payload, or None if the token is bad, expired or the wrong type."""
    try:
        body, sig = token.split(".")
        good = hmac.new(config.AUTH_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, good):
            return None
        data = json.loads(_unb64(body))
        if data.get("typ") != typ or data.get("exp", 0) < time.time():
            return None
        return data
    except Exception:
        return None


# ---- login rate limit: 5 failed attempts per minute per user (in memory, resets on restart)
_fails: dict[str, deque] = defaultdict(deque)
LIMIT, WINDOW = 5, 60


def too_many(key: str) -> bool:
    q = _fails[key]
    now = time.time()
    while q and now - q[0] > WINDOW:
        q.popleft()
    return len(q) >= LIMIT


def note_failure(key: str) -> None:
    _fails[key].append(time.time())


def clear_failures() -> None:
    _fails.clear()


_used_handoffs: set[str] = set()


def use_handoff_once(payload: dict) -> bool:
    jti = payload.get("jti", "")
    if jti in _used_handoffs:
        return False
    _used_handoffs.add(jti)
    return True
