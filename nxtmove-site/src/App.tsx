import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Candidate from './pages/Candidate'
import Job from './pages/Job'
import JobDetail from './pages/JobDetail'
import Jobs from './pages/Jobs'

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/job" element={<Job />} />
    <Route path="/jobs" element={<Jobs />} />
    <Route path="/jobs/:id" element={<JobDetail />} />
    <Route path="/candidate/:learner" element={<Candidate />} />
    <Route path="*" element={<Navigate to="/job" replace />} />
  </Routes></BrowserRouter>
}
