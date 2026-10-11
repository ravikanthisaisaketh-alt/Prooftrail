// Who is the learner? Always from a signed token, never from the URL (except DEMO mode with no token).
const API = (import.meta.env.VITE_API_URL as string | undefined) || (import.meta.env.DEV ? 'http://localhost:8000' : '')
const KEY = 'pt_token'
let memToken: string | null = null

export function getToken(): string | null {
  if (memToken) return memToken
  try { memToken = sessionStorage.getItem(KEY) } catch { /* storage blocked */ }
  return memToken
}
export function setToken(t: string | null) {
  memToken = t
  try { t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY) } catch { /* storage blocked */ }
}

export type Session = { status: 'ready' | 'none' | 'down' | 'expired'; learner?: string; name?: string }
let cached: Promise<Session> | null = null

async function resolve(): Promise<Session> {
  const url = new URL(window.location.href)
  const handoff = url.searchParams.get('handoff')
  if (handoff) {
    // The 5 minute ticket is single use: exchange it once, then remove it from the address bar.
    url.searchParams.delete('handoff')
    window.history.replaceState({}, '', url.pathname + url.search)
    try {
      const r = await fetch(`${API}/auth/exchange`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handoff }) })
      if (!r.ok) return { status: 'expired' }
      setToken((await r.json()).token)
    } catch { return { status: 'down' } }
  }
  const t = getToken()
  if (t) {
    try {
      const r = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      if (r.ok) { const me = await r.json(); return { status: 'ready', learner: me.learner, name: me.name } }
      setToken(null)
      return { status: 'expired' }
    } catch { return { status: 'down' } }
  }
  const demo = import.meta.env.VITE_DEMO_MODE === '1' ? url.searchParams.get('learner') : null
  return demo ? { status: 'ready', learner: demo } : { status: 'none' }
}
export const getSession = () => (cached ??= resolve())
export function clearSession() { setToken(null); cached = null }
