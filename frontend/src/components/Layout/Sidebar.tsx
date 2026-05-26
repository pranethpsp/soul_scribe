import { NavLink } from 'react-router-dom'
import { BookOpen, MessageCircle, Clock, Users, Lightbulb, TrendingUp, Settings, X, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../lib/AuthContext'

const ADMIN_MODE = import.meta.env.VITE_ADMIN_MODE === 'true'

const NAV = [
  { to: '/today',    icon: BookOpen,       label: 'Today' },
  { to: '/oracle',   icon: MessageCircle,  label: 'Oracle' },
  { to: '/timeline', icon: Clock,          label: 'Timeline' },
  { to: '/people',   icon: Users,          label: 'People' },
  { to: '/ideas',    icon: Lightbulb,      label: 'Ideas' },
  { to: '/patterns', icon: TrendingUp,     label: 'Patterns' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()

  return (
    <aside
      className={clsx(
        // Layout
        'flex flex-col w-64 shrink-0 border-r border-soul-border bg-soul-surface/50',
        // Mobile/tablet: fixed drawer, slide in/out
        'fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out',
        'lg:relative lg:translate-x-0 lg:z-auto lg:transition-none',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-soul-border">
        <div>
          <h1 className="text-soul-gold font-serif text-xl font-semibold tracking-wide">
            ◆ SOULSCRIBE
          </h1>
          <p className="text-soul-ivory-dim text-xs mt-0.5">Your lifelong companion</p>
        </div>
        {/* Close button – mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-soul-ivory-dim hover:text-soul-ivory hover:bg-soul-surface transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-soul-gold/10 text-soul-gold border border-soul-gold/20'
                  : 'text-soul-ivory-dim hover:text-soul-ivory hover:bg-white/5',
              )
            }
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </NavLink>
        ))}

        {ADMIN_MODE && (
          <div className="mt-4 pt-4 border-t border-soul-border">
            <p className="text-soul-ivory-dim text-xs px-3 mb-2 uppercase tracking-widest">
              Developer
            </p>
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-soul-gold/10 text-soul-gold border border-soul-gold/20'
                    : 'text-soul-ivory-dim hover:text-soul-ivory hover:bg-white/5',
                )
              }
            >
              <Settings size={16} className="shrink-0" />
              Vault Manager
            </NavLink>
          </div>
        )}
      </nav>

      {/* ── Footer / User ── */}
      <div className="px-4 py-4 border-t border-soul-border space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-soul-gold/20 border border-soul-gold/30 flex items-center justify-center shrink-0">
              <span className="text-soul-gold text-xs font-semibold uppercase">
                {(user.display_name || user.username)[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-soul-ivory text-sm font-medium truncate">
                {user.display_name || user.username}
              </p>
              <p className="text-soul-ivory-dim text-xs truncate">@{user.username}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-soul-ivory-dim hover:text-rose-400 hover:bg-rose-900/10 transition-colors"
        >
          <LogOut size={15} className="shrink-0" />
          Sign out
        </button>

        <p className="text-soul-ivory-dim text-xs px-2">v1.0.0</p>
      </div>
    </aside>
  )
}
