import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Sparkles, X } from 'lucide-react'
import Sidebar from './Sidebar'
import InsightPanel from '../InsightPanel'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [insightOpen, setInsightOpen] = useState(false)

  return (
    <div className="flex h-screen bg-soul-bg overflow-hidden">

      {/* ── Mobile / Tablet sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-soul-border bg-soul-surface/80 shrink-0 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-soul-ivory-dim hover:text-soul-ivory hover:bg-soul-surface transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-soul-gold font-serif text-lg font-semibold tracking-wide">
            ◆ SOULSCRIBE
          </h1>

          <button
            onClick={() => setInsightOpen(true)}
            className="p-2 rounded-lg text-soul-ivory-dim hover:text-soul-ivory hover:bg-soul-surface transition-colors"
            aria-label="Show insights"
          >
            <Sparkles size={18} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* ── Insight Panel — desktop only ── */}
      <div className="hidden xl:flex xl:shrink-0">
        <InsightPanel />
      </div>

      {/* ── Insight Panel — mobile / tablet slide-over ── */}
      {insightOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-20 xl:hidden"
            onClick={() => setInsightOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 z-30 w-80 xl:hidden shadow-2xl">
            <InsightPanel onClose={() => setInsightOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
}
