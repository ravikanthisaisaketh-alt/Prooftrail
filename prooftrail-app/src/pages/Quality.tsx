import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'

export default function Quality() {
  const [q, setQ] = useState<Awaited<ReturnType<typeof api.quality>> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.quality().then(setQ).catch((e) => setError(e.message)) }, [])
  const pct = q?.review_rate_pct ?? 0
  return (
    <Layout>
      <section className="card">
        <h2>Doubt panel</h2>
        <p className="muted">How often the system is unsure and asks a person.</p>
        {error && <p role="alert" className="alert">{error}</p>}
        {q && <>
          <p><span className="level">{q.review_rate_pct === null ? 'No data yet' : `${q.review_rate_pct}%`}</span> sent to human review</p>
          <div className="progress"><span style={{ width: `${Math.min(100, pct)}%` }} /></div>
          <p className="muted" style={{ marginTop: 8 }}>{q.sent_to_review} of {q.checked} checked. {q.note}</p>
        </>}
      </section>
    </Layout>
  )
}
