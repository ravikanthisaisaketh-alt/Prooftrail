import { QRCodeSVG } from 'qrcode.react'

type Props = { id: string; level: string; status: string; mode: string; aiAssisted: boolean }

export function Receipt({ id, level, status, mode, aiAssisted }: Props) {
  const verifyUrl = `${window.location.origin}/verify/${id}` // the QR holds only this link
  return (
    <div className="card row" style={{ justifyContent: 'space-between' }}>
      <div>
        <h2>Receipt {id}</h2>
        <p>Level: {level} · Status: {status} · Conditions: {mode}</p>
        {aiAssisted && <span className="chip warn">AI assisted</span>}{' '}
        <a className="link" href={`/verify/${id}`}>Verify this receipt</a>
      </div>
      <QRCodeSVG value={verifyUrl} size={96} />
    </div>
  )
}
