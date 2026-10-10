"""Turns criterion results into a level, status and confidence. AI never raises a failed test."""

def debugging_level(c1: bool, c2: bool) -> str:
    if c1 and c2:
        return "Proficient"
    return "Developing" if c1 else "Not yet"


def insight_level(c3: str, c4: bool, c5: str) -> str:
    yes = [c3 == "yes", c4, c5 == "yes"]
    if all(yes):
        return "Proficient"
    return "Developing" if any(yes) else "Not yet"


def route(ai_results: list[str], flags: list[str], thin: bool) -> tuple[str, str]:
    """Returns (status, confidence) for the Insight skill."""
    if flags:                                   # a flag always means a person looks
        return "Needs human review", "Pending"
    if thin:
        return "Not yet evidenced", "n/a"
    if any(r in ("disagree", "pending", "review") for r in ai_results):
        return "Needs human review", "Pending"
    return "Evidenced", "High"
