"""SQLite helpers, schema, reset."""
import sqlite3
from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS learners(id TEXT PRIMARY KEY, display_label TEXT);
CREATE TABLE IF NOT EXISTS attempts(
  id INTEGER PRIMARY KEY AUTOINCREMENT, learner TEXT, attempt_no INTEGER, mode TEXT,
  tools_declared TEXT, code TEXT, text TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP,
  task TEXT DEFAULT 't1');
CREATE TABLE IF NOT EXISTS criterion_results(
  id INTEGER PRIMARY KEY AUTOINCREMENT, attempt INTEGER, criterion TEXT,
  result TEXT, source TEXT, category TEXT);
CREATE TABLE IF NOT EXISTS ai_runs(
  id INTEGER PRIMARY KEY AUTOINCREMENT, attempt INTEGER, criterion TEXT, run_no INTEGER,
  model TEXT, prompt_version TEXT, raw_output TEXT, answer TEXT, quote TEXT,
  input_tokens INTEGER, output_tokens INTEGER);
CREATE TABLE IF NOT EXISTS flags(id INTEGER PRIMARY KEY AUTOINCREMENT, attempt INTEGER, type TEXT, details TEXT);
CREATE TABLE IF NOT EXISTS signals(
  id INTEGER PRIMARY KEY AUTOINCREMENT, attempt INTEGER, event TEXT, value REAL, note TEXT,
  created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reviews(
  id INTEGER PRIMARY KEY AUTOINCREMENT, attempt INTEGER, criterion TEXT, reviewer TEXT,
  decision TEXT, reason TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS consents(
  id INTEGER PRIMARY KEY AUTOINCREMENT, learner TEXT, role TEXT, on_off INTEGER,
  changed TEXT DEFAULT CURRENT_TIMESTAMP, task TEXT DEFAULT 't1');
CREATE TABLE IF NOT EXISTS accommodations(learner TEXT, type TEXT);
CREATE TABLE IF NOT EXISTS profiles(
  learner TEXT, skill TEXT, level TEXT, status TEXT, confidence TEXT, mode TEXT,
  last_attempt TEXT, attempt INTEGER, PRIMARY KEY(learner, skill));
CREATE TABLE IF NOT EXISTS audit_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT, attempt INTEGER, actor TEXT, data TEXT,
  versions TEXT, prev TEXT, fingerprint TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, pw_hash TEXT);
CREATE TABLE IF NOT EXISTS progress(learner TEXT, course TEXT, done INTEGER, PRIMARY KEY(learner, course));
"""


def conn() -> sqlite3.Connection:
    c = sqlite3.connect(config.DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def seed_if_empty() -> bool:
    """Make sure the tables and the demo data exist. Never wipes existing data. Returns True if it seeded.
    The free host resets its disk on every restart, so this runs at startup."""
    try:
        c = conn()
        c.execute("SELECT task FROM attempts LIMIT 1")             # an old schema without these columns gets rebuilt
        c.execute("SELECT 1 FROM consents WHERE task IS NULL LIMIT 1")
        n = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        c.close()
    except Exception:
        reset()
        return True
    if n == 0:
        reset()
        return True
    return False


def reset() -> None:
    c = conn()
    names = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
    for n in names:
        c.execute(f"DROP TABLE IF EXISTS {n}")
    c.executescript(SCHEMA)
    from . import auth
    for u in auth.DEMO_USERS:
        c.execute("INSERT INTO learners VALUES(?,?)", (u["id"], f"Learner {u['id']}"))
        c.execute("INSERT INTO users VALUES(?,?,?,?)", (u["id"], u["name"], u["email"], auth.hash_password(u["password"])))
        for course, done in u["progress"].items():
            c.execute("INSERT INTO progress VALUES(?,?,?)", (u["id"], course, done))
    c.commit()
    c.close()
