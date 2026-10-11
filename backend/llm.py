"""Gemini adapter: llm(prompt) -> JSON string matching the Verdict schema.
Never raises and never returns a pass on failure: any problem returns "" (not valid JSON),
which ai_checks treats as a failed run, so the pipeline shows Pending or Needs human review.
The key is read from config and is never logged."""
import logging
from google import genai
from google.genai import types
from . import config
from .grader.ai_checks import Verdict

log = logging.getLogger("prooftrail.llm")
TIMEOUT_MS = 20_000
_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=config.LLM_API_KEY,
                               http_options=types.HttpOptions(timeout=TIMEOUT_MS))
    return _client


def llm(prompt: str) -> str:
    try:
        resp = _get_client().models.generate_content(
            model=config.LLM_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=Verdict,
                temperature=0.2,
            ),
        )
        return resp.text or ""
    except Exception as e:          # API error, timeout, rate limit, blocked output
        log.warning("model call failed: %s", type(e).__name__)   # class name only, never the message or key
        return ""
