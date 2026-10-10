"""Personal task variant: same learner -> same data, different learner -> different data."""
import hashlib
import random

MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]
PRODUCTS = ["Notebook", "Pen set", "Desk lamp", "Backpack", "Mouse"]


def variant_for(learner_id: str, task_version: str) -> dict:
    digest = hashlib.sha256(f"{learner_id}|{task_version}".encode()).hexdigest()
    seed = int(digest[:12], 16)
    rng = random.Random(seed)
    return {
        "seed": seed,
        "refund_rate_pct": rng.choice([6, 8, 10, 12, 15]),
        "months": sorted(rng.sample(MONTHS, 4)),
        "n_rows": 200,
    }


def build_orders(variant: dict) -> list[dict]:
    """Make the synthetic order rows for this variant. Same variant -> same rows."""
    rng = random.Random(variant["seed"] + 1)
    rows = []
    for i in range(variant["n_rows"]):
        month = rng.choice(variant["months"])
        day = rng.randint(1, 28)
        amount = round(rng.uniform(5, 120), 2)
        if rng.random() < 0.05:        # about 5 percent of amounts are missing
            amount = None
        rows.append({
            "order_id": f"O-{i:04d}",
            "order_date": f"{month}-{day:02d}",
            "product": rng.choice(PRODUCTS),
            "amount": amount,
            "refunded": rng.random() < variant["refund_rate_pct"] / 100,
        })
    return rows
