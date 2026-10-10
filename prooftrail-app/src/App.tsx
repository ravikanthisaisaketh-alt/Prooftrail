import type React from 'react'
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import Attempt from './pages/Attempt'
import Audit from './pages/Audit'
import Explainback from './pages/Explainback'
import Quality from './pages/Quality'
import Review from './pages/Review'
import Challenge from './pages/Challenge'
import Consent from './pages/Consent'
import Profile from './pages/Profile'
import Verify from './pages/Verify'
import { useLearner, NYERAS_URL } from './lib/api'
import { Layout } from './components/Layout'

function NoLearner() {
  return <Layout><section className="card amber-card"><p>No learner given.</p><a className="btn" href={`${NYERAS_URL}/course`}>Go back to the course page</a></section></Layout>
}
function WithLearner({ children }: { children: (l: string) => React.ReactElement }) {
  const learner = useLearner()
  return learner ? children(learner) : <NoLearner />
}
function ExplainRoute() {
  const id = Number(new URLSearchParams(window.location.search).get('attempt'))
  return id ? <Explainback attemptId={id} /> : <Layout><section className="card amber-card"><p>No attempt given.</p></section></Layout>
}
function VerifyRoute() {
  const { id } = useParams()
  return <Verify receiptId={id ?? 'R-0'} />
}

export default function App() {
  return <BrowserRouter><Routes>
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
  </Routes></BrowserRouter>
}
