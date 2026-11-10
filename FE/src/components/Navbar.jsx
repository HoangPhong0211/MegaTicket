/**
 * Navbar - Thanh điều hướng cố định trên cùng
 * Hiển thị: Logo | Tìm kiếm | Nút CTA | Avatar/Menu user
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const menuRef = useRef(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  // Lấy 2 chữ cái đầu từ tên để hiển thị avatar
  function getInitials(name) {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase()
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 12V22H4V12"/>
              <path d="M22 7H2v5h20V7z"/>
              <path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
            Mega<span>Ticket</span>
          </Link>

          {/* Thanh tìm kiếm */}
          <div className="navbar-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện, concert..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {isLoggedIn ? (
              <>
                {/* Avatar / User menu */}
                <div ref={menuRef} style={{ position: 'relative' }}>
                  <button
                    className="navbar-user-menu"
                    onClick={() => setMenuOpen(o => !o)}
                  >
                    <div className="navbar-avatar">{getInitials(user?.fullName)}</div>
                    <span className="navbar-username">{user?.fullName}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="dropdown-menu">
                      <div style={{ padding: '8px 12px 10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{user?.fullName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
                        {user?.role && (
                          <span className="badge badge-upcoming" style={{ marginTop: 6, fontSize: 10 }}>
                            {user.role}
                          </span>
                        )}
                      </div>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        Thông tin cá nhân
                      </button>
                      <button className="dropdown-item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/>
                        </svg>
                        Vé của tôi
                      </button>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item danger" onClick={handleLogout}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost" style={{ padding: '9px 18px', borderRadius: '999px', fontSize: '14px' }}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '9px 18px', borderRadius: '999px', fontSize: '14px' }}>
                  Đăng ký
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button className="navbar-mobile-toggle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
