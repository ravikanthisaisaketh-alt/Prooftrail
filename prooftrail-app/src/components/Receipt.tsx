import { QRCodeSVG } from 'qrcode.react'

type Props = { id: string; level: string; status: string; mode: string; aiAssisted: boolean }

export function Receipt({ id, level, status, mode, aiAssisted }: Props) {
  const verifyUrl = `${window.location.origin}/verify/${id}` // the QR holds only this link
  return (
    <div className="rounded border p-4 space-y-2">
      <div className="font-semibold">Receipt {id}</div>
      <div>Level: {level} · Status: {status} · Conditions: {mode}</div>
      {aiAssisted && <span className="text-sm rounded bg-amber-100 px-2 py-0.5">AI assisted</span>}
      <QRCodeSVG value={verifyUrl} size={96} />
    </div>
  )
}
