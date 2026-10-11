import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'

type Props = { id: string; level: string; status: string; mode: string; aiAssisted: boolean }

// The receipt rises into view. The QR holds only the verify link.
export function Receipt({ id, level, status, mode, aiAssisted }: Props) {
  const verifyUrl = `${window.location.origin}/verify/${id}`
  return (
    <div className="card row receipt-card" style={{ justifyContent: 'space-between' }}>
      <div>
        <h2>Receipt {id}</h2>
        <p>Level: {level} · Status: {status} · Conditions: {mode}</p>
        {aiAssisted && <span className="chip ai">AI assisted</span>}{' '}
        <Link className="link" to={`/verify/${id}`}>Verify this receipt</Link>
      </div>
      <QRCodeSVG value={verifyUrl} size={96} />
    </div>
  )
}
