"""Task t2: normalize messy strings. Reference, personal variant and hidden tests. Server only."""
import hashlib
import random
import re
from .generic import run_generic

ENTRY = "normalize_text"
WORDS = ["north", "south", "east", "west", "red", "blue", "green", "alpha", "beta", "gamma", "river", "stone"]


def reference(text):
    """None -> empty string. Trim, collapse runs of spaces to one, lower-case."""
    if text is None:
        return ""
    return " ".join(str(text).split()).lower()


def variant_for(learner: str, version: str = "t2") -> dict:
    seed = int(hashlib.sha256(f"{learner}|{version}".encode()).hexdigest()[:12], 16)
    return {"seed": seed, "n": 40}


def build_input(variant: dict) -> list:
    """Messy strings: stray spaces (also in the middle), mixed case. No None here: None is an edge case (C2)."""
    rng = random.Random(variant["seed"])
    out = []
    for _ in range(variant["n"]):
        w = " ".join(rng.choice(WORDS) for _ in range(rng.randint(1, 3)))
        sep = lambda: " " * rng.randint(1, 3)
        w = re.sub(" ", sep(), w) if rng.random() < 0.6 else w
        w = (" " * rng.randint(0, 2)) + w + (" " * rng.randint(0, 2))
        w = w.title() if rng.random() < 0.4 else (w.upper() if rng.random() < 0.3 else w)
        out.append(w)
    return out


EDGE = [None, "", "   ", "Hello   World", "  MIXED  Case  "]


def check_c1(code: str, variant: dict, timeout: int) -> dict:
    data = build_input(variant)
    out = run_generic(code, ENTRY, "each", data, timeout)
    if not out["ok"]:
        return {"pass": False, "category": out["category"]}
    ok = out["result"] == [reference(x) for x in data]
    return {"pass": ok, "category": None if ok else "wrong_total"}


def check_c2(code: str, timeout: int) -> dict:
    out = run_generic(code, ENTRY, "each", EDGE, timeout)
    if not out["ok"]:
        return {"pass": False, "category": "edge_case_" + out["category"]}
    ok = out["result"] == [reference(x) for x in EDGE]
    return {"pass": ok, "category": None if ok else "edge_case_wrong_total"}


def facts(variant: dict) -> dict:
    data = build_input(variant)
    cleaned = [reference(x) for x in data]
    return {"changed_count": sum(1 for a, b in zip(data, cleaned) if a != b), "total": len(data),
            "distinct_count": len(set(cleaned))}


def check_c4(text: str, variant: dict) -> dict:
    f = facts(variant)
    targets = {f["changed_count"], f["total"], f["distinct_count"]}
    cited = {int(float(x.replace(",", ""))) for x in re.findall(r"\d[\d,]*\.?\d*", text or "") if float(x.replace(",", "")).is_integer()}
    return {"pass": bool(targets & cited), "category": None if targets & cited else "number_not_matching_data"}
