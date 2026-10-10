"""Runs learner code in a separate process with a timeout.
DEMO-GRADE ONLY: this is not a secure sandbox. A real product needs containers."""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HARNESS = r'''
import json, sys
sys.path.insert(0, ".")
import pandas as pd
payload = json.loads(sys.stdin.read())
df = pd.DataFrame(payload["rows"], columns=["order_id","order_date","product","amount","refunded"])
df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
df["refunded"] = df["refunded"].astype(bool)
import learner
out = learner.monthly_revenue(df)
print("@@RESULT@@" + json.dumps({k: round(float(v), 2) for k, v in dict(out).items()}))
'''


def run_learner(code: str, rows: list[dict], timeout: int = 5) -> dict:
    """Returns {"ok": True, "result": {...}} or {"ok": False, "category": "..."}"""
    with tempfile.TemporaryDirectory() as tmp:
        Path(tmp, "learner.py").write_text(code)
        Path(tmp, "harness.py").write_text(HARNESS)
        try:
            proc = subprocess.run(
                [sys.executable, "-I", "harness.py"],
                input=json.dumps({"rows": rows}), capture_output=True, text=True,
                timeout=timeout, cwd=tmp,
                env={"PATH": os.environ.get("PATH", "")},   # do NOT pass our secrets (API keys) to learner code
            )
        except subprocess.TimeoutExpired:
            return {"ok": False, "category": "timed_out"}
    if proc.returncode != 0:
        return {"ok": False, "category": "crashed"}   # never return the traceback (it may leak)
    for line in proc.stdout.splitlines():
        if line.startswith("@@RESULT@@"):
            return {"ok": True, "result": json.loads(line[len("@@RESULT@@"):])}
    return {"ok": False, "category": "no_result"}
