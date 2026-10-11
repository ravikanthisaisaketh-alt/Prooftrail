import { useState, type ReactNode } from 'react'

export const TIPS: Record<string, { cls: string; tip: string }> = {
  Evidenced: { cls: 'ok', tip: 'Evidenced: backed by passing tests and checks.' },
  'Needs human review': { cls: 'warn', tip: 'Needs human review: the checks were unsure, so a person will look. This is not a fail.' },
  'Not yet evidenced': { cls: '', tip: 'Not yet evidenced: not enough evidence yet.' },
  'Not yet': { cls: '', tip: 'Not yet: the criteria for this level are not met yet.' },
  Developing: { cls: 'or', tip: 'Developing: some criteria are met.' },
  Proficient: { cls: 'or', tip: 'Proficient: all criteria for this skill are met.' },
  Pending: { cls: 'warn', tip: 'Pending: waiting for the AI or a person.' },
}
export function Chip({ value, label }: { value: string; label?: string }) {
  const m = TIPS[value] ?? { cls: '', tip: value }
  return <span className={`chip ${m.cls}`} title={m.tip} tabIndex={0} aria-label={m.tip}>{label ?? value}</span>
}
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return <div className="nm-card" aria-busy="true" aria-label="Loading">{Array.from({ length: lines }, (_, i) => <div key={i} className="skel" style={{ width: `${95 - i * 15}%` }} />)}</div>
}
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const [retrying, setRetrying] = useState(false)
  async function retry() {
    setRetrying(true)
    try { await onRetry?.() } finally { setRetrying(false) }
  }
  return (
    <div role="alert" className="alert">
      <p style={{ margin: 0 }}>{message}</p>
      {onRetry && <button className="nm-btn" style={{ marginTop: 8 }} disabled={retrying} onClick={retry}>{retrying ? 'Retrying…' : 'Try again'}</button>}
    </div>
  )
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="nm-card empty"><p><b>{title}</b></p>{children}</div>
}
export const DOWN = 'We cannot reach the candidate service right now. Check your connection, then try again.'
