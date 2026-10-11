// Site and API addresses come from VITE_ env vars. The localhost fallbacks apply to `npm run dev` only,
// so a production build that is missing a variable fails loudly instead of quietly calling localhost.
const fromEnv = (v: string | undefined, devDefault: string): string => v || devDefault
export const API = fromEnv(import.meta.env.VITE_API_URL, import.meta.env.DEV ? 'http://localhost:8000' : '')
export const PROOFTRAIL = fromEnv(import.meta.env.VITE_PROOFTRAIL_URL, import.meta.env.DEV ? 'http://localhost:5174' : '')
if (import.meta.env.PROD && !API) console.error('Set VITE_API_URL for this build.')
export const LEVELS = ['Not yet', 'Developing', 'Proficient']
export const SAMPLES = [
  { learner: 'S-101', skill: 'Debugging', level: 'Proficient', status: 'Evidenced', confidence: 'High', last_attempt: '2026-10-01', mode: 'Open' },
  { learner: 'S-102', skill: 'Debugging', level: 'Developing', status: 'Evidenced', confidence: 'High', last_attempt: '2026-09-20', mode: 'Focus' },
]
export const LIVE_JOB = 'jr-data-analyst'
export const JOBS = [
  { id: LIVE_JOB, title: 'Junior Data Analyst', company: 'Sample Analytics Co.', place: 'Remote (sample)', sample: true,
    blurb: 'Clean and summarise order data, find why numbers look wrong, and tell the team what to do next.' },
  { id: 'support-engineer', title: 'Support Engineer', company: 'Example Cloud Ltd.', place: 'Hybrid (sample)', sample: true,
    blurb: 'Reproduce customer issues, read logs and write clear replies.' },
  { id: 'qa-analyst', title: 'QA Analyst', company: 'Demo Retail Inc.', place: 'On-site (sample)', sample: true,
    blurb: 'Design test cases and report defects with evidence.' },
  { id: 'ops-associate', title: 'Operations Associate', company: 'Placeholder Logistics', place: 'Remote (sample)', sample: true,
    blurb: 'Track shipments, spot exceptions and keep the weekly report accurate.' },
]
export const SKILLS: [string, string][] = [
  ['Debugging', 'Debugging with pandas'], ['Insight Communication', 'Explanation: pandas'],
  ['Text cleaning', 'Text cleaning'], ['Insight: Text cleaning', 'Explanation: text cleaning'],
  ['Data structures', 'Data structures'], ['Insight: Data structures', 'Explanation: data structures'],
]
export const skillLabel = (s: string) => SKILLS.find(([v]) => v === s)?.[1] ?? s
