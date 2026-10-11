import { useEffect, useState } from 'react'
import { Shell } from '../components/Shell'
import { useAuth } from '../components/Auth'
import { useToast } from '../components/Toast'
import { api } from '../lib'
import { courses } from '../seed'

type Row = { skill: string; level: string; status: string; receipt_id: string; task: string }
type Summary = { verified: boolean; shared_with_nxtmove: boolean; date?: string; skills: Row[] }

const TIPS: Record<string, string> = {
  Evidenced: 'Evidenced: backed by passing tests and checks.',
  'Needs human review': 'Needs human review: the checks were unsure, so a person will look. This is not a fail.',
  'Not yet evidenced': 'Not yet evidenced: not enough evidence yet. You can try again.',
}
const LABEL: Record<string, string> = { Debugging: 'Debugging with pandas', 'Insight Communication': 'Explanation: pandas' }

export default function Profile() {
  const { user } = useAuth()
  const toast = useToast()
  const [s, setS] = useState<Summary | null>(null)
  const [down, setDown] = useState(false)
  const [resetting, setResetting] = useState(false)
  const load = () => {
    setDown(false)
    api(`/profile/${user.learner}/summary`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setS).catch(() => setDown(true))
  }
  useEffect(() => { load() }, [])
  async function resetDemo() {
    setResetting(true)
    const ok = await api(`/dev/reset/${user.learner}`, { method: 'POST' }).then((r) => r.ok).catch(() => false)
    setResetting(false)
    if (!ok) return toast('Could not reset the demo. Please try again.')
    setS(null); load(); toast('Demo reset. Your results are cleared.')
  }
  return (
    <Shell page="profile" title="My profile" subtitle="Your latest verified results from ProofTrail, one row per skill. Next: prove another skill.">
      <section className="ny-card" aria-label="Latest result">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Latest results</h2>
          {s?.verified ? <span className="chip ok">Verified by ProofTrail</span> : s && <span className="chip warn pulse">Not yet verified</span>}
        </div>
        {!s && !down && <div aria-busy="true" aria-label="Loading"><div className="skel" style={{ width: '70%' }} /><div className="skel" style={{ width: '50%' }} /></div>}
        {down && <div role="alert" className="alert"><p style={{ margin: 0 }}>We cannot reach ProofTrail right now. Check your connection, then try again.</p><button className="ny-btn" style={{ marginTop: 8 }} onClick={load}>Try again</button></div>}
        {s && !s.verified && <p>You have no verified result yet. Open a course and press <b>Prove your skill</b>.</p>}
        {s?.skills.map((k) => (
          <div className="skill" key={k.skill}>
            <span>{LABEL[k.skill] ?? k.skill}<br /><span className="muted">Receipt {k.receipt_id}</span></span>
            <span className="row"><span className="level">{k.level}</span>
              <span className={`chip ${k.status === 'Evidenced' ? 'ok' : 'warn'}`} title={TIPS[k.status] ?? k.status} tabIndex={0}>{k.status}</span></span>
          </div>
        ))}
        {s?.verified && <p className="muted" style={{ marginTop: 8 }}>Latest date {s.date} · Shared with NxtMove: <span className={`chip ${s.shared_with_nxtmove ? 'ok' : ''}`}>{s.shared_with_nxtmove ? 'Yes' : 'No'}</span></p>}
        <div className="row" style={{ marginTop: 12 }}>
          <a className="ny-btn" href="/courses">Go to courses</a>
          <button className="ny-link" onClick={resetDemo} disabled={resetting} style={{ minHeight: 36 }}>{resetting ? 'Resetting...' : `Reset demo (clears ${user.learner})`}</button>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>ProofTrail is the real prototype. This page is simulated. {courses.length} courses, one exam each.</p>
      </section>
    </Shell>
  )
}
