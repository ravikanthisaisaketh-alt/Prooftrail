# STATUS
## Done (this round: UI polish, plain CSS only)
- ProofTrail (teal): header + nav, task card with objective and C1 to C5 rubric, labelled textarea, Focus chip, attempts-left counter, animated result card (staggered criterion rows), consent switch card, Back to Nyeras / View in NxtMove (only when ON), amber "Reset demo attempts" card at the attempt limit. Profile, Consent, Verify, Challenge restyled. New pages: /explainback?attempt=ID, /review, /audit, /quality.
- Nyeras (blue): course page and profile with "Latest result" card, status chip, "Shared with NxtMove: Yes/No", Reset demo.
- NxtMove (orange): top nav, /jobs list (4 sample jobs), job header, filter sidebar (minimum level, conditions, recent days, status), candidate cards with level chips and why-surfaced line, evidence drawer sliding from the right with a verify badge, candidate profile page. Candidates only for Junior Data Analyst.
- Backend (small): `GET /learners/{l}/attempts`; `/candidates` takes `recent_days` and `conditions` (Open|Focus).
- prefers-reduced-motion respected in all three sites.
## Verified
- `python scripts/e2e.py http://localhost:8000`: ALL PASSED. pytest: 25 passed. `npm run build` OK in all three sites. Headless screenshots checked for ProofTrail start, Nyeras profile, NxtMove list.
## Not verified
- No automated browser click-through: the result card, consent switch, drawer slide-in, explain-back, review, audit and quality pages are type-checked and built, not clicked.
- Explain-back and AI-dependent screens need a configured model (none yet; app.state.llm is None).
## Skipped
- Real "Human reviewed" flow end to end, gap-to-role, docs/ folder, orders_synthetic.csv.
## Failed
- Nothing failed. Note: my first screenshots showed "unavailable" because the backend on port 8000 was stale; I restarted it.
