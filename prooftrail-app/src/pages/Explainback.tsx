import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'

export default function Explainback({ attemptId }: { attemptId: number }) {
  const [qs, setQs] = useState<{ id: string; text?: string }[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => { api.explainQuestions(attemptId).then((d) => setQs(d.questions)).catch((e) => setMsg({ ok: false, text: e.message })) }, [attemptId])
  async function send() {
    try { setMsg({ ok: true, text: (await api.explainSubmit(attemptId, answers)).message }) }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }) }
  }
  return (
    <Layout>
      <section className="card">
        <h2>Explain-back</h2>
        <p className="muted">Two questions about your own code. We ask whether you understand the fix, not who typed it. A mismatch only sends the result to a person, never an automatic fail.</p>
        {qs.map((q) => (
          <div key={q.id} style={{ margin: '12px 0' }}>
            <label htmlFor={q.id} style={{ fontWeight: 600 }}>{q.text}</label>
            <textarea id={q.id} className="pt-text" rows={3} value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
          </div>
        ))}
        {qs.length > 0 && <button className="btn" onClick={send}>Send answers</button>}
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'chip ok' : 'alert'} style={{ marginTop: 10 }}>{msg.text}</p>}
      </section>
    </Layout>
  )
}
