import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import InsightPanel from '../InsightPanel'

export default function Layout() {
  return (
    <div className="flex h-screen bg-soul-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <InsightPanel />
    </div>
  )
}
