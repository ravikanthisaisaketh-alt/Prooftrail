"""Tamper-evident log: each row stores a fingerprint of (previous fingerprint + its own content).
Edit any old row and every fingerprint after it stops matching. (Evident, not proof.)"""
import hashlib
import json
from . import db, config

GENESIS = "0" * 64


def _fp(prev: str, event: str, attempt, actor: str, data: str, versions: str) -> str:
    body = json.dumps([prev, event, attempt, actor, data, versions], sort_keys=True)
    return hashlib.sha256(body.encode()).hexdigest()


def append(event: str, attempt, actor: str, data: dict) -> int:
    c = db.conn()
    last = c.execute("SELECT fingerprint FROM audit_log ORDER BY id DESC LIMIT 1").fetchone()
    prev = last["fingerprint"] if last else GENESIS
    data_s = json.dumps(data, sort_keys=True)
    versions = json.dumps({"rubric": config.RUBRIC_VERSION, "prompt": config.PROMPT_VERSION,
                           "engine": config.ENGINE_VERSION, "model": config.LLM_MODEL}, sort_keys=True)
    fp = _fp(prev, event, attempt, actor, data_s, versions)
    cur = c.execute(
        "INSERT INTO audit_log(event,attempt,actor,data,versions,prev,fingerprint) VALUES(?,?,?,?,?,?,?)",
        (event, attempt, actor, data_s, versions, prev, fp))
    c.commit()
    rid = cur.lastrowid
    c.close()
    return rid


def verify() -> dict:
    c = db.conn()
    prev = GENESIS
    for r in c.execute("SELECT * FROM audit_log ORDER BY id"):
        if r["prev"] != prev or r["fingerprint"] != _fp(prev, r["event"], r["attempt"], r["actor"], r["data"], r["versions"]):
            c.close()
            return {"valid": False, "bad_row": r["id"]}
        prev = r["fingerprint"]
    c.close()
    return {"valid": True, "bad_row": None}
