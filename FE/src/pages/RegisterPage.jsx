/**
 * RegisterPage - Trang đăng ký tài khoản
 * Gọi POST /api/auth/register → { fullName, email, password, phone }
 * Khớp với RegisterRequest DTO:
 *   - fullName: required, max 150 ký tự
 *   - email: required, email format
 *   - password: required, min 6 ký tự
 *   - phone: optional, max 20 ký tự
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InfoModal from '../components/InfoModal'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [modalType, setModalType] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }))
    if (serverError) setServerError('')
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) {
      errs.fullName = 'Họ tên không được để trống'
    } else if (form.fullName.length > 150) {
      errs.fullName = 'Họ tên tối đa 150 ký tự'
    }
    if (!form.email.trim()) {
      errs.email = 'Email không được để trống'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email không đúng định dạng'
    }
    if (!form.password) {
      errs.password = 'Mật khẩu không được để trống'
    } else if (form.password.length < 6) {
      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }
    if (form.phone && form.phone.length > 20) {
      errs.phone = 'Số điện thoại tối đa 20 ký tự'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      })
      setSuccess(true)
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setServerError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Tính độ mạnh mật khẩu
  function getPasswordStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    if (score <= 1) return { score, label: 'Yếu', color: 'var(--error)' }
    if (score <= 3) return { score, label: 'Trung bình', color: 'var(--warning)' }
    return { score, label: 'Mạnh', color: 'var(--success)' }
  }

  const pwStrength = getPasswordStrength(form.password)

  return (
    <div className="auth-page">
      <div className="auth-bg-blur" />
      <div className="auth-bg-blur-2" />

      <div className="auth-card" style={{ maxWidth: 480 }}>
        {/* Logo */}
        <Link to="/" className="auth-logo-link">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 12V22H4V12"/>
            <path d="M22 7H2v5h20V7z"/>
            <path d="M12 22V7"/>
            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
          </svg>
          Mega<span>Ticket</span>
        </Link>

        {/* Heading */}
        <div className="auth-heading">
          <h1>Tạo tài khoản</h1>
          <p>Tham gia MegaTicket để không bỏ lỡ sự kiện nào!</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="auth-alert success" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Đăng ký thành công! Đang chuyển về trang chủ...
          </div>
        )}

        {/* Server Error */}
        {serverError && (
          <div className="auth-alert error" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {serverError}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Họ tên */}
          <div className="form-group">
            <label htmlFor="fullName">Họ và tên <span style={{ color: 'var(--primary)' }}>*</span></label>
            <input
              className={`form-input ${errors.fullName ? 'error' : ''}`}
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={handleChange}
              autoComplete="name"
              autoFocus
            />
            {errors.fullName && (
              <span className="form-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                </svg>
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email <span style={{ color: 'var(--primary)' }}>*</span></label>
            <input
              className={`form-input ${errors.email ? 'error' : ''}`}
              type="email"
              id="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && (
              <span className="form-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                </svg>
                {errors.email}
              </span>
            )}
          </div>

          {/* Số điện thoại (optional) */}
          <div className="form-group">
            <label htmlFor="phone">Số điện thoại <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(tùy chọn)</span></label>
            <input
              className={`form-input ${errors.phone ? 'error' : ''}`}
              type="tel"
              id="phone"
              name="phone"
              placeholder="0901 234 567"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
            {errors.phone && (
              <span className="form-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                </svg>
                {errors.phone}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Mật khẩu <span style={{ color: 'var(--primary)' }}>*</span></label>
            <div className="input-wrapper">
              <input
                className={`form-input ${errors.password ? 'error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Ít nhất 6 ký tự"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button type="button" className="input-toggle-btn" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {form.password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= pwStrength.score ? pwStrength.color : 'var(--border)',
                      transition: 'background 0.3s'
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: pwStrength.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {pwStrength.label}
                </span>
              </div>
            )}

            {errors.password && (
              <span className="form-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                </svg>
                {errors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu <span style={{ color: 'var(--primary)' }}>*</span></label>
            <div className="input-wrapper">
              <input
                className={`form-input ${errors.confirmPassword ? 'error' : form.confirmPassword && form.password === form.confirmPassword ? '' : ''}`}
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button type="button" className="input-toggle-btn" onClick={() => setShowConfirm(s => !s)}>
                {showConfirm ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {/* Match indicator */}
            {form.confirmPassword && form.password === form.confirmPassword && (
              <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Mật khẩu khớp
              </span>
            )}
            {errors.confirmPassword && (
              <span className="form-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                </svg>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Terms */}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4 }}>
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <button
              type="button"
              onClick={() => setModalType('terms')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                padding: 0,
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              Điều khoản sử dụng
            </button>{' '}
            và{' '}
            <button
              type="button"
              onClick={() => setModalType('privacy')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                padding: 0,
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              Chính sách bảo mật
            </button>{' '}
            của MegaTicket.
          </p>

          {/* Submit */}
          <button type="submit" className="auth-submit-btn" disabled={loading || success}>
            {loading ? (
              <>
                <div className="spinner" />
                Đang tạo tài khoản...
              </>
            ) : success ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Thành công!
              </>
            ) : (
              <>
                Tạo tài khoản
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider" style={{ marginTop: 20 }}>hoặc</div>

        {/* Footer Link */}
        <p className="auth-footer-link">
          Đã có tài khoản?{' '}
          <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>

      <InfoModal
        isOpen={modalType === 'terms'}
        onClose={() => setModalType(null)}
        title="Điều khoản sử dụng MegaTicket"
      >
        <h4 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '15px' }}>1. Chấp thuận điều khoản</h4>
        <p style={{ marginBottom: 12 }}>
          Khi đăng ký tài khoản và sử dụng nền tảng MegaTicket, bạn cam kết tuân thủ các quy định về mua vé, thanh toán, bảo mật vé điện tử và quyền lợi của người tham gia sự kiện.
        </p>
        <h4 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '15px' }}>2. Quy định vé điện tử & QR Code</h4>
        <p style={{ marginBottom: 12 }}>
          Mỗi mã vé QR chỉ có giá trị check-in một lần duy nhất tại cổng sự kiện. Người dùng có trách nhiệm bảo mật mã QR, không chụp màn hình chia sẻ công khai nhằm tránh bị chiếm đoạt lượt quét vé.
        </p>
        <h4 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '15px' }}>3. Chính sách hoàn tiền & Hủy đơn</h4>
        <p>
          Đơn hàng giữ chỗ có hiệu lực thanh toán trong vòng 10 phút. Sau thời hạn trên, hệ thống sẽ tự động hủy đơn và giải phóng ghế để phục vụ khán giả khác. Vé đã thanh toán tuân theo chính sách riêng của từng ban tổ chức sự kiện.
        </p>
      </InfoModal>

      <InfoModal
        isOpen={modalType === 'privacy'}
        onClose={() => setModalType(null)}
        title="Chính sách bảo mật thông tin"
      >
        <h4 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '15px' }}>1. Thu thập thông tin</h4>
        <p style={{ marginBottom: 12 }}>
          MegaTicket chỉ thu thập các thông tin thiết yếu bao gồm họ tên, email, số điện thoại phục vụ việc xuất vé điện tử, thông báo sự kiện và hỗ trợ khách hàng.
        </p>
        <h4 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '15px' }}>2. Bảo mật dữ liệu & Mật khẩu</h4>
        <p style={{ marginBottom: 12 }}>
          Toàn bộ mật khẩu của khách hàng được mã hóa một chiều bằng thuật toán BCrypt chuẩn quốc tế. Thông tin giao dịch thanh toán qua VietQR/Ngân hàng được truyền tải qua giao thức mã hóa SSL/TLS.
        </p>
        <h4 style={{ color: 'var(--text)', marginBottom: 8, fontSize: '15px' }}>3. Cam kết không chia sẻ bên thứ ba</h4>
        <p>
          Chúng tôi cam kết không kinh doanh, bán hoặc cung cấp thông tin cá nhân của bạn cho bất kỳ đơn vị quảng cáo trung gian nào khi chưa có sự đồng thuận từ bạn.
        </p>
      </InfoModal>
    </div>
  )
}
