# Build Plan v2: NxtMove (simulated site)

**Status:** the screen is SIMULATED. The candidate data is REAL from ProofTrail. About 2.6 hours of work, plus 0.25 for the verify badge.
**Owner slots:** B (front end), A (the `/candidates` routes). Fill in: ____
**Replaces:** the earlier `buildplan-nxtmove.md`. Now a separate site in its own folder.

Companion files: `buildplan-prooftrail.md` (the real system), `buildplan-nyeras.md` (learning mock), `buildplan.md` (overview).

**Hours are estimates.** Tiers: Core, Stretch.

---

## 1. Purpose

Show the recruiter's side: inspect relevant evidence for a sample role and see why a candidate surfaced, without one opaque score, and only for learners who gave consent.

**What it is:** a styled job page plus a candidate list that reads consented profiles from ProofTrail.
**What it is not:** an integration with NxtMove, a ranking tool, or a hiring predictor.

What we know: NxtMove's existence is unconfirmed. So we call it "a simulated recruiter screen" and say so out loud.

---

## 2. Rules that apply here

- [ ] Banner on every screen: **SIMULATED SCREEN. Not the real NxtMove.**
- [ ] No NxtMove logo, colours or copied text. Plain text and neutral styling.
- [ ] No composite score, match percent, rank or "top candidate". Neutral order only (by learner ID).
- [ ] A learner appears only while consent is ON for this role.
- [ ] Disclosure line on the page: "Experimental scores. Not validated hiring predictors. AI assisted some criteria."
- [ ] Show AI-assisted and Human reviewed tags on every result.
- [ ] **Show the assessment mode label (Open or Focus). Do not show focus counts, paste counts or accommodations to recruiters.** Counts stay with the learner and the reviewer so they cannot become a hidden ranking signal. This is a design decision, change it only on purpose.
- [ ] Sample rows are clearly tagged "sample".
- [ ] Never say "integrated with NxtMove".

---

## 3. Where it lives

```
prooftrail/
  nxtmove-site/           own Vite app, port 5175
    src/pages/Job.tsx
    src/components/SimBanner.tsx  CandidateCard.tsx  EvidenceDrawer.tsx  Filters.tsx
    .env.example                  VITE_API_URL, VITE_PROOFTRAIL_URL
```

It is a **separate website**. It never writes data. Read only.

---

## 4. Contract with the other parts

| Direction | What | Detail |
|---|---|---|
| ProofTrail to NxtMove | Candidate list | `GET /candidates?role=jr-data-analyst&skill=&min_level=&status=&recent_days=&conditions=` returns only learners with consent ON |
| ProofTrail to NxtMove | Evidence receipt | `GET /candidates/{learner}/receipt?skill=` returns task, rubric version, evidence, date, mode label, tags. **403 if consent is OFF** |
| NxtMove to ProofTrail | Verify link | Opens `${VITE_PROOFTRAIL_URL}/verify/{receipt_id}` (Stretch) |
| NxtMove to ProofTrail | Nothing is written back | Read only |

Response for each candidate (suggested):

```json
{
  "learner": "L-001",
  "skills": [
    {"skill": "Debugging", "level": "Developing", "status": "Evidenced",
     "confidence": "High", "last_attempt": "2026-10-10",
     "conditions": "Unsupervised, AI tools allowed", "mode": "Open"}
  ]
}
```

The response has no accommodation field, no signal counts and no score.

---

## 5. Screens

### 5.1 Job page (`/job`)

| Block | Content |
|---|---|
| Banner | `SimBanner` fixed at the top |
| Role | "Junior Data Analyst" (sample role) |
| Explicit requirements | Debugging: minimum Developing. Insight Communication: minimum Developing. Evidence within the last 90 days |
| Filters | Skill, minimum level, status, recency (days), conditions label. Defaults match the role requirements |
| Disclosure line | "Experimental scores. Not validated hiring predictors. AI assisted some criteria." |

### 5.2 Candidate list
- One card per candidate: learner label, then per skill the level, status, confidence, recency, conditions label and mode.
- **Neutral order:** sort by learner ID. Do not sort by level, by any combined value, or by latest attempt (a recency proxy).
- **Why surfaced:** one line listing only the matched requirements, for example "Debugging: Developing or above. Evidence 3 days old. Insight Communication: Developing or above."
- **Empty state:** "No consented candidates match these filters."
- **Sample rows:** 2 or 3 seeded candidates tagged **sample**, so the list is not empty before any learner consents.

### 5.3 Evidence drawer
Opens on click. Shows the receipt: task and variant, rubric version, criterion results with failure categories where relevant, evidence lines, date, conditions label and mode, AI-assisted tags, Human reviewed tag. **Verify badge (Stretch):** "Receipt check: VALID", linking to the ProofTrail verify page. Reuse the receipt component idea from ProofTrail (copy the markup, the sites are separate).

---

## 6. "Why surfaced" rule (simple and honest)

A candidate matches when every requirement the recruiter set is met:

- skill level is at or above the minimum (Not yet < Developing < Proficient)
- status is Evidenced (or the status chosen in the filter)
- last attempt is within the chosen number of days
- conditions label equals the chosen one, if set

Candidates who do not match are not shown. There is no partial score. A candidate whose status is Needs human review is shown only if the recruiter chooses that status, and is tagged.

---

## 7. Tasks

| ID | Task | Hours | Owner slot | Tier |
|---|---|---|---|---|
| M1 | `/candidates` and `/candidates/{learner}/receipt` routes with filters and consent check | 1.0 | A | Core |
| M2 | Job page and candidate list UI with filters, neutral order, empty state | 1.0 | B | Core |
| M3 | Evidence drawer | 0.5 | B | Core |
| M4 | Disclosure line and sample-row tags | 0.1 | B | Core |
| M5 | Verify badge in the drawer | 0.25 | B | Stretch |

Total: about 2.6 hours Core, 0.25 hours Stretch.

**Order:** after consent (P18) exists in ProofTrail, in Phase 2 (H8 to H15). M1 and M2 can start earlier using seeded rows. Scaffolding is counted in ProofTrail task P3.

---

## 8. Tests

| Test | Steps | Expected |
|---|---|---|
| T-01 Valid | Learner has consent ON, open the job page | Learner appears with correct level, status and why-surfaced line |
| T-02 Invalid | Set a minimum level no one meets, or send a bad filter value | Empty state or a clear validation message, no crash |
| T-03 Dependency down | Stop the back end | "Candidate data unavailable". Sample rows stay labelled. No fake live data |
| T-04 Repeat | Reset and repeat the same consent change twice | Same list both times |
| Consent ON | Turn consent ON in ProofTrail | Learner appears |
| Consent OFF | Turn consent OFF | Learner disappears on refresh. Receipt route returns 403 |
| No ranking | Change filters and data | Order stays by learner ID. No score or percent anywhere |
| Privacy check | Read every API response used by this site | No accommodation, no focus or paste counts |
| Label check | Visit every NxtMove screen | Banner visible. Sample rows tagged |
| Verify (Stretch) | Edit an audit row, reopen the drawer | Receipt check shows INVALID |

---

## 9. Done when

- [ ] A learner with consent OFF never appears and the receipt route refuses them.
- [ ] Turning consent ON then OFF adds then removes them.
- [ ] Every candidate shows level, status, confidence, recency, conditions, mode and a why-surfaced line.
- [ ] No composite score, rank or match percent exists in the UI or the API.
- [ ] Banner, disclosure line and sample tags are visible.
- [ ] No accommodation or signal counts are returned to this site.

## 10. Do not

- Do not rank, score or "match percent" candidates.
- Do not show names, emails or any personal data. Use pseudonymous labels.
- Do not show a candidate without consent, even in a demo.
- Do not claim the scores predict hiring success.
- Do not add messaging, hiring pipelines or saved searches.

## 11. Demo lines

- "This is a simulated recruiter screen. The candidate data is real, from ProofTrail, and only appears with consent."
- "Switch consent off and the candidate disappears."
- "There is no single score. The recruiter sees evidence and why this person matched."
- "The recruiter sees the conditions the work was done under, not a hidden surveillance score."

## 12. Risks

| Risk | Fallback |
|---|---|
| NxtMove does not exist as a recruiter platform | Wording stays "simulated recruiter screen" |
| Organisers disallow the NxtMove name | Rename to "Recruiter screen (simulated)" |
| Only one real learner exists at demo time | Use the labelled sample rows and a second test learner from the reset script |
| Consent logic bug shows a learner without consent | Run the consent tests before submission |

## 13. Open questions for the organisers

- Is NxtMove an existing platform, and may we use its name in a labelled simulation?
- Is a role other than Junior Data Analyst expected?

## 14. Later ideas (not in this plan)

- An evidence request loop (recruiter asks for more proof, learner approves). It needs a consent workflow beyond the first version.
