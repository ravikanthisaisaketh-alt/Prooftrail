import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { api, AuthError, getToken, setToken, type User } from '../lib'

type Ctx = { user: User; logout: () => void }
const AuthCtx = createContext<Ctx | null>(null)
export const useAuth = () => useContext(AuthCtx)!

export function logoutNow() { setToken(null); window.location.assign('/login') }

// Wraps protected pages: no token, or a bad one, means a redirect to /login.
export function RequireAuth({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: 'loading' | 'out' | 'in' | 'down'; user?: User }>({ status: getToken() ? 'loading' : 'out' })
  useEffect(() => {
    if (!getToken()) return setState({ status: 'out' })
    api('/auth/me').then(async (r) => (r.ok ? r.json() : Promise.reject()))
      .then((u: User) => setState({ status: 'in', user: u }))
      .catch((e) => setState({ status: e instanceof AuthError ? 'out' : 'down' }))
  }, [])
  if (state.status === 'loading') return <p style={{ padding: 24 }} aria-busy="true">Loading...</p>
  if (state.status === 'down') return <p role="alert" style={{ padding: 24 }}>We cannot reach the server. Check that the back end is running, then reload.</p>
  if (state.status === 'out') return <Navigate to="/login" replace />
  return <AuthCtx.Provider value={{ user: state.user!, logout: logoutNow }}>{children}</AuthCtx.Provider>
}
