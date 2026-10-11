import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ease, time } from '../motion'
import { api, ROLE, TASK_NAMES } from '../lib/api'
import { Layout } from '../components/Layout'
import { Switch } from '../components/Switch'
import { useToast } from '../components/Toast'
import { ErrorBox, Skeleton } from '../components/Ui'

function ConsentCard({ learner, task, onChange }: { learner: string; task: string; onChange?: (on: boolean) => void }) {
  const [on, setOn] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const load = () => api.consentState(learner, task).then((d) => { setOn(d.on); onChange?.(d.on) }).catch((e) => setError(e.message))
  useEffect(() => { load() }, [learner, task])
  async function change(next: boolean) {
    setBusy(true)
    try { await api.setConsent(learner, ROLE, next, task); setError(''); await load(); toast(`Sharing ${TASK_NAMES[task] ?? task} with NxtMove is ${next ? 'ON' : 'OFF'}`) }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return (
    <section className="card">
      <h2>Share with NxtMove: {TASK_NAMES[task] ?? task}</h2>
      <p className="muted">Learner {learner}. Sharing is OFF by default and you can revoke it at any time. Each exam has its own switch.</p>
      <div className="row" style={{ margin: '10px 0' }}>
        {on === null && !error ? <Skeleton lines={1} /> : <><Switch disabled={busy} on={!!on} onChange={change} label={`Share ${TASK_NAMES[task] ?? task} with NxtMove`} /><b aria-live="polite">{busy ? 'Saving…' : on ? 'ON' : 'OFF'}</b></>}
        <span className={`chip ${on ? 'ok' : ''}`}>{on ? 'Recruiters on NxtMove can see this result' : 'Not shared'}</span>
      </div>
      <AnimatePresence initial={false}>
        {on ? (
          <motion.div key="panel" style={{ overflow: 'hidden' }} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: time.base, ease }}>
            <div className="twocol">
              <div className="see"><b>Recruiters on NxtMove see</b>
                <ul><li>Your learner ID (a label, not your name)</li><li>Skill, level and status</li><li>Confidence and last attempt date</li><li>Conditions label: Open or Focus</li><li>Receipt with each criterion result</li></ul></div>
              <div className="never"><b>They never see</b>
                <ul><li>Your name or email</li><li>Accommodations</li><li>Focus or paste counts</li><li>Your code or written answer</li><li>Exams you have not shared</li></ul></div>
            </div>
          </motion.div>
        ) : <p key="off" className="muted">Nothing is shared. Turn the switch ON to see exactly what recruiters would see.</p>}
      </AnimatePresence>
      {on && <button className="btn ghost sm" disabled={busy} onClick={() => change(false)}>Revoke sharing</button>}
      {error && <ErrorBox message={error} onRetry={load} />}
    </section>
  )
}

export default function Consent({ learner, task, onChange, embedded = false }: { learner: string; task?: string; onChange?: (on: boolean) => void; embedded?: boolean }) {
  if (embedded) return <ConsentCard learner={learner} task={task ?? 't1'} onChange={onChange} />
  return (
    <Layout title="Your sharing choice" subtitle="You decide who can see each result. It is OFF until you turn it ON, and you can turn it OFF any time.">
      {Object.keys(TASK_NAMES).map((t) => <ConsentCard key={t} learner={learner} task={t} />)}
      <p><Link className="btn" to="/profile">Done: back to profile</Link></p>
    </Layout>
  )
}
