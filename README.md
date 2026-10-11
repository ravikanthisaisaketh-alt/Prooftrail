# ProofTrail

A learner completes a realistic task, is graded against a visible rubric (hidden tests decide, AI assists, humans decide when unsure), keeps an evidence-linked profile, and chooses who sees it. Nyeras and NxtMove are **simulated** screens, not integrations.

## Run
```
python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
uvicorn backend.main:app --port 8000          # back end
cd prooftrail-app && npm install && npm run dev -- --port 5174
# optional mocks: nyeras-site (5173), nxtmove-site (5175): npm install && npm run dev -- --port <port>
pytest backend/tests                           # tests
```
`./run_all.sh` starts the back end and all three sites and prints the URLs. `python scripts/e2e.py <api-url>` runs the consent end-to-end check against a running back end.

## Login and demo accounts (demo-grade, simulated)
Nyeras needs a sign-in. These accounts are made up and public:

| Learner | Name | Password |
|---|---|---|
| L-001 | Asha Rao (asha@demo.test) | demo-pass-1 |
| L-002 | Ben Carter (ben@demo.test) | demo-pass-2 |
| L-003 | Chen Wei (chen@demo.test) | demo-pass-3 |

Passwords are stored as scrypt hashes. Tokens are HMAC-signed, expire after 8 hours, and live in memory plus sessionStorage. Opening ProofTrail uses a 5 minute, single-use ticket in the URL (never the main token). Login allows 5 failed tries per minute per user. This is not production auth: no email check, no password reset, in-memory rate limit.

## Environment variables (copy `.env.example` to `.env`; `.env` is gitignored)
| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Signs tokens. Use a long random value. Missing means a random one per run (logins die on restart). |
| `DEMO_MODE` | `0` normally. `1` lets learner routes work with no token (old `?learner=` style). Tokens that are present are always checked. |
| `LLM_API_KEY`, `LLM_MODEL` | Gemini key and model. Blank key means AI off (C3/C5 show Pending). Never commit the key. |
| `VITE_API_URL`, `VITE_NYERAS_URL`, `VITE_PROOFTRAIL_URL`, `VITE_NXTMOVE_URL` | Site URLs. Defaults match the ports below. |
| `VITE_DEMO_MODE` | `0` normally. `1` lets ProofTrail read `?learner=` with no login. |

## Courses and exams
Three courses in Nyeras, one ProofTrail exam each (3 attempts per exam, consent per exam):
Data Analysis with pandas (t1), Python Text Cleaning (t2), Python Data Structures (t3). The exam unlocks at 100 percent lesson progress. "Mark all lessons complete (demo)" skips the wait.

## Demo flow (click order)
1. Nyeras `http://localhost:5173/login`: sign in as L-001 (use "Show demo accounts").
2. Courses: pandas is completed. Open a course. For an unfinished one, press "Mark all lessons complete (demo)".
3. Press "Start a ProofTrail task". ProofTrail opens already signed in as you.
4. Start attempt, fix the code, explain it (quote a number from your data), Submit for grading.
5. Read the result card. Flip the consent switch ON, then "View in NxtMove". Flip it OFF and refresh NxtMove: you are gone.
6. "Back to Nyeras", then My profile: one row per skill with receipt. "Reset demo" clears all your exams.
7. Extras: `/verify`, `/challenge`, and the Trust menu (Review, Audit, Quality).

`./run_all.sh` starts everything. `python scripts/e2e.py http://localhost:8000` and `pytest backend/tests` check it.
