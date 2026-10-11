import { useEffect, useState } from 'react'
import { Navigate, useParams, Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { useAuth } from '../components/Auth'
import { useToast } from '../components/Toast'
import { api, startProofTrail } from '../lib'
import { courseById } from '../seed'

export default function Course() {
  const { id } = useParams()
  const c = courseById(id)
  const { user } = useAuth()
  const toast = useToast()
  const [done, setDone] = useState<number | null>(null)
  const [down, setDown] = useState(false)
  const [busy, setBusy] = useState(false)
  const load = () => {
    setDown(false)
    api(`/learners/${user.learner}/progress`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => setDone(d.courses[id!]?.done ?? 0)).catch(() => setDown(true))
  }
  useEffect(() => { load() }, [id])
  if (!c) return <Navigate to="/courses" replace />
  const total = c.lessons.length
  const pct = done === null ? 0 : Math.round((100 * done) / total)
  const unlocked = done !== null && done >= total
  async function completeAll() {
    setBusy(true)
    const r = await api(`/learners/${user.learner}/progress/${c!.id}/complete`, { method: 'POST' }).catch(() => null)
    setBusy(false)
    if (r?.ok) { toast('All lessons marked complete (demo). Prove your skill is unlocked.'); load() } else toast('Could not update progress. Try again.')
  }
  async function prove() {
    setBusy(true)
    try { window.location.assign(await startProofTrail(c!.task, '/profile')) }
    catch { setBusy(false); toast('Could not open ProofTrail. Please try again.') }
  }
  return (
    <Shell page="courses" title={c.title} subtitle={unlocked ? 'You finished the lessons. The next step is to prove what you can do.' : 'Work through the lessons. When you reach 100%, the Prove your skill card unlocks.'}
           steps={['Finish course', 'Prove your skill', 'See your result']}>
      <p><Link className="ny-link" to="/courses">Back to all courses</Link></p>
      <section className="ny-card">
        {down && <div role="alert" className="alert"><p style={{ margin: 0 }}>We cannot reach the server right now.</p><button className="ny-btn" style={{ marginTop: 8 }} onClick={load}>Try again</button></div>}
        <div className="row" style={{ justifyContent: 'space-between' }}><b>Progress {pct}%</b>{unlocked && <span className="chip ok">Course completed</span>}</div>
        <div className="progress" style={{ margin: '10px 0 16px' }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress"><span style={{ width: `${pct}%` }} /></div>
        <ul className="mods">
          {c.lessons.map((m, i) => <li key={m} style={{ animationDelay: `${i * 40}ms` }}><span className="tick" style={i < (done ?? 0) ? undefined : { background: '#e2e8f0', color: '#64748b' }}>{i < (done ?? 0) ? '✓' : i + 1}</span>{m}</li>)}
        </ul>
        {!unlocked && done !== null && <button className="ny-btn" style={{ marginTop: 14 }} disabled={busy} onClick={completeAll}>{busy ? 'Saving...' : 'Mark all lessons complete (demo)'}</button>}
        <p className="muted" style={{ marginTop: 14 }}>A completion badge shows you finished the lessons. It does not show what you can do.</p>
      </section>
      <section className="ny-card">
        <h2>Prove your skill {!unlocked && <span className="chip warn">Locked</span>}</h2>
        <p>Try a short, realistic task. You get feedback on each criterion, and you choose who sees the result.</p>
        {unlocked
          ? <button className="ny-btn" onClick={prove} disabled={busy}>{busy ? 'Opening...' : 'Start a ProofTrail task'}</button>
          : <p className="muted">Finish all {total} lessons to unlock this. In the demo you can use the button above.</p>}
        <p className="muted" style={{ marginTop: 10 }}>ProofTrail is the real prototype. This page is simulated.</p>
      </section>
    </Shell>
  )
}
