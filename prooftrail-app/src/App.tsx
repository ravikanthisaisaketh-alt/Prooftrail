import type React from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Attempt from './pages/Attempt'
import Audit from './pages/Audit'
import Explainback from './pages/Explainback'
import Quality from './pages/Quality'
import Review from './pages/Review'
import Challenge from './pages/Challenge'
import Consent from './pages/Consent'
import Profile from './pages/Profile'
import Verify from './pages/Verify'
import { useEffect, useState } from 'react'
import { NYERAS_URL } from './lib/api'
import { getSession, type Session } from './lib/session'
import { Skeleton } from './components/Ui'
import { AppShell, Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'

function NoSession({ status }: { status: Session['status'] }) {
  const msg = status === 'down' ? 'We cannot reach the server. Check that the back end is running, then reload.'
    : status === 'expired' ? 'Your link or session has expired. Go back to Nyeras and press Prove your skill again.'
    : 'Please sign in on Nyeras first, then press Prove your skill on a course.'
  return <Layout title="Welcome to ProofTrail" subtitle="We need to know who you are to continue.">
    <section className="card amber-card"><p>{msg}</p><a className="btn" href={`${NYERAS_URL}/login`}>Go to Nyeras sign in</a></section></Layout>
}
function WithLearner({ children }: { children: (l: string) => React.ReactElement }) {
  const [s, setS] = useState<Session | null>(null)
  useEffect(() => { getSession().then(setS) }, [])
  if (!s) return <Layout title="One moment" subtitle="Checking who you are."><section className="card"><Skeleton /></section></Layout>
  return s.status === 'ready' && s.learner ? children(s.learner) : <NoSession status={s.status} />
}
function ExplainRoute() {
  const id = Number(new URLSearchParams(window.location.search).get('attempt'))
  return id ? <Explainback attemptId={id} /> : <Layout title="Explain your fix" subtitle="Open this page from your result."><section className="card amber-card"><p>No attempt given.</p><Link className="btn" to="/start">Go to Attempt</Link></section></Layout>
}
function VerifyRoute() {
  const { id } = useParams()
  return <Verify receiptId={id ?? 'R-0'} />
}

function AnimatedRoutes() {
  const loc = useLocation()
  return <AnimatePresence mode="wait" initial={false}>
    <Routes location={loc} key={loc.pathname}>
    <Route path="/start" element={<WithLearner>{(l) => <Attempt learner={l} />}</WithLearner>} />
    <Route path="/consent" element={<WithLearner>{(l) => <Consent learner={l} />}</WithLearner>} />
    <Route path="/profile" element={<WithLearner>{(l) => <Profile learner={l} />}</WithLearner>} />
    <Route path="/challenge" element={<Challenge />} />
    <Route path="/explainback" element={<ExplainRoute />} />
    <Route path="/review" element={<Review />} />
    <Route path="/audit" element={<Audit />} />
    <Route path="/quality" element={<Quality />} />
    <Route path="/verify" element={<VerifyRoute />} />
    <Route path="/verify/:id" element={<VerifyRoute />} />
  </Routes>
  </AnimatePresence>
}

export default function App() {
  return <ToastProvider><BrowserRouter><AppShell /><AnimatedRoutes /></BrowserRouter></ToastProvider>
}
