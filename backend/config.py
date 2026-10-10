"""Settings in one place. Keys come from .env, never from code."""
import os
from dotenv import load_dotenv

load_dotenv()  # reads backend/.env or the folder you run from

DB_PATH = os.getenv("DB_PATH", "prooftrail.db")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")        # empty means "AI is off"
LLM_MODEL = os.getenv("LLM_MODEL", "UNSET-run-model-test-first")
PROMPT_VERSION = "p1"
RUBRIC_VERSION = "r1"
TASK_VERSION = "t1"
ENGINE_VERSION = "e1"
ATTEMPT_CAP = 3
RUN_TIMEOUT_SECONDS = 5
AI_RUNS = 3
ALLOWED_ORIGINS = [
    os.getenv("NYERAS_URL", "http://localhost:5173"),
    os.getenv("PROOFTRAIL_URL", "http://localhost:5174"),
    os.getenv("NXTMOVE_URL", "http://localhost:5175"),
]
