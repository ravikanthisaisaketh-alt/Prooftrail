"""Runner for the plain-Python tasks (text cleaning, duplicate ids). Same safety as runner.py:
separate process, timeout, no secrets in the environment. DEMO-GRADE ONLY, not a secure sandbox."""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HARNESS = r'''
import json, sys
sys.path.insert(0, ".")
payload = json.loads(sys.stdin.read())
import learner
fn = getattr(learner, payload["entry"])
if payload["mode"] == "each":
    out = [fn(x) for x in payload["input"]]
else:
    out = fn(payload["input"])
print("@@RESULT@@" + json.dumps(out, default=lambda o: sorted(o) if isinstance(o, (set, frozenset)) else str(o)))
'''


def run_generic(code: str, entry: str, mode: str, data, timeout: int = 5) -> dict:
    """mode 'each': call entry(x) for every x in data. mode 'whole': call entry(data) once."""
    with tempfile.TemporaryDirectory() as tmp:
        Path(tmp, "learner.py").write_text(code)
        Path(tmp, "harness.py").write_text(HARNESS)
        try:
            proc = subprocess.run(
                [sys.executable, "-I", "harness.py"],
                input=json.dumps({"entry": entry, "mode": mode, "input": data}), capture_output=True, text=True,
                timeout=timeout, cwd=tmp, env={"PATH": os.environ.get("PATH", "")},
            )
        except subprocess.TimeoutExpired:
            return {"ok": False, "category": "timed_out"}
    if proc.returncode != 0:
        return {"ok": False, "category": "crashed"}
    for line in proc.stdout.splitlines():
        if line.startswith("@@RESULT@@"):
            return {"ok": True, "result": json.loads(line[len("@@RESULT@@"):])}
    return {"ok": False, "category": "no_result"}
