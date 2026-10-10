# Build Plan v2: ProofTrail (our real system)

**Status:** REAL and working. This is where most of the build time goes.
**Replaces:** the earlier `buildplan-prooftrail.md`. It now includes the quality-first features (Docs 1 to 3), the architecture, the tech stack and the cost notes.
**Owner slots:** A (grader and back end), B (front end), C (tests, data, docs). Fill in: A ____ B ____ C ____

Companion files: `buildplan-nyeras.md`, `buildplan-nxtmove.md`, `buildplan.md` (overview), `features-expected.md`, `features-added.md`, `features-innovations.md`, `architecture.md`, `tech-stack.md`.

**Hours are estimates, not measurements.** Tiers: **Core** (first working version), **Stretch** (after Core works end to end), **Concept** (labelled roadmap screen, never presented as working).

---

## 1. Purpose

A learner completes a real task, is graded against a visible rubric, and keeps an evidence-linked profile that only they can choose to share. Hidden tests decide. The AI assists. Anything uncertain goes to a person. Every result is a receipt.

One line: **tests decide, AI assists, humans decide when unsure.**

---

## 2. Rules that apply here

- [ ] Disclose AI use on screen and in the receipt. Provide a human appeal route.
- [ ] Minimise personal data. Synthetic data only. The AI sees a pseudonymous ID, never a name.
- [ ] No recruiter access without consent. Consent is OFF by default and revocable.
- [ ] Hidden tests and expected values never leave the server. Feedback names the failure category only.
- [ ] AI use is not automatically misconduct. Use the conditions label, not an AI detector.
- [ ] Focus log and paste provenance are **open** (the learner sees them), **never block**, and **never change a level**. No keystroke timing.
- [ ] No composite score, no rank, no match percent. Show level, status, confidence, recency.
- [ ] Accommodations stay private. Recruiters never see them.
- [ ] Never claim: accurate, fair, cheat-proof, injection-proof, tamper-proof, or that scores predict hiring success.
- [ ] Keys in `.env`, never committed. Fallback if the AI API fails.
- [ ] Every number we show comes from our own tests. No fabricated results.
- [ ] Record each third-party library, API and model in `docs/resources.md` the moment it is added.

---

## 3. Contract with the other parts

Three separate sites in one folder, joined by buttons (your earlier decision).

| Direction | What | Detail |
|---|---|---|
| Nyeras to ProofTrail | Button link | `http://localhost:5174/start?learner=L-001&source=nyeras-mock` |
| ProofTrail to Nyeras | Return link | `http://localhost:5173/course` |
| ProofTrail to Nyeras (Could) | Summary strip | `GET /profile/{learner}/summary` |
| ProofTrail to NxtMove | Candidate list | `GET /candidates?...` (consent ON only) |
| ProofTrail to NxtMove | Receipt | `GET /candidates/{learner}/receipt?skill=` (403 if consent OFF) |
| Anyone with a receipt link | Verify | `GET /verify/{receipt_id}` |

ProofTrail owns all data. The mocks only read it. URLs come from `.env` values (for example `VITE_PROOFTRAIL_URL`), never hard-coded.

---

## 4. Architecture (short form)

```
Browser: nyeras-site (5173)   prooftrail-app (5174)   nxtmove-site (5175)
                         \           |            /
                          v          v           v
                      FastAPI back end (8000), consent gate, roles
   Task/variant | Signals | Runner | AI adapter | Explain-back | Review | Profile+consent | Receipt+audit
                                      |
                              Hosted LLM API (key in .env)
   Data: SQLite     Jobs: gold-set check, model change alert, review-rate metrics
```

Full detail in `architecture.md`. Trust boundaries: browser to server (nothing trusted), server to AI (pseudonymous text only), server to recruiter (consent gate on every route).

---

## 5. Stack (see `tech-stack.md`)

| Layer | Pick |
|---|---|
| Front end | React, Vite, Tailwind, CodeMirror 6 |
| QR on receipts | qrcode.react (ISC, checked 10 Oct 2026) |
| Back end | Python, FastAPI, pydantic, python-dotenv |
| Storage | SQLite |
| Runner | Python subprocess with timeout (demo-grade, say so) |
| Hash chain, variants | `hashlib`, `random` (built in) |
| AI | One hosted LLM, 3 runs. **Model chosen by the 1-hour model test** |
| Tests | pytest plus our hidden-test harness |
| Accessibility testing | axe-core (test tool only, MPL-2.0, checked 10 Oct 2026) |

**AI cost note:** about 12 AI calls per attempt. At about 1,200 input and 200 output tokens per call, 400 test attempts cost roughly ₹100 (Claude Haiku 5.5) to ₹2,000 (Claude Sonnet 5.5) at today's list prices. Log real token counts in `ai_runs` and replace these assumptions. Do not pick the cheapest model if it fails the injection test.

---

## 6. Folder structure

```
prooftrail/
  README.md  .env.example  .gitignore (includes .env and *.db)
  scripts/dev.sh                 starts the back end and the three sites
  docs/ resources.md  test-notes.md  validation-plan.md
  backend/
    main.py  db.py               routes, schema, seed, reset
    grader/
      runner.py                  subprocess + timeout
      tests_c1_c2.py             HIDDEN tests (server only)
      reference.py               reference solution used to compute expected values per variant
      intake.py                  thin-answer gate, instruction scan
      ai_checks.py               LLM calls, pydantic schema, quote guard, 3 runs, token logging
      explainback.py             template questions, answer checks
      routing.py                 agree or differ or flag, level rules
    variants.py                  personal task variant from learner ID
    signals.py                   focus and paste events
    review.py  consent.py  audit.py (hash chain)  quality.py (gold set, review rate)
    data/ orders_synthetic.csv   cached_ai_results.json (labelled cached)
    tests/                       our pytest tests
  nyeras-site/                   SIMULATED, see buildplan-nyeras.md
  prooftrail-app/src/pages/      Start  Attempt  Explainback  Feedback  Profile  Gap
                                 Consent  Review  Audit  Verify  Challenge  Quality
  prooftrail-app/src/components/ Receipt  AiTag  ModeBadge  QrCode
  nxtmove-site/                  SIMULATED, see buildplan-nxtmove.md
```

---

## 7. Learner flow (stages)

| Stage | Screen or action | Key behaviour |
|---|---|---|
| 1 Setup | Rubric C1 to C5, AI disclosure, mode (Open or Focus), tools-used declaration | Rubric first. Personal variant assigned |
| 2 Attempt | Task, editor, visible tests, explanation boxes, "attempt n of 3" | Focus mode logs tab leaves and large pastes, openly |
| 3 Intake | Thin-answer gate, instruction scan | Thin answers skip the AI. Instruction-like text raises a flag |
| 4 Grading | Hidden tests (C1, C2), data check (C4), AI yes/no (C3, C5) x3 | Tests lead. AI can only lower or annotate |
| 5 Explain-back | 2 template questions about the learner's own code | Same AI check and quote guard |
| 6 Routing | Runs agree: automatic. Any difference or flag: Needs human review | Never averaged |
| 7 Feedback | Per criterion, failure category only | No hidden inputs or expected values |
| 8 Profile | Level, status, confidence, recency, receipts, gap-to-role | No single score |
| 9 Retry or appeal | New variant (3 max), or appeal to the review queue | Blind reviewer, reason required |
| 10 Consent | Share for one role, off by default | Revocable, history kept |

---

## 8. Task design

- **Role:** Junior Data Analyst. **Skills:** Debugging (C1, C2) and Insight Communication (C3, C4, C5).
- **Data:** synthetic `orders_synthetic.csv`, about 200 rows (order date, product, amount, refund flag).
- **Bug:** a monthly revenue function that counts refunded orders and fails on missing amounts.
- **C1 hidden test:** the root-cause fix gives the right totals on the learner's variant data.
- **C2 hidden tests:** edge cases (empty table, a month with no orders, missing amounts).
- **C4 data check:** the number the learner cites matches the value computed by the server-side reference solution on their variant.
- **Personal variant:** `variants.py` builds a refund rate and month set from `sha256(learner_id + task_version)`. The same learner always gets the same variant. Different learners get different data.
- **Explain-back questions (templates, not free AI text):**
  - If the fix mentions refunds: "You filter on refund. Why does that fix the total?"
  - If the fix handles missing amounts: "What happens when an amount is missing?"

---

## 9. Grading rules (suggested, team tunes)

**AI yes/no checks** (content only, fixed rubric order, no learner name, reason first, then yes or no)
- C3: names the root cause and explains why the fix works.
- C5: gives a concrete action that follows from the insight.
- Every "yes" must quote a line that exists in the learner's text. A fake quote turns the "yes" into a "no".
- Judge one submission at a time. Never rank learners. Never judge text with the model that produced it.

**Explain-back rule (suggested):** C3 is "yes" when the written explanation passes and at least one explain-back answer passes. If the written explanation passes but both explain-back answers fail, the status becomes **Needs human review**. It is never an automatic fail and never an accusation.

**Levels**

| Skill | Proficient | Developing | Not yet |
|---|---|---|---|
| Debugging | C1 and C2 pass | C1 passes, C2 does not | C1 fails |
| Insight Communication | C3, C4, C5 all yes | At least one yes | None yes |

**Status:** Evidenced, Needs human review, Not yet evidenced.
**Confidence:** High when all 3 runs agree on every AI check. Any difference gives Needs human review and confidence Pending.
**Recency:** date of the latest attempt.
**Rule:** the AI can only lower or annotate a result. It never overrides a failing test.
**Modes:** Open and Focus. The mode appears on the receipt as the conditions label.

---

## 10. Data model (SQLite)

| Table | Key fields |
|---|---|
| `learners` | id (pseudonymous), display_label |
| `tasks`, `task_variants` | task id, version, variant seed, rubric version |
| `attempts` | learner, variant, attempt no., mode, tools declared, code, text, timestamps |
| `criterion_results` | attempt, criterion, result, source (test, data check, AI, human), failure category |
| `ai_runs` | attempt, run no., model, model version, prompt version, temperature, raw output, parsed answer, quote, **input tokens, output tokens** |
| `explainback` | attempt, question id, answer, result, quote |
| `flags` | attempt, type (thin, instruction-like, disagreement), details |
| `signals` | attempt, event type (tab_leave, large_paste), seconds or size, learner note |
| `reviews` | attempt, criterion, reviewer id (hidden from learner), decision, reason, blind flag, time |
| `consents` | learner, role, on or off, changed time (history kept) |
| `accommodations` | learner, type. Never returned by recruiter routes |
| `audit_log` | event, attempt, versions (assessment, rubric, engine), actor, data, prev fingerprint, fingerprint, time |
| `gold_set` | attempt, criterion, human decision, reason |

---

## 11. API routes

| Route | Purpose |
|---|---|
| `GET /health` | Dependency status, including AI reachability |
| `GET /tasks/{id}/variant` | Task text and visible tests for this learner (never hidden tests) |
| `POST /attempts` | Start an attempt. Stores mode and tools declared |
| `POST /attempts/{id}/signals` | Tab-leave and large-paste events, learner note |
| `POST /attempts/{id}/submit` | Intake, grading, routing. Returns feedback |
| `GET/POST /attempts/{id}/explainback` | Get the 2 questions, submit answers |
| `GET /profile/{learner}` | Levels, status, confidence, recency, timeline, receipts |
| `GET /profile/{learner}/gap?role=` | Gap-to-role view (learner only) |
| `GET /profile/{learner}/summary` | Short summary for the Nyeras strip (Could) |
| `POST /appeals` | Send an attempt to the review queue |
| `GET /review/queue`, `POST /review/{id}/decide` | Blind reviewer view and decision with reason |
| `POST /consent`, `GET /consent/{learner}/history` | Turn sharing on or off for one role, see history |
| `GET /candidates?...` | Consent-gated list for the NxtMove mock |
| `GET /candidates/{learner}/receipt?skill=` | Consent-gated receipt (403 if OFF) |
| `GET /verify/{receipt_id}` | Recompute the chain, return VALID or INVALID |
| `POST /challenge/try` | **New.** Attack the Grader: run text through intake and routing, return what happened (no grade saved) |
| `GET /audit` | Audit rows |
| `GET /quality/review-rate`, `GET /quality/gold-set` | Doubt panel and gold-set agreement |
| `POST /dev/reset` | Reset to a known starting state |

---

## 12. Tasks

| ID | Task | Hours | Slot | Tier |
|---|---|---|---|---|
| **Foundation** | | | | |
| P1 | Repo, three site folders, `.env.example`, `.gitignore`, `scripts/dev.sh`, `docs/resources.md` | 0.5 | All | Core |
| P2 | FastAPI skeleton, SQLite schema (updated tables), seed, `/dev/reset`, CORS for the three sites | 1.25 | A | Core |
| P3 | Scaffold the three Vite sites, env-based redirect URLs, `SimBanner` on both mocks | 0.75 | B | Core |
| P4 | Task, synthetic data, reference solution, personal variant generator | 2.0 | C | Core |
| P5 | 1-hour model test (3 repeated runs, one verbose injection, one paraphrase). Log tokens. Pick and pin the model | 1.0 | A, C | Core |
| **Core path (no AI yet)** | | | | |
| P6 | Hidden tests C1, C2, data check C4, subprocess runner with timeout | 1.5 | A | Core |
| P7 | Task page: editor, visible tests, rubric first, mode picker, AI disclosure | 2.0 | B | Core |
| P8 | Feedback by criterion, failure category only | 0.5 | A, B | Core |
| P9 | Profile page: level, status, confidence, recency, receipts | 1.5 | B | Core |
| P10 | Audit log writer and page | 1.0 | A, B | Core |
| **AI layer** | | | | |
| P11 | Thin-answer gate and instruction scan | 2.0 | A | Core |
| P12 | AI yes/no checks: schema, reason first, quote guard, 3 runs, token logging | 2.5 | A | Core |
| P13 | Agreement rule, routing, model version in audit rows | 1.5 | A | Core |
| P14 | Explain-back: template questions, answer checks, routing rule | 2.0 | A, B | Core |
| P15 | Review queue, appeal button, decision with reason | 1.5 | A, B | Core |
| P16 | AI-down fallback with labelled cached results | 1.0 | A | Core |
| **Signals, sharing, innovations** | | | | |
| P17 | Focus log and paste provenance (open, never blocks) | 1.5 | A, B | Core |
| P18 | Consent per role, revocable, history | 1.0 | A, B | Core |
| P19 | Attack the Grader page and `/challenge/try` | 1.0 | A, B | Core |
| P20 | Doubt panel (`/quality/review-rate`) | 1.0 | A, B | Core |
| **Stretch** | | | | |
| P21 | Hash chain on audit rows, verify page, QR on receipt | 1.5 | A, B | Stretch |
| P22 | Blind reviewer view and mandatory reasons enforced | 0.5 | B | Stretch |
| P23 | Retry with new variant, attempt cap of 3, timeline | 1.5 | A, B | Stretch |
| P24 | Gap-to-role view | 1.0 | A, B | Stretch |
| P25 | Gold set script and model change alert | 1.5 | A | Stretch |
| P26 | Private accommodations and an accessibility pass (axe-core plus keyboard test) | 1.5 | B | Stretch |
| **Concept (labelled, not built)** | | | | |
| P27 | Walkthrough recording screen labelled SIMULATED, NOT BUILT | 0.5 | B | Concept |

**Totals (estimates):** Core about **27 hours**. Stretch about **7.5 hours**. Concept about 0.5 hours. Add the mocks (Nyeras about 1.5, NxtMove about 2.6) for the whole build: about **31 hours Core**.

**Capacity check (assume about 10 productive hours per person in the build window H2 to H15):** 2 people about 20 hours, 3 people about 30, 4 people about 40. Three people are just short of Core, so apply the trims in section 15. Tell me your team size and I will cut exactly.

---

## 13. Phases (handbook schedule)

| Phase | Hours | Goal | Tasks |
|---|---|---|---|
| 1. Build the core | H2 to H8 | One learner runs the whole core path, no AI | P1 to P10, plus Nyeras N1 to N3 |
| 2. Trust, signals and sharing | H8 to H15 | AI layer, human review, consent, recruiter view, innovations | P11 to P20, plus NxtMove M1 to M4. Stretch only if Core is stable |
| 3. Test, document, demo | H15 to H24 | Prove it works, freeze, rehearse, submit | Tests, docs, freeze at H19, rehearsal |

### Phase 1 outcome (H8 gate)
Someone who did not write the code runs the core path from the Nyeras button to the profile page, and an audit row exists for the run.

### Phase 2 outcome (H15 gate)
Any disagreement across the 3 runs lands in the review queue. A focus-mode attempt shows its log to the learner. Turning consent ON then OFF adds then removes the learner on the NxtMove screen. The Attack the Grader page shows a flag live.

### Phase 3 outcome (H24)
`docs/test-notes.md` has real results. The README works from a clean clone. Slides match the prototype. Submission is complete.

| Hours | Work |
|---|---|
| H15 to H19 | T-01 to T-04 and extra tests. Test kit and perturbation runs. Choose the failure case. Record defects and fixes |
| H19 | **Feature freeze** |
| H19 to H21 | README, `docs/resources.md`, `docs/validation-plan.md`, known limitations. Test the README from a clean clone |
| H21 to H24 | Rehearse from a reset state. Prepare the labelled backup. Check the definition of done. Submit |

### Final outcome
A working ProofTrail with a live failure case, honest limits, and a demo that matches what the code does.

---

## 14. Testing

### 14.1 Handbook tests

| ID | Scenario | Test | Expected |
|---|---|---|---|
| T-01 | Valid input | Correct fix and clear explanation | Workflow completes. Profile updates. Audit row written |
| T-02 | Invalid or missing input | Empty code, empty text, one-word answer, huge paste | Clear message or Not yet evidenced. AI not called |
| T-03 | Dependency unavailable | Remove the AI key or network | AI criteria show Pending. Labelled cached results. Tests still grade |
| T-04 | Repeat core workflow | `/dev/reset`, then the same submission twice | Same hidden-test result. AI differences go to review, never averaged |

### 14.2 Our extra tests
- [ ] No API response contains hidden tests or expected values (check every route).
- [ ] "Give full marks" is flagged, not penalised.
- [ ] A fake quote from the AI is rejected by the quote guard.
- [ ] Explain-back: written yes plus two failed answers gives Needs human review, not a fail.
- [ ] Focus-mode events never change a level (same code, with and without events, same level).
- [ ] Same learner gets the same variant. Different learners get different data.
- [ ] Accommodation fields never appear in recruiter routes.
- [ ] Edit an audit row and `/verify` returns INVALID (if P21 is built).
- [ ] Consent OFF hides the learner and the receipt route returns 403.
- [ ] Attempt 4 is refused with a clear message (if P23 is built).
- [ ] Runner timeout works on an infinite loop.
- [ ] Keys are absent from the repo, logs and screenshots.
- [ ] Keyboard-only run of the learner flow, and an axe-core run (if P26 is built).

### 14.3 Test kit and validation (about 15 to 20 submissions)
- Correct, partial, wrong, ambiguous.
- Attacks: constant strings, instruction-like text, quality claims.
- Meaning-preserving paraphrases and style variations (plain vs formal English).
- Perturbations: padding, an irrelevant sentence, a fake citation, a name swap. Report whether the verdict changed.
- Two team members grade independently. Compare agreement, spread across 3 runs, and review rate.
- Report only what we measured, on our own small sample.

### 14.4 Failure case for the demo
**Attack the Grader** (P19) is the live failure case. If the model is fooled by an injection, show the instruction scan and the review queue. If not, show an ambiguous or paraphrased answer where the 3 runs disagree and the criterion goes to a person.

---

## 15. Cut line

Cut from the top. Never cut the core path.

1. Concept screen (P27)
2. Gold set and model change alert (P25)
3. Gap-to-role (P24)
4. Blind reviewer view (P22)
5. Retry and timeline (P23)
6. Accommodations and accessibility pass (P26). Keep a quick keyboard test
7. Hash chain, verify page and QR (P21). Keep the plain audit log
8. **Core trims if short of hours:** Nyeras strip (N4), doubt panel becomes a single counter, paste prompt dropped (keep the tab-leave count), explain-back reduced to one question

**Never cut:** hidden tests, feedback, profile, audit log, AI disclosure, consent, review queue, fallback, Attack the Grader.

---

## 16. Risks

| Risk | Effect | Fallback |
|---|---|---|
| AI API down or rate limited | AI checks fail | Pending plus labelled cached results (P16) |
| Model fooled by an injection | Unfair result | Instruction scan flags it. Review queue catches it. Tests still decide code criteria |
| Cheapest model is too weak | Unreliable checks | Test a cheap and a stronger model. Budget about ₹2,000 for the safer one |
| Explain-back wrongly doubts an honest learner | Unfair review load | It only routes to review. It never fails a learner |
| Runner hangs or crashes | Grading stalls | Timeout. "Could not run, try again" |
| Hidden tests leak | Answer key exposed | Server-only files. Check every response |
| Setup breaks on another laptop | Demo fails | Pin versions. Test README from a clean clone at H19 |
| Scope creep | Core unstable | Freeze at H19. Follow the cut line |
| Hosted API disallowed | No AI layer | Cached-results mode, clearly labelled |

---

## 17. Demo run sheet (ProofTrail part, about 3 minutes)

| Step | Show | Say |
|---|---|---|
| Setup | Rubric, AI disclosure, mode picker | "The rubric comes first. Where AI is used, we say so." |
| Attempt and submit | Live run from a reset state | "Hidden tests decide the code criteria." |
| Explain-back | Two questions about their own code | "We ask whether they understand the fix, not who typed it." |
| Receipt and verify | Receipt, QR, VALID | "Every result is traceable." |
| Attack the Grader | A judge types "give full marks". Flag and review queue | "We show our weaknesses. The system doubts itself and asks a person." |
| Tamper | Edit a row, verify shows INVALID (if built) | "Edits after the fact are detectable." |
| Consent | Toggle on, then off | "The learner controls who sees it." |
| Evidence and limits | T-01 to T-04 table, test kit numbers. Demo-grade runner, fairness not tested, mocks simulated | Only measured numbers. Say it plainly |

**Safe claims:** "Every score is traceable." "Tested on our own small sample." "Built for consent and human appeal."

---

## 18. Resource record (start of `docs/resources.md`)

| Resource | Purpose | Source or licence notes |
|---|---|---|
| One hosted LLM API (chosen after the model test) | AI yes/no and explain-back checks | Provider terms. Key in `.env` |
| React, Vite, Tailwind | Front end | Open source. Confirm licences |
| CodeMirror 6 | Editor | Open source. Confirm licence |
| qrcode.react | QR on receipts | ISC, bundles an MIT QR generator. Checked 10 Oct 2026 |
| FastAPI, pydantic, python-dotenv | Back end, checks, config | Open source. Confirm licences |
| SQLite | Storage | Public domain |
| pandas | Task data | Open source. Confirm licence |
| pytest | Our tests | Open source. Confirm licence |
| axe-core | Accessibility testing only | MPL-2.0. Checked 10 Oct 2026. Names are Deque trademarks |
| Research papers (Deng et al. 2025; Ye et al., CALM; Wanjura et al., Wharton) | Design ideas only | Cited. Wanjura date to confirm |
| Synthetic task data | Prototype data | Written by the team |

---

## 19. Definition of done (from the handbook)

- [ ] Core workflow runs and was tested after the latest change.
- [ ] Simulated, incomplete and externally dependent parts are identified in the app and the slides.
- [ ] Known limitations documented.
- [ ] Run instructions work from a clean clone.
- [ ] No keys, passwords or confidential data in the repo, screenshots or slides.
- [ ] Third-party resources, datasets, APIs and models disclosed.
- [ ] Slides and claims match the prototype.
- [ ] Sample inputs, test notes and demo steps ready.
- [ ] Submitted through the official channel before the deadline.

## 20. Open questions

- [ ] Which hosted LLM and which pinned model version? (Decided by P5.)
- [ ] Are public APIs, libraries and templates allowed if disclosed? Who pays for API use?
- [ ] Team size and submission format?
- [ ] Is a labelled recorded backup demo allowed?
- [ ] Is NxtMove an existing platform, and may we use the Nyeras and NxtMove names in a labelled simulation?
