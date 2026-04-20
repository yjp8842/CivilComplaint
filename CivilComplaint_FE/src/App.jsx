import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Agency from './pages/Agency'
import Dashboard from './pages/Dashboard'

export default function App() {
  const auth = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={auth.isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={auth.login} />}
        />
        <Route
          path="/register"
          element={auth.isLoggedIn ? <Navigate to="/" replace /> : <Register />}
        />
        <Route
          path="/"
          element={auth.isLoggedIn ? <Home auth={auth} /> : <Navigate to="/login" replace />}
        />
        <Route path="/agency" element={<Agency />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
