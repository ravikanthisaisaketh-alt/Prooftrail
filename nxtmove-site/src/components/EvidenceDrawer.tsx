import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { API, skillLabel } from '../lib'
import { Chip, ErrorBox } from './Ui'

const CRIT: Record<string, [string, string]> = {
  C1: ['Root-cause fix', 'Totals are right on the learner\'s data (hidden tests).'],
  C2: ['Edge cases', 'Empty table, empty month and missing amounts are handled (hidden tests).'],
  C3: ['Explanation', 'Names the cause and why the fix works (AI assisted).'],
  C4: ['Data check', 'The number quoted matches the data.'],
  C5: ['Action', 'Gives a concrete next step for the team (AI assisted).'],
}

export type Receipt = {
  receipt_id: string; skill: string; level: string; status: string; confidence: string; mode: string
  last_attempt: string; ai_assisted: boolean; task: string; rubric_version: string; criteria: Record<string, string>
}

// Slides in from the right. Reads the receipt (consent re-checked by the back end) and the verify route.
export function EvidenceDrawer({ learner, skill, onClose }: { learner: string; skill: string; onClose: () => void }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState('')
  const [check, setCheck] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [closing, setClosing] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const close = () => {
    if (closing) return
    setClosing(true)
    closeTimer.current = setTimeout(onClose, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200)
  }
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const node = dialog.current
    const overflow = document.body.style.overflow
    node?.showModal()
    document.body.style.overflow = 'hidden'
    node?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
      node?.close()
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [])

  useEffect(() => {
    setReceipt(null); setError(''); setCheck(null)
    fetch(`${API}/candidates/${learner}/receipt?skill=${encodeURIComponent(skill)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rc: Receipt) => {
        setReceipt(rc)
        fetch(`${API}/verify/${rc.receipt_id}`).then((r) => r.json()).then((v) => setCheck(v.result)).catch(() => setCheck('UNAVAILABLE'))
      })
      .catch(() => setError('Receipt not available. The learner may have turned sharing off.'))
  }, [learner, skill, tick])

  return createPortal(
    <dialog ref={dialog} className={`evidence-modal ${closing ? 'closing' : ''}`} aria-label="Evidence drawer" aria-modal="true" onCancel={(e) => { e.preventDefault(); close() }} onKeyDown={(e) => {
      if (e.key !== 'Tab') return
      const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]') ?? [])
      const first = controls[0], last = controls[controls.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }}>
      <div className="overlay" onClick={close} aria-hidden="true" />
      <aside className="drawer">
        <button className="nm-btn ghost close" onClick={close}>Close</button>
        <h2>Evidence · {skillLabel(skill)}</h2>
        <p className="muted">Candidate {learner}</p>
        {!receipt && !error && <div aria-busy="true"><div className="skel" /><div className="skel" style={{ width: '60%' }} /><div className="skel" /></div>}
        {error && <ErrorBox message={error} onRetry={() => setTick(tick + 1)} />}
        {receipt && <>
          <div className="row">
            <Chip value={receipt.level} label={`Level ${receipt.level}`} />
            <Chip value={receipt.status} />
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
          <div style={{ margin: '6px 0 14px' }}>
            {Object.entries(receipt.criteria).map(([k, v]) => {
              const [name, what] = CRIT[k] ?? [k, '']
              return <div className="crit" key={k}>
                <b style={{ minWidth: '8.5rem' }}>{name}</b>
                {v === 'pass' ? <span className="chip ok">Met</span> : v === 'pending' ? <Chip value="Pending" /> : <span className="chip bad">Not met</span>}
                <span className="muted">{what}</span>
              </div>
            })}
          </div>
          <p>
            Receipt check:{' '}
            <span className={`chip ${check === 'VALID' ? 'ok' : check ? 'bad' : ''}`}>{check ?? 'checking...'}</span>
          </p>
          <p className="muted">Experimental scores. Not validated hiring predictors.</p>
        </>}
      </aside>
    </dialog>, document.body
  )
}
