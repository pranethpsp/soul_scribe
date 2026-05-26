import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Today from './pages/Today'
import Oracle from './pages/Oracle'
import Timeline from './pages/Timeline'
import People from './pages/People'
import Ideas from './pages/Ideas'
import Patterns from './pages/Patterns'
import Admin from './pages/Admin'

const ADMIN_MODE = import.meta.env.VITE_ADMIN_MODE === 'true'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="today" element={<Today />} />
          <Route path="oracle" element={<Oracle />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="people" element={<People />} />
          <Route path="ideas" element={<Ideas />} />
          <Route path="patterns" element={<Patterns />} />
          {ADMIN_MODE && <Route path="admin" element={<Admin />} />}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
