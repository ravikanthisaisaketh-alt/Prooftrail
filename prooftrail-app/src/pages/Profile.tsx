import { useEffect, useState } from 'react'
import { api, type Skill } from '../lib/api'

export default function Profile({ learner }: { learner: string }) {
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.profile(learner).then((d) => setSkills(d.skills)).catch((e) => setError(e.message)) }, [learner])
  return (
    <div className="p-6 space-y-3 max-w-xl">
      <h1 className="text-2xl font-bold">Profile · {learner}</h1>
      <p className="text-xs">Experimental scores. Not validated hiring predictors. AI assisted some criteria.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {skills && skills.length === 0 && <p>No evidence yet. <a className="underline" href={`/start?learner=${learner}`}>Start an attempt</a>.</p>}
      {skills?.map((s) => (
        <div key={s.skill} className="rounded border p-3">
          <b>{s.skill}</b>: Level {s.level} · Status {s.status} · Confidence {s.confidence} · Last attempt {s.last_attempt} · Conditions {s.mode}
        </div>
      ))}
      {skills && skills.length > 0 && <>
        <h2 className="font-semibold">Receipts</h2>
        <ul className="list-disc pl-6">
          {skills.map((s) => <li key={s.skill}>{s.skill}: <a className="underline" href={`/verify/R-${s.attempt}`}>R-{s.attempt}</a></li>)}
        </ul>
      </>}
      <p><a className="underline" href={`/consent?learner=${learner}`}>Consent: choose who sees this</a></p>
    </div>
  )
}
