import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SimBanner } from '../components/SimBanner'
import { API, SAMPLES } from '../lib'
type Skill = { skill: string; level: string; status: string; confidence: string; last_attempt: string; mode: string }
type Candidate = { learner: string; skills: Skill[] }

export default function Job() {
  const [minLevel, setMinLevel] = useState('Not yet')
  const [list, setList] = useState<Candidate[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setError('')
    fetch(`${API}/candidates?min_level=${encodeURIComponent(minLevel)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad response'))))
      .then((d) => setList(d.candidates))
      .catch(() => { setList(null); setError('Candidate data unavailable.') })
  }, [minLevel])

  return (
    <div>
      <SimBanner name="NxtMove" />
      <main className="mx-auto max-w-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Junior Data Analyst (sample role)</h1>
        <p className="text-xs">Experimental scores. Not validated hiring predictors. AI assisted some criteria.</p>
        <label className="block">Minimum level{' '}
          <select value={minLevel} onChange={(e) => setMinLevel(e.target.value)} className="border p-1">
            <option>Not yet</option><option>Developing</option><option>Proficient</option>
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        {list && list.length === 0 && <p>No consented candidates match these filters.</p>}
        {!error && SAMPLES.filter((c) => (['Not yet','Developing','Proficient'].indexOf(c.level) >= ['Not yet','Developing','Proficient'].indexOf(minLevel))).map((c) => (
          <article key={c.learner} className="rounded border border-dashed p-3">
            <h2 className="font-semibold">{c.learner} <span className="ml-2 rounded bg-gray-200 px-2 text-xs">sample</span></h2>
            <p>{c.skill}: {c.level}, {c.status}, confidence {c.confidence}, last attempt {c.last_attempt}, conditions {c.mode}</p>
          </article>
        ))}
        {list?.map((c) => (
          <article key={c.learner} className="rounded border p-3">
            <h2 className="font-semibold"><Link className="underline" to={`/candidate/${c.learner}`}>{c.learner}</Link></h2>
            {c.skills.map((s) => (
              <p key={s.skill}>
                {s.skill}
                : {s.level}, {s.status}, confidence {s.confidence}, last attempt {s.last_attempt}, conditions {s.mode}
                <span className="ml-2 text-xs">Why surfaced: {s.skill} at {minLevel} or above</span>
              </p>
            ))}
          </article>
        ))}
      </main>
    </div>
  )
}
