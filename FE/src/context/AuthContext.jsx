/**
 * AuthContext - Quản lý trạng thái xác thực toàn cục.
 * Lưu token + user info vào localStorage để giữ đăng nhập khi refresh trang.
 */
import { createContext, useContext, useState, useCallback } from 'react'
import { apiFetch, clearStoredSession } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('megaticket_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('megaticket_token') || null)

  const persistAuth = useCallback((data) => {
    localStorage.setItem('megaticket_token', data.accessToken)
    const userInfo = { fullName: data.fullName, email: data.email, role: data.role }
    localStorage.setItem('megaticket_user', JSON.stringify(userInfo))
    setToken(data.accessToken)
    setUser(userInfo)
    return userInfo
  }, [])

  /** Đăng nhập - POST /api/auth/login */
  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    })
    return persistAuth(data)
  }, [persistAuth])

  /** Đăng ký - POST /api/auth/register */
  const register = useCallback(async ({ fullName, email, password, phone }) => {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      auth: false,
      body: { fullName, email, password, phone },
    })
    return persistAuth(data)
  }, [persistAuth])

  /** Đăng xuất */
  const logout = useCallback(() => {
    clearStoredSession()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoggedIn: !!user && !!token,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng trong <AuthProvider>')
  return ctx
}
