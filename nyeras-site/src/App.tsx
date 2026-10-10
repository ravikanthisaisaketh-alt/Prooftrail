import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Profile from './pages/Profile'
import Course from './pages/Course'

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/course" element={<Course />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="*" element={<Navigate to="/course" replace />} />
  </Routes></BrowserRouter>
}
