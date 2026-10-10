# STATUS
## Done
- Backend: `GET /profile/{learner}/summary` (own latest result + shared yes/no, consent or not), `POST /dev/reset/{learner}` (demo repeat), receipt now carries task, rubric version, criteria results. CORS already covered ports 5173/5174/5175.
- Nyeras: `/profile` page with "Latest result" strip ("Not yet verified" before an attempt), "Reset demo" link, Prove-your-skill button passes `return=`.
- ProofTrail: after a result, the Consent block (ON/OFF), "Back to Nyeras" (return URL, only accepted if it starts with VITE_NYERAS_URL) and "View in NxtMove" (only while ON).
- NxtMove: list = consented learners + 2 rows tagged "sample"; `/candidate/:learner` profile with evidence drawer; empty states.
- `run_all.sh`, `.env.example` (root and in each site), `scripts/e2e.py`.
## Verified
- `python scripts/e2e.py http://localhost:8001`: all 20 checks pass (consent ON, OFF, ON then revoke, CORS, no private fields).
- pytest: 25 passed. `npm run build` passes in all three sites.
## Not verified
- No browser click-through. Pages were type-checked and built, not clicked.
## Notes / deviations
- Receipt route returns 403 (not 404) when consent is OFF: the plan and the existing test say 403. The candidate list is empty/omits the learner.
- NxtMove default minimum level is now "Not yet" so a new consented learner is visible; the role's Developing bar is a filter choice.
- Without an AI model, Insight Communication stays "Not yet evidenced" (Pending). Debugging shows the real level.
- A backend started BEFORE these edits (pid on port 8000) serves old code: restart it.
## Skipped
- Recency/conditions/status filters, verify badge in the drawer, sample-row drawer.
