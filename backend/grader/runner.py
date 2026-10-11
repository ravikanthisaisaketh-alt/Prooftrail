"""Runs learner code for the pandas task through the hardened sandbox (see sandbox.py).
DEMO-GRADE ONLY: this is not a secure sandbox. A real product needs containers."""
from . import sandbox

TAIL = r'''
import pandas as pd
df = pd.DataFrame(payload["rows"], columns=["order_id","order_date","product","amount","refunded"])
df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
df["refunded"] = df["refunded"].astype(bool)
os.environ.clear()
import learner
out = learner.monthly_revenue(df)
print("@@RESULT@@" + json.dumps({k: round(float(v), 2) for k, v in dict(out).items()}))
'''


def run_learner(code: str, rows: list[dict], timeout: int = 5) -> dict:
    """Returns {"ok": True, "result": {...}} or {"ok": False, "category": "..."}"""
    return sandbox.run(TAIL, code, {"rows": rows}, timeout)
