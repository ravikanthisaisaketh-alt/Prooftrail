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

## UI/UX polish round (no logic, route, API or test changes)
Done: per-site backgrounds (Nyeras blue to indigo gradient, ProofTrail neutral off-white, NxtMove warm gradient); ProofTrail nav with active highlight and a Trust dropdown (Review, Audit, Quality; closes on outside click and Escape); page titles with one-line descriptions; Start/Solve/Result/Consent step indicator; criterion names with Met/Not met/Pending chips and reasons in the ProofTrail result and the NxtMove drawer; plain-words "Matches: ..." why-surfaced line; chip tooltips (Evidenced, Needs human review, Not yet, Pending, levels); empty states with next-step buttons; loading skeletons; toasts on consent change, demo-attempt reset, Nyeras Reset demo, filter clear; plain-language errors with Try again; loading/disabled button states; mobile layouts (checked ProofTrail at 390px).
Verified: npm run build in all three sites, pytest 25 passed, e2e ALL PASSED, headless screenshots of NxtMove list, ProofTrail profile and the 390px start page.
Not verified: no click-through of the result card, toasts, dropdown, drawer or consent switch in a real browser; NxtMove and Nyeras were not screenshot at 390px; contrast was set by choosing darker text colours, not measured with a tool.
Skipped: toast in NxtMove only appears on Clear filters (it has no consent action); step indicator only on ProofTrail attempt (plus a simple path on the Nyeras hero).

## Login, courses and per-course exams round
Done:
- Phase 1 auth: POST /auth/login, GET /auth/me, POST /auth/handoff (5 min, single use), POST /auth/exchange. 3 seeded users, scrypt hashes, HMAC tokens (8 h), AUTH_SECRET in .env (placeholder in .env.example), 5 failed tries per minute per user (429). 401 for a missing or bad token, 403 for another learner's data. DEMO_MODE=1 only lets requests with no token through; a present token is always checked. Nyeras: /login (show/hide password, friendly errors, demo accounts toggle), /courses, /course/:id and /profile protected, name and Log out in the bar. ProofTrail reads the learner from the token (exchange of the handoff ticket, then it is removed from the URL).
- Phase 2: /courses catalog (3 cards with progress), per-course page with the badge line, Prove your skill locked until 100 percent, "Mark all lessons complete (demo)". Progress stored in the back end per learner; L-001 pandas is complete.
- Phase 3: tasks t2 (text cleaning) and t3 (duplicate ids): starter, objective, C1 to C5, reference, hidden tests, personal variants, generic runner with the same timeout. /tasks/{id}/variant generalised. Attempt cap, consent, receipts and profile rows are per task. C3/C5 reuse the same AI checks with a task hint; quote guard untouched.
- Phase 4: one profile row per skill in Nyeras and ProofTrail; NxtMove lists only consented skills and has a Skill filter; Reset demo clears all exams for the learner.
- Tests: pytest 41 passed (new: auth, tokens, handoff, both tasks, per-task cap and consent). scripts/e2e.py extended (login, 401, 403, handoff, courses, per-task cap, per-learner consent): ALL PASSED. Real browser run (headless Chrome) of login, courses, handoff, attempt with a live Gemini grade, consent ON, NxtMove candidate and Nyeras profile worked.
Not verified / skipped:
- Browser run covered the pandas course only. Text cleaning and data structures were tested through the API and pytest, not clicked.
- NxtMove recruiter side has no login: /candidates and receipts stay consent-gated only (no recruiter token). Review, audit, quality, verify and challenge routes stay open.
- Rate limit counts failed tries only and resets when the back end restarts. Tokens cannot be revoked before they expire.
- Explain-back question templates are still pandas-flavoured; other tasks get the general question.
- Nyeras pages were not re-screenshotted at 390px after the rewrite.

## Motion redesign of ProofTrail (prooftrail-app only)
Done: `motion` package (v14) with src/motion.ts (fast .18, base .28, page .4, ease-out [0.22,1,0.36,1]) and MotionConfig reducedMotion="user". Orange/cream/ink tokens (orange FF5B2D, deep B93A14, cream FFF8EE, ink 231F1C; green, amber, grey for Pending), Comfortaa headings via Google Fonts. Persistent nav in Learner / Reviewer / Trust groups with a sliding active pill, SPA links, page fade plus 8px slide, Attack the Grader as a highlighted button. Rubric cards stagger in with AI assisted tags. Grading stepper (Hidden tests, Data check, AI 1/3 to 3/3, Routing) with Checking chips flipping to final state and agree/differ dots. Attack the Grader flag pulse then slide into a review-queue card. Doubt panel counter. Receipt rise, verify badge (draw-in check or shake), hash-chain links drawn one by one. Consent switch with an expanding see / never-see panel.
Honest limits: the stepper cannot show real per-step timing (the back end answers once), so it spins on step 1 and completes the steps when the answer arrives. AI run dots are derived from the result (all agree = green, a disagreement flag = amber, AI off = grey), not from per-run data. The Attack page cannot run hidden tests, so it states that text cannot change C1/C2 rather than measuring it. The Doubt panel lists the grader's rules, not per-check reasons (the route returns counts only). Nyeras and NxtMove were not restyled.
Skills named in the request (frontend-design, web-design-guidelines, emil-design-eng, ui-ux-pro-max, review-animations) are not available in this environment, so their guidance was applied by hand and motion was audited manually.
Verified: all three sites build, pytest 41 passed, e2e ALL PASSED, headless Chrome flow (handoff, grading stepper, result, consent expand/collapse, verify, quality, challenge flag to review queue, 390px) with no page or console errors and no horizontal overflow at 390px.

## Focus mode now blocks pasting (design change)
The plan said Focus mode must never block. By request it now blocks paste and drop into the code editor and the explanation box (paste event, drop, and beforeinput insertFromPaste/Drop/Yank, so context-menu paste is covered). Typing still works. Each blocked attempt shows a toast and is counted ("paste attempts blocked N"); pastes of 200+ characters are still logged as large_paste signals. Signals still never change a level. Open mode is unchanged.
Limits: this is a browser-side control only. It does not stop someone retyping text from another window, using devtools, or sending requests to the API directly, and it does not block copying. Verified with a real Ctrl+V in headless Chrome: Focus blocked both boxes, Open allowed both; no back end change.

## Public-demo hardening
Done (pytest 54 passed, e2e ALL PASSED after each step; all three sites build):
1. Runner: backend/grader/sandbox.py runs both runners with an EMPTY environment (cleared again before the learner module is imported), hard timeout, CPU/memory/file-size/open-file limits, no core dumps, a temp working dir, and no network (own network namespace via unshare when the host allows it, plus Python sockets disabled). New tests: no secrets visible, no network, memory hog stopped, temp dir only.
2. CORS_ORIGINS (comma separated) with localhost defaults; blank env values mean the default.
3. /dev/reset routes exist only when DEMO_MODE=1 (404 otherwise); the wipe-everything /dev/reset also needs a sign-in and, if set, RESET_KEY. AI caps: 30 uses per hour overall, 5 per learner (env-tunable); over the cap the AI criteria show Pending and tests still grade. Thin answers do not use the cap.
4. db.seed_if_empty() runs at startup: tables plus demo users and course progress when the database is empty, never wipes existing data.
5. vercel.json (rewrite all paths to /index.html) in all three sites.
6. Every site and API address comes from VITE_ env vars; localhost fallbacks only exist in `npm run dev` (production bundles contain none). ProofTrail only accepts a return link on the VITE_NYERAS_URL origin.
7. render.yaml; 8. README Deploy section and full env table; blank-valued .env.example files.
Behaviour change to know about: DEMO_MODE now ONLY controls the reset routes. Tokenless access moved to ALLOW_TOKENLESS (default 0), so a public demo with DEMO_MODE=1 still requires login.
Not verified: nothing was deployed to Render or Vercel, so the Blueprint, the Vercel project settings and CORS between real hosts are untested. The network namespace may be unavailable on Render (the socket block then is the only network control). Limits are not a real sandbox.
Test notes: my browser regression script has two known test-side flakes (it clicks the first See evidence button, which is the explanation skill, and it checks for Locked before progress loads); neither is an app bug.
