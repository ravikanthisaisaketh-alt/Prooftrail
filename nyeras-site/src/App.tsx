import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/Auth'
import Course from './pages/Course'
import Courses from './pages/Courses'
import Login from './pages/Login'
import Profile from './pages/Profile'

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/courses" element={<RequireAuth><Courses /></RequireAuth>} />
    <Route path="/course/:id" element={<RequireAuth><Course /></RequireAuth>} />
    <Route path="/course" element={<Navigate to="/courses" replace />} />
    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
    <Route path="*" element={<Navigate to="/courses" replace />} />
  </Routes></BrowserRouter>
}
