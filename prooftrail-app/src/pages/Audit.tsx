import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'
import { Empty, ErrorBox, Skeleton } from '../components/Ui'

export default function Audit() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.audit>>['rows'] | null>(null)
  const [error, setError] = useState('')
  const load = () => { setError(''); return api.audit().then((d) => setRows(d.rows)).catch((e) => setError(e.message)) }
  useEffect(() => { load() }, [])
  return (
    <Layout title="Audit log" subtitle="Every important event is recorded and chained so later edits can be detected.">
      <section className="card" style={{ overflowX: 'auto' }}>
        <h2>Audit log</h2>
        <p className="muted">Each row's fingerprint covers the row before it. Edits to old rows are detectable.</p>
        {error && <ErrorBox message={error} onRetry={load} />}
        {!rows && !error && <Skeleton />}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
          <thead><tr style={{ textAlign: 'left' }}><th>#</th><th>Event</th><th>Attempt</th><th>Actor</th><th>Fingerprint</th></tr></thead>
          <tbody>{(rows ?? []).map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
              <td>{r.id}</td><td>{r.event}</td><td>{r.attempt ?? '-'}</td><td>{r.actor}</td><td><code>{r.fingerprint.slice(0, 10)}</code></td>
            </tr>))}</tbody>
        </table>
        {rows && rows.length === 0 && <Empty title="No audit rows yet"><p className="muted">Rows appear when someone starts an attempt.</p><Link className="btn" to="/start">Start an attempt</Link></Empty>}
      </section>
    </Layout>
  )
}
