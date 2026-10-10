PROJECT FACTS (use only these, do not invent numbers or claims)

Name: ProofTrail
Event: Samartha Hackathon, Vignan's Institute of Information Technology (24-hour format), Part A: Nyeras / NxtMove Proof-of-Skill Sandbox
Builder: Saketh, 3rd-year B.Tech CSE (AI/ML), Lendi Institute of Engineering and Technology

PROBLEM
- Badges and course certificates show that someone finished a course, not that they can do the work.
- Employers cannot trust or verify them. Learners have no portable, trustworthy proof.
- Assessment tools can be gamed (copy-paste, tab switching, leaked answers) and learners cannot challenge unfair grading.
- Sharing results with employers often happens without the learner's clear control.

SOLUTION
- ProofTrail is a real, working skill-test and evidence platform. It issues a verifiable receipt for each attempt.
- Receipt contains: task, rubric version, per-criterion results, level, status, evidence.
- The learner decides whether the receipt is shared with employers (consent ON or OFF).
- Slogan idea: "A badge is not a skill. A receipt is evidence."

HOW IT WORKS (APPROACH)
1. Learner clicks "Prove your skill" on Nyeras (simulated learning site).
2. ProofTrail opens with the learner ID. Learner attempts a Python task in an in-browser editor, in Open or Focus mode.
3. Intake gate checks the submission, then hidden tests run in a runner with a timeout.
4. AI-assisted checks run with a quote guard (claims must be backed by quoted evidence) and 3 runs for consistency. Routing sends low-confidence cases to humans.
5. Explain-back: learner explains their solution as extra evidence.
6. Appeals and blind review: learners can challenge a result, reviewers do not see who they are reviewing.
7. Result is always written to the Nyeras profile.
8. Only if consent is ON does the learner appear in NxtMove (simulated hiring site) with the receipt and evidence drawer. Revoking consent removes them from NxtMove.
9. Every action is written to a hash-chained audit log. The Verify page shows VALID or broken.

KEY FEATURES
- Hidden tests with timeout runner
- Focus mode with focus log (tab-change tracking)
- AI checks with quote guard and 3-run consistency
- Explain-back, appeals, blind review
- Consent-first sharing, revocable anytime
- Tamper-evident audit log with public Verify
- "Attack the Grader" challenge page: flags instruction-like text trying to trick the AI grader
- Review-rate tracking

WHAT IS REAL VS SIMULATED
- Real: ProofTrail backend and frontend (FastAPI, React + TypeScript + Vite, pytest)
- Simulated and labelled as such: Nyeras and NxtMove

PROOF / NUMBERS (verified)
- 25 backend tests passing
- Audit log verified VALID in an end-to-end run
- Three separate sites connected by one backend

HONEST LIMITS (say these as "next steps")
- AI model keys not configured in this build, so AI-judged criteria show Pending
- Review, audit and quality dashboards not built yet
- Sample data only, no real employers or learners

NEXT STEPS
- Connect a model for AI-judged criteria
- Reviewer dashboard and quality metrics
- Real pilot with a college