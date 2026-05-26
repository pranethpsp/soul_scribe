import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(username.toLowerCase(), password)
      navigate('/today', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      setError(msg.includes('401') ? 'Invalid username or password.' : msg)
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
            <h2 className="font-serif text-2xl text-soul-ivory font-semibold mb-1">Welcome back</h2>
            <p className="text-soul-ivory-dim text-sm">Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-soul-ivory-dim text-sm mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="input-soul"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-soul-ivory-dim text-sm mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
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
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-soul-ivory-dim text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-soul-gold hover:text-soul-gold-dim transition-colors font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
