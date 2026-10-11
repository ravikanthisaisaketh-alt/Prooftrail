import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { SimBanner } from '../components/SimBanner'
import { getToken, login } from '../lib'

const DEMO = [['L-001', 'Asha Rao', 'demo-pass-1'], ['L-002', 'Ben Carter', 'demo-pass-2'], ['L-003', 'Chen Wei', 'demo-pass-3']]

export default function Login() {
  const nav = useNavigate()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [demo, setDemo] = useState(false)
  if (getToken() && !busy) return <Navigate to="/courses" replace />
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!id.trim() || !pw) return setError('Enter your ID or email and your password.')
    setBusy(true); setError('')
    try { await login(id.trim(), pw); nav('/courses', { replace: true }) }
    catch (err) { setError((err as Error).message); setBusy(false) }
  }
  return (
    <div>
      <SimBanner name="Nyeras" />
      <main className="ny-wrap" style={{ maxWidth: 440, paddingTop: 48, paddingBottom: 48 }}>
        <p className="muted" style={{ textAlign: 'center' }}>Learning platform (simulated)</p>
        <h1 style={{ textAlign: 'center', margin: '0 0 16px' }}>Sign in</h1>
        <form className="ny-card" onSubmit={submit} noValidate>
          <label htmlFor="id" style={{ fontWeight: 600 }}>Learner ID or email</label>
          <input id="id" className="ny-input" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} placeholder="L-001" />
          <label htmlFor="pw" style={{ fontWeight: 600, display: 'block', marginTop: 12 }}>Password</label>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input id="pw" className="ny-input" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" className="ny-link" onClick={() => setShow(!show)} aria-pressed={show} style={{ minHeight: 44, whiteSpace: 'nowrap' }}>{show ? 'Hide' : 'Show'}</button>
          </div>
          {error && <p role="alert" className="alert" style={{ marginTop: 12 }}>{error}</p>}
          <button className="ny-btn" type="submit" disabled={busy} style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>{busy ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="ny-card" style={{ marginTop: 16 }}>
          <button className="ny-link" onClick={() => setDemo(!demo)} aria-expanded={demo} aria-controls="demo-accounts">{demo ? 'Hide' : 'Show'} demo accounts</button>
          <div id="demo-accounts" className={`demo-accounts ${demo ? 'open' : ''}`} inert={!demo} aria-hidden={!demo}><div>
            <p className="muted"><b>Demo only.</b> These are made-up accounts for this simulated site. Click one to fill the form.</p>
            {DEMO.map(([i, n, p]) => (
              <button key={i} className="ny-link" style={{ display: 'block', minHeight: 36 }} onClick={() => { setId(i); setPw(p) }}>{n} · {i} · password {p}</button>
            ))}
          </div></div>
        </div>
      </main>
    </div>
  )
}
