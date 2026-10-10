import { useEffect, useState } from 'react'
import { Shell } from '../components/Shell'
import { learner } from '../seed'
import { API, proveUrl } from '../lib'

type Summary = {
  verified: boolean; shared_with_nxtmove: boolean; date?: string; receipt_id?: string
  skills: { skill: string; level: string; status: string }[]
}

export default function Profile() {
  const [s, setS] = useState<Summary | null>(null)
  const [down, setDown] = useState(false)
  useEffect(() => {
    fetch(`${API}/profile/${learner.id}/summary`).then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS).catch(() => setDown(true))
  }, [])
  async function resetDemo() {
    await fetch(`${API}/dev/reset/${learner.id}`, { method: 'POST' }).catch(() => {})
    window.location.reload()
  }
  return (
    <Shell page="profile" title="My profile" subtitle={learner.label}>
      <section className="ny-card" aria-label="Latest result">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Latest result</h2>
          {s?.verified ? <span className="chip ok">Verified by ProofTrail</span> : s && <span className="chip warn pulse">Not yet verified</span>}
        </div>
        {down && <p>Result unavailable right now.</p>}
        {s && !s.verified && <p>Not yet verified. Finish a ProofTrail task to see your result here.</p>}
        {s?.verified && <>
          {s.skills.map((k) => (
            <div className="skill" key={k.skill}>
              <span>{k.skill}</span>
              <span className="row"><span className="level">{k.level}</span><span className={`chip ${k.status === 'Evidenced' ? 'ok' : 'warn'}`}>{k.status}</span></span>
            </div>
          ))}
          <p className="muted">Date {s.date} · Receipt {s.receipt_id}</p>
          <p>Shared with NxtMove: <span className={`chip ${s.shared_with_nxtmove ? 'ok' : ''}`}>{s.shared_with_nxtmove ? 'Yes' : 'No'}</span></p>
        </>}
        <div className="row" style={{ marginTop: 12 }}>
          <a className="ny-btn" href={proveUrl}>Prove your skill</a>
          <button className="ny-link" onClick={resetDemo}>Reset demo (clears {learner.id})</button>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>ProofTrail is the real prototype. This page is simulated.</p>
      </section>
    </Shell>
  )
}
