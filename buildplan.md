# Build Plan v2: Overview (ProofTrail + Nyeras + NxtMove)

**Read this first.** It is the short map. The three standalone plans hold the detail, and **they win if anything here differs**.

- `buildplan-prooftrail.md`: the real system (about 27h Core)
- `buildplan-nyeras.md`: simulated learning screen (about 1.25h Core)
- `buildplan-nxtmove.md`: simulated recruiter screen (about 2.6h Core)

**Hours are estimates, not measured.** Tiers: Core, Stretch, Concept.

---

## 1. Totals

| Tier | Hours (estimate) | Meaning |
|---|---|---|
| Core | about 31 | Must work live. Includes both mock sites |
| Stretch | about 8 | Build only if Core is green |
| Concept | about 0.5 | Slide or note only, labelled "SIMULATED, NOT BUILT" |

**Capacity warning:** 3 people over a 24-hour event give roughly 30 usable hours. Core is about 31. So there is almost no slack. Use the cut line (section 6) early, not at H18.

---

## 2. Three sites, one folder

```
prooftrail/
  backend/          FastAPI, port 8000, SQLite
  nyeras-site/      Vite, port 5173   (SIMULATED)
  prooftrail-app/   Vite, port 5174   (REAL)
  nxtmove-site/     Vite, port 5175   (SIMULATED)
  scripts/dev.sh    starts all four
```

They join only through **buttons and links**. URLs come from each site's `.env`, never hard-coded.

| From | To | How |
|---|---|---|
| Nyeras | ProofTrail | "Start a ProofTrail task" button, `?learner=L-001` |
| ProofTrail | Nyeras | Return link |
| NxtMove | ProofTrail | Reads `/candidates` (consented only), verify link |

---

## 3. Ground rules (apply to all three)

- Tests decide. AI assists. Humans decide when unsure. AI can lower or annotate, never raise a failed test.
- No composite score, rank or match percent anywhere.
- Banner on every mock screen: **SIMULATED SCREEN**.
- Consent is deny-by-default. No consent, no recruiter view.
- Pseudonymous IDs only (`L-001`). No names or emails.
- Focus and paste signals never change a level. Recruiters see the mode label only.
- No fabricated results. Sample rows are tagged "sample".
- Keys in `.env`. Record every library in `docs/resources.md`.

---

## 4. Phases (matches the handbook H0 to H24 schedule)

| Phase | Hours | Goal | Outcome you can show |
|---|---|---|---|
| 0 Setup | H0 to H2 | Repo, three Vite apps, back end, model test starts | All four start with `dev.sh` |
| 1 Core loop | H2 to H8 | Task, editor, runner, hidden tests, Nyeras page | Learner runs code, gets category feedback |
| 2 Rubric, AI, consent | H8 to H15 | AI checks, receipt, consent, NxtMove list | Receipt shown, consent changes recruiter list |
| 3 Quality features | H15 to H19 | Modes, variants, explain-back, reviewer queue | Feature demo path works |
| Freeze | H19 | No new features | Bug fixes and docs only |
| 4 Prove it | H19 to H22 | Tests T-01 to T-04, clean-clone README run, reset script | Tests pass from a clean clone |
| 5 Demo | H22 to H24 | Rehearse, backup video, submit | Two rehearsals done |

---

## 5. Who does what (fill in)

| Slot | Likely work | Name |
|---|---|---|
| A | Back end, runner, grading, consent, audit log | ____ |
| B | Front ends, mocks, receipt UI, NxtMove | ____ |
| C | AI adapter, tests, docs, resources record, demo | ____ |

Team size is not confirmed. Change the slots once it is.

---

## 6. Cut line (drop in this order if time runs short)

1. Concept items (walkthrough)
2. Reviewer gold set and model change alert
3. Gap-to-role view
4. Blind reviewer view
5. Retry and doubt panel polish
6. Accommodations
7. Hash chain and verify page
8. Only then trim Core (for example NxtMove drawer detail)

**Never cut:** hidden tests, category-only feedback, consent gate, banner labels, the four required tests, the README.

---

## 7. Top risks

| Risk | Fallback |
|---|---|
| AI API fails or key limit hit | Fallback path: AI criteria go to Needs human review, tests still grade |
| Runner is demo-grade, not a sandbox | Say so openly. Timeout plus restricted imports |
| Time runs short | Cut line above |
| Organisers disallow mock names | Rename to "Learning platform (simulated)" and "Recruiter screen (simulated)" |
| Live demo breaks | Backup recording plus seeded data and the reset script |

---

## 8. Demo run sheet (about 5 minutes)

1. Nyeras (simulated): course complete, no proof of skill.
2. Click through to ProofTrail. Pick a task. Show the mode label.
3. Submit a buggy fix: category-only feedback, level "Not yet".
4. Fix it and answer the explain-back questions: "Proficient", receipt with tags.
5. Turn consent ON. Open NxtMove (simulated): learner appears with why-surfaced line.
6. Turn consent OFF: learner disappears.
7. Attack the Grader: try a prompt trick, show it cannot raise a failed test.
8. Close with limits: experimental, not a validated hiring predictor.

---

## 9. Definition of done (whole project)

- [ ] Fresh clone runs from the README with one command.
- [ ] T-01 to T-04 pass for each site.
- [ ] Banners, tags and disclosure lines on every screen.
- [ ] `docs/resources.md` lists every library, model and dataset.
- [ ] No keys in the repo.
- [ ] Limitations slide is honest.

---

## 10. Open questions (still unanswered)

- Team size and hours left (decides how much of the cut line to apply now)
- Which model to pin (decided by the 1-hour model test)
- Organisers: is an LLM API allowed, does NxtMove exist, backup demo rules
