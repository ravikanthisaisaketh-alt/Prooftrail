import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { EvidenceDrawer } from '../components/EvidenceDrawer'
import { Chip, DOWN, Empty, ErrorBox, Skeleton } from '../components/Ui'
import { useToast } from '../components/Toast'
import { API, LEVELS, SAMPLES, JOBS, LIVE_JOB, SKILLS, skillLabel } from '../lib'

type Skill = { skill: string; level: string; status: string; confidence: string; last_attempt: string; mode: string }
type Candidate = { learner: string; skills: Skill[] }

const daysAgo = (d: string) => Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 86400000))
function why(s: Skill, f: { minLevel: string; conditions: string; status: string; days: string; skill: string }) {
  const bits: string[] = []
  if (f.skill) bits.push(`skill ${skillLabel(f.skill)}`)
  if (f.minLevel !== 'Not yet') bits.push(`level ${f.minLevel} or above`)
  if (f.conditions) bits.push(`conditions ${f.conditions}`)
  if (f.days) bits.push(`evidence within ${f.days} days`)
  if (f.status) bits.push(`status ${f.status}`)
  const base = bits.length ? bits.join(', ') : 'no filters set, so every shared candidate is shown'
  return `Matches: ${base}. Their ${skillLabel(s.skill)} evidence is ${daysAgo(s.last_attempt)} days old.`
}

export default function Job() {
  const [minLevel, setMinLevel] = useState('Not yet')
  const [conditions, setConditions] = useState('')
  const [days, setDays] = useState('')
  const [status, setStatus] = useState('')
  const [skill, setSkill] = useState('')
  const [list, setList] = useState<Candidate[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<{ learner: string; skill: string } | null>(null)
  const [tick, setTick] = useState(0)
  const toast = useToast()
  const job = JOBS.find((j) => j.id === LIVE_JOB)!

  useEffect(() => {
    setError(''); setList(null)
    const q = new URLSearchParams({ min_level: minLevel })
    if (conditions) q.set('conditions', conditions)
    if (days) q.set('recent_days', days)
    if (status) q.set('status', status)
    if (skill) q.set('skill', skill)
    fetch(`${API}/candidates?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad response'))))
      .then((d) => setList(d.candidates))
      .catch(() => { setList(null); setError('Candidate data unavailable.') })
  }, [minLevel, conditions, days, status, skill, tick])
  const clear = () => { setMinLevel('Not yet'); setConditions(''); setDays(''); setStatus(''); setSkill(''); toast('Filters cleared') }

  const f = { minLevel, conditions, status, days, skill }
  const samples = SAMPLES.filter((c) => LEVELS.indexOf(c.level) >= LEVELS.indexOf(minLevel)
    && (!skill || c.skill === skill) && (!conditions || c.mode === conditions) && (!status || c.status === status) && (!days || daysAgo(c.last_attempt) <= Number(days)))

  return (
    <Shell>
      <p><Link className="nm-link" to="/jobs">All roles</Link></p>
      <div className="nm-head">
        <div className="nm-co">S</div>
        <div style={{ flex: 1 }}>
          <h1>{job.title} <span className="chip">sample</span></h1>
          <div className="muted">{job.company} · {job.place}</div>
        </div>
        <span className="chip or pulse">Candidate search</span>
      </div>
      <p className="sub">Learners who chose to share their ProofTrail result appear below. Open <b>Evidence</b> to see why. Experimental scores. Not validated hiring predictors. AI assisted some criteria.</p>
      <div className="nm-layout">
        <aside className="nm-card nm-side" aria-label="Filters">
          <h2>Filters</h2>
          <label htmlFor="f-skill">Skill</label>
          <select id="f-skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">Any skill</option>
            {SKILLS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <label htmlFor="f-level">Minimum level</label>
          <select id="f-level" value={minLevel} onChange={(e) => setMinLevel(e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
          <label htmlFor="f-cond">Conditions</label>
          <select id="f-cond" value={conditions} onChange={(e) => setConditions(e.target.value)}><option value="">Any</option><option>Open</option><option>Focus</option></select>
          <label htmlFor="f-days">Recent evidence</label>
          <select id="f-days" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="">Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
          </select>
          <label htmlFor="f-status">Status</label>
          <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option><option>Evidenced</option><option>Needs human review</option><option>Not yet evidenced</option>
          </select>
        </aside>
        <section style={{ display: 'grid', gap: 12 }}>
          {error && <ErrorBox message={DOWN} onRetry={() => setTick(tick + 1)} />}
          {!list && !error && <Skeleton lines={4} />}
          {list && list.length === 0 && <Empty title="No consented candidates match these filters"><p className="muted">Nobody has shared a result that fits, or filters are too strict.</p><button className="nm-btn" onClick={clear}>Clear filters</button></Empty>}
          {list?.map((c) => (
            <article key={c.learner} className="nm-card hover">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h2><Link className="nm-link" to={`/candidate/${c.learner}`}>{c.learner}</Link></h2>
                <span className="chip ok">Shared with consent</span>
              </div>
              {c.skills.map((s) => (
                <div key={s.skill} className="skillrow">
                  <b>{skillLabel(s.skill)}</b>
                  <Chip value={s.level} />
                  <Chip value={s.status} />
                  <span className="muted">confidence {s.confidence} · {s.last_attempt} · {s.mode}</span>
                  <button className="nm-btn" style={{ marginLeft: 'auto' }} onClick={() => setOpen({ learner: c.learner, skill: s.skill })}>Evidence</button>
                  <div className="why" style={{ flexBasis: '100%' }}><b>Why surfaced.</b> {why(s, f)}</div>
                </div>
              ))}
            </article>
          ))}
          {!error && samples.map((c) => (
            <article key={c.learner} className="nm-card" style={{ borderStyle: 'dashed' }}>
              <h2>{c.learner} <span className="chip">sample</span></h2>
              <div className="skillrow"><b>{c.skill}</b><Chip value={c.level} /><Chip value={c.status} />
                <span className="muted">confidence {c.confidence} · {c.last_attempt} · {c.mode}</span></div>
              <div className="why"><b>Why surfaced.</b> {why(c, f)}</div>
            </article>
          ))}
        </section>
      </div>
      {open && <EvidenceDrawer learner={open.learner} skill={open.skill} onClose={() => setOpen(null)} />}
    </Shell>
  )
}
