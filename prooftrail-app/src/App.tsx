import type React from 'react'
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import Attempt from './pages/Attempt'
import Challenge from './pages/Challenge'
import Consent from './pages/Consent'
import Profile from './pages/Profile'
import Verify from './pages/Verify'
import { useLearner } from './lib/api'

function NoLearner() {
  return <p className="p-6">No learner given. <a className="underline" href={import.meta.env.VITE_NYERAS_URL}>Go back to the course page</a>.</p>
}
function WithLearner({ children }: { children: (l: string) => React.ReactElement }) {
  const learner = useLearner()
  return learner ? children(learner) : <NoLearner />
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
    <Route path="/verify" element={<VerifyRoute />} />
    <Route path="/verify/:id" element={<VerifyRoute />} />
  </Routes></BrowserRouter>
}
