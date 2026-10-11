"""Runs submitted code in a hardened child process. One place for both runners.

What it does:
  * EMPTY environment: no LLM_API_KEY, no AUTH_SECRET, no PATH, nothing.
  * hard wall-clock timeout (subprocess) plus a CPU-time limit
  * memory limit (address space), file-size limit, no core dumps, few open files
  * no network: the child runs in its own empty network namespace when `unshare` allows it,
    and the harness also disables Python's socket module before the learner's code is imported
  * a fresh temporary working directory that is deleted afterwards
Limits are applied by the harness itself (not preexec_fn), so it is safe to call from a threaded web server.

This is demo-grade hardening, NOT a real sandbox. Determined code can still try other routes
(ctypes, raw syscalls). A real product needs containers or a dedicated runner service."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

MEM_MB = int(os.getenv("RUN_MEMORY_MB", "").strip() or "1024")
FSIZE_MB = 5

PREAMBLE = r'''
import json, os, sys
sys.path.insert(0, ".")
payload = json.loads(sys.stdin.read())
_lim = payload.get("limits", {})
import resource
def _setrl(name, soft):
    try:
        resource.setrlimit(getattr(resource, name), (soft, soft))
    except Exception:
        pass
_setrl("RLIMIT_CPU", int(_lim.get("cpu", 6)))
_setrl("RLIMIT_AS", int(_lim.get("mem_mb", 1024)) * 1024 * 1024)
_setrl("RLIMIT_FSIZE", int(_lim.get("fsize_mb", 5)) * 1024 * 1024)
_setrl("RLIMIT_CORE", 0)
_setrl("RLIMIT_NOFILE", 256)
# keep numpy from starting one thread per core under the memory limit
os.environ.update(OPENBLAS_NUM_THREADS="1", OMP_NUM_THREADS="1", MKL_NUM_THREADS="1")
import socket
def _no_net(*a, **k):
    raise OSError("network access is disabled in the grader")
class _NoSocket:
    def __init__(self, *a, **k):
        _no_net()
socket.socket = _NoSocket
socket.create_connection = _no_net
socket.getaddrinfo = _no_net
socket.gethostbyname = _no_net
'''
# Run just before the learner's module is imported: the learner sees a completely empty environment.
CLEAR_ENV = "os.environ.clear()\n"

_unshare: list[str] | None = None


def _net_prefix() -> list[str]:
    """['unshare','-rn','--'] when we may create an empty network namespace, else []."""
    global _unshare
    if _unshare is None:
        exe = shutil.which("unshare")
        _unshare = []
        if exe:
            try:
                ok = subprocess.run([exe, "-rn", "--", "true"], capture_output=True, timeout=5, env={}).returncode == 0
            except Exception:
                ok = False
            if ok:
                _unshare = [exe, "-rn", "--"]
    return _unshare


def run_raw(tail: str, code: str, payload: dict, timeout: int) -> dict:
    """Returns {"timed_out": bool, "returncode": int, "stdout": str}. `tail` runs after the preamble."""
    payload = {**payload, "limits": {"cpu": timeout + 1, "mem_mb": MEM_MB, "fsize_mb": FSIZE_MB}}
    with tempfile.TemporaryDirectory() as tmp:
        Path(tmp, "learner.py").write_text(code)
        Path(tmp, "harness.py").write_text(PREAMBLE + tail)
        try:
            proc = subprocess.run(
                _net_prefix() + [sys.executable, "-I", "harness.py"],
                input=json.dumps(payload), capture_output=True, text=True,
                timeout=timeout, cwd=tmp, env={},          # EMPTY environment
            )
        except subprocess.TimeoutExpired:
            return {"timed_out": True, "returncode": -1, "stdout": ""}
    return {"timed_out": False, "returncode": proc.returncode, "stdout": proc.stdout}


def run(tail: str, code: str, payload: dict, timeout: int) -> dict:
    """Returns {"ok": True, "result": ...} or {"ok": False, "category": ...}. Never returns a traceback."""
    out = run_raw(tail, code, payload, timeout)
    if out["timed_out"]:
        return {"ok": False, "category": "timed_out"}
    if out["returncode"] != 0:
        return {"ok": False, "category": "crashed"}
    for line in out["stdout"].splitlines():
        if line.startswith("@@RESULT@@"):
            return {"ok": True, "result": json.loads(line[len("@@RESULT@@"):])}
    return {"ok": False, "category": "no_result"}
