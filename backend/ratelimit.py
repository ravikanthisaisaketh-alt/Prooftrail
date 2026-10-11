"""Caps on paid AI use, so a public demo cannot run up the bill. In memory: resets when the server restarts.
One 'AI use' = one graded attempt (about 6 model calls), one explain-back, or one Attack the Grader try."""
import time
from collections import defaultdict, deque
from . import config

WINDOW = 3600
_total: deque = deque()
_per: dict[str, deque] = defaultdict(deque)


def _prune(q: deque, now: float) -> None:
    while q and now - q[0] > WINDOW:
        q.popleft()


def allow_ai(key: str, per_limit: int | None = -1) -> bool:
    """True and counts it if both caps have room. per_limit=None means only the overall cap applies."""
    now = time.time()
    per_cap = config.AI_CAP_PER_LEARNER_PER_HOUR if per_limit == -1 else per_limit
    _prune(_total, now); _prune(_per[key], now)
    if len(_total) >= config.AI_CAP_TOTAL_PER_HOUR:
        return False
    if per_cap is not None and len(_per[key]) >= per_cap:
        return False
    _total.append(now); _per[key].append(now)
    return True


def clear() -> None:
    _total.clear(); _per.clear()
