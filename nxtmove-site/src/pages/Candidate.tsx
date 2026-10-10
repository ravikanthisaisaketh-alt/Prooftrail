import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { EvidenceDrawer } from '../components/EvidenceDrawer'
import { API } from '../lib'

type Skill = { skill: string; level: string; status: string; confidence: string; last_attempt: string; mode: string }

export default function Candidate() {
  const { learner = '' } = useParams()
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  // Consent is re-checked by the back end on every request. No consent means no profile.
  useEffect(() => {
    fetch(`${API}/candidates?min_level=Not%20yet`).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSkills(d.candidates.find((c: { learner: string }) => c.learner === learner)?.skills ?? []))
      .catch(() => setError('Candidate data unavailable.'))
  }, [learner])

  return (
    <Shell>
      <p><Link className="nm-link" to="/job">Back to candidates</Link></p>
      <div className="nm-head">
        <div className="nm-co">{learner.slice(0, 1) || 'C'}</div>
        <div><h1>Candidate {learner}</h1><div className="muted">Junior Data Analyst (sample) · pseudonymous profile</div></div>
      </div>
      <p className="muted" style={{ margin: 0 }}>Experimental scores. Not validated hiring predictors. AI assisted some criteria.</p>
      {error && <p role="alert" className="alert">{error}</p>}
      {skills && skills.length === 0 && <div className="nm-card"><p>This profile is not available. The learner has not shared it, or has turned sharing off.</p></div>}
      {skills?.map((s) => (
        <div key={s.skill} className="nm-card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>{s.skill}</h2>
            <span className="row"><span className="chip or">{s.level}</span><span className={`chip ${s.status === 'Evidenced' ? 'ok' : 'warn'}`}>{s.status}</span></span>
          </div>
          <p className="muted">Confidence {s.confidence} · Last attempt {s.last_attempt} · Conditions {s.mode}</p>
          <button className="nm-btn" onClick={() => setOpen(s.skill)}>Open evidence</button>
        </div>
      ))}
      {open && <EvidenceDrawer learner={learner} skill={open} onClose={() => setOpen(null)} />}
    </Shell>
  )
}
