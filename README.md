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

## Environment variables
Blank means "use the default". Real values go in `.env` (gitignored) locally, or in the host's settings. Never commit a key.

**Back end** (Render, or `.env` locally)
| Variable | Default | Purpose |
|---|---|---|
| `AUTH_SECRET` | random per run | Signs login tokens. Set a long random value in production, or every restart logs everyone out. |
| `LLM_API_KEY` | empty | Gemini key. Empty means AI off: C3 and C5 show Pending and tests still grade. |
| `LLM_MODEL` | none | Gemini model name, for example `gemini-3.5-flash-lite`. |
| `CORS_ORIGINS` | the three localhost sites | Comma separated site URLs allowed to call the API, no trailing slash. |
| `DEMO_MODE` | `0` | `1` turns on the Reset demo routes (`/dev/reset`, `/dev/reset/{learner}`). Public demo only. |
| `ALLOW_TOKENLESS` | `0` | `1` lets learner routes work with no login. Local tests only. Keep `0` when deployed. |
| `RESET_KEY` | empty | If set, the wipe-everything `/dev/reset` also needs header `X-Reset-Key`. |
| `AI_CAP_TOTAL_PER_HOUR` | `30` | AI uses per rolling hour for the whole server. Over the cap, AI criteria show Pending. |
| `AI_CAP_PER_LEARNER_PER_HOUR` | `5` | AI uses per learner per hour. |
| `RUN_MEMORY_MB` | `1024` | Memory limit for each graded submission. |
| `DB_PATH` | `prooftrail.db` | SQLite file. On a free host the disk resets, and the demo data is re-seeded at startup. |
| `PYTHON_VERSION` | host default | Render only. Use `3.12.7`. |

**Front ends** (Vercel, one project per site, or exported by `run_all.sh` locally)
| Variable | Used by | Purpose |
|---|---|---|
| `VITE_API_URL` | all three | The Render API address. |
| `VITE_NYERAS_URL` | nyeras-site, prooftrail-app | Nyeras address (return links). |
| `VITE_PROOFTRAIL_URL` | nyeras-site, nxtmove-site | ProofTrail address (the Prove your skill handoff). |
| `VITE_NXTMOVE_URL` | prooftrail-app | NxtMove address (View in NxtMove). |
| `VITE_DEMO_MODE` | prooftrail-app | Leave blank or `0`. `1` allows `?learner=` with no login (needs the back end `ALLOW_TOKENLESS=1`). |

Vite reads these when it builds, so change them, then redeploy. Without them a production build calls nowhere (the localhost addresses only exist in `npm run dev`).

## Deploy
Back end on Render, three static sites on Vercel.
1. **Render:** New > Blueprint, point it at this repo (`render.yaml`), or create a Web Service by hand: build `pip install -r requirements.txt`, start `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`, health check `/health`. Set the back end variables above. Copy the service URL, for example `https://prooftrail-api.onrender.com`.
2. **Vercel:** create three projects from the same repo with Root Directory `nyeras-site`, `prooftrail-app` and `nxtmove-site`. Framework preset Vite (build `npm run build`, output `dist`). Each folder has a `vercel.json` that rewrites every path to `index.html`, so refreshing `/courses` works. Set that site's variables from the table (the API URL from step 1, the other sites' Vercel URLs).
3. **Back to Render:** set `CORS_ORIGINS` to the three Vercel URLs, comma separated, then redeploy the back end.
4. Open the Nyeras URL `/login` and sign in with a demo account.

Things to know on a free host:
- The back end sleeps when idle, so the first request after a pause is slow. The disk resets on restart: demo users, progress and profiles are re-created automatically, results are lost.
- Submitted code runs in a hardened child process: empty environment (no keys), time, CPU, memory and file-size limits, no network (its own network namespace when the host allows it, plus Python sockets switched off), and a temp folder. It is still demo-grade, not a real sandbox. Do not accept code from people you do not trust without a container runner.
- The AI caps and login rate limits live in memory and reset on restart.
- Everyone who can open the demo can use the public demo accounts and the Reset demo button. Do not put real data in it.

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
