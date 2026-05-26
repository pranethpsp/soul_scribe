import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getMe, login as apiLogin, register as apiRegister } from './api'
import type { AuthUser } from './types'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('soul_token')
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem('soul_token'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password)
    localStorage.setItem('soul_token', data.token)
    setUser(data.user)
  }

  const register = async (username: string, password: string, displayName: string) => {
    const data = await apiRegister(username, password, displayName)
    localStorage.setItem('soul_token', data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('soul_token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
