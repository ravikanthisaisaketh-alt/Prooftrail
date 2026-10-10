"""Live end-to-end check against a RUNNING back end (default http://localhost:8000).
Run: python -I scripts/e2e.py   (needs the repo root on sys.path for the sample solution)"""
import json, sys, urllib.request, urllib.error
sys.path.insert(0, ".")
from backend.tests.test_prooftrail import FIXED, good_text

API = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
ROLE, L = "jr-data-analyst", "L-001"
fails = []

def call(method, path, body=None, origin=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", **({"Origin": origin} if origin else {})})
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

call("POST", f"/dev/reset/{L}")
print("\nFAILED: " + ", ".join(fails) if fails else "\nALL PASSED")
sys.exit(1 if fails else 0)
