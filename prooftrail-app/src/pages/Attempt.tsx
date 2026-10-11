import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { EditorView } from '@codemirror/view'
import { api, NXTMOVE_URL, useReturnUrl, useTask, type Mode, type Result } from '../lib/api'
import Consent from './Consent'
import { Layout } from '../components/Layout'
import { useToast } from '../components/Toast'
import { ErrorBox, StatusChip } from '../components/Ui'
import { useFocusLog } from '../lib/useFocusLog'
import { Receipt } from '../components/Receipt'
import { RubricCards } from '../components/RubricCards'
import { GradingProgress, type AiState } from '../components/GradingProgress'
import { CriterionChip } from '../components/CriterionChip'
import { Skeleton } from '../components/Ui'

function aiState(r: Result | null): AiState {
  if (!r) return 'off'
  if (r.flags.includes('disagreement')) return 'differ'
  const f = r.feedback
  if ((f.C3 ?? '').startsWith('Pending')) return 'off'
  if ((f.C3 ?? '').includes('too short')) return 'skipped'
  return 'agree'
}

export default function Attempt({ learner }: { learner: string }) {
  const [mode, setMode] = useState<Mode>('Open')
  const [attemptId, setAttemptId] = useState<number | null>(null)
  const task = useTask()
  const [info, setInfo] = useState<{ task: string; objective: string; starter: string; criteria: { id: string; name: string; what: string }[] } | null>(null)
  const [code, setCode] = useState('')
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [shared, setShared] = useState(false)
  const [left, setLeft] = useState<{ left: number; cap: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [grading, setGrading] = useState(false)
  const returnUrl = useReturnUrl()
  const toast = useToast()
    const log = useFocusLog(attemptId, mode === 'Focus')
  const loadLeft = () => api.attemptsLeft(learner, task).then(setLeft).catch(() => setLeft(null))
  useEffect(() => { loadLeft() }, [learner, task])
  useEffect(() => { api.taskVariant(learner, task).then((v) => { setInfo(v); setCode(v.starter) }).catch((e) => setError(e.message)) }, [learner, task])

  // Focus mode blocks pasting and dropping text into the editor and the explanation box. Attempts are logged, never graded.
  const focus = mode === 'Focus'
  const refuse = (pasted = '') => { log.onPaste(pasted); log.onBlocked(); toast('Paste is turned off in Focus mode. Please type your answer.') }
  const pasteHandler = EditorView.domEventHandlers({
    paste: (e) => { if (!focus) { log.onPaste(e.clipboardData?.getData('text') ?? ''); return false } e.preventDefault(); refuse(e.clipboardData?.getData('text') ?? ''); return true },
    drop: (e) => { if (!focus) return false; e.preventDefault(); refuse(e.dataTransfer?.getData('text') ?? ''); return true },
    beforeinput: (e) => {            // also catches paste from the context menu and other routes
      if (focus && /^insertFrom(Paste|Drop|Yank)/.test((e as InputEvent).inputType)) { e.preventDefault(); refuse(); return true }
      return false
    },
  })
  const blockText = (e: { preventDefault: () => void; clipboardData?: DataTransfer | null; dataTransfer?: DataTransfer | null }) => {
    if (!focus) return
    e.preventDefault(); refuse((e.clipboardData ?? e.dataTransfer)?.getData('text') ?? '')
  }

  async function start() {
    setBusy(true)
    try { setAttemptId((await api.startAttempt(learner, mode, '', task)).attempt_id); setError('') }
    catch (e) { setError((e as Error).message); loadLeft() }
    setBusy(false)
  }
  async function submit() {
    if (attemptId === null) return
    setBusy(true); setGrading(true); setResult(null)
    try { setResult(await api.submit(attemptId, code, text)); setError(''); loadLeft() }
    catch (e) { setError((e as Error).message); setGrading(false) }
    setBusy(false)
  }
  async function resetAttempts() {
    setBusy(true)
    await api.resetLearner(learner).catch(() => {})
    setError(''); setAttemptId(null); setResult(null); setGrading(false); setText(''); setCode(info?.starter ?? ''); loadLeft()
    toast('Demo attempts reset. You can start again.')
    setBusy(false)
  }

  const limitHit = (left !== null && left.left === 0 && attemptId === null) || /limit/i.test(error)
  const counter = left && <span className="chip teal" aria-live="polite">Attempts left: {left.left} of {left.cap}</span>

  return (
    <Layout title="Solve a real task" subtitle={attemptId === null ? 'Fix a bug, explain it, and get a receipt you can choose to share. Next: press Start attempt.' : result ? 'Here is your result. Next: choose whether to share it, then go back to Nyeras.' : 'Fix the code, explain it in a few sentences, then press Submit.'}>
      <ol className="steps" aria-label="Progress">
        {['Start', 'Solve', 'Result', 'Consent'].map((n, i) => {
          const cur = attemptId === null ? 0 : !result ? 1 : 3
          return <li key={n} className={i < cur ? 'done' : i === cur ? 'now' : ''} aria-current={i === cur ? 'step' : undefined}><b>{i < cur ? '✓' : i + 1}</b><span>{n}</span></li>
        })}
      </ol>
      <section className="card">
        <h2>Task: {info?.task ?? '...'}</h2>
        <p>{info?.objective ?? 'Loading the task...'}</p>
        <p className="muted">AI helps check two criteria (C3, C5). Hidden tests decide the code criteria. You can appeal to a person.</p>
        {info ? <RubricCards criteria={info.criteria} /> : <Skeleton lines={2} />}
      </section>

      {limitHit && (
        <section className="card amber-card" role="status">
          <h2>You have used all your attempts</h2>
          <p>This demo allows 3 attempts per learner. You can start fresh for the demo.</p>
          <button className="btn" disabled={busy} onClick={resetAttempts}>{busy ? 'Resetting…' : 'Reset demo attempts'}</button>
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
            ? 'Focus mode blocks pasting and logs tab leaves. You can see the log. It never changes your level.'
            : 'Open mode: use any tools you like and tell us what you used.'}</p>
          <button onClick={start} className="btn" disabled={busy}>{busy ? 'Starting...' : 'Start attempt'}</button>
          {error && !limitHit && <div style={{ marginTop: 10 }}><ErrorBox message={error} onRetry={start} /></div>}
        </section>
      )}

      {attemptId !== null && (
        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>Your fix</h2>
            <div className="row">{mode === 'Focus' && <span className="chip warn pulse">Focus mode on</span>}{counter}</div>
          </div>
          {mode === 'Focus' && <p className="muted">Focus log (only you and reviewers see it): tab leaves {log.leaves}, paste attempts blocked {log.blocked}. Pasting is turned off in Focus mode.</p>}
          <div className="cm-wrap"><CodeMirror value={code} height="260px" extensions={[python(), pasteHandler, EditorView.contentAttributes.of({ 'aria-label': 'Your Python code' })]} onChange={setCode} /></div>
          <label htmlFor="explain" style={{ display: 'block', margin: '14px 0 6px', fontWeight: 600 }}>Explain your fix in 2 or 3 sentences</label>
          <textarea id="explain" className="pt-text" value={text} onPaste={blockText} onDrop={blockText} onBeforeInput={(e) => { const t = (e.nativeEvent as InputEvent).inputType ?? ''; if (focus && /^insertFrom(Paste|Drop|Yank)/.test(t)) { e.preventDefault(); refuse() } }} onChange={(e) => setText(e.target.value)} rows={5}
            placeholder="What was the cause, why does your fix work, and what should the team do next?" />
          <div style={{ marginTop: 12 }}>
            <button onClick={submit} className={`btn ${result ? 'ghost' : ''}`} disabled={busy}>{busy ? 'Grading...' : 'Submit for grading'}</button>
          </div>
          {error && <div style={{ marginTop: 10 }}><ErrorBox message={error} onRetry={submit} /></div>}
        </section>
      )}

      {grading && <GradingProgress done={!!result} ai={aiState(result)} status={result?.status} />}
      {grading && !result && <section className="card" aria-busy="true" aria-label="Checking criteria"><h2>Checking criteria</h2><Skeleton lines={5} /></section>}
      {result && <>
        <section className="card result-card" aria-label="Result">
          <div className="result-top">
            <div>
              <div className="muted">{info?.task ?? 'Code'} (tests)</div><div className="level">{result.debugging}</div>
            </div>
            <div>
              <div className="muted">Explanation and action (AI assisted)</div><div className="level">{result.insight}</div>
            </div>
            <div className="row">
              <StatusChip value={result.status} />
              <span className="chip">Receipt {result.receipt_id}</span>
              <span className="chip teal confidence-chip">Confidence: {result.confidence}</span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            {Object.entries(result.feedback).map(([k, v], i) => (
              <div className="crit" key={k} style={{ animationDelay: `${i * 40}ms` }}>
                <b style={{ minWidth: '9.5rem' }}>{(info?.criteria ?? []).find((c) => c.id === k)?.name ?? k}</b>
                <CriterionChip value={v} delay={160 + i * 40} />
                <span className="muted">{v === 'pass' ? (info?.criteria ?? []).find((c) => c.id === k)?.what.replace(' (AI assisted)', '') : v.replace(/^Pending: /, '')}</span>
              </div>
            ))}
          </div>
        </section>
        <Receipt id={result.receipt_id} level={result.debugging} status={result.status} mode={mode} aiAssisted />
        <Consent learner={learner} task={task} embedded onChange={(v) => { setShared(v) }} />
        <p className="muted">Your result is saved to your Nyeras profile whether sharing is ON or OFF. Sharing only controls whether NxtMove can see it.</p>
        <div className="row">
          <a className="btn" href={returnUrl}>Back to Nyeras</a>
          {shared && <a className="btn ghost" href={`${NXTMOVE_URL}/candidate/${learner}`}>View in NxtMove</a>}
          <Link className="link" to="/profile">ProofTrail profile</Link>
          {attemptId !== null && <Link className="link" to={`/explainback?attempt=${attemptId}`}>Explain-back</Link>}
        </div>
      </>}
    </Layout>
  )
}
