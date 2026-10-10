import { useState } from 'react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'

export default function Challenge() {
  const [text, setText] = useState('')
  const [out, setOut] = useState<Awaited<ReturnType<typeof api.challenge>> | null>(null)
  const [error, setError] = useState('')
  async function run() {
    try { setOut(await api.challenge(text)); setError('') } catch (e) { setError((e as Error).message) }
  }
  return (
    <Layout><section className="card">
      <h2>Attack the Grader</h2>
      <p>Type any text and see what the safety layers do. Nothing is saved.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="pt-text" aria-label="Text to attack the grader with" />
      <button onClick={run} className="btn" style={{ marginTop: 10 }}>Try it</button>
      {error && <p role="alert" className="alert">{error}</p>}
      {out && <ul style={{ marginTop: 12 }}>
        <li>Too thin to check: {String(out.thin)}</li>
        <li>Instruction-like text flagged: {String(out.instruction_like)}</li>
        <li>AI check: {out.ai ? out.ai.result : 'not run (AI off or thin answer)'}</li>
        <li>Would route to: <b>{out.would_route_to}</b></li>
      </ul>}
    </section></Layout>
  )
}
