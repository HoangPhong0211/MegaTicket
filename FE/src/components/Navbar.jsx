/**
 * Navbar - Thanh điều hướng cố định trên cùng
 * Hiển thị: Logo | Tìm kiếm | Điều hướng | Avatar/Menu user
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Ticket, LogOut, ShieldCheck, ChevronDown, Menu, X, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isLoggedIn, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('q') || ''
  })
  const menuRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    if (q !== null) setSearchValue(q)
  }, [location.search])

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

  // Đóng mobile drawer khi chuyển route
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  function handleSearchSubmit(e) {
    e.preventDefault()
    const trimmed = searchValue.trim()
    navigate(trimmed ? `/events?q=${encodeURIComponent(trimmed)}` : '/events')
    setMobileOpen(false)
  }

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

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
            <Ticket size={24} strokeWidth={2.5} />
            Mega<span>Ticket</span>
          </Link>

          {/* Thanh tìm kiếm */}
          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện, concert, địa điểm..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && (
              <button
                type="button"
                className="navbar-search-clear"
                onClick={() => setSearchValue('')}
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Nav Links Desktop */}
          <div className="navbar-links">
            <Link
              to="/events"
              className={`navbar-nav-link ${location.pathname.startsWith('/events') ? 'active' : ''}`}
            >
              <Calendar size={15} />
              Sự kiện
            </Link>
            {isLoggedIn && (
              <Link
                to="/orders"
                className={`navbar-nav-link ${location.pathname.startsWith('/orders') ? 'active' : ''}`}
              >
                <Ticket size={15} />
                Vé của tôi
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`navbar-nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
              >
                <ShieldCheck size={15} />
                Quản trị
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {isLoggedIn ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="navbar-user-menu"
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <div className="navbar-avatar">{getInitials(user?.fullName)}</div>
                  <span className="navbar-username">{user?.fullName}</span>
                  <ChevronDown size={14} />
                </button>

                {menuOpen && (
                  <div className="dropdown-menu">
                    <div style={{ padding: '8px 12px 10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                        {user?.fullName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                        {user?.email}
                      </div>
                      {user?.role && (
                        <span className="badge badge-upcoming" style={{ marginTop: 6, fontSize: 10 }}>
                          {user.role}
                        </span>
                      )}
                    </div>
                    <div className="dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => { setMenuOpen(false); navigate('/orders') }}
                    >
                      <Ticket size={15} />
                      Đơn hàng & Vé của tôi
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => { setMenuOpen(false); navigate('/events') }}
                    >
                      <Calendar size={15} />
                      Khám phá sự kiện
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => { setMenuOpen(false); navigate('/admin') }}
                      >
                        <ShieldCheck size={15} />
                        Trang Quản trị (Admin)
                      </button>
                    )}
                    <div className="dropdown-divider" />
                    <button type="button" className="dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar-auth-btns">
                <Link to="/login" className="btn btn-ghost" style={{ padding: '9px 18px', fontSize: '14px' }}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '14px' }}>
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="navbar-mobile-toggle"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Mở menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="navbar-mobile-drawer">
            <form className="navbar-mobile-search" onSubmit={handleSearchSubmit}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện, địa điểm..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                Tìm
              </button>
            </form>
            <div className="navbar-mobile-links">
              <Link to="/" className="navbar-mobile-link">Trang chủ</Link>
              <Link to="/events" className="navbar-mobile-link">Tất cả sự kiện</Link>
              {isLoggedIn ? (
                <>
                  <Link to="/orders" className="navbar-mobile-link">Đơn hàng & Vé của tôi</Link>
                  {isAdmin && <Link to="/admin" className="navbar-mobile-link">Quản trị (Admin)</Link>}
                  <button type="button" className="navbar-mobile-link danger" onClick={handleLogout}>
                    Đăng xuất ({user?.fullName})
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                  <Link to="/login" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
