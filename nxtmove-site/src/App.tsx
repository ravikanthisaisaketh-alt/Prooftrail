import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Candidate from './pages/Candidate'
import Job from './pages/Job'

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/job" element={<Job />} />
    <Route path="/candidate/:learner" element={<Candidate />} />
    <Route path="*" element={<Navigate to="/job" replace />} />
  </Routes></BrowserRouter>
}
