"""Live end-to-end check against a RUNNING back end (default http://localhost:8000).
Run: python -I scripts/e2e.py   (needs the repo root on sys.path for the sample solution)"""
import json, sys, urllib.request, urllib.error
sys.path.insert(0, ".")
from backend.tests.test_prooftrail import FIXED, good_text, T2_FIXED, T3_FIXED

API = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
ROLE, L = "jr-data-analyst", "L-001"
fails = []

TOKENS = {}

def call(method, path, body=None, origin=None, token="L-001"):
    """token: a learner id (uses that learner's session token), a raw token string, or None for no token."""
    tok = TOKENS.get(token, token)
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", **({"Origin": origin} if origin else {}),
                                          **({"Authorization": "Bearer " + tok} if tok else {})})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, {}, {}

def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

def attempt():
    _, a, _ = call("POST", "/attempts", {"learner": L, "mode": "Open"})
    _, r, _ = call("POST", f"/attempts/{a['attempt_id']}/submit", {"code": FIXED, "text": good_text(L)})
    return r

def listed(): return any(c["learner"] == L for c in call("GET", "/candidates?min_level=Not%20yet")[1]["candidates"])
def consent(on): call("POST", "/consent", {"learner": L, "role": ROLE, "on": on})
def summary(): return call("GET", f"/profile/{L}/summary")[1]

print("-- login")
for who, pw in (("L-001", "demo-pass-1"), ("L-002", "demo-pass-2")):
    code, body, _ = call("POST", "/auth/login", {"login": who, "password": pw}, token=None)
    check(f"login works for {who}", code == 200 and body.get("token"))
    if code == 200: TOKENS[who] = body["token"]
check("wrong password gives 401", call("POST", "/auth/login", {"login": "L-001", "password": "wrong"}, token=None)[0] == 401)
check("/auth/me returns the learner from the token", call("GET", "/auth/me")[1].get("learner") == "L-001")
check("no token gives 401 on a learner route", call("GET", "/profile/L-001/summary", token=None)[0] == 401)
check("bad token gives 401", call("GET", "/profile/L-001/summary", token="junk.token")[0] == 401)
check("learner A cannot read learner B's data (403)", call("GET", "/profile/L-002/summary", token="L-001")[0] == 403)
check("learner A cannot change learner B's consent (403)", call("POST", "/consent", {"learner": "L-002", "role": ROLE, "on": True}, token="L-001")[0] == 403)
code, ho, _ = call("POST", "/auth/handoff", token="L-001")
code2, ex, _ = call("POST", "/auth/exchange", {"handoff": ho.get("handoff", "")}, token=None)
check("handoff ticket exchanges for a session once", code == 200 and code2 == 200 and ex.get("learner") == "L-001"
      and call("POST", "/auth/exchange", {"handoff": ho["handoff"]}, token=None)[0] == 401)
print()
for o in ("http://localhost:5173", "http://localhost:5174", "http://localhost:5175"):
    check(f"CORS allows {o}", call("GET", "/health", origin=o)[2].get("access-control-allow-origin") == o)

print("\n-- before any attempt")
call("POST", f"/dev/reset/{L}")
check("summary says not verified", summary()["verified"] is False)
check("not listed in NxtMove", not listed())

print("\n-- consent ON")
r = attempt(); consent(True); s = summary()
check("Nyeras summary updated (verified, level, date, receipt)", s["verified"] and s["date"] and s["receipt_id"] == r["receipt_id"] and s["skills"])
check("summary shows shared = yes", s["shared_with_nxtmove"] is True)
check("NxtMove lists L-001", listed())
code, rec, _ = call("GET", f"/candidates/{L}/receipt?skill=Debugging")
check("NxtMove receipt present with task, rubric, criteria", code == 200 and rec["receipt_id"] == r["receipt_id"] and rec["rubric_version"] and rec["criteria"])
check("no accommodation or count fields in recruiter responses", not any(k in json.dumps(rec) + json.dumps(call('GET', '/candidates?min_level=Not%20yet')[1]) for k in ("accommodation", "paste", "tab_leave", "focus_count")))

print("\n-- consent OFF from the start")
call("POST", f"/dev/reset/{L}"); attempt(); consent(False); s = summary()
check("Nyeras summary updated", s["verified"] and s["receipt_id"])
check("summary shows shared = no", s["shared_with_nxtmove"] is False)
check("NxtMove does NOT list L-001", not listed())
check("NxtMove receipt refused", call("GET", f"/candidates/{L}/receipt?skill=Debugging")[0] in (403, 404))

print("\n-- ON then revoke")
call("POST", f"/dev/reset/{L}"); attempt(); consent(True)
check("listed while ON", listed())
consent(False)
check("not listed after revoke", not listed())
check("receipt refused after revoke", call("GET", f"/candidates/{L}/receipt?skill=Debugging")[0] in (403, 404))
s = summary()
check("Nyeras summary still shows the result", s["verified"] and s["receipt_id"] and s["shared_with_nxtmove"] is False)

print("\n-- courses, tasks and per-task consent")
for l in ("L-001", "L-002"): call("POST", f"/dev/reset/{l}", token=l)
v = {t: call("GET", f"/tasks/{t}/variant?learner=L-001")[1] for t in ("t1", "t2", "t3")}
check("each course opens its own task (distinct objective and starter)", len({v[t]["objective"] for t in v}) == 3 and len({v[t]["starter"] for t in v}) == 3)
def run(task, code, text, learner="L-001"):
    _, a, _ = call("POST", "/attempts", {"learner": learner, "mode": "Open", "task": task}, token=learner)
    return call("POST", f"/attempts/{a['attempt_id']}/submit", {"code": code, "text": text}, token=learner)[1]
r2, r3 = run("t2", T2_FIXED, "x"), run("t3", T3_FIXED, "x")
check("text cleaning and data structures reference solutions score Proficient on code", r2["debugging"] == "Proficient" and r3["debugging"] == "Proficient")
sk = {x["skill"] for x in call("GET", f"/profile/{L}/summary")[1]["skills"]}
check("profile has one row per skill", {"Text cleaning", "Data structures"} <= sk)
for _ in range(2): run("t2", T2_FIXED, "x")
check("attempt cap applies per task", call("POST", "/attempts", {"learner": L, "mode": "Open", "task": "t2"})[0] == 400
      and call("POST", "/attempts", {"learner": L, "mode": "Open", "task": "t1"})[0] == 200)
call("POST", "/consent", {"learner": "L-002", "role": ROLE, "on": True, "task": "t2"}, token="L-002"); run("t2", T2_FIXED, "x", "L-002")
call("POST", "/consent", {"learner": L, "role": ROLE, "on": False, "task": "t2"})
ids = [c["learner"] for c in call("GET", "/candidates?min_level=Not%20yet")[1]["candidates"]]
check("consent holds per learner: L-002 listed, L-001 not", "L-002" in ids and L not in ids)
call("POST", "/consent", {"learner": L, "role": ROLE, "on": True, "task": "t3"})
c1 = [c for c in call("GET", "/candidates?min_level=Not%20yet")[1]["candidates"] if c["learner"] == L]
check("only the consented task's skills are listed", c1 and all(x["skill"].startswith("Data structures") or x["skill"].startswith("Insight: Data") for x in c1[0]["skills"]))
call("POST", "/dev/reset/L-002", token="L-002")
call("POST", f"/dev/reset/{L}")
print("\nFAILED: " + ", ".join(fails) if fails else "\nALL PASSED")
sys.exit(1 if fails else 0)
