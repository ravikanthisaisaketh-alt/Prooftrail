import { useEffect, useState } from 'react'
import { api, ROLE } from '../lib/api'
import { Layout } from '../components/Layout'
import { Switch } from '../components/Switch'

export default function Consent({ learner, onChange, embedded = false }: { learner: string; onChange?: (on: boolean) => void; embedded?: boolean }) {
  const [on, setOn] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const load = () => api.consentState(learner).then((d) => { setOn(d.on); onChange?.(d.on) }).catch((e) => setError(e.message))
  useEffect(() => { load() }, [learner])
  async function change(next: boolean) {
    try { await api.setConsent(learner, ROLE, next); setError(''); await load() }
    catch (e) { setError((e as Error).message) }
  }
  const card = (
    <section className="card">
      <h2>Share with NxtMove</h2>
      <p className="muted">Learner {learner}. Sharing is OFF by default and you can revoke it at any time.</p>
      <div className="row" style={{ margin: '10px 0' }}>
        <Switch on={!!on} onChange={change} label="Share with NxtMove" />
        <b>{on === null ? '...' : on ? 'ON' : 'OFF'}</b>
        <span className={`chip ${on ? 'ok' : ''}`}>{on ? 'Recruiters on NxtMove can see your result' : 'Not shared'}</span>
      </div>
      <p className="muted"><b>What is shared:</b> your pseudonymous learner ID, skill, level, status, confidence, last attempt date,
        and the conditions label (Open or Focus). <b>Not shared:</b> your name, accommodations, focus or paste counts.</p>
      {on && <button className="btn ghost sm" onClick={() => change(false)}>Revoke sharing</button>}
      {error && <p role="alert" className="alert">{error}</p>}
      {!embedded && <p><a className="link" href={`/profile?learner=${learner}`}>Back to profile</a></p>}
    </section>
  )
  return embedded ? card : <Layout>{card}</Layout>
}
