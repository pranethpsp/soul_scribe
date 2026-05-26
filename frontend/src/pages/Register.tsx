import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)
    try {
      await register(username.toLowerCase(), password, displayName || username)
      navigate('/today', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      if (msg.includes('400')) {
        setError('Username already taken. Please choose another.')
      } else if (msg.includes('422') || msg.includes('Validation')) {
        setError('Username must be 3–30 characters: letters, numbers, underscores only.')
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-soul-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-soul-gold font-serif text-4xl font-semibold tracking-wide mb-2">
            ◆ SOULSCRIBE
          </h1>
          <p className="text-soul-ivory-dim text-sm">Your lifelong intelligent companion</p>
        </div>

        {/* Card */}
        <div className="card space-y-6">
          <div>
            <h2 className="font-serif text-2xl text-soul-ivory font-semibold mb-1">Begin your journey</h2>
            <p className="text-soul-ivory-dim text-sm">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-soul-ivory-dim text-sm mb-1.5">
                Username <span className="text-soul-ivory-dim/60 font-normal">(unique, used to log in)</span>
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_username"
                className="input-soul"
                minLength={3}
                maxLength={30}
              />
              <p className="text-soul-ivory-dim/60 text-xs mt-1">3–30 characters: letters, numbers, underscores</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-soul-ivory-dim text-sm mb-1.5">
                Display name <span className="text-soul-ivory-dim/60 font-normal">(optional)</span>
              </label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                className="input-soul"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-soul-ivory-dim text-sm mb-1.5">
                Password <span className="text-soul-ivory-dim/60 font-normal">(min 6 characters)</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-soul"
              />
            </div>

            {error && (
              <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-soul-bg/40 border-t-soul-bg rounded-full animate-spin" />
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-soul-ivory-dim text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-soul-gold hover:text-soul-gold-dim transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
