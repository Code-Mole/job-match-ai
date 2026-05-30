import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { invalidateCache } from '../utils/apiCache'

const AuthContext = createContext(null)

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Verify token and hydrate user on page load ────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

    axios.get('/api/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Re-fetch user from server (call this after CV parse) ──────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/auth/me')
      setUser(data.user)
      return data.user
    } catch { return null }
  }, [])

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data
  }

  const completeOAuthLogin = async (token) => {
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const { data } = await axios.get('/api/auth/me')
    setUser(data.user)
    return data.user
  }

  const register = async (name, email, password) => {
    const { data } = await axios.post('/api/auth/register', { name, email, password })
    localStorage.setItem('token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data
  }

  const updateProfile = async (updates) => {
    const { data } = await axios.put('/api/auth/profile', updates)
    setUser(data.user)
    if (updates.skills) {
      invalidateCache('/api/jobs/match')
      invalidateCache('/api/auth/career-insights')
    }
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser, completeOAuthLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}