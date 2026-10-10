import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { EditorView } from '@codemirror/view'
import { api, NXTMOVE_URL, useReturnUrl, type Mode, type Result } from '../lib/api'
import Consent from './Consent'
import { Layout } from '../components/Layout'
import { useFocusLog } from '../lib/useFocusLog'
import { Receipt } from '../components/Receipt'

const STARTER = `def monthly_revenue(df):\n    totals = {}\n    for _, row in df.iterrows():\n        month = row["order_date"][:7]\n        totals[month] = totals.get(month, 0) + int(row["amount"])\n    return totals\n`

const CRITERIA = [
  { id: 'C1', name: 'Root-cause fix', what: 'Hidden tests: totals are right on your data.' },
  { id: 'C2', name: 'Edge cases', what: 'Hidden tests: empty table, empty month, missing amounts.' },
  { id: 'C3', name: 'Explanation', what: 'Names the cause and why the fix works (AI assisted).' },
  { id: 'C4', name: 'Data check', what: 'The number you quote matches the data.' },
  { id: 'C5', name: 'Action', what: 'A concrete next step for the team (AI assisted).' },
]
const OBJECTIVE = 'Fix monthly_revenue(df) so refunded orders and missing amounts no longer break the monthly totals, then explain your fix.'

export default function Attempt({ learner }: { learner: string }) {
  const [mode, setMode] = useState<Mode>('Open')
  const [attemptId, setAttemptId] = useState<number | null>(null)
  const [code, setCode] = useState(STARTER)
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [shared, setShared] = useState(false)
  const [left, setLeft] = useState<{ left: number; cap: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const returnUrl = useReturnUrl()
  const log = useFocusLog(attemptId, mode === 'Focus')
  const loadLeft = () => api.attemptsLeft(learner).then(setLeft).catch(() => setLeft(null))
  useEffect(() => { loadLeft() }, [learner])

  const pasteHandler = EditorView.domEventHandlers({
    paste: (e) => { log.onPaste(e.clipboardData?.getData('text') ?? '') ; return false },
  })

  async function start() {
    try { setAttemptId((await api.startAttempt(learner, mode, '')).attempt_id); setError('') }
    catch (e) { setError((e as Error).message); loadLeft() }
  }
  async function submit() {
    if (attemptId === null) return
    setBusy(true)
    try { setResult(await api.submit(attemptId, code, text)); setError(''); loadLeft() }
    catch (e) { setError((e as Error).message) }
    setBusy(false)
  }
  async function resetAttempts() {
    await api.resetLearner(learner).catch(() => {})
    setError(''); setAttemptId(null); setResult(null); setText(''); setCode(STARTER); loadLeft()
  }

  const limitHit = (left !== null && left.left === 0 && attemptId === null) || /limit/i.test(error)
  const counter = left && <span className="chip teal" aria-live="polite">Attempts left: {left.left} of {left.cap}</span>

  return (
    <Layout>
      <section className="card">
        <h2>Task</h2>
        <p>{OBJECTIVE}</p>
        <p className="muted">AI helps check two criteria (C3, C5). Hidden tests decide the code criteria. You can appeal to a person.</p>
        <ul className="rubric" aria-label="Rubric">
          {CRITERIA.map((c) => <li key={c.id}><b>{c.id}</b><span><b style={{ color: 'inherit', minWidth: 0 }}>{c.name}</b> · <span className="muted">{c.what}</span></span></li>)}
        </ul>
      </section>

      {limitHit && (
        <section className="card amber-card" role="status">
          <h2>You have used all your attempts</h2>
          <p>This demo allows 3 attempts per learner. You can start fresh for the demo.</p>
          <button className="btn" onClick={resetAttempts}>Reset demo attempts</button>
        </section>
      )}

      {attemptId === null && !limitHit && (
        <section className="card">
          <h2>Start an attempt</h2>
          <div className="row">
            <label>Mode{' '}
              <select className="pt-select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option>Open</option><option>Focus</option>
              </select>
            </label>
            {mode === 'Focus' && <span className="chip warn pulse">Focus mode on</span>}
            {counter}
          </div>
          <p className="muted" style={{ marginTop: 10 }}>{mode === 'Focus'
            ? 'Focus mode logs tab leaves and large pastes. You can see the log. It never blocks you and never changes your level.'
            : 'Open mode: use any tools you like and tell us what you used.'}</p>
          <button onClick={start} className="btn">Start attempt</button>
          {error && !limitHit && <p role="alert" className="alert" style={{ marginTop: 10 }}>{error}</p>}
        </section>
      )}

      {attemptId !== null && (
        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>Your fix</h2>
            <div className="row">{mode === 'Focus' && <span className="chip warn pulse">Focus mode on</span>}{counter}</div>
          </div>
          {mode === 'Focus' && <p className="muted">Focus log (only you and reviewers see it): tab leaves {log.leaves}, large pastes {log.pastes}</p>}
          <div className="cm-wrap"><CodeMirror value={code} height="260px" extensions={[python(), pasteHandler]} onChange={setCode} /></div>
          <label htmlFor="explain" style={{ display: 'block', margin: '14px 0 6px', fontWeight: 600 }}>Explain your fix in 2 or 3 sentences</label>
          <textarea id="explain" className="pt-text" value={text} onChange={(e) => setText(e.target.value)} rows={5}
            placeholder="What was the cause, why does your fix work, and what should the team do next?" />
          <div style={{ marginTop: 12 }}>
            <button onClick={submit} className="btn" disabled={busy}>{busy ? 'Grading...' : 'Submit'}</button>
          </div>
          {error && <p role="alert" className="alert" style={{ marginTop: 10 }}>{error}</p>}
        </section>
      )}

      {result && <>
        <section className="card" aria-label="Result">
          <div className="result-top">
            <div>
              <div className="muted">Debugging</div><div className="level">{result.debugging}</div>
            </div>
            <div>
              <div className="muted">Insight Communication</div><div className="level">{result.insight}</div>
            </div>
            <div className="row">
              <span className={`chip ${result.status === 'Evidenced' ? 'ok' : 'warn'}`}>{result.status}</span>
              <span className="chip">Receipt {result.receipt_id}</span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            {Object.entries(result.feedback).map(([k, v], i) => (
              <div className="crit" key={k} style={{ animationDelay: `${i * 160}ms` }}>
                <b style={{ minWidth: '2.2rem' }}>{k}</b>
                {v === 'pass' ? <span className="chip ok">Met</span> : <span className="chip warn">Not met</span>}
                <span className="muted">{v === 'pass' ? CRITERIA.find((c) => c.id === k)?.name : v}</span>
              </div>
            ))}
          </div>
        </section>
        <Receipt id={result.receipt_id} level={result.debugging} status={result.status} mode={mode} aiAssisted />
        <Consent learner={learner} embedded onChange={setShared} />
        <p className="muted">Your result is saved to your Nyeras profile whether sharing is ON or OFF.</p>
        <div className="row">
          <a className="btn" href={returnUrl}>Back to Nyeras</a>
          {shared && <a className="btn ghost" href={`${NXTMOVE_URL}/candidate/${learner}`}>View in NxtMove</a>}
          <a className="link" href={`/profile?learner=${learner}`}>ProofTrail profile</a>
          {attemptId !== null && <a className="link" href={`/explainback?attempt=${attemptId}&learner=${learner}`}>Explain-back</a>}
        </div>
      </>}
    </Layout>
  )
}
