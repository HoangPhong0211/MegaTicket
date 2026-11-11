/**
 * AdminPage - Bảng điều khiển Quản trị viên (ROLE_ADMIN)
 * Kết nối BE AdminController:
 *   GET    /api/events
 *   POST   /api/admin/events
 *   PUT    /api/admin/events/{id}
 *   DELETE /api/admin/events/{id}
 *   POST   /api/admin/events/{eventId}/zones
 *   GET    /api/admin/orders
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Edit3,
  Layers,
  Calendar,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  DollarSign,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { adminApi, eventApi } from '../services/api'
import {
  EVENT_STATUS_META,
  ORDER_STATUS_META,
  formatCurrency,
  formatDateTime,
  getShortId,
} from '../utils/format'

function toLocalDateTimeInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('events')
  const [events, setEvents] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Modals
  const [eventModal, setEventModal] = useState(null) // null | { mode: 'create' | 'edit', event?: ... }
  const [zoneModalEvent, setZoneModalEvent] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [evList, ordList] = await Promise.all([
        eventApi.getAll(),
        adminApi.getAllOrders(),
      ])
      setEvents(Array.isArray(evList) ? evList : [])
      const sortedOrders = Array.isArray(ordList)
        ? [...ordList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : []
      setOrders(sortedOrders)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu quản trị.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === 'PAID')
    const pendingOrders = orders.filter((o) => o.status === 'PENDING')
    const revenue = paidOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)
    return {
      totalEvents: events.length,
      totalOrders: orders.length,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      revenue,
    }
  }, [events, orders])

  async function handleDeleteEvent(id) {
    try {
      await adminApi.deleteEvent(id)
      setDeleteConfirmId(null)
      showToast('Đã xóa sự kiện thành công.')
      loadData()
    } catch (err) {
      setError(err.message || 'Không thể xóa sự kiện.')
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="page-header-strip">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="page-title">Bảng điều khiển Quản trị</h1>
              <p className="page-subtitle">Quản lý sự kiện, khu vực ghế ngồi (Zones) và đơn hàng hệ thống</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={loadData} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'spin' : ''} />
                Làm mới
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setEventModal({ mode: 'create' })}
              >
                <Plus size={16} />
                Tạo sự kiện mới
              </button>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
          {toast && (
            <div className="auth-alert success" style={{ marginBottom: 20 }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              {toast}
            </div>
          )}

          {error && (
            <div className="auth-alert error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* KPI Cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon"><Calendar size={20} /></div>
              <div>
                <div className="admin-stat-label">Tổng sự kiện</div>
                <div className="admin-stat-value">{stats.totalEvents}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon"><ShoppingCart size={20} /></div>
              <div>
                <div className="admin-stat-label">Tổng đơn hàng</div>
                <div className="admin-stat-value">{stats.totalOrders}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon warning"><Clock size={20} /></div>
              <div>
                <div className="admin-stat-label">Đang giữ chỗ</div>
                <div className="admin-stat-value">{stats.pendingCount}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon success"><DollarSign size={20} /></div>
              <div>
                <div className="admin-stat-label">Doanh thu (PAID)</div>
                <div className="admin-stat-value">{formatCurrency(stats.revenue)}</div>
              </div>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="filter-tabs" style={{ marginBottom: 24 }}>
            <button
              type="button"
              className={`filter-tab ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <Calendar size={14} />
              Sự kiện & Khu vực ghế ({events.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart size={14} />
              Tất cả Đơn hàng ({orders.length})
            </button>
          </div>

          {loading ? (
            <div className="skeleton-bar" style={{ height: 280, borderRadius: 14 }} />
          ) : activeTab === 'events' ? (
            <div className="admin-events-list">
              {events.map((ev) => {
                const stMeta = EVENT_STATUS_META[ev.status] || EVENT_STATUS_META.UPCOMING
                return (
                  <div key={ev.id} className="admin-event-card">
                    <div className="admin-event-main">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <h3 className="admin-event-title">{ev.name}</h3>
                        <span className={`badge ${stMeta.cls}`}>{stMeta.shortLabel}</span>
                      </div>
                      <div className="admin-event-meta">
                        <span>{ev.location}</span>
                        <span>·</span>
                        <span>Bắt đầu: {formatDateTime(ev.startTime)}</span>
                      </div>

                      {/* Zones pills */}
                      <div className="admin-zones-row">
                        {(ev.seatZones || []).map((z) => (
                          <span key={z.id} className="admin-zone-pill">
                            <strong>{z.name}</strong>: {formatCurrency(z.price)} · Còn {z.availableSeats}/{z.totalSeats}
                          </span>
                        ))}
                        <button
                          type="button"
                          className="admin-add-zone-btn"
                          onClick={() => setZoneModalEvent(ev)}
                        >
                          <Plus size={12} /> Thêm Zone
                        </button>
                      </div>
                    </div>

                    <div className="admin-event-actions">
                      <Link to={`/events/${ev.id}`} className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }}>
                        <ExternalLink size={14} /> Xem
                      </Link>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '8px 12px', fontSize: 12 }}
                        onClick={() => setEventModal({ mode: 'edit', event: ev })}
                      >
                        <Edit3 size={14} /> Sửa
                      </button>

                      {deleteConfirmId === ev.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '8px 12px', fontSize: 12 }}
                            onClick={() => handleDeleteEvent(ev.id)}
                          >
                            Xóa thật
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '8px 10px', fontSize: 12 }}
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '8px 12px', fontSize: 12, color: '#fca5a5' }}
                          onClick={() => setDeleteConfirmId(ev.id)}
                        >
                          <Trash2 size={14} /> Xóa
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Orders Table */
            <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Trạng thái</th>
                      <th>Vé đã đặt</th>
                      <th>Tổng tiền</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => {
                      const st = ORDER_STATUS_META[ord.status] || ORDER_STATUS_META.PENDING
                      return (
                        <tr key={ord.id}>
                          <td><code>#{getShortId(ord.id)}</code></td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td>{ord.tickets?.length || 0} vé</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {formatCurrency(ord.totalAmount)}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {formatDateTime(ord.createdAt)}
                          </td>
                          <td>
                            <Link to={`/orders/${ord.id}`} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>
                              Chi tiết <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Tạo / Sửa Sự kiện */}
      {eventModal && (
        <EventFormModal
          mode={eventModal.mode}
          event={eventModal.event}
          onClose={() => setEventModal(null)}
          onSaved={(msg) => {
            setEventModal(null)
            showToast(msg)
            loadData()
          }}
        />
      )}

      {/* Modal Thêm Zone */}
      {zoneModalEvent && (
        <AddZoneModal
          event={zoneModalEvent}
          onClose={() => setZoneModalEvent(null)}
          onSaved={() => {
            setZoneModalEvent(null)
            showToast('Đã thêm khu vực ghế và tự động sinh vé thành công.')
            loadData()
          }}
        />
      )}

      <Footer />
    </>
  )
}

function EventFormModal({ mode, event, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(() => ({
    name: event?.name || '',
    description: event?.description || '',
    location: event?.location || '',
    bannerUrl: event?.bannerUrl || '',
    startTime: event?.startTime ? toLocalDateTimeInput(event.startTime) : '',
    endTime: event?.endTime ? toLocalDateTimeInput(event.endTime) : '',
    status: event?.status || 'UPCOMING',
  }))
  const [zones, setZones] = useState([
    { name: 'VIP A', price: '1500000', totalSeats: '20' },
  ])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function addZoneRow() {
    setZones((z) => [...z, { name: '', price: '', totalSeats: '' }])
  }

  function updateZoneRow(idx, key, val) {
    setZones((prev) => prev.map((z, i) => (i === idx ? { ...z, [key]: val } : z)))
  }

  function removeZoneRow(idx) {
    setZones((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')

    if (!form.name.trim() || !form.location.trim() || !form.startTime || !form.endTime) {
      setErr('Vui lòng nhập đầy đủ Tên sự kiện, Địa điểm, Thời gian bắt đầu và kết thúc.')
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      bannerUrl: form.bannerUrl.trim() || null,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      ...(isEdit ? { status: form.status } : {}),
    }

    if (!isEdit) {
      const validZones = zones
        .filter((z) => z.name.trim() && Number(z.price) > 0 && Number(z.totalSeats) >= 1)
        .map((z) => ({
          name: z.name.trim(),
          price: Number(z.price),
          totalSeats: Number(z.totalSeats),
        }))
      payload.zones = validZones
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminApi.updateEvent(event.id, payload)
        onSaved('Cập nhật sự kiện thành công.')
      } else {
        await adminApi.createEvent(payload)
        onSaved('Tạo sự kiện mới và sinh vé thành công.')
      }
    } catch (e2) {
      setErr(e2.message || 'Thao tác thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Cập nhật sự kiện' : 'Tạo sự kiện mới'}</h2>
          <button type="button" className="icon-remove-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="auth-alert error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Tên sự kiện *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ví dụ: MegaTicket Concert 2026"
            />
          </div>

          <div className="form-group">
            <label>Địa điểm *</label>
            <input
              className="form-input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Sân vận động Mỹ Đình, Hà Nội"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Thời gian kết thúc *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          {isEdit && (
            <div className="form-group">
              <label>Trạng thái sự kiện</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="UPCOMING">UPCOMING (Sắp diễn ra / Đang mở bán)</option>
                <option value="ONGOING">ONGOING (Đang diễn ra)</option>
                <option value="ENDED">ENDED (Đã kết thúc)</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Banner URL (tùy chọn)</label>
            <input
              className="form-input"
              value={form.bannerUrl}
              onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="form-group">
            <label>Mô tả sự kiện</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Thông tin chi tiết về sự kiện..."
            />
          </div>

          {!isEdit && (
            <div className="form-group" style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Cấu hình khu vực ghế (Zones)</label>
                <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={addZoneRow}>
                  <Plus size={14} /> Thêm Zone
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                Mẹo: Tên chứa chữ "GA" (vd: GA Standing) sẽ tạo vé đứng tự do; các tên khác tạo ghế đánh số tự động.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {zones.map((z, idx) => (
                  <div key={idx} className="zone-builder-row">
                    <input
                      className="form-input"
                      placeholder="Tên zone (vd: VIP A)"
                      value={z.name}
                      onChange={(e) => updateZoneRow(idx, 'name', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Giá (VNĐ)"
                      value={z.price}
                      onChange={(e) => updateZoneRow(idx, 'price', e.target.value)}
                    />
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Số ghế"
                      value={z.totalSeats}
                      onChange={(e) => updateZoneRow(idx, 'totalSeats', e.target.value)}
                    />
                    {zones.length > 1 && (
                      <button type="button" className="icon-remove-btn" onClick={() => removeZoneRow(idx)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddZoneModal({ event, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('1000000')
  const [totalSeats, setTotalSeats] = useState('20')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (!name.trim() || Number(price) <= 0 || Number(totalSeats) < 1) {
      setErr('Vui lòng nhập tên khu vực, giá vé > 0 và số ghế >= 1.')
      return
    }
    setSaving(true)
    try {
      await adminApi.addZone(event.id, {
        name: name.trim(),
        price: Number(price),
        totalSeats: Number(totalSeats),
      })
      onSaved()
    } catch (e2) {
      setErr(e2.message || 'Không thể thêm khu vực.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Layers size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: 6 }} />
            Thêm Zone mới
          </h2>
          <button type="button" className="icon-remove-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Sự kiện: <strong style={{ color: 'var(--text)' }}>{event.name}</strong>
        </p>

        {err && (
          <div className="auth-alert error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Tên khu vực *</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: VIP B hoặc GA Standing"
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Giá vé (VNĐ) *</label>
              <input
                type="number"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tổng số vé *</label>
              <input
                type="number"
                className="form-input"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang tạo vé...' : 'Thêm Zone & Sinh vé'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
