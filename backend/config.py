"""Settings in one place. Keys come from .env, never from code."""
import os
import secrets
from dotenv import load_dotenv

load_dotenv()  # reads backend/.env or the folder you run from


def _env(name: str, default: str = "") -> str:
    """Like os.getenv, but a blank value (as in .env.example) means "use the default"."""
    return os.getenv(name, "").strip() or default


def _int(name: str, default: int) -> int:
    return int(_env(name, str(default)))


DB_PATH = _env("DB_PATH", "prooftrail.db")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")        # empty means "AI is off"
LLM_MODEL = _env("LLM_MODEL", "UNSET-run-model-test-first")
PROMPT_VERSION = "p1"
RUBRIC_VERSION = "r1"
TASK_VERSION = "t1"
ENGINE_VERSION = "e1"
ATTEMPT_CAP = 3
RUN_TIMEOUT_SECONDS = 5
AI_RUNS = 3


def parse_origins(value: str) -> list[str]:
    """'https://a.app, https://b.app/' -> ['https://a.app', 'https://b.app']"""
    return [o.strip().rstrip("/") for o in value.split(",") if o.strip()]


# CORS_ORIGINS (comma separated) wins. Unset means the three localhost dev sites.
ALLOWED_ORIGINS = parse_origins(os.getenv("CORS_ORIGINS", "")) or [
    _env("NYERAS_URL", "http://localhost:5173"),
    _env("PROOFTRAIL_URL", "http://localhost:5174"),
    _env("NXTMOVE_URL", "http://localhost:5175"),
]

DEMO_MODE = os.getenv("DEMO_MODE", "0") == "1"       # 1 = the /dev/reset routes work (demo only). Keep 0 for anything real.
ALLOW_TOKENLESS = os.getenv("ALLOW_TOKENLESS", "0") == "1"   # 1 = learner routes accept requests with no token (local tests only)
AUTH_SECRET = os.getenv("AUTH_SECRET") or secrets.token_hex(32)   # missing secret = random per run (tokens die on restart)
TOKEN_TTL_SECONDS = 8 * 3600
HANDOFF_TTL_SECONDS = 5 * 60

# Caps on AI use per rolling hour. When a cap is hit, AI criteria show Pending and the tests still grade.
AI_CAP_TOTAL_PER_HOUR = _int("AI_CAP_TOTAL_PER_HOUR", 30)
AI_CAP_PER_LEARNER_PER_HOUR = _int("AI_CAP_PER_LEARNER_PER_HOUR", 5)
RESET_KEY = os.getenv("RESET_KEY", "")           # optional extra key for the wipe-everything reset route
