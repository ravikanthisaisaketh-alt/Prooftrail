"""FastAPI routes. Thin on purpose: real work lives in pipeline.py, audit.py, consent.py."""
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from . import db, config, audit, pipeline
from .tasks import TASKS, SKILL_TASK, COURSES

@asynccontextmanager
async def lifespan(_app):
    if not _db_ready():
        db.reset()        # first run: create tables and the two sample learners
    if config.LLM_API_KEY:
        from .llm import llm
        app.state.llm = llm
    yield


app = FastAPI(title="ProofTrail", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"])
app.state.llm = None          # set to a real model function after the model test. None = AI off (T-03)

# ---------------- Authentication (demo-grade) ----------------
from . import auth


def current_user(request: Request) -> str | None:
    """Learner id from a valid Bearer token. None if no header. 401 if the header is present but bad."""
    h = request.headers.get("Authorization", "")
    if not h:
        return None
    if not h.startswith("Bearer "):
        raise HTTPException(401, "Please sign in again.")
    data = auth.read_token(h[7:])
    if not data:
        raise HTTPException(401, "Your session is missing or expired. Please sign in again.")
    return data["sub"]


def require_learner(request: Request, learner: str) -> None:
    """401 if the token is bad, 403 if it belongs to someone else. No header is allowed only in DEMO_MODE."""
    who = current_user(request)
    if who is None:
        if config.DEMO_MODE:
            return
        raise HTTPException(401, "Please sign in.")
    if who != learner:
        raise HTTPException(403, "You can only use your own data.")


def attempt_learner(aid: int) -> str:
    c = db.conn(); r = c.execute("SELECT learner FROM attempts WHERE id=?", (aid,)).fetchone(); c.close()
    if not r:
        raise HTTPException(404, "Unknown attempt")
    return r["learner"]


class LoginIn(BaseModel):
    login: str = Field(max_length=100)       # email or learner id
    password: str = Field(max_length=200)

@app.post("/auth/login")
def login(body: LoginIn):
    key = body.login.strip().lower()
    if auth.too_many(key):
        raise HTTPException(429, "Too many tries. Wait a minute and try again.")
    c = db.conn()
    u = c.execute("SELECT * FROM users WHERE lower(email)=? OR lower(id)=?", (key, key)).fetchone()
    c.close()
    ok = auth.check_password(body.password, u["pw_hash"]) if u else auth.check_password(body.password, "00$00")
    if not (u and ok):
        auth.note_failure(key)
        raise HTTPException(401, "That ID or password is not right.")
    return {"token": auth.make_token(u["id"]), "learner": u["id"], "name": u["name"], "expires_in": config.TOKEN_TTL_SECONDS}

@app.get("/auth/me")
def me(request: Request):
    who = current_user(request)
    if who is None:
        raise HTTPException(401, "Please sign in.")
    c = db.conn(); u = c.execute("SELECT id, name FROM users WHERE id=?", (who,)).fetchone(); c.close()
    if not u:
        raise HTTPException(401, "Unknown user.")
    return {"learner": u["id"], "name": u["name"]}

@app.post("/auth/handoff")
def handoff(request: Request):
    """Nyeras asks for a 5 minute, single-use ticket to send the learner to ProofTrail."""
    who = current_user(request)
    if who is None:
        raise HTTPException(401, "Please sign in.")
    return {"handoff": auth.make_token(who, "handoff"), "expires_in": config.HANDOFF_TTL_SECONDS}

class ExchangeIn(BaseModel):
    handoff: str

@app.post("/auth/exchange")
def exchange(body: ExchangeIn):
    data = auth.read_token(body.handoff, "handoff")
    if not data or not auth.use_handoff_once(data):
        raise HTTPException(401, "That link has expired. Go back to Nyeras and press Prove your skill again.")
    return {"token": auth.make_token(data["sub"]), "learner": data["sub"]}



def _db_ready() -> bool:
    try:
        c = db.conn(); c.execute("SELECT task FROM attempts LIMIT 1"); c.execute("SELECT 1 FROM users LIMIT 1"); c.close(); return True
    except Exception:
        return False


class StartIn(BaseModel):
    learner: str
    mode: str = Field(pattern="^(Open|Focus)$")
    tools_declared: str = ""
    task: str = Field(default="t1", pattern="^t[0-9]+$")

class SubmitIn(BaseModel):
    code: str = Field(max_length=20000)       # huge pastes are refused by size
    text: str = Field(max_length=5000)

class SignalIn(BaseModel):
    event: str = Field(pattern="^(tab_leave|large_paste)$")
    value: float = 0
    note: str = ""

@app.get("/health")
def health():
    return {"api": "ok", "ai": "configured" if app.state.llm else "off", "model": config.LLM_MODEL if app.state.llm else None}

@app.post("/dev/reset")
def dev_reset():
    db.reset(); return {"reset": True}

@app.get("/tasks/{task_id}/variant")
def task_variant(task_id: str, learner: str, request: Request):
    require_learner(request, learner)
    t = TASKS.get(task_id)
    if not t:
        raise HTTPException(404, "Unknown task")
    # Visible information only: objective, starter code, rubric, a few sample inputs. Never hidden tests or expected values.
    return {"task_id": t["id"], "task": t["name"], "objective": t["objective"], "starter": t["starter"],
            "criteria": t["criteria"], "sample_rows": t["sample"](learner), "rubric": ["C1", "C2", "C3", "C4", "C5"]}

@app.post("/attempts")
def start_attempt(body: StartIn, request: Request):
    require_learner(request, body.learner)
    c = db.conn()
    if body.task not in TASKS:
        c.close(); raise HTTPException(404, "Unknown task")
    n = c.execute("SELECT COUNT(*) FROM attempts WHERE learner=? AND task=?", (body.learner, body.task)).fetchone()[0]
    if n >= config.ATTEMPT_CAP:
        c.close(); raise HTTPException(400, "Attempt limit reached (3).")
    cur = c.execute("INSERT INTO attempts(learner,attempt_no,mode,tools_declared,task) VALUES(?,?,?,?,?)",
                    (body.learner, n + 1, body.mode, body.tools_declared, body.task))
    c.commit(); aid = cur.lastrowid; c.close()
    audit.append("attempt_started", aid, body.learner, {"mode": body.mode, "task": body.task})
    return {"attempt_id": aid, "attempt_no": n + 1}

@app.post("/attempts/{aid}/signals")
def add_signal(aid: int, body: SignalIn, request: Request):
    require_learner(request, attempt_learner(aid))
    c = db.conn()
    c.execute("INSERT INTO signals(attempt,event,value,note) VALUES(?,?,?,?)", (aid, body.event, body.value, body.note))
    c.commit(); c.close()
    return {"stored": True}      # stored and shown to the learner. Never used for grading.

@app.post("/attempts/{aid}/submit")
def submit(aid: int, body: SubmitIn, request: Request):
    require_learner(request, attempt_learner(aid))
    if not body.code.strip():
        raise HTTPException(400, "Please add your code before submitting.")
    c = db.conn()
    if not c.execute("SELECT 1 FROM attempts WHERE id=?", (aid,)).fetchone():
        c.close(); raise HTTPException(404, "Unknown attempt")
    c.execute("UPDATE attempts SET code=?, text=? WHERE id=?", (body.code, body.text, aid))
    c.commit(); c.close()
    return pipeline.grade(aid, app.state.llm)

@app.get("/profile/{learner}")
def profile(learner: str, request: Request):
    require_learner(request, learner)
    c = db.conn()
    rows = [dict(r) for r in c.execute("SELECT * FROM profiles WHERE learner=?", (learner,))]
    c.close(); return {"learner": learner, "skills": rows}

@app.get("/profile/{learner}/summary")
def profile_summary(learner: str, request: Request, role: str = "jr-data-analyst"):
    require_learner(request, learner)
    """Short summary for the Nyeras strip. Always the learner's own latest result, consent or not."""
    c = db.conn()
    rows = [dict(r) for r in c.execute("SELECT * FROM profiles WHERE learner=?", (learner,))]
    c.close()
    shared = any(consent.is_on(learner, role, t) for t in TASKS)
    if not rows:
        return {"learner": learner, "verified": False, "shared_with_nxtmove": shared, "skills": []}
    latest = max(rows, key=lambda r: r["attempt"])
    return {"learner": learner, "verified": True, "shared_with_nxtmove": shared,
            "date": latest["last_attempt"], "receipt_id": f"R-{latest['attempt']}",
            "skills": [{"skill": r["skill"], "level": r["level"], "status": r["status"], "receipt_id": f"R-{r['attempt']}",
                        "task": SKILL_TASK.get(r["skill"], "t1")} for r in rows]}


@app.get("/learners/{learner}/attempts")
def attempts_used(learner: str, request: Request, task: str = "t1"):
    require_learner(request, learner)
    c = db.conn(); n = c.execute("SELECT COUNT(*) FROM attempts WHERE learner=? AND task=?", (learner, task)).fetchone()[0]; c.close()
    return {"used": n, "cap": config.ATTEMPT_CAP, "left": max(0, config.ATTEMPT_CAP - n)}


@app.post("/dev/reset/{learner}")
def dev_reset_learner(learner: str, request: Request):
    require_learner(request, learner)
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
    task: str = Field(default="t1", pattern="^t[0-9]+$")


@app.post("/consent")
def set_consent(body: ConsentIn, request: Request):
    require_learner(request, body.learner)
    if body.task not in TASKS:
        raise HTTPException(404, "Unknown task")
    consent.set_consent(body.learner, body.role, body.on, body.task)
    audit.append("consent_changed", None, body.learner, {"role": body.role, "on": body.on, "task": body.task})
    return {"ok": True}

@app.get("/consent/{learner}/history")
def consent_history(learner: str, request: Request, role: str = "jr-data-analyst", task: str = "t1"):
    require_learner(request, learner)
    return {"learner": learner, "role": role, "task": task, "on": consent.is_on(learner, role, task), "history": consent.history(learner)}

@app.get("/candidates")
def candidates(role: str = "jr-data-analyst", skill: Optional[str] = None,
               min_level: Optional[str] = None, status: Optional[str] = None,
               recent_days: Optional[int] = None, conditions: Optional[str] = Query(default=None, pattern="^(Open|Focus)$")):
    return {"candidates": consent.candidates(role, skill, min_level, status, recent_days, conditions)}

@app.get("/candidates/{learner}/receipt")
def candidate_receipt(learner: str, skill: str, role: str = "jr-data-analyst"):
    task_id = SKILL_TASK.get(skill, "t1")
    if not consent.is_on(learner, role, task_id):
        raise HTTPException(403, "Learner has not shared this profile.")
    c = db.conn()
    p = c.execute("SELECT * FROM profiles WHERE learner=? AND skill=?", (learner, skill)).fetchone()
    if not p:
        c.close(); raise HTTPException(404, "No evidence for this skill.")
    insight = skill == TASKS[task_id]["insight_skill"]
    wanted = ("C3", "C4", "C5") if insight else ("C1", "C2")
    crit = {r["criterion"]: r["result"] for r in c.execute(
        "SELECT criterion, result FROM criterion_results WHERE attempt=?", (p["attempt"],)) if r["criterion"] in wanted}
    c.close()
    return {"learner": learner, "skill": skill, "level": p["level"], "status": p["status"],
            "confidence": p["confidence"], "mode": p["mode"], "last_attempt": p["last_attempt"],
            "ai_assisted": insight, "task_id": task_id, "receipt_id": f"R-{p['attempt']}",
            "task": TASKS[task_id]["name"] + ": " + TASKS[task_id]["objective"].split(",")[0].rstrip("."), "rubric_version": config.RUBRIC_VERSION,
            "criteria": crit}

# ---------------- Nyeras demo data: per-learner course progress ----------------
@app.get("/learners/{learner}/progress")
def course_progress(learner: str, request: Request):
    require_learner(request, learner)
    c = db.conn()
    got = {r["course"]: r["done"] for r in c.execute("SELECT course, done FROM progress WHERE learner=?", (learner,))}
    c.close()
    return {"learner": learner, "courses": {k: {"done": got.get(k, 0), "total": v["lessons"], "task": v["task"]} for k, v in COURSES.items()}}

@app.post("/learners/{learner}/progress/{course}/complete")
def complete_course(learner: str, course: str, request: Request):
    """Demo helper so the exam is never blocked: marks every lesson of one course complete."""
    require_learner(request, learner)
    if course not in COURSES:
        raise HTTPException(404, "Unknown course")
    c = db.conn()
    c.execute("INSERT OR REPLACE INTO progress VALUES(?,?,?)", (learner, course, COURSES[course]["lessons"]))
    c.commit(); c.close()
    return {"course": course, "done": COURSES[course]["lessons"], "total": COURSES[course]["lessons"]}

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
def get_explainback(aid: int, request: Request):
    require_learner(request, attempt_learner(aid))
    c = db.conn(); a = c.execute("SELECT code FROM attempts WHERE id=?", (aid,)).fetchone(); c.close()
    if not a:
        raise HTTPException(404, "Unknown attempt")
    return {"questions": eb.make_questions(a["code"])}

@app.post("/attempts/{aid}/explainback")
def post_explainback(aid: int, body: AnswersIn, request: Request):
    require_learner(request, attempt_learner(aid))
    if app.state.llm is None:
        raise HTTPException(503, "The AI check is not available right now. Your answers were not judged.")
    c = db.conn()
    a = c.execute("SELECT code, learner, task FROM attempts WHERE id=?", (aid,)).fetchone()
    c3 = c.execute("SELECT result FROM criterion_results WHERE attempt=? AND criterion='C3'", (aid,)).fetchone()
    qs = {q["id"]: q for q in eb.make_questions(a["code"])}
    results = [eb.check_answer(app.state.llm, qs[qid], ans)["result"] for qid, ans in body.answers.items() if qid in qs]
    outcome = eb.apply_rule(bool(c3 and c3["result"] == "pass"), results)
    if outcome == "review":     # written yes but every explain-back failed: a person looks. Never an automatic fail.
        c.execute("UPDATE profiles SET status='Needs human review', confidence='Pending' WHERE learner=? AND skill=?", (a["learner"], TASKS[a["task"] or "t1"]["insight_skill"]))
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
def appeal(body: AppealIn, request: Request):
    require_learner(request, attempt_learner(body.attempt_id))
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
    att = c.execute("SELECT learner, task FROM attempts WHERE id=?", (r["attempt"],)).fetchone()
    learner = att["learner"]
    c.execute("UPDATE profiles SET level=?, status='Evidenced', confidence='Human reviewed' WHERE learner=? AND skill=?", (level, learner, TASKS[att["task"] or "t1"]["insight_skill"]))
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
