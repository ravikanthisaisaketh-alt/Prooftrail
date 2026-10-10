"""HIDDEN tests for C1 and C2, plus the C4 data check. Server only.
Feedback uses categories only, never expected values."""
import re
import pandas as pd
from .reference import reference_monthly_revenue, reference_facts
from .runner import run_learner

COLS = ["order_id", "order_date", "product", "amount", "refunded"]


def _same(a: dict, b: dict) -> bool:
    return a.keys() == b.keys() and all(abs(a[k] - b[k]) < 0.01 for k in a)


def _edge_cases() -> list[list[dict]]:
    row = lambda d, amt, ref: {"order_id": "X", "order_date": d, "product": "P", "amount": amt, "refunded": ref}
    return [
        [],                                                        # empty table
        [row("2026-01-05", 10.0, True)],                           # month with only refunds
        [row("2026-02-05", None, False), row("2026-02-06", 5.5, False)],  # missing amount
    ]


def check_c1(code: str, rows: list[dict], timeout: int) -> dict:
    out = run_learner(code, rows, timeout)
    if not out["ok"]:
        return {"pass": False, "category": out["category"]}
    expected = reference_monthly_revenue(pd.DataFrame(rows, columns=COLS))
    if _same(out["result"], expected):
        return {"pass": True, "category": None}
    return {"pass": False, "category": "wrong_total"}


def check_c2(code: str, timeout: int) -> dict:
    for case in _edge_cases():
        out = run_learner(code, case, timeout)
        if not out["ok"]:
            return {"pass": False, "category": "edge_case_" + out["category"]}
        expected = reference_monthly_revenue(pd.DataFrame(case, columns=COLS))
        if not _same(out["result"], expected):
            return {"pass": False, "category": "edge_case_wrong_total"}
    return {"pass": True, "category": None}


def check_c4(text: str, rows: list[dict]) -> dict:
    """Data check: does the text cite a number that matches our own calculation?"""
    facts = reference_facts(rows)
    targets = [facts["top_month_total"], facts["refund_rate_pct"]]
    cited = [float(x.replace(",", "")) for x in re.findall(r"\d[\d,]*\.?\d*", text)]
    for c in cited:
        for t in targets:
            if t is not None and abs(c - t) <= max(0.5, abs(t) * 0.005):
                return {"pass": True, "category": None}
    return {"pass": False, "category": "number_not_matching_data"}
