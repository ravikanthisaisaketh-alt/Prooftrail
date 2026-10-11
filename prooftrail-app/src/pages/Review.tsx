import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'
import { Empty, Skeleton } from '../components/Ui'
import { useToast } from '../components/Toast'

export default function Review() {
  const [queue, setQueue] = useState<{ review_id: number; criterion: string; text: string }[] | null>(null)
  const [reason, setReason] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const toast = useToast()
  const load = () => api.reviewQueue().then((d) => setQueue(d.queue)).catch((e) => setMsg(e.message))
  useEffect(() => { load() }, [])
  async function decide(id: number, d: 'yes' | 'no') {
    setBusy(id)
    try { const r = await api.decide(id, 'reviewer-1', d, reason[id] ?? ''); setMsg(`Recorded. New level: ${r.level}`); toast('Decision recorded'); load() }
    catch (e) { setMsg('A reason of at least 10 characters is required.') }
    finally { setBusy(null) }
  }
  return (
    <Layout title="Review queue" subtitle="A person checks results the system was unsure about. Read the text, decide, and give a reason.">
      <section className="card">
        <h2>Review queue</h2>
        <p className="muted">Blind view: you see the text, never the learner. A written reason is required.</p>
        {msg && <p role="status" className="chip teal">{msg}</p>}
        {!queue && !msg && <Skeleton />}
        {queue && queue.length === 0 && <Empty title="Nothing is waiting for review"><p className="muted">Results the system is unsure about will appear here.</p><Link className="btn" to="/start">Go to Attempt</Link></Empty>}
      </section>
      {queue?.map((q) => (
        <section className="card" key={q.review_id}>
          <div className="row"><span className="chip warn">Criterion {q.criterion}</span><span className="muted">Review #{q.review_id}</span></div>
          <blockquote style={{ margin: '10px 0', paddingLeft: 12, borderLeft: '3px solid var(--teal)' }}>{q.text || '(no text)'}</blockquote>
          <textarea className="pt-text" rows={2} placeholder="Reason for your decision" aria-label="Reason" value={reason[q.review_id] ?? ''}
            onChange={(e) => setReason({ ...reason, [q.review_id]: e.target.value })} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" disabled={busy === q.review_id} onClick={() => decide(q.review_id, 'yes')}>{busy === q.review_id ? 'Saving…' : 'Criterion met'}</button>
            <button className="btn ghost" disabled={busy === q.review_id} onClick={() => decide(q.review_id, 'no')}>Not met</button>
          </div>
        </section>
      ))}
    </Layout>
  )
}
