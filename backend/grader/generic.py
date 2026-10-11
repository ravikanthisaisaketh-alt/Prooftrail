"""Runner for the plain-Python tasks (text cleaning, duplicate ids), through the hardened sandbox (see sandbox.py).
DEMO-GRADE ONLY, not a secure sandbox."""
from . import sandbox

TAIL = r'''
os.environ.clear()
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
    return sandbox.run(TAIL, code, {"entry": entry, "mode": mode, "input": data}, timeout)
