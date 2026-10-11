import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api, SKILL_LABEL, type Skill } from '../lib/api'
import { Layout } from '../components/Layout'
import { Empty, ErrorBox, Skeleton, StatusChip } from '../components/Ui'

export default function Profile({ learner }: { learner: string }) {
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [error, setError] = useState('')
  const load = () => { setError(''); return api.profile(learner).then((d) => setSkills(d.skills)).catch((e) => setError(e.message)) }
  useEffect(() => { load() }, [learner])
  return (
    <Layout title="Your skill profile" subtitle="Your latest level for each skill, with receipts you can verify. Next: choose who can see it.">
      <section className="card">
        <h2>Learner {learner}</h2>
        <p className="muted">Experimental scores. Not validated hiring predictors. AI assisted some criteria.</p>
        {error && <ErrorBox message={error} onRetry={load} />}
        {!skills && !error && <Skeleton />}
        {skills && skills.length === 0 && <Empty title="No evidence yet"><p className="muted">Complete one task to see your level here.</p><a className="btn" href={"/start"}>Start an attempt</a></Empty>}
      </section>
      {skills?.map((s, i) => (
        <section key={s.skill} className="card" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>{SKILL_LABEL[s.skill] ?? s.skill}</h2><StatusChip value={s.status} />
          </div>
          <p><span className="level">{s.level}</span> <StatusChip value={s.level} /></p>
          <p className="muted">Confidence {s.confidence} · Last attempt {s.last_attempt} · Conditions {s.mode}</p>
        </section>
      ))}
      {skills && skills.length > 0 && (
        <section className="card">
          <h2>Receipts</h2>
          <ul className="rubric">
            {skills.map((s) => <li key={s.skill}><b>R-{s.attempt}</b><span>{SKILL_LABEL[s.skill] ?? s.skill} · <a className="link" href={`/verify/R-${s.attempt}`}>Verify</a></span></li>)}
          </ul>
        </section>
      )}
      {skills && skills.length > 0 && <p><Link className="btn" to="/consent">Next: choose who can see this</Link></p>}
    </Layout>
  )
}
