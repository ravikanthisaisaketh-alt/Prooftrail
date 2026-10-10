# ProofTrail: video script (2:00, 1920x1080, 30 fps)

All facts come from `../pro_details.md`. Timestamps are when each screen starts; it exits 0.35 s before the next one starts.
No voiceover. Music bed only. The "H" line is the large headline and "C" is the caption.

## 1. Problem (0:00-0:15)
| Time | On screen |
|---|---|
| 0:00 | H: Badges show you finished. / C: Not that you can do the work. |
| 0:03.75 | H: Employers can't verify them. / C: No portable, trustworthy proof. |
| 0:07.50 | H: Tests can be gamed. / C: Copy-paste. Tab switching. Leaked answers. |
| 0:11.25 | H: Can't challenge unfair grading. / C: Results shared without clear control. |

## 2. Solution (0:15-0:35)
| Time | On screen |
|---|---|
| 0:15 | ProofTrail wordmark / C: A real, working skill-test and evidence platform. |
| 0:20 | H: Every attempt gets a receipt. / C: A verifiable receipt for each attempt. |
| 0:25 | H: Inside every receipt. Chips: Task, Rubric version, Per-criterion results, Level, Status, Evidence |
| 0:30 | H: You decide who sees it. Toggles: Consent ON / Consent OFF / C: Revocable anytime. |

## 3. Live demo (0:35-1:20): 45 s PLACEHOLDER for your screen recording
The dashed teal frame (`#demo-slot`) is marked "Placeholder / Screen recording goes here / 45 seconds, 0:35 to 1:20".
The click-path caption list is on screen the whole time. Each step lights up on the beat below.
| Time | Step highlighted |
|---|---|
| 0:36 | 1. Nyeras |
| 0:41.5 | 2. Prove your skill |
| 0:47 | 3. Attempt |
| 0:54 | 4. Consent ON or OFF |
| 1:03 | 5. Nyeras profile always updates |
| 1:11.5 | 6. NxtMove shows it only if ON |

## 4. How we solve it (1:20-1:40)
| Time | On screen |
|---|---|
| 1:20 | Diagram: Nyeras → ProofTrail → Nyeras profile (always), NxtMove (if ON) / C: Three sites. One backend. |
| 1:25 | Pipeline icons: Attempt, Hidden tests, AI checks, Humans, Audit log / C: Low-confidence cases go to humans. |
| 1:30 | Feature tiles: Focus mode, Quote guard, Appeals, Blind review, Revocable consent, Attack the Grader |
| 1:35 | H: Hash-chained audit log. Chain ending in VALID / C: Public Verify page. |

## 5. Impact, honest limits, next steps (1:40-2:00)
| Time | On screen |
|---|---|
| 1:40 | Stats: 25 backend tests passing / VALID audit log verified / 3 sites, one backend |
| 1:45 | REAL: ProofTrail backend and frontend. SIMULATED: Nyeras and NxtMove. / C: Labelled as such. |
| 1:49 | LIMITS: AI-judged criteria show Pending. Dashboards not built yet. Sample data only. |
| 1:53 | NEXT STEPS: Connect a model. Reviewer dashboard, quality metrics. Real college pilot. |
| 1:56.5 | ProofTrail. A badge is not a skill. A receipt is evidence. (holds to 2:00) |

## Notes
- Word cap: every screen is at most 12 words, except the demo click-path list (19 words, as requested).
- Not shown on screen: builder and event credit (Saketh, Samartha Hackathon), kept out to hold the 12-word cap.
- To drop in your recording: put it at `composition/assets/demo.mp4` and follow the comment above the `#s3` section in `composition/index.html`, then re-render with `cd composition && npx hyperframes render --output ../ProofTrail.mp4`.
