export type Receipt = {
  receipt_id: string; skill: string; level: string; status: string; confidence: string; mode: string
  last_attempt: string; ai_assisted: boolean; task: string; rubric_version: string; criteria: Record<string, string>
}

export function EvidenceDrawer({ receipt, error, onClose }: { receipt: Receipt | null; error: string; onClose: () => void }) {
  return (
    <aside className="rounded border p-3 bg-gray-50 space-y-1" aria-label="Evidence drawer">
      {error && <p role="alert">{error}</p>}
      {receipt && <>
        <p><b>Receipt {receipt.receipt_id}</b> · {receipt.skill}</p>
        <p>Task: {receipt.task} · Rubric version {receipt.rubric_version}</p>
        <p>Level {receipt.level} · Status {receipt.status} · Confidence {receipt.confidence}</p>
        <p>Date {receipt.last_attempt} · Conditions {receipt.mode}</p>
        <ul className="list-disc pl-6">
          {Object.entries(receipt.criteria).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
        </ul>
        <p className="text-xs">
          {receipt.ai_assisted && <span className="mr-2 rounded bg-amber-100 px-2">AI assisted</span>}
          {receipt.confidence === 'Human reviewed' && <span className="rounded bg-green-100 px-2">Human reviewed</span>}
        </p>
      </>}
      <button className="underline" onClick={onClose}>Close</button>
    </aside>
  )
}
