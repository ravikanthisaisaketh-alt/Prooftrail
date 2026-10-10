import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Verify({ receiptId }: { receiptId: string }) {
  const [res, setRes] = useState<{ result: string; entries: number } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.verify(receiptId).then(setRes).catch((e) => setError(e.message)) }, [receiptId])
  const valid = res?.result === 'VALID'
  return (
    <div className="p-6 space-y-3 max-w-xl">
      <h1 className="text-2xl font-bold">Verify receipt {receiptId}</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {res && <p className={valid ? 'text-green-800' : 'text-red-700'}>
        Receipt check: <b>{res.result}</b>. Audit chain {valid ? 'intact' : 'broken'}, {res.entries} entries checked.
      </p>}
      <p className="text-xs">Tamper-evident, not tamper-proof.</p>
    </div>
  )
}
