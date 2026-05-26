import { NavLink } from 'react-router-dom'
import { BookOpen, MessageCircle, Clock, Users, Lightbulb, TrendingUp, Settings } from 'lucide-react'
import clsx from 'clsx'

const ADMIN_MODE = import.meta.env.VITE_ADMIN_MODE === 'true'

const NAV = [
  { to: '/today', icon: BookOpen, label: 'Today' },
  { to: '/oracle', icon: MessageCircle, label: 'Oracle' },
  { to: '/timeline', icon: Clock, label: 'Timeline' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/ideas', icon: Lightbulb, label: 'Ideas' },
  { to: '/patterns', icon: TrendingUp, label: 'Patterns' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 flex flex-col border-r border-soul-border bg-soul-surface/50 shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-soul-border">
        <h1 className="text-soul-gold font-serif text-xl font-semibold tracking-wide">
          ◆ SOULSCRIBE
        </h1>
        <p className="text-soul-ivory-dim text-xs mt-0.5">Your lifelong companion</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-soul-gold/10 text-soul-gold'
                  : 'text-soul-ivory-dim hover:text-soul-ivory hover:bg-soul-surface'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {ADMIN_MODE && (
          <>
            <div className="mt-4 pt-4 border-t border-soul-border">
              <p className="text-soul-ivory-dim text-xs px-3 mb-2 uppercase tracking-widest">Developer</p>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-soul-gold/10 text-soul-gold'
                      : 'text-soul-ivory-dim hover:text-soul-ivory hover:bg-soul-surface'
                  )
                }
              >
                <Settings size={16} />
                Vault Manager
              </NavLink>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-soul-border">
        <p className="text-soul-ivory-dim text-xs">v1.0.0</p>
      </div>
    </aside>
  )
}
