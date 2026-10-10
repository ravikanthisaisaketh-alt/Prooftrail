"""The correct answer. Server only. Never sent to a browser."""
import pandas as pd


def reference_monthly_revenue(df: pd.DataFrame) -> dict:
    ok = df[(~df["refunded"].astype(bool)) & df["amount"].notna()]
    if ok.empty:
        return {}
    return ok.groupby(ok["order_date"].str[:7])["amount"].sum().round(2).to_dict()


def reference_facts(rows: list[dict]) -> dict:
    """Numbers a learner may cite in their insight (used by the C4 data check)."""
    df = pd.DataFrame(rows)
    totals = reference_monthly_revenue(df)
    top_month = max(totals, key=totals.get) if totals else None
    refund_pct = round(100 * df["refunded"].mean(), 1)
    return {
        "top_month": top_month,
        "top_month_total": totals.get(top_month),
        "refund_rate_pct": refund_pct,
    }
