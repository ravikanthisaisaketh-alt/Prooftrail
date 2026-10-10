"""FastAPI routes. Thin on purpose: real work lives in pipeline.py, audit.py, consent.py."""
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from . import db, config, audit, pipeline
from .variants import variant_for, build_orders

@asynccontextmanager
async def lifespan(_app):
    if not _db_ready():
        db.reset()        # first run: create tables and the two sample learners
    yield


app = FastAPI(title="ProofTrail", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"])
app.state.llm = None          # set to a real model function after the model test. None = AI off (T-03)


def _db_ready() -> bool:
    try:
        c = db.conn(); c.execute("SELECT 1 FROM learners LIMIT 1"); c.close(); return True
    except Exception:
        return False


class StartIn(BaseModel):
    learner: str
    mode: str = Field(pattern="^(Open|Focus)$")
    tools_declared: str = ""

class SubmitIn(BaseModel):
    code: str = Field(max_length=20000)       # huge pastes are refused by size
    text: str = Field(max_length=5000)

class SignalIn(BaseModel):
    event: str = Field(pattern="^(tab_leave|large_paste)$")
    value: float = 0
    note: str = ""

@app.get("/health")
def health():
    return {"api": "ok", "ai": "configured" if app.state.llm else "off"}

@app.post("/dev/reset")
def dev_reset():
    db.reset(); return {"reset": True}

@app.get("/tasks/t1/variant")
def task_variant(learner: str):
    v = variant_for(learner, config.TASK_VERSION)
    rows = build_orders(v)[:5]       # sample rows only. Never hidden tests, never expected values.
    return {"task": "Fix monthly_revenue(df)", "sample_rows": rows, "rubric": ["C1", "C2", "C3", "C4", "C5"]}

@app.post("/attempts")
def start_attempt(body: StartIn):
    c = db.conn()
    n = c.execute("SELECT COUNT(*) FROM attempts WHERE learner=?", (body.learner,)).fetchone()[0]
    if n >= config.ATTEMPT_CAP:
        c.close(); raise HTTPException(400, "Attempt limit reached (3).")
    cur = c.execute("INSERT INTO attempts(learner,attempt_no,mode,tools_declared) VALUES(?,?,?,?)",
                    (body.learner, n + 1, body.mode, body.tools_declared))
    c.commit(); aid = cur.lastrowid; c.close()
    audit.append("attempt_started", aid, body.learner, {"mode": body.mode})
    return {"attempt_id": aid, "attempt_no": n + 1}

@app.post("/attempts/{aid}/signals")
def add_signal(aid: int, body: SignalIn):
    c = db.conn()
    c.execute("INSERT INTO signals(attempt,event,value,note) VALUES(?,?,?,?)", (aid, body.event, body.value, body.note))
    c.commit(); c.close()
    return {"stored": True}      # stored and shown to the learner. Never used for grading.

@app.post("/attempts/{aid}/submit")
def submit(aid: int, body: SubmitIn):
    if not body.code.strip():
        raise HTTPException(400, "Please add your code before submitting.")
    c = db.conn()
    if not c.execute("SELECT 1 FROM attempts WHERE id=?", (aid,)).fetchone():
        c.close(); raise HTTPException(404, "Unknown attempt")
    c.execute("UPDATE attempts SET code=?, text=? WHERE id=?", (body.code, body.text, aid))
    c.commit(); c.close()
    return pipeline.grade(aid, app.state.llm)

@app.get("/profile/{learner}")
def profile(learner: str):
    c = db.conn()
    rows = [dict(r) for r in c.execute("SELECT * FROM profiles WHERE learner=?", (learner,))]
    c.close(); return {"learner": learner, "skills": rows}

@app.get("/profile/{learner}/summary")
def profile_summary(learner: str, role: str = "jr-data-analyst"):
    """Short summary for the Nyeras strip. Always the learner's own latest result, consent or not."""
    c = db.conn()
    rows = [dict(r) for r in c.execute("SELECT * FROM profiles WHERE learner=?", (learner,))]
    c.close()
    shared = consent.is_on(learner, role)
    if not rows:
        return {"learner": learner, "verified": False, "shared_with_nxtmove": shared, "skills": []}
    latest = max(rows, key=lambda r: r["attempt"])
    return {"learner": learner, "verified": True, "shared_with_nxtmove": shared,
            "date": latest["last_attempt"], "receipt_id": f"R-{latest['attempt']}",
            "skills": [{"skill": r["skill"], "level": r["level"], "status": r["status"]} for r in rows]}


@app.post("/dev/reset/{learner}")
def dev_reset_learner(learner: str):
    """Demo helper: clear one learner's attempts, results and consent so the demo can be repeated."""
    c = db.conn()
    ids = [r[0] for r in c.execute("SELECT id FROM attempts WHERE learner=?", (learner,))]
    for i in ids:
        for t in ("criterion_results", "ai_runs", "flags", "signals", "reviews"):
            c.execute(f"DELETE FROM {t} WHERE attempt=?", (i,))
    c.execute("DELETE FROM attempts WHERE learner=?", (learner,))
    c.execute("DELETE FROM profiles WHERE learner=?", (learner,))
    c.execute("DELETE FROM consents WHERE learner=?", (learner,))
    c.commit(); c.close()
    return {"reset": learner}


@app.get("/verify/{receipt_id}")
def verify(receipt_id: str):
    r = audit.verify()
    c = db.conn(); n = c.execute("SELECT COUNT(*) FROM audit_log").fetchone()[0]; c.close()
    return {"receipt_id": receipt_id, "result": "VALID" if r["valid"] else f"INVALID at row {r['bad_row']}", "entries": n}

@app.get("/audit")
def audit_rows():
    c = db.conn()
    rows = [dict(r) for r in c.execute("SELECT id,event,attempt,actor,data,versions,fingerprint,created FROM audit_log ORDER BY id")]
    c.close(); return {"rows": rows}


# ---------------- Sharing: consent and the recruiter routes (Phase 2) ----------------
from . import consent


class ConsentIn(BaseModel):
    learner: str
    role: str
    on: bool


@app.post("/consent")
def set_consent(body: ConsentIn):
    consent.set_consent(body.learner, body.role, body.on)
    audit.append("consent_changed", None, body.learner, {"role": body.role, "on": body.on})
    return {"ok": True}

@app.get("/consent/{learner}/history")
def consent_history(learner: str, role: str = "jr-data-analyst"):
    return {"learner": learner, "role": role, "on": consent.is_on(learner, role), "history": consent.history(learner)}

@app.get("/candidates")
def candidates(role: str = "jr-data-analyst", skill: Optional[str] = None,
               min_level: Optional[str] = None, status: Optional[str] = None):
    return {"candidates": consent.candidates(role, skill, min_level, status)}

@app.get("/candidates/{learner}/receipt")
def candidate_receipt(learner: str, skill: str, role: str = "jr-data-analyst"):
    if not consent.is_on(learner, role):
        raise HTTPException(403, "Learner has not shared this profile.")
    c = db.conn()
    p = c.execute("SELECT * FROM profiles WHERE learner=? AND skill=?", (learner, skill)).fetchone()
    if not p:
        c.close(); raise HTTPException(404, "No evidence for this skill.")
    wanted = ("C1", "C2") if skill == "Debugging" else ("C3", "C4", "C5")
    crit = {r["criterion"]: r["result"] for r in c.execute(
        "SELECT criterion, result FROM criterion_results WHERE attempt=?", (p["attempt"],)) if r["criterion"] in wanted}
    c.close()
    return {"learner": learner, "skill": skill, "level": p["level"], "status": p["status"],
            "confidence": p["confidence"], "mode": p["mode"], "last_attempt": p["last_attempt"],
            "ai_assisted": skill == "Insight Communication", "receipt_id": f"R-{p['attempt']}",
            "task": "Fix monthly_revenue(df) and explain the fix", "rubric_version": config.RUBRIC_VERSION,
            "criteria": crit}

# ---------------- Explain-back, Attack the Grader, appeals, doubt panel ----------------
from .grader import explainback as eb, intake as intake_mod, ai_checks, routing


class AnswersIn(BaseModel):
    answers: dict[str, str]            # question id -> learner's answer

class ChallengeIn(BaseModel):
    text: str = Field(max_length=5000)

class AppealIn(BaseModel):
    attempt_id: int
    criterion: str = Field(pattern="^(C3|C5)$")

class DecideIn(BaseModel):
    reviewer: str
    decision: str = Field(pattern="^(yes|no)$")
    reason: str = Field(min_length=10)        # a reason is mandatory


@app.get("/attempts/{aid}/explainback")
def get_explainback(aid: int):
    c = db.conn(); a = c.execute("SELECT code FROM attempts WHERE id=?", (aid,)).fetchone(); c.close()
    if not a:
        raise HTTPException(404, "Unknown attempt")
    return {"questions": eb.make_questions(a["code"])}

@app.post("/attempts/{aid}/explainback")
def post_explainback(aid: int, body: AnswersIn):
    if app.state.llm is None:
        raise HTTPException(503, "The AI check is not available right now. Your answers were not judged.")
    c = db.conn()
    a = c.execute("SELECT code, learner FROM attempts WHERE id=?", (aid,)).fetchone()
    c3 = c.execute("SELECT result FROM criterion_results WHERE attempt=? AND criterion='C3'", (aid,)).fetchone()
    qs = {q["id"]: q for q in eb.make_questions(a["code"])}
    results = [eb.check_answer(app.state.llm, qs[qid], ans)["result"] for qid, ans in body.answers.items() if qid in qs]
    outcome = eb.apply_rule(bool(c3 and c3["result"] == "pass"), results)
    if outcome == "review":     # written yes but every explain-back failed: a person looks. Never an automatic fail.
        c.execute("UPDATE profiles SET status='Needs human review', confidence='Pending' WHERE learner=? AND skill='Insight Communication'", (a["learner"],))
        c.execute("INSERT INTO flags(attempt,type,details) VALUES(?,?,?)", (aid, "explainback_mismatch", ""))
    c.commit(); c.close()
    audit.append("explainback_checked", aid, "system", {"results": results, "outcome": outcome})
    return {"outcome": outcome, "message": "A person will take a look." if outcome == "review" else "Thanks, recorded."}

@app.post("/challenge/try")
def challenge(body: ChallengeIn):
    """Attack the Grader: shows what the safety layers do. Saves NOTHING."""
    gate = intake_mod.intake(body.text)
    out = {"thin": gate["thin"], "instruction_like": gate["instruction_like"], "ai": None}
    if not gate["thin"] and app.state.llm is not None:
        res = ai_checks.check(app.state.llm, "C3", body.text, config.AI_RUNS)
        out["ai"] = {"result": res["result"], "answers": [r["answer"] if r else None for r in res["runs"]]}
    flags = ["instruction_like"] if gate["instruction_like"] else []
    ai_results = [out["ai"]["result"]] if out["ai"] else []
    out["would_route_to"] = routing.route(ai_results, flags, gate["thin"])[0]
    return out

@app.post("/appeals")
def appeal(body: AppealIn):
    c = db.conn()
    cur = c.execute("INSERT INTO reviews(attempt,criterion) VALUES(?,?)", (body.attempt_id, body.criterion))
    c.commit(); rid = cur.lastrowid; c.close()
    audit.append("appeal_opened", body.attempt_id, "learner", {"criterion": body.criterion})
    return {"review_id": rid}

@app.get("/review/queue")
def review_queue():
    """Blind view: the reviewer sees the text, never the learner label."""
    c = db.conn()
    rows = [dict(r) for r in c.execute(
        "SELECT r.id AS review_id, r.criterion, a.text FROM reviews r JOIN attempts a ON a.id=r.attempt WHERE r.decision IS NULL")]
    c.close(); return {"queue": rows}

@app.post("/review/{rid}/decide")
def decide(rid: int, body: DecideIn):
    c = db.conn()
    r = c.execute("SELECT * FROM reviews WHERE id=?", (rid,)).fetchone()
    if not r:
        c.close(); raise HTTPException(404, "Unknown review")
    c.execute("UPDATE reviews SET reviewer=?, decision=?, reason=? WHERE id=?", (body.reviewer, body.decision, body.reason, rid))
    res = {x["criterion"]: x["result"] for x in c.execute("SELECT criterion, result FROM criterion_results WHERE attempt=?", (r["attempt"],))}
    res[r["criterion"]] = "yes" if body.decision == "yes" else "no"
    to_word = lambda v: "yes" if v in ("yes", "pass") else "no"
    level = routing.insight_level(to_word(res.get("C3")), res.get("C4") == "pass", to_word(res.get("C5")))
    learner = c.execute("SELECT learner FROM attempts WHERE id=?", (r["attempt"],)).fetchone()["learner"]
    c.execute("UPDATE profiles SET level=?, status='Evidenced', confidence='Human reviewed' WHERE learner=? AND skill='Insight Communication'", (level, learner))
    c.commit(); c.close()
    audit.append("human_decision", r["attempt"], "reviewer", {"criterion": r["criterion"], "decision": body.decision, "reason": body.reason})
    return {"level": level}

@app.get("/quality/review-rate")
def review_rate():
    c = db.conn()
    total = c.execute("SELECT COUNT(*) FROM profiles WHERE skill='Insight Communication'").fetchone()[0]
    review = c.execute("SELECT COUNT(*) FROM profiles WHERE skill='Insight Communication' AND status='Needs human review'").fetchone()[0]
    c.close()
    rate = round(100 * review / total, 1) if total else None
    return {"checked": total, "sent_to_review": review, "review_rate_pct": rate,
            "note": "Rule of thumb: above about 33 percent, the rubric wording is probably too vague."}
