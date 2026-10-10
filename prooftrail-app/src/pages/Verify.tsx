import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Layout } from '../components/Layout'

export default function Verify({ receiptId }: { receiptId: string }) {
  const [res, setRes] = useState<{ result: string; entries: number } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.verify(receiptId).then(setRes).catch((e) => setError(e.message)) }, [receiptId])
  const valid = res?.result === 'VALID'
  return (
    <Layout>
      <section className="card">
        <h2>Verify receipt {receiptId}</h2>
        {error && <p role="alert" className="alert">{error}</p>}
        {res && <p className="row"><span className={`chip ${valid ? 'ok' : 'bad'}`}>Receipt check: {res.result}</span>
          <span>Audit chain {valid ? 'intact' : 'broken'}, {res.entries} entries checked.</span></p>}
        <p className="muted">Tamper-evident, not tamper-proof.</p>
      </section>
    </Layout>
  )
}
