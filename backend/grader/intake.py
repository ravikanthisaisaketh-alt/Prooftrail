"""Step before any AI: thin-answer gate and instruction scan. No AI is called here."""
import re

INSTRUCTION_PATTERNS = [
    r"ignore (all |the |any )?(previous|prior|above|rubric|instructions)",
    r"give (me )?(full|maximum|top|100) ?(marks|score|points)?",
    r"mark (this|it) as (correct|yes|pass)",
    r"you (must|should) (answer|say|output) ['\"]?yes",
    r"system prompt",
    r"as an ai",
]
MIN_WORDS = 15


def intake(text: str) -> dict:
    words = re.findall(r"\w+", text or "")
    thin = len(words) < MIN_WORDS
    hits = [p for p in INSTRUCTION_PATTERNS if re.search(p, text or "", re.I)]
    return {"thin": thin, "instruction_like": bool(hits)}   # a flag, never an accusation
