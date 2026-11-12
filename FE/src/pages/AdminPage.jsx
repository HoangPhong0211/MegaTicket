/**
 * AdminPage - Bảng điều khiển Quản trị viên (ROLE_ADMIN)
 * Kết nối BE AdminController:
 *   - Doanh thu: GET /api/admin/revenue
 *   - Soát vé QR: POST /api/admin/tickets/check-in, GET /api/admin/events/{id}/check-in-stats
 *   - Sự kiện & Zone: GET /api/events, POST/PUT/DELETE /api/admin/events, POST /api/admin/events/{id}/zones
 *   - Vật phẩm: POST /api/admin/events/{id}/merchandises, PUT/DELETE /api/admin/merchandises/{id}
 *   - Đơn hàng: GET /api/admin/orders?status=..., GET /api/admin/orders/{id}
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  BarChart3,
  QrCode,
  ShoppingBag,
  Eye,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AdminRevenuePanel from '../components/admin/AdminRevenuePanel'
import AdminCheckInPanel from '../components/admin/AdminCheckInPanel'
import AdminMerchandisePanel from '../components/admin/AdminMerchandisePanel'
import { adminApi, eventApi } from '../services/api'
import {
  EVENT_STATUS_META,
  ORDER_STATUS_META,
  formatCurrency,
  formatDateTime,
  getShortId,
} from '../utils/format'

const ADMIN_TABS = [
  { id: 'revenue', label: 'Doanh thu', icon: BarChart3 },
  { id: 'checkin', label: 'Check-in QR', icon: QrCode },
  { id: 'events', label: 'Sự kiện & Ghế', icon: Calendar },
  { id: 'merchandises', label: 'Vật phẩm', icon: ShoppingBag },
  { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
]

function toLocalDateTimeInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(() =>
    ADMIN_TABS.some((t) => t.id === initialTab) ? initialTab : 'revenue'
  )

  const [events, setEvents] = useState([])
  const [orders, setOrders] = useState([])
  const [revenueStats, setRevenueStats] = useState(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [checkInEventId, setCheckInEventId] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Modals
  const [eventModal, setEventModal] = useState(null)
  const [zoneModalEvent, setZoneModalEvent] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [inspectOrder, setInspectOrder] = useState(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ADMIN_TABS.some((t) => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const switchTab = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId }, { replace: true })
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [evList, ordList, revData] = await Promise.all([
        eventApi.getAll(),
        adminApi.getAllOrders(orderStatusFilter || undefined),
        adminApi.getRevenueStats().catch(() => null),
      ])
      setEvents(Array.isArray(evList) ? evList : [])
      setOrders(Array.isArray(ordList) ? ordList : [])
      setRevenueStats(revData)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu quản trị.')
    } finally {
      setLoading(false)
    }
  }, [orderStatusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleInspectOrder(orderId) {
    try {
      const detail = await adminApi.getOrderDetail(orderId)
      setInspectOrder(detail)
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết đơn hàng.')
    }
  }

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
              <p className="page-subtitle">Doanh thu · Soát vé Check-in QR · Sự kiện · Vật phẩm · Đơn hàng</p>
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

          {/* Admin Tabs */}
          <div className="filter-tabs" style={{ marginBottom: 24 }}>
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon
              const badgeCount =
                tab.id === 'events'
                  ? events.length
                  : tab.id === 'orders'
                  ? orders.length
                  : null
              return (
                <button
                  type="button"
                  key={tab.id}
                  className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => switchTab(tab.id)}
                >
                  <Icon size={14} />
                  {tab.label}
                  {badgeCount !== null && (
                    <span className="filter-tab-count">{badgeCount}</span>
                  )}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="skeleton-bar" style={{ height: 320, borderRadius: 14 }} />
          ) : activeTab === 'revenue' ? (
            <AdminRevenuePanel
              revenueStats={revenueStats}
              onInspectCheckIn={(evId) => {
                setCheckInEventId(evId)
                switchTab('checkin')
              }}
            />
          ) : activeTab === 'checkin' ? (
            <AdminCheckInPanel events={events} initialEventId={checkInEventId} />
          ) : activeTab === 'merchandises' ? (
            <AdminMerchandisePanel events={events} onToast={showToast} />
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
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '8px 12px', fontSize: 12 }}
                        onClick={() => {
                          setCheckInEventId(ev.id)
                          switchTab('checkin')
                        }}
                      >
                        <QrCode size={14} /> Check-in
                      </button>
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
            /* Orders Table with Status Filter */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="filter-tabs">
                {[
                  { id: '', label: 'Tất cả đơn' },
                  { id: 'PAID', label: 'Đã thanh toán' },
                  { id: 'PENDING', label: 'Chờ thanh toán' },
                  { id: 'CANCELLED', label: 'Đã hủy' },
                ].map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    className={`filter-tab ${orderStatusFilter === f.id ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Trạng thái</th>
                        <th>Vé & Vật phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                            Không có đơn hàng nào khớp bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        orders.map((ord) => {
                          const st = ORDER_STATUS_META[ord.status] || ORDER_STATUS_META.PENDING
                          return (
                            <tr key={ord.id}>
                              <td><code>#{getShortId(ord.id)}</code></td>
                              <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                              <td>
                                {ord.tickets?.length || 0} vé
                                {ord.merchandises?.length > 0 ? ` · ${ord.merchandises.length} món merch` : ''}
                              </td>
                              <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                {formatCurrency(ord.totalAmount)}
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {formatDateTime(ord.createdAt)}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  style={{ padding: '6px 10px', fontSize: 12 }}
                                  onClick={() => handleInspectOrder(ord.id)}
                                >
                                  <Eye size={13} /> Chi tiết
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Chi tiết Đơn hàng (Admin) */}
      {inspectOrder && (
        <div className="modal-backdrop" onClick={() => setInspectOrder(null)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn hàng #{getShortId(inspectOrder.id)}</h2>
              <button type="button" className="icon-remove-btn" onClick={() => setInspectOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className={`badge ${(ORDER_STATUS_META[inspectOrder.status] || ORDER_STATUS_META.PENDING).cls}`}>
                {(ORDER_STATUS_META[inspectOrder.status] || ORDER_STATUS_META.PENDING).label}
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
                {formatCurrency(inspectOrder.totalAmount)}
              </span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              <div>ID: <code>{inspectOrder.id}</code></div>
              <div style={{ marginTop: 4 }}>Ngày tạo: {formatDateTime(inspectOrder.createdAt)}</div>
              {inspectOrder.expiresAt && (
                <div style={{ marginTop: 4 }}>Hạn thanh toán: {formatDateTime(inspectOrder.expiresAt)}</div>
              )}
            </div>

            <div className="summary-section-label">Vé trong đơn ({inspectOrder.tickets?.length || 0})</div>
            <div className="ticket-stub-list" style={{ marginBottom: 16 }}>
              {(inspectOrder.tickets || []).map((t) => (
                <div key={t.ticketId} className="ticket-stub">
                  <div>
                    <span className="ticket-stub-zone">{t.zoneName}</span>
                    <div className="ticket-stub-seat">{t.seatNumber || 'GA'}</div>
                    <div className="ticket-stub-code"><code>{t.ticketCode}</code></div>
                  </div>
                  <span className="ticket-stub-price">{formatCurrency(t.price)}</span>
                </div>
              ))}
            </div>

            {inspectOrder.merchandises?.length > 0 && (
              <>
                <div className="summary-section-label">Vật phẩm lưu niệm</div>
                <div className="summary-items">
                  {inspectOrder.merchandises.map((m) => (
                    <div key={m.merchandiseId} className="summary-line">
                      <span>{m.merchandiseName} x{m.quantity}</span>
                      <span>{formatCurrency(Number(m.price) * m.quantity)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
