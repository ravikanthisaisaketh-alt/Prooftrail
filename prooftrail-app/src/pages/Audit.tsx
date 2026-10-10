import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'

export default function Audit() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.audit>>['rows']>([])
  const [error, setError] = useState('')
  useEffect(() => { api.audit().then((d) => setRows(d.rows)).catch((e) => setError(e.message)) }, [])
  return (
    <Layout>
      <section className="card" style={{ overflowX: 'auto' }}>
        <h2>Audit log</h2>
        <p className="muted">Each row's fingerprint covers the row before it. Edits to old rows are detectable.</p>
        {error && <p role="alert" className="alert">{error}</p>}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
          <thead><tr style={{ textAlign: 'left' }}><th>#</th><th>Event</th><th>Attempt</th><th>Actor</th><th>Fingerprint</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
              <td>{r.id}</td><td>{r.event}</td><td>{r.attempt ?? '-'}</td><td>{r.actor}</td><td><code>{r.fingerprint.slice(0, 10)}</code></td>
            </tr>))}</tbody>
        </table>
        {rows.length === 0 && !error && <p>No audit rows yet.</p>}
      </section>
    </Layout>
  )
}
