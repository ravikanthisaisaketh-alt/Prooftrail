"""Consent: OFF by default. Recruiter routes call is_on() on EVERY request."""
import datetime
from . import db

LEVEL_ORDER = {"Not yet": 0, "Developing": 1, "Proficient": 2}


def set_consent(learner: str, role: str, on: bool, task: str = "t1") -> None:
    c = db.conn()
    c.execute("INSERT INTO consents(learner, role, on_off, task) VALUES(?,?,?,?)", (learner, role, int(on), task))
    c.commit(); c.close()


def is_on(learner: str, role: str, task: str = "t1") -> bool:
    """Consent is per learner, per role and per task. No row means OFF."""
    c = db.conn()
    r = c.execute("SELECT on_off FROM consents WHERE learner=? AND role=? AND task=? ORDER BY id DESC LIMIT 1",
                  (learner, role, task)).fetchone()
    c.close()
    return bool(r and r["on_off"])          # no row means OFF


def history(learner: str) -> list[dict]:
    c = db.conn()
    rows = [dict(r) for r in c.execute("SELECT role, on_off, changed, task FROM consents WHERE learner=? ORDER BY id", (learner,))]
    c.close()
    return rows


def candidates(role: str, skill: str | None, min_level: str | None, status: str | None,
               recent_days: int | None = None, conditions: str | None = None) -> list[dict]:
    """Only consented learners. Neutral order (by learner id). No score, no rank.
    Deliberately returns NO accommodations and NO focus or paste counts."""
    from .tasks import SKILL_TASK
    c = db.conn()
    out = []
    for l in c.execute("SELECT id FROM learners ORDER BY id"):
        skills = []
        for p in c.execute("SELECT * FROM profiles WHERE learner=?", (l["id"],)):
            if not is_on(l["id"], role, SKILL_TASK.get(p["skill"], "t1")):
                continue            # only skills from tasks the learner chose to share
            if skill and p["skill"] != skill:
                continue
            if min_level and LEVEL_ORDER[p["level"]] < LEVEL_ORDER[min_level]:
                continue
            if status and p["status"] != status:
                continue
            if conditions and p["mode"] != conditions:
                continue
            if recent_days is not None and (datetime.date.today() - datetime.date.fromisoformat(p["last_attempt"])).days > recent_days:
                continue
            skills.append({"skill": p["skill"], "level": p["level"], "status": p["status"],
                           "confidence": p["confidence"], "last_attempt": p["last_attempt"], "mode": p["mode"]})
        if skills:
            out.append({"learner": l["id"], "skills": skills})
    c.close()
    return out
