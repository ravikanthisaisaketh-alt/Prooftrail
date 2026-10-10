import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { EditorView } from '@codemirror/view'
import { api, NXTMOVE_URL, useReturnUrl, type Mode, type Result } from '../lib/api'
import Consent from './Consent'
import { useFocusLog } from '../lib/useFocusLog'
import { Receipt } from '../components/Receipt'

const STARTER = `def monthly_revenue(df):\n    totals = {}\n    for _, row in df.iterrows():\n        month = row["order_date"][:7]\n        totals[month] = totals.get(month, 0) + int(row["amount"])\n    return totals\n`

export default function Attempt({ learner }: { learner: string }) {
  const [mode, setMode] = useState<Mode>('Open')
  const [attemptId, setAttemptId] = useState<number | null>(null)
  const [code, setCode] = useState(STARTER)
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [shared, setShared] = useState(false)
  const returnUrl = useReturnUrl()
  const log = useFocusLog(attemptId, mode === 'Focus')

  const pasteHandler = EditorView.domEventHandlers({
    paste: (e) => { log.onPaste(e.clipboardData?.getData('text') ?? '') ; return false },
  })

  async function start() {
    try { setAttemptId((await api.startAttempt(learner, mode, '')).attempt_id) }
    catch (e) { setError((e as Error).message) }
  }
  async function submit() {
    if (attemptId === null) return
    try { setResult(await api.submit(attemptId, code, text)); setError('') }
    catch (e) { setError((e as Error).message) }
  }

  if (attemptId === null) return (
    <div className="p-6 space-y-3">
      <p>AI helps check two criteria (C3, C5). Hidden tests decide the code criteria. You can appeal to a person.</p>
      <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="border p-1">
        <option>Open</option><option>Focus</option>
      </select>
      <button onClick={start} className="border px-3 py-1">Start attempt</button>
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </div>
  )
  return (
    <div className="p-6 space-y-3">
      {mode === 'Focus' && <p className="text-sm">Focus mode log (only you and reviewers see it): tab leaves {log.leaves}, large pastes {log.pastes}</p>}
      <CodeMirror value={code} height="260px" extensions={[python(), pasteHandler]} onChange={setCode} />
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full border p-2" rows={5}
        aria-label="Explain the cause, the fix and what the team should do" />
      <button onClick={submit} className="border px-3 py-1">Submit</button>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {result && <>
        <ul>{Object.entries(result.feedback).map(([k, v]) => <li key={k}><b>{k}</b>: {v}</li>)}</ul>
        <Receipt id={result.receipt_id} level={result.debugging} status={result.status} mode={mode} aiAssisted />
        <Consent learner={learner} embedded onChange={setShared} />
        <p className="text-sm">Your result is saved to your Nyeras profile whether sharing is ON or OFF.</p>
        <div className="flex gap-3">
          <a className="border px-3 py-1" href={returnUrl}>Back to Nyeras</a>
          {shared && <a className="border px-3 py-1" href={`${NXTMOVE_URL}/candidate/${learner}`}>View in NxtMove</a>}
          <a className="underline px-3 py-1" href={`/profile?learner=${learner}`}>ProofTrail profile</a>
        </div>
      </>}
    </div>
  )
}
