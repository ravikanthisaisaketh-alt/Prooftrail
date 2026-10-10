"""Two template questions built from the learner's own code. Repeatable, not free AI text."""
from . import ai_checks


def make_questions(code: str) -> list[dict]:
    qs = []
    c = code.lower()
    if "refund" in c:
        qs.append({"id": "eb_refund", "text": "Your code uses the refund column. Why does that make the total correct?"})
    if "isna" in c or "notna" in c or "fillna" in c or "dropna" in c or "nan" in c:
        qs.append({"id": "eb_missing", "text": "What does your code do when an amount is missing, and why?"})
    if not qs:
        qs.append({"id": "eb_general", "text": "In your own words, what change did you make and why does it fix the bug?"})
    return qs[:2]


def check_answer(llm, question: dict, answer: str) -> dict:
    ai_checks.RUBRIC.setdefault("EB", "Does the answer give a correct reason for the code change?")
    return ai_checks.check(llm, "EB", answer)


def apply_rule(written_yes: bool, answer_results: list[str]) -> str:
    """Written yes + at least one explain-back pass -> 'yes'.
    Written yes + all explain-backs fail -> 'review' (never an automatic fail)."""
    if not written_yes:
        return "no"
    if not answer_results or "yes" in answer_results:
        return "yes"
    return "review"
