# Build Plan v2: Nyeras (simulated site)

**Status:** SIMULATED. Not the real Nyeras. About 1.5 hours of work.
**Owner slot:** B (front end and mocks). Fill in: ____
**Replaces:** the earlier `buildplan-nyeras.md`. Now a separate site in its own folder.

Companion files: `buildplan-prooftrail.md` (the real system), `buildplan-nxtmove.md` (recruiter mock), `buildplan.md` (overview).

**Hours are estimates.** Tiers: Core, Stretch.

---

## 1. Purpose

Show where a learner starts: a finished course with no proof of skill. Then hand the learner to ProofTrail.

**What it is:** a small static site with seeded pages plus one real button.
**What it is not:** an integration with Nyeras, a copy of its content, or a use of its brand.

What we know: Nyeras exists as an online learning company. We have not confirmed whether it is a website, an app or both. So we call this "a simulated learning platform screen" and say so out loud.

---

## 2. Rules that apply here

- [ ] Banner on every screen: **SIMULATED SCREEN. Not the real Nyeras.**
- [ ] No Nyeras logo, colours, fonts or real course text. Plain text and neutral styling.
- [ ] Synthetic learner and course data only.
- [ ] Never say "integrated with Nyeras". Say "simulated Nyeras screen".
- [ ] Record React, Vite and Tailwind in `docs/resources.md`.
- [ ] No claim that the course badge or the ProofTrail result is verified competence.

---

## 3. Where it lives

```
prooftrail/
  nyeras-site/            own Vite app, port 5173
    src/pages/Course.tsx
    src/components/SimBanner.tsx   (copy of the same small component used by NxtMove)
    src/seed.ts
    .env.example                   VITE_PROOFTRAIL_URL, VITE_API_URL
```

It is a **separate website** from ProofTrail and NxtMove. It only talks to them through a link and one optional read.

---

## 4. Contract with the other parts

| Direction | What | Detail |
|---|---|---|
| Nyeras to ProofTrail | Button link | `${VITE_PROOFTRAIL_URL}/start?learner=L-001&source=nyeras-mock` |
| ProofTrail to Nyeras | Return link | `http://localhost:5173/course` (from `.env`, not hard-coded) |
| ProofTrail to Nyeras (Could) | Latest result strip | `GET ${VITE_API_URL}/profile/L-001/summary` returns skill, level, status, date |

The learner ID is a pseudonymous label like `L-001`. It carries no name or email.

**Privacy note for the strip:** the demo has no login, so the summary route returns a pseudonymous, synthetic learner's own summary. A real product would need sign-in before showing anyone's result. Say this under limitations.

---

## 5. Screens

### 5.1 Course page (`/course`)

| Block | Content (synthetic) |
|---|---|
| Banner | `SimBanner` fixed at the top |
| Header | Plain text "Learning platform (simulated)" and "Learner L-001" |
| Course title | "Data Analysis with pandas" |
| Progress | Bar at 100% and a "Course completed" badge |
| Modules | 5 or 6 ticked module titles (for example: Loading data, Cleaning data, Grouping and totals, Dates and months, Reading results) |
| Certificate area | "A completion badge shows you finished the lessons. It does not show what you can do." |
| ProofTrail card | See 5.2 |

### 5.2 "Prove your skill" card
- Title: "Prove your skill"
- Text: "Try a short, realistic task. You get feedback on each criterion, and you choose who sees the result."
- Button: **Start a ProofTrail task** (opens the link in section 4)
- Small note: "ProofTrail is the real prototype. This page is simulated."

### 5.3 Optional strip (Stretch)
If the API is reachable, show "Latest ProofTrail result: Debugging, Developing, 10 Oct". If not, hide the strip silently. The page must work without it.

---

## 6. Seed data (`src/seed.ts`)

```ts
export const course = {
  title: "Data Analysis with pandas",
  completed: true,
  modules: [
    "Loading data",
    "Cleaning data",
    "Grouping and totals",
    "Dates and months",
    "Reading results",
  ],
};
export const learner = { id: "L-001", label: "Learner L-001" };
```

Keep module names generic and not copied from any real course.

---

## 7. Tasks

| ID | Task | Hours | Tier |
|---|---|---|---|
| N1 | `SimBanner` component (copy it into NxtMove too) | 0.25 | Core |
| N2 | Course page with seeded content | 0.75 | Core |
| N3 | "Prove your skill" card and link with learner ID from `.env` | 0.25 | Core |
| N4 | Latest-result strip with silent fallback | 0.25 | Stretch |

Total: about 1.25 hours Core, 0.25 hours Stretch.

**Order:** N1, N2, N3 in Phase 1 (H2 to H8). N4 only if time remains. Scaffolding the Vite app is counted in ProofTrail task P3.

---

## 8. Tests

| Test | Steps | Expected |
|---|---|---|
| T-01 Valid | Open `/course`, click the button | ProofTrail setup opens with the learner shown as `L-001` |
| T-02 Invalid | Open the ProofTrail start page with no `learner` param | A clear message and a link back to the course page, no crash |
| T-03 Dependency down | Stop the back end, reload the course page | Page still renders. Strip hidden. Button still works |
| T-04 Repeat | Run `/dev/reset`, click through twice | Same result both times |
| Label check | Visit every Nyeras screen | Banner visible on all |
| Brand check | Look for logos, colours, copied text | None found |

---

## 9. Done when

- [ ] Banner on every Nyeras screen.
- [ ] Button opens ProofTrail with the learner ID set.
- [ ] No brand assets or copied course content.
- [ ] The page works with the back end switched off.
- [ ] Redirect URLs come from `.env`.

## 10. Do not

- Do not claim a real Nyeras connection.
- Do not add login, payments, a video player or progress tracking.
- Do not spend more than 2 hours here.

## 11. Demo lines

- "This is a simulated learning platform screen. The course is complete, but completion is not proof of skill."
- "From here the learner starts ProofTrail, which is the real prototype."

## 12. Risks

| Risk | Fallback |
|---|---|
| Nyeras turns out to be an app, not a website | The banner already says "simulated". Keep the wording generic |
| Organisers disallow using the Nyeras name | Rename the screen "Learning platform (simulated)" |
| Port clash on another laptop | Ports come from each site's config. Document them in the README |
| Time runs short | Ship N1 to N3 only. Skip N4 |

## 13. Open questions for the organisers

- Is Nyeras a website, an app or both?
- May we use the Nyeras name in a labelled simulation?
