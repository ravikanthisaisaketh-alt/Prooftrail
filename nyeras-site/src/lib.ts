export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
export const PROOFTRAIL = import.meta.env.VITE_PROOFTRAIL_URL ?? 'http://localhost:5174'
export const NYERAS = import.meta.env.VITE_NYERAS_URL ?? 'http://localhost:5173'

// Session token: kept in memory and in sessionStorage (cleared when the tab closes).
let memToken: string | null = null
const KEY = 'nyeras_token'
export function getToken(): string | null {
  if (memToken) return memToken
  try { memToken = sessionStorage.getItem(KEY) } catch { /* storage blocked */ }
  return memToken
}
export function setToken(t: string | null) {
  memToken = t
  try { t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY) } catch { /* storage blocked */ }
}

export type User = { learner: string; name: string }

export class AuthError extends Error {}
// fetch with the Bearer token. A 401 clears the session.
export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const t = getToken()
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) },
  })
  if (res.status === 401) { setToken(null); throw new AuthError('Please sign in again.') }
  return res
}

export async function login(id: string, password: string): Promise<User> {
  let res: Response
  try {
    res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: id, password }) })
  } catch { throw new Error('We cannot reach the server. Check that the back end is running, then try again.') }
  const body = await res.json().catch(() => ({}))
  if (res.status === 429) throw new Error('Too many tries. Wait a minute and try again.')
  if (!res.ok) throw new Error(res.status === 401 ? 'That ID or password is not right.' : (body.detail ?? 'Something went wrong. Try again.'))
  setToken(body.token)
  return { learner: body.learner, name: body.name }
}

export async function startProofTrail(task: string, returnPath: string): Promise<string> {
  // A short-lived, single-use ticket goes in the URL. The main token never does.
  const res = await api('/auth/handoff', { method: 'POST' })
  if (!res.ok) throw new Error('Could not open ProofTrail. Try again.')
  const { handoff } = await res.json()
  return `${PROOFTRAIL}/start?handoff=${encodeURIComponent(handoff)}&task=${task}&source=nyeras-mock&return=${encodeURIComponent(`${NYERAS}${returnPath}`)}`
}
