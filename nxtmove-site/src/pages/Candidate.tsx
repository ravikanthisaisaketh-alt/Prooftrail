import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { EvidenceDrawer } from '../components/EvidenceDrawer'
import { Chip, DOWN, Empty, ErrorBox, Skeleton } from '../components/Ui'
import { API, skillLabel } from '../lib'

type Skill = { skill: string; level: string; status: string; confidence: string; last_attempt: string; mode: string }

export default function Candidate() {
  const { learner = '' } = useParams()
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // Consent is re-checked by the back end on every request. No consent means no profile.
  useEffect(() => {
    setError(''); setSkills(null)
    fetch(`${API}/candidates?min_level=Not%20yet`).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSkills(d.candidates.find((c: { learner: string }) => c.learner === learner)?.skills ?? []))
      .catch(() => setError(DOWN))
  }, [learner, tick])

  return (
    <Shell>
      <p><Link className="nm-link" to="/job">Back to candidates</Link></p>
      <div className="nm-head">
        <div className="nm-co">{learner.slice(0, 1) || 'C'}</div>
        <div><h1>Candidate {learner}</h1><div className="muted">Junior Data Analyst (sample) · pseudonymous profile</div></div>
      </div>
      <p className="sub">Open <b>See evidence</b> to check the task, rubric and each criterion. Experimental scores. Not validated hiring predictors. AI assisted some criteria.</p>
      {error && <ErrorBox message={error} onRetry={() => setTick(tick + 1)} />}
      {!skills && !error && <Skeleton lines={4} />}
      {skills && skills.length === 0 && <Empty title="This profile is not available"><p className="muted">The learner has not shared it, or has turned sharing off.</p><Link className="nm-btn" to="/job">Back to candidates</Link></Empty>}
      {skills?.map((s) => (
        <div key={s.skill} className="nm-card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>{skillLabel(s.skill)}</h2>
            <span className="row"><Chip value={s.level} /><Chip value={s.status} /></span>
          </div>
          <p className="muted">Confidence {s.confidence} · Last attempt {s.last_attempt} · Conditions {s.mode}</p>
          <button className="nm-btn" onClick={() => setOpen(s.skill)}>See evidence</button>
        </div>
      ))}
      {open && <EvidenceDrawer learner={learner} skill={open} onClose={() => setOpen(null)} />}
    </Shell>
  )
}
