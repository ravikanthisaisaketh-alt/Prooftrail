import { useEffect, useState } from 'react'
import { api, type Skill } from '../lib/api'
import { Layout } from '../components/Layout'

export default function Profile({ learner }: { learner: string }) {
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.profile(learner).then((d) => setSkills(d.skills)).catch((e) => setError(e.message)) }, [learner])
  return (
    <Layout>
      <section className="card">
        <h2>Profile · {learner}</h2>
        <p className="muted">Experimental scores. Not validated hiring predictors. AI assisted some criteria.</p>
        {error && <p role="alert" className="alert">{error}</p>}
        {skills && skills.length === 0 && <p>No evidence yet. <a className="link" href={`/start?learner=${learner}`}>Start an attempt</a>.</p>}
      </section>
      {skills?.map((s, i) => (
        <section key={s.skill} className="card" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>{s.skill}</h2><span className={`chip ${s.status === 'Evidenced' ? 'ok' : 'warn'}`}>{s.status}</span>
          </div>
          <p><span className="level">{s.level}</span></p>
          <p className="muted">Confidence {s.confidence} · Last attempt {s.last_attempt} · Conditions {s.mode}</p>
        </section>
      ))}
      {skills && skills.length > 0 && (
        <section className="card">
          <h2>Receipts</h2>
          <ul className="rubric">
            {skills.map((s) => <li key={s.skill}><b>R-{s.attempt}</b><span>{s.skill} · <a className="link" href={`/verify/R-${s.attempt}`}>Verify</a></span></li>)}
          </ul>
        </section>
      )}
      <p><a className="btn ghost" href={`/consent?learner=${learner}`}>Consent: choose who sees this</a></p>
    </Layout>
  )
}
