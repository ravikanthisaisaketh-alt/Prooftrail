"""Task registry: one entry per course exam. The pandas task (t1) wraps the original grader code unchanged."""
from . import config
from .variants import variant_for as t1_variant, build_orders
from .grader import hidden_tests, text_task, dups_task

CRITERIA_NAMES = {"C1": "Root-cause fix", "C2": "Edge cases", "C3": "Explanation", "C4": "Data check", "C5": "Action"}


def _crit(c1, c2, c3, c4, c5):
    return [{"id": i, "name": CRITERIA_NAMES[i], "what": w} for i, w in zip(["C1", "C2", "C3", "C4", "C5"], [c1, c2, c3, c4, c5])]


def _t1_grade(code, text, learner, timeout):
    rows = build_orders(t1_variant(learner, config.TASK_VERSION))
    return hidden_tests.check_c1(code, rows, timeout), hidden_tests.check_c2(code, timeout), hidden_tests.check_c4(text, rows)


def _mod_grade(mod, version):
    def grade(code, text, learner, timeout):
        v = mod.variant_for(learner, version)
        return mod.check_c1(code, v, timeout), mod.check_c2(code, timeout), mod.check_c4(text, v)
    return grade


def _t1_sample(learner):
    return build_orders(t1_variant(learner, config.TASK_VERSION))[:5]


TASKS = {
    "t1": {
        "id": "t1", "course": "pandas", "name": "Debugging with pandas",
        "skill": "Debugging", "insight_skill": "Insight Communication",
        "objective": "Fix monthly_revenue(df) so refunded orders and missing amounts no longer break the monthly totals, then explain your fix.",
        "starter": 'def monthly_revenue(df):\n    totals = {}\n    for _, row in df.iterrows():\n        month = row["order_date"][:7]\n        totals[month] = totals.get(month, 0) + int(row["amount"])\n    return totals\n',
        "criteria": _crit("Automatic tests: totals are right on your data.", "Automatic tests: empty table, empty month, missing amounts.",
                          "Names the cause and why the fix works (AI assisted).", "The number you quote matches the data.", "A concrete next step for the team (AI assisted)."),
        "ai_hint": "", "grade": _t1_grade, "sample": _t1_sample,
    },
    "t2": {
        "id": "t2", "course": "text-cleaning", "name": "Text cleaning",
        "skill": "Text cleaning", "insight_skill": "Insight: Text cleaning",
        "objective": "Fix normalize_text(text) so messy strings (extra spaces, mixed case, None, empty) come out clean and consistent, then explain your fix.",
        "starter": 'def normalize_text(text):\n    return text.strip().lower()\n',
        "criteria": _crit("Automatic tests: messy strings come out clean on your data.", "Automatic tests: None, empty and spaces-only strings.",
                          "Names the cause and why the fix works (AI assisted).", "A count you quote (for example how many strings changed) matches the data.", "A concrete next step to keep text clean (AI assisted)."),
        "ai_hint": "Task context: the function normalize_text had to clean messy strings. The real problems were extra spaces between words that were not collapsed, and None or empty values.",
        "grade": _mod_grade(text_task, "t2"),
        "sample": lambda l: text_task.build_input(text_task.variant_for(l))[:5],
    },
    "t3": {
        "id": "t3", "course": "data-structures", "name": "Data structures",
        "skill": "Data structures", "insight_skill": "Insight: Data structures",
        "objective": "Fix find_duplicate_ids(records) so each duplicated id is returned once and records without an id do not crash it, then explain your fix.",
        "starter": 'def find_duplicate_ids(records):\n    seen = set()\n    dups = []\n    for r in records:\n        if r["id"] in seen:\n            dups.append(r["id"])\n        seen.add(r["id"])\n    return dups\n',
        "criteria": _crit("Automatic tests: the right duplicates, each once, on your data.", "Automatic tests: empty list, missing ids, ids repeated many times.",
                          "Names the cause and why the fix works (AI assisted).", "A count you quote (for example how many ids are duplicated) matches the data.", "A concrete next step to prevent duplicates (AI assisted)."),
        "ai_hint": "Task context: the function find_duplicate_ids had to list each duplicated id once. The real problems were an id repeated 3 or more times being listed more than once, and records with a missing id causing a crash.",
        "grade": _mod_grade(dups_task, "t3"),
        "sample": lambda l: dups_task.build_input(dups_task.variant_for(l))[:5],
    },
}
SKILL_TASK = {}
for _t in TASKS.values():
    SKILL_TASK[_t["skill"]] = _t["id"]
    SKILL_TASK[_t["insight_skill"]] = _t["id"]
COURSES = {"pandas": {"task": "t1", "lessons": 5}, "text-cleaning": {"task": "t2", "lessons": 6}, "data-structures": {"task": "t3", "lessons": 5}}
