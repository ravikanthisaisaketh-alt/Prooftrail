import { useState, type ReactNode } from 'react'

export const MEANINGS: Record<string, { cls: string; tip: string }> = {
  Evidenced: { cls: 'ok', tip: 'Evidenced: the result is backed by passing tests and checks.' },
  'Needs human review': { cls: 'warn', tip: 'Needs human review: the checks were unsure, so a person will look. This is not a fail.' },
  'Not yet evidenced': { cls: '', tip: 'Not yet evidenced: not enough evidence yet. You can try again.' },
  'Not yet': { cls: '', tip: 'Not yet: the criteria for this level have not been met yet.' },
  Pending: { cls: 'pending', tip: 'Pending: this check is waiting for the AI or a person.' },
  Developing: { cls: 'teal', tip: 'Developing: some criteria are met.' },
  Proficient: { cls: 'ok', tip: 'Proficient: all criteria for this skill are met.' },
}

export function StatusChip({ value }: { value: string }) {
  const m = MEANINGS[value] ?? { cls: '', tip: value }
  return <span className={`chip ${m.cls}`} title={m.tip} tabIndex={0} aria-label={m.tip}>{value}</span>
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return <div aria-busy="true" aria-label="Loading">{Array.from({ length: lines }, (_, i) => <div key={i} className="skel" style={{ width: `${95 - i * 15}%` }} />)}</div>
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const [retrying, setRetrying] = useState(false)
  async function retry() {
    setRetrying(true)
    try { await onRetry?.() } finally { setRetrying(false) }
  }
  const friendly = /fetch|network|failed to/i.test(message) ? 'We cannot reach the ProofTrail server. Check your connection, then try again.' : message
  return (
    <div role="alert" className="alert">
      <p style={{ margin: 0 }}>{friendly}</p>
      {onRetry && <button className="btn sm" style={{ marginTop: 8 }} disabled={retrying} onClick={retry}>{retrying ? 'Retrying…' : 'Try again'}</button>}
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><p><b>{title}</b></p>{children}</div>
}
