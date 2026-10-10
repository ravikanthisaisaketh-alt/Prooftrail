import { useEffect, useState } from 'react'
import { API } from '../lib'

export type Receipt = {
  receipt_id: string; skill: string; level: string; status: string; confidence: string; mode: string
  last_attempt: string; ai_assisted: boolean; task: string; rubric_version: string; criteria: Record<string, string>
}

// Slides in from the right. Reads the receipt (consent re-checked by the back end) and the verify route.
export function EvidenceDrawer({ learner, skill, onClose }: { learner: string; skill: string; onClose: () => void }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState('')
  const [check, setCheck] = useState<string | null>(null)

  useEffect(() => {
    setReceipt(null); setError(''); setCheck(null)
    fetch(`${API}/candidates/${learner}/receipt?skill=${encodeURIComponent(skill)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rc: Receipt) => {
        setReceipt(rc)
        fetch(`${API}/verify/${rc.receipt_id}`).then((r) => r.json()).then((v) => setCheck(v.result)).catch(() => setCheck('UNAVAILABLE'))
      })
      .catch(() => setError('Receipt not available. The learner may have turned sharing off.'))
  }, [learner, skill])

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Evidence drawer">
        <button className="nm-btn ghost close" onClick={onClose}>Close</button>
        <h2>Evidence · {skill}</h2>
        <p className="muted">Candidate {learner}</p>
        {error && <p role="alert" className="alert">{error}</p>}
        {receipt && <>
          <div className="row">
            <span className="chip or">Level {receipt.level}</span>
            <span className={`chip ${receipt.status === 'Evidenced' ? 'ok' : 'warn'}`}>{receipt.status}</span>
            {receipt.ai_assisted && <span className="chip warn">AI assisted</span>}
            {receipt.confidence === 'Human reviewed' && <span className="chip ok">Human reviewed</span>}
          </div>
          <dl className="kv">
            <dt>Receipt</dt><dd>{receipt.receipt_id}</dd>
            <dt>Task</dt><dd>{receipt.task}</dd>
            <dt>Rubric version</dt><dd>{receipt.rubric_version}</dd>
            <dt>Date</dt><dd>{receipt.last_attempt}</dd>
            <dt>Conditions</dt><dd>{receipt.mode}</dd>
            <dt>Confidence</dt><dd>{receipt.confidence}</dd>
          </dl>
          <b>Criterion results</b>
          <ul style={{ margin: '6px 0 14px', paddingLeft: 20 }}>
            {Object.entries(receipt.criteria).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
          </ul>
          <p>
            Receipt check:{' '}
            <span className={`chip ${check === 'VALID' ? 'ok' : check ? 'bad' : ''}`}>{check ?? 'checking...'}</span>
          </p>
          <p className="muted">Experimental scores. Not validated hiring predictors.</p>
        </>}
      </aside>
    </>
  )
}
