import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'
import { ErrorBox, Skeleton } from '../components/Ui'
import { ease, time } from '../motion'

type Row = Awaited<ReturnType<typeof api.audit>>['rows'][number]
const SHOW = 6

export default function Verify({ receiptId }: { receiptId: string }) {
  const [res, setRes] = useState<{ result: string; entries: number } | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState('')
  const load = () => {
    setError(''); setRes(null)
    return Promise.all([api.verify(receiptId), api.audit()]).then(([v, a]) => { setRes(v); setRows(a.rows) }).catch((e) => setError(e.message))
  }
  useEffect(() => { load() }, [receiptId])
  const valid = res?.result === 'VALID'
  const badId = res && !valid ? Number(/row (\d+)/.exec(res.result)?.[1]) || null : null
  // Show a window of the chain: the newest rows, or the rows around the broken one.
  let end = rows.length
  if (badId) { const i = rows.findIndex((r) => r.id === badId); if (i >= 0) end = Math.min(rows.length, i + 3) }
  const shown = rows.slice(Math.max(0, end - SHOW), end)

  return (
    <Layout title="Check a receipt" subtitle="See whether the record of this result has been changed since it was saved. Each row is locked to the row before it.">
      <section className="card">
        <h2>Receipt {receiptId}</h2>
        {error && <ErrorBox message={error} onRetry={load} />}
        {!res && !error && <Skeleton lines={2} />}
        {res && (
          <motion.div key={res.result} className={`bigbadge ${valid ? 'valid' : 'invalid'}`} role="status"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={valid ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }}
            transition={{ duration: valid ? time.base : 0.32, ease }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {valid
                ? <motion.path d="M7 18l7 7 13-15" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease, delay: 0.1 }} />
                : <><motion.path d="M9 9l16 16" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2, delay: 0.05 }} /><motion.path d="M25 9L9 25" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2, delay: 0.15 }} /></>}
            </svg>
            {valid ? 'VALID' : 'INVALID'}
          </motion.div>
        )}
        {res && <p style={{ marginTop: 10 }}>{valid ? `The audit chain is intact: ${res.entries} entries checked.` : `The chain is broken${badId ? ` at row ${badId}` : ''}. Something was edited after it was saved.`}</p>}
        <p className="muted">Tamper-evident, not tamper-proof.</p>
      </section>
      {res && shown.length > 0 && (
        <section className="card" aria-label="Hash chain">
          <h2>The chain</h2>
          <p className="muted">Each row stores a fingerprint of itself plus the row before it. Change one and every link after it stops matching.</p>
          <div className="chain">
            {shown.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <motion.span className="link-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.12, ease, delay: i * 0.08 }} style={badId && r.id >= badId ? { background: 'var(--red)' } : undefined} />}
                <motion.div className={`node ${badId === r.id ? 'bad' : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: time.fast, ease, delay: i * 0.08 }}
                  aria-label={`Row ${r.id}${badId === r.id ? ', broken' : ''}`}>
                  <b>#{r.id}</b> {r.event}<br /><code>{r.fingerprint.slice(0, 8)}</code>
                </motion.div>
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  )
}
