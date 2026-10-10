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

## Demo flow
1. Nyeras (simulated) course page -> "Start a ProofTrail task" opens `/start?learner=L-001`.
2. Attempt: fix the code, explain it, submit; see feedback and receipt.
3. `/consent?learner=L-001`: turn sharing ON for the role (revoke any time).
4. `/profile?learner=L-001`: level, status, receipts. NxtMove (simulated) shows the consented candidate and receipt.
5. `/verify/R-1`: audit chain VALID or broken, with entry count. `/challenge`: Attack the Grader.
