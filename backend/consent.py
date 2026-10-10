"""Consent: OFF by default. Recruiter routes call is_on() on EVERY request."""
from . import db

LEVEL_ORDER = {"Not yet": 0, "Developing": 1, "Proficient": 2}


def set_consent(learner: str, role: str, on: bool) -> None:
    c = db.conn()
    c.execute("INSERT INTO consents(learner, role, on_off) VALUES(?,?,?)", (learner, role, int(on)))
    c.commit(); c.close()


def is_on(learner: str, role: str) -> bool:
    c = db.conn()
    r = c.execute("SELECT on_off FROM consents WHERE learner=? AND role=? ORDER BY id DESC LIMIT 1",
                  (learner, role)).fetchone()
    c.close()
    return bool(r and r["on_off"])          # no row means OFF


def history(learner: str) -> list[dict]:
    c = db.conn()
    rows = [dict(r) for r in c.execute("SELECT role, on_off, changed FROM consents WHERE learner=? ORDER BY id", (learner,))]
    c.close()
    return rows


def candidates(role: str, skill: str | None, min_level: str | None, status: str | None) -> list[dict]:
    """Only consented learners. Neutral order (by learner id). No score, no rank.
    Deliberately returns NO accommodations and NO focus or paste counts."""
    c = db.conn()
    out = []
    for l in c.execute("SELECT id FROM learners ORDER BY id"):
        if not is_on(l["id"], role):
            continue
        skills = []
        for p in c.execute("SELECT * FROM profiles WHERE learner=?", (l["id"],)):
            if skill and p["skill"] != skill:
                continue
            if min_level and LEVEL_ORDER[p["level"]] < LEVEL_ORDER[min_level]:
                continue
            if status and p["status"] != status:
                continue
            skills.append({"skill": p["skill"], "level": p["level"], "status": p["status"],
                           "confidence": p["confidence"], "last_attempt": p["last_attempt"], "mode": p["mode"]})
        if skills:
            out.append({"learner": l["id"], "skills": skills})
    c.close()
    return out
