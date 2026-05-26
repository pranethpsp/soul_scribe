import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout/Layout'
import Today from './pages/Today'
import Oracle from './pages/Oracle'
import Timeline from './pages/Timeline'
import People from './pages/People'
import Ideas from './pages/Ideas'
import Patterns from './pages/Patterns'
import Admin from './pages/Admin'
import Library from './pages/Library'
import Login from './pages/Login'
import Register from './pages/Register'

const ADMIN_MODE = import.meta.env.VITE_ADMIN_MODE === 'true'

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen bg-soul-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-soul-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-soul-ivory-dim text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/today" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/today" replace /> : <Register />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={user ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="today" element={<Today />} />
        <Route path="oracle" element={<Oracle />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="people" element={<People />} />
        <Route path="ideas" element={<Ideas />} />
        <Route path="patterns" element={<Patterns />} />
        <Route path="library" element={<Library />} />
        {ADMIN_MODE && <Route path="admin" element={<Admin />} />}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? '/today' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
