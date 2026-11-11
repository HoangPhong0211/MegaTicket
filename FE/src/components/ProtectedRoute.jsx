/**
 * ProtectedRoute - Bảo vệ các route yêu cầu đăng nhập hoặc quyền ADMIN
 */
import { Navigate, useLocation, Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'
import Footer from './Footer'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isLoggedIn, isAdmin } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <>
        <Navbar />
        <main className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <div className="empty-state">
            <ShieldAlert size={56} style={{ color: 'var(--error)' }} />
            <h3>Không có quyền truy cập</h3>
            <p>Khu vực này chỉ dành cho Quản trị viên (ADMIN).</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>
              Về trang chủ
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return children
}
