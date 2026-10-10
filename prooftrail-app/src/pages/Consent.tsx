import { useEffect, useState } from 'react'
import { api, ROLE } from '../lib/api'

export default function Consent({ learner, onChange, embedded = false }: { learner: string; onChange?: (on: boolean) => void; embedded?: boolean }) {
  const [on, setOn] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const load = () => api.consentState(learner).then((d) => { setOn(d.on); onChange?.(d.on) }).catch((e) => setError(e.message))
  useEffect(() => { load() }, [learner])
  async function change(next: boolean) {
    try { await api.setConsent(learner, ROLE, next); setError(''); await load() }
    catch (e) { setError((e as Error).message) }
  }
  return (
    <div className={embedded ? 'space-y-3 rounded border p-4' : 'p-6 space-y-3 max-w-xl'}>
      <h1 className="text-2xl font-bold">Consent: Share with NxtMove</h1>
      <p>Learner {learner}. Sharing is OFF by default and you can revoke it at any time.</p>
      <p className="text-lg">Sharing for the Junior Data Analyst role: <b>{on === null ? '...' : on ? 'ON' : 'OFF'}</b></p>
      <div className="rounded border p-3 text-sm">
        <b>What is shared:</b> your pseudonymous learner ID, skill, level, status, confidence, last attempt date,
        and the conditions label (Open or Focus). <b>Not shared:</b> your name, accommodations, focus or paste counts.
      </div>
      {on ? <button onClick={() => change(false)} className="border px-3 py-1">Revoke sharing</button>
          : <button onClick={() => change(true)} className="border px-3 py-1">Share for this role</button>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!embedded && <p><a className="underline" href={`/profile?learner=${learner}`}>Back to profile</a></p>}
    </div>
  )
}
