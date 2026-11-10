/**
 * AuthContext - Quản lý trạng thái xác thực toàn cục.
 * Lưu token + user info vào localStorage để giữ đăng nhập khi refresh trang.
 *
 * API endpoints (khớp với Spring Boot AuthController):
 *   POST /api/auth/register  → { fullName, email, password, phone }
 *   POST /api/auth/login     → { email, password }
 *   Response: { accessToken, tokenType, fullName, email, role }
 */
import { createContext, useContext, useState, useCallback } from 'react'

const API_BASE = 'http://localhost:8080'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Khôi phục session từ localStorage khi app khởi động
    try {
      const stored = localStorage.getItem('megaticket_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('megaticket_token') || null)

  /**
   * Đăng nhập - POST /api/auth/login
   */
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      // Spring trả về ErrorResponse: { status, message, errors }
      throw new Error(data.message || 'Đăng nhập thất bại')
    }

    // Lưu token và thông tin user
    localStorage.setItem('megaticket_token', data.accessToken)
    const userInfo = { fullName: data.fullName, email: data.email, role: data.role }
    localStorage.setItem('megaticket_user', JSON.stringify(userInfo))
    setToken(data.accessToken)
    setUser(userInfo)
    return userInfo
  }, [])

  /**
   * Đăng ký - POST /api/auth/register
   */
  const register = useCallback(async ({ fullName, email, password, phone }) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, phone }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Đăng ký thất bại')
    }

    // Sau khi đăng ký thành công → tự động đăng nhập
    localStorage.setItem('megaticket_token', data.accessToken)
    const userInfo = { fullName: data.fullName, email: data.email, role: data.role }
    localStorage.setItem('megaticket_user', JSON.stringify(userInfo))
    setToken(data.accessToken)
    setUser(userInfo)
    return userInfo
  }, [])

  /**
   * Đăng xuất
   */
  const logout = useCallback(() => {
    localStorage.removeItem('megaticket_token')
    localStorage.removeItem('megaticket_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook tiện lợi
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng trong <AuthProvider>')
  return ctx
}
