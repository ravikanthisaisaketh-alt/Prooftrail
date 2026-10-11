"""Task t3: find duplicate ids in a list of records. Reference, personal variant and hidden tests. Server only."""
import hashlib
import random
import re
from collections import Counter
from .generic import run_generic

ENTRY = "find_duplicate_ids"


def reference(records) -> list:
    """Ids that appear more than once, each listed once, sorted. Records with no id are ignored."""
    ids = [r.get("id") for r in records if isinstance(r, dict) and r.get("id") is not None]
    return sorted(i for i, n in Counter(ids).items() if n > 1)


def variant_for(learner: str, version: str = "t3") -> dict:
    seed = int(hashlib.sha256(f"{learner}|{version}".encode()).hexdigest()[:12], 16)
    return {"seed": seed, "n": 60}


def build_input(variant: dict) -> list:
    """Records with repeated ids (some 3 times). No missing ids here: they are an edge case (C2)."""
    rng = random.Random(variant["seed"])
    pool = [f"ID-{i:03d}" for i in range(1, 41)]
    ids = rng.sample(pool, 30)
    dup = rng.sample(ids, 6)
    ids += dup + dup[:3]                   # 6 ids twice, the first 3 of them a third time
    while len(ids) < variant["n"]:
        ids.append(rng.choice([i for i in pool if i not in ids] or pool))
    rng.shuffle(ids)
    return [{"id": i, "name": f"Item {k}"} for k, i in enumerate(ids)]


EDGE = [
    [],                                                       # empty list
    [{"id": "A"}, {"name": "no id"}, {"id": None}, {"id": "B"}],   # missing ids, no duplicates
    [{"id": "X"}, {"id": "X"}, {"id": "X"}, {"id": "Y"}, {"id": "Y"}, {"name": "x"}],   # repeated duplicate counted once
]


def _same(a, b) -> bool:
    return isinstance(a, list) and sorted(map(str, a)) == sorted(map(str, b))


def check_c1(code: str, variant: dict, timeout: int) -> dict:
    data = build_input(variant)
    out = run_generic(code, ENTRY, "whole", data, timeout)
    if not out["ok"]:
        return {"pass": False, "category": out["category"]}
    ok = _same(out["result"], reference(data))
    return {"pass": ok, "category": None if ok else "wrong_total"}


def check_c2(code: str, timeout: int) -> dict:
    for case in EDGE:
        out = run_generic(code, ENTRY, "whole", case, timeout)
        if not out["ok"]:
            return {"pass": False, "category": "edge_case_" + out["category"]}
        if not _same(out["result"], reference(case)):
            return {"pass": False, "category": "edge_case_wrong_total"}
    return {"pass": True, "category": None}


def facts(variant: dict) -> dict:
    data = build_input(variant)
    return {"duplicate_count": len(reference(data)), "total": len(data)}


def check_c4(text: str, variant: dict) -> dict:
    f = facts(variant)
    targets = {f["duplicate_count"], f["total"]}
    cited = {int(float(x)) for x in re.findall(r"\d+\.?\d*", text or "") if float(x).is_integer()}
    return {"pass": bool(targets & cited), "category": None if targets & cited else "number_not_matching_data"}
