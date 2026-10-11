"""The submission pipeline. Read this file top to bottom: it IS the architecture."""
import datetime
from . import db, audit, config, ratelimit
from .tasks import TASKS
from .grader import hidden_tests, intake as intake_mod, ai_checks, explainback, routing

FEEDBACK_TEXT = {   # category -> message. Never contains expected values.
    "wrong_total": "The totals do not match the data. Re-read how each order should be counted.",
    "crashed": "Your code stopped with an error on some data.",
    "timed_out": "Your code took too long to run.",
    "no_result": "Your function did not return a result.",
    "edge_case_wrong_total": "A special case (like an empty or odd month) gives a wrong total.",
    "edge_case_crashed": "A special case (like an empty or odd month) makes your code stop.",
    "edge_case_timed_out": "A special case makes your code run too long.",
    "number_not_matching_data": "The number you quote does not match the data.",
    "thin_answer": "The explanation is too short to check. Add the cause and why your fix works.",
}


def _fb(v: dict) -> str:
    if v["pass"]:
        return "pass"
    if v.get("pending"):
        return "Pending: the AI check is not available right now"
    return FEEDBACK_TEXT.get(v["category"], "Not met yet")


def grade(attempt_id: int, llm=None) -> dict:
    c = db.conn()
    a = c.execute("SELECT * FROM attempts WHERE id=?", (attempt_id,)).fetchone()
    task = TASKS[a["task"] or "t1"]
    results, flags = {}, []

    # NOTE: signals (tab leaves, pastes) are NOT read anywhere in this function. By design.

    # 1 intake (no AI)
    gate = intake_mod.intake(a["text"])
    if gate["instruction_like"]:
        flags.append("instruction_like")

    # 2 hidden tests (these decide the code criteria)
    t = config.RUN_TIMEOUT_SECONDS
    r1, r2, r4 = task["grade"](a["code"], a["text"], a["learner"], t)
    results["C1"], results["C2"], results["C4"] = r1, r2, r4

    # 3 AI checks (C3, C5) only if the answer is not thin and an AI is available
    ai_words = {}
    if gate["thin"]:
        ai_words = {"C3": "no", "C5": "no"}
        results["C3"] = results["C5"] = {"pass": False, "category": "thin_answer"}
    elif llm is None or not ratelimit.allow_ai(a["learner"]):      # no AI, or the hourly cap is used up: Pending
        ai_words = {"C3": "pending", "C5": "pending"}
        results["C3"] = results["C5"] = {"pass": False, "category": None, "pending": True}
    else:
        for crit in ("C3", "C5"):
            out = ai_checks.check(llm, crit, a["text"], config.AI_RUNS, task["ai_hint"])
            ai_words[crit] = out["result"]
            for i, run in enumerate(out["runs"], 1):
                if run:
                    c.execute("INSERT INTO ai_runs(attempt,criterion,run_no,model,prompt_version,raw_output,answer,quote) VALUES(?,?,?,?,?,?,?,?)",
                              (attempt_id, crit, i, config.LLM_MODEL, config.PROMPT_VERSION, run["raw"], run["answer"], run["quote"]))
            results[crit] = {"pass": out["result"] == "yes", "category": None}
            if out["result"] == "disagree":
                flags.append("disagreement")

    # 4 levels and routing
    debug_level = routing.debugging_level(r1["pass"], r2["pass"])
    insight = routing.insight_level(ai_words["C3"], r4["pass"], ai_words["C5"])
    status, confidence = routing.route(list(ai_words.values()), flags, gate["thin"])

    # 5 save
    now = datetime.date.today().isoformat()
    for crit, r in results.items():
        src = "ai" if crit in ("C3", "C5") else "test"
        c.execute("INSERT INTO criterion_results(attempt,criterion,result,source,category) VALUES(?,?,?,?,?)",
                  (attempt_id, crit, "pass" if r["pass"] else ("pending" if r.get("pending") else "fail"), src, r["category"]))
    for f in flags:
        c.execute("INSERT INTO flags(attempt,type,details) VALUES(?,?,?)", (attempt_id, f, ""))
    for skill, level, st, conf in ((task["skill"], debug_level, "Evidenced", "High"),
                                    (task["insight_skill"], insight, status, confidence)):
        c.execute("INSERT OR REPLACE INTO profiles VALUES(?,?,?,?,?,?,?,?)",
                  (a["learner"], skill, level, st, conf, a["mode"], now, attempt_id))
    c.commit(); c.close()

    audit.append("graded", attempt_id, "system",
                 {"learner": a["learner"], "task": task["id"], "debugging": debug_level, "insight": insight,
                  "status": status, "flags": flags, "criteria": {k: v["pass"] for k, v in results.items()}})

    feedback = {k: _fb(v) for k, v in results.items()}
    return {"debugging": debug_level, "insight": insight, "status": status, "confidence": confidence,
            "flags": flags, "feedback": feedback, "receipt_id": f"R-{attempt_id}"}
