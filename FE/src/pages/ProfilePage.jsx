/**
 * ProfilePage - Hồ sơ cá nhân & Đổi mật khẩu
 * Kết nối BE UserController:
 *   GET /api/users/me
 *   PUT /api/users/me
 *   PUT /api/users/me/password
 */
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  UserCircle,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  QrCode,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../services/api'
import { formatDateTime } from '../utils/format'

export default function ProfilePage() {
  const { updateUserInfo } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Form Profile
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')

  // Form Change Password
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurPw, setShowCurPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await userApi.getMyProfile()
      setProfile(data)
      setFullName(data.fullName || '')
      setPhone(data.phone || '')
    } catch (err) {
      setLoadError(err.message || 'Không thể tải thông tin hồ sơ cá nhân.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileMsg('')
    setProfileErr('')

    if (!fullName.trim()) {
      setProfileErr('Họ tên không được để trống.')
      return
    }
    if (fullName.trim().length > 150) {
      setProfileErr('Họ tên tối đa 150 ký tự.')
      return
    }
    if (phone.trim().length > 20) {
      setProfileErr('Số điện thoại tối đa 20 ký tự.')
      return
    }

    setSavingProfile(true)
    try {
      const updated = await userApi.updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      })
      setProfile(updated)
      updateUserInfo({ fullName: updated.fullName })
      setProfileMsg('Cập nhật thông tin cá nhân thành công!')
    } catch (err) {
      setProfileErr(err.message || 'Không thể cập nhật thông tin cá nhân.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwMsg('')
    setPwErr('')

    if (!pwForm.currentPassword) {
      setPwErr('Vui lòng nhập mật khẩu hiện tại.')
      return
    }
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
      setPwErr('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErr('Mật khẩu xác nhận không khớp.')
      return
    }

    setSavingPw(true)
    try {
      const res = await userApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwMsg(res?.message || 'Đổi mật khẩu thành công!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwErr(err.message || 'Không thể đổi mật khẩu.')
    } finally {
      setSavingPw(false)
    }
  }

  function getInitials(name) {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase()
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="page-header-strip">
          <div className="container">
            <h1 className="page-title">Hồ sơ cá nhân</h1>
            <p className="page-subtitle">Quản lý thông tin tài khoản và bảo mật đăng nhập</p>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
          {loadError && (
            <div className="auth-alert error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="detail-layout">
              <div className="skeleton-bar" style={{ height: 340, borderRadius: 16 }} />
              <div className="skeleton-bar" style={{ height: 340, borderRadius: 16 }} />
            </div>
          ) : profile && (
            <>
              {/* Profile Overview Banner */}
              <div className="profile-banner-card">
                <div className="profile-banner-left">
                  <div className="profile-avatar-lg">{getInitials(profile.fullName)}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 22, fontWeight: 800 }}>{profile.fullName}</h2>
                      <span className={`badge ${profile.role === 'ADMIN' ? 'badge-on-sale' : 'badge-upcoming'}`}>
                        <ShieldCheck size={12} />
                        {profile.role}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {profile.email}
                    </div>
                    {profile.createdAt && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} />
                        Tham gia từ: {formatDateTime(profile.createdAt)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link to="/tickets" className="btn btn-outline" style={{ padding: '9px 16px', fontSize: 13 }}>
                    <QrCode size={15} /> Vé điện tử
                  </Link>
                  <Link to="/orders" className="btn btn-outline" style={{ padding: '9px 16px', fontSize: 13 }}>
                    <ClipboardList size={15} /> Đơn hàng của tôi
                  </Link>
                </div>
              </div>

              {/* 2 Forms Grid */}
              <div className="profile-forms-grid">
                {/* Update Info */}
                <section className="panel-card">
                  <div className="panel-header-row">
                    <div>
                      <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserCircle size={20} style={{ color: 'var(--primary)' }} />
                        Thông tin cá nhân
                      </h2>
                      <p className="panel-sub">Cập nhật họ tên và số điện thoại liên hệ</p>
                    </div>
                  </div>

                  {profileMsg && (
                    <div className="auth-alert success" style={{ marginBottom: 16 }}>
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      {profileMsg}
                    </div>
                  )}
                  {profileErr && (
                    <div className="auth-alert error" style={{ marginBottom: 16 }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      {profileErr}
                    </div>
                  )}

                  <form className="auth-form" onSubmit={handleSaveProfile}>
                    <div className="form-group">
                      <label htmlFor="profile-email">Email</label>
                      <input
                        id="profile-email"
                        className="form-input"
                        value={profile.email || ''}
                        disabled
                        style={{ opacity: 0.65, cursor: 'not-allowed' }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Email đăng nhập cố định, không thể thay đổi.
                      </span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="profile-name">Họ và tên *</label>
                      <input
                        id="profile-name"
                        className="form-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="profile-phone">Số điện thoại</label>
                      <input
                        id="profile-phone"
                        className="form-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901 234 567"
                      />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={savingProfile}>
                      <Save size={16} />
                      {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </form>
                </section>

                {/* Change Password */}
                <section className="panel-card">
                  <div className="panel-header-row">
                    <div>
                      <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Lock size={20} style={{ color: 'var(--primary)' }} />
                        Đổi mật khẩu
                      </h2>
                      <p className="panel-sub">Sử dụng mật khẩu tối thiểu 6 ký tự để bảo vệ tài khoản</p>
                    </div>
                  </div>

                  {pwMsg && (
                    <div className="auth-alert success" style={{ marginBottom: 16 }}>
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      {pwMsg}
                    </div>
                  )}
                  {pwErr && (
                    <div className="auth-alert error" style={{ marginBottom: 16 }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      {pwErr}
                    </div>
                  )}

                  <form className="auth-form" onSubmit={handleChangePassword}>
                    <div className="form-group">
                      <label htmlFor="cur-pw">Mật khẩu hiện tại *</label>
                      <div className="input-wrapper">
                        <input
                          id="cur-pw"
                          type={showCurPw ? 'text' : 'password'}
                          className="form-input"
                          value={pwForm.currentPassword}
                          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                        <button type="button" className="input-toggle-btn" onClick={() => setShowCurPw((v) => !v)}>
                          {showCurPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="new-pw">Mật khẩu mới *</label>
                      <div className="input-wrapper">
                        <input
                          id="new-pw"
                          type={showNewPw ? 'text' : 'password'}
                          className="form-input"
                          value={pwForm.newPassword}
                          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                          placeholder="Ít nhất 6 ký tự"
                        />
                        <button type="button" className="input-toggle-btn" onClick={() => setShowNewPw((v) => !v)}>
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirm-pw">Xác nhận mật khẩu mới *</label>
                      <input
                        id="confirm-pw"
                        type="password"
                        className="form-input"
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={savingPw}>
                      <Lock size={16} />
                      {savingPw ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
