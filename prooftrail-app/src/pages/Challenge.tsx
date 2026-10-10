import { useState } from 'react'
import { api } from '../lib/api'

export default function Challenge() {
  const [text, setText] = useState('')
  const [out, setOut] = useState<Awaited<ReturnType<typeof api.challenge>> | null>(null)
  const [error, setError] = useState('')
  async function run() {
    try { setOut(await api.challenge(text)); setError('') } catch (e) { setError((e as Error).message) }
  }
  return (
    <div className="p-6 space-y-3 max-w-xl">
      <h1 className="text-2xl font-bold">Attack the Grader</h1>
      <p>Type any text and see what the safety layers do. Nothing is saved.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full border p-2" aria-label="Text to attack the grader with" />
      <button onClick={run} className="border px-3 py-1">Try it</button>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {out && <ul className="list-disc pl-6">
        <li>Too thin to check: {String(out.thin)}</li>
        <li>Instruction-like text flagged: {String(out.instruction_like)}</li>
        <li>AI check: {out.ai ? out.ai.result : 'not run (AI off or thin answer)'}</li>
        <li>Would route to: <b>{out.would_route_to}</b></li>
      </ul>}
    </div>
  )
}
