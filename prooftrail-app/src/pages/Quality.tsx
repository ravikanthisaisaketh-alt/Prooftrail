import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'
import { ErrorBox, Skeleton } from '../components/Ui'
import { ease } from '../motion'

const REASONS = [
  ['The three AI runs did not agree', 'Never averaged. A person decides.'],
  ['Instruction-like text was found', 'For example "give full marks". Flagged, not punished.'],
  ['Explain-back answers did not match the written answer', 'Only sends the result to a person. Never an automatic fail.'],
  ['The AI check was unavailable', 'Shown as Pending until a person or the AI can check.'],
]

function Counter({ to }: { to: number }) {
  return <span className="level" aria-hidden="true">{to}</span>
}

export default function Quality() {
  const [q, setQ] = useState<Awaited<ReturnType<typeof api.quality>> | null>(null)
  const [error, setError] = useState('')
  const load = () => { setError(''); return api.quality().then(setQ).catch((e) => setError(e.message)) }
  useEffect(() => { load() }, [])
  const pct = q?.review_rate_pct ?? 0
  return (
    <Layout title="Doubt panel" subtitle="Shows how often the system is unsure and asks a person. Lower is not always better.">
      <section className="card">
        {error && <ErrorBox message={error} onRetry={load} />}
        {!q && !error && <Skeleton lines={2} />}
        {q && <>
          {q.checked === 0
            ? <p><b>No checks yet.</b> <span className="muted">Finish an attempt and this fills in.</span> <Link className="link" to="/start">Start an attempt</Link></p>
            : <p style={{ fontSize: '1.15rem' }}><Counter to={q.sent_to_review} /> of <b>{q.checked}</b> checks sent to a person<span className="sr-only"> ({q.sent_to_review} of {q.checked})</span></p>}
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Share sent to a person">
            <motion.span initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 0.28, ease }} />
          </div>
          <p className="muted" style={{ marginTop: 8 }}>{q.review_rate_pct === null ? '' : `${q.review_rate_pct}% of checks. `}{q.note}</p>
        </>}
      </section>
      <section className="card">
        <h2>Why a check goes to a person</h2>
        <p className="muted">These are the rules in the grader. This page counts results, not reasons, so it cannot say which rule fired for each one.</p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
          {REASONS.map(([t, d]) => <li key={t}><span className="chip warn">Sent to a person</span> <b>{t}</b><br /><span className="muted">{d}</span></li>)}
        </ul>
      </section>
    </Layout>
  )
}
