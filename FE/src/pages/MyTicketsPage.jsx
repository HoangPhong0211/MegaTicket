/**
 * MyTicketsPage - Kho Vé điện tử (E-Ticket) của khách hàng
 * Kết nối BE:
 *   GET /api/tickets/my -> List<ETicketResponse>
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  QrCode,
  Ticket,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Search,
  RefreshCw,
  AlertCircle,
  Maximize2,
  X,
  Printer,
  ExternalLink,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ticketApi } from '../services/api'
import { formatCurrency, formatDateTime, formatDateRange, getShortId } from '../utils/format'

const TICKET_TABS = [
  { id: 'ALL', label: 'Tất cả vé' },
  { id: 'UNUSED', label: 'Chưa check-in' },
  { id: 'CHECKED_IN', label: 'Đã check-in' },
]

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [query, setQuery] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [zoomTicket, setZoomTicket] = useState(null)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ticketApi.getMyETickets()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách vé điện tử.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const counts = useMemo(() => {
    const checked = tickets.filter((t) => Boolean(t.isCheckedIn)).length
    return {
      ALL: tickets.length,
      UNUSED: tickets.length - checked,
      CHECKED_IN: checked,
    }
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tickets.filter((t) => {
      if (activeTab === 'UNUSED' && t.isCheckedIn) return false
      if (activeTab === 'CHECKED_IN' && !t.isCheckedIn) return false
      if (!q) return true
      const text = `${t.eventName || ''} ${t.ticketCode || ''} ${t.seatNumber || ''} ${t.zoneName || ''} ${t.eventLocation || ''}`.toLowerCase()
      return text.includes(q)
    })
  }, [tickets, activeTab, query])

  async function copyCode(id, code) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(''), 1800)
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="page-header-strip">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="page-title">Vé điện tử của tôi</h1>
              <p className="page-subtitle">Xuất trình mã QR trên từng vé tại cổng soát vé sự kiện để check-in</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                <Printer size={15} />
                In vé
              </button>
              <button type="button" className="btn btn-outline" onClick={loadTickets} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'spin' : ''} />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
          {/* Summary Stats */}
          <div className="eticket-stats-row">
            <div className="admin-stat-card">
              <div className="admin-stat-icon"><Ticket size={20} /></div>
              <div>
                <div className="admin-stat-label">Tổng vé hợp lệ</div>
                <div className="admin-stat-value">{counts.ALL}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon warning"><Clock size={20} /></div>
              <div>
                <div className="admin-stat-label">Sẵn sàng check-in</div>
                <div className="admin-stat-value">{counts.UNUSED}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon success"><CheckCircle2 size={20} /></div>
              <div>
                <div className="admin-stat-label">Đã check-in</div>
                <div className="admin-stat-value">{counts.CHECKED_IN}</div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="events-toolbar" style={{ marginTop: 22 }}>
            <div className="filter-tabs">
              {TICKET_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  <span className="filter-tab-count">{counts[tab.id]}</span>
                </button>
              ))}
            </div>

            <div className="events-search-box" style={{ maxWidth: 340 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm mã vé, sự kiện, số ghế..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" className="navbar-search-clear" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="auth-alert error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-bar" style={{ height: 190, borderRadius: 16 }} />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="empty-state">
              <QrCode size={56} />
              <h3>Chưa có vé điện tử nào</h3>
              <p>
                {tickets.length === 0
                  ? 'Các vé sau khi thanh toán thành công qua VietQR sẽ xuất hiện tại đây.'
                  : 'Không có vé nào khớp với bộ lọc hiện tại.'}
              </p>
              <Link to="/events" className="btn btn-primary" style={{ marginTop: 10 }}>
                Khám phá sự kiện
              </Link>
            </div>
          ) : (
            <div className="eticket-wallet-list">
              {filteredTickets.map((ticket) => (
                <article
                  key={ticket.ticketId}
                  className={`eticket-pass-card ${ticket.isCheckedIn ? 'checked-in' : ''}`}
                >
                  {/* Left: Event Info & Seat Details */}
                  <div className="eticket-pass-main">
                    <div className="eticket-pass-banner">
                      {ticket.eventBannerUrl ? (
                        <img src={ticket.eventBannerUrl} alt={ticket.eventName} />
                      ) : (
                        <div className="eticket-pass-banner-fallback">🎫</div>
                      )}
                    </div>

                    <div className="eticket-pass-info">
                      <div className="eticket-pass-badges">
                        <span className={`badge ${ticket.isCheckedIn ? 'badge-sold-out' : 'badge-on-sale'}`}>
                          {ticket.isCheckedIn ? '✓ Đã Check-in' : '● Sẵn sàng Check-in'}
                        </span>
                        <span className="eticket-zone-tag">{ticket.zoneName}</span>
                      </div>

                      <Link to={`/events/${ticket.eventId}`} className="eticket-pass-event-name">
                        {ticket.eventName}
                      </Link>

                      <div className="eticket-pass-meta">
                        <span>
                          <Calendar size={13} />
                          {formatDateRange(ticket.eventStartTime, ticket.eventEndTime)}
                        </span>
                        <span>
                          <MapPin size={13} />
                          {ticket.eventLocation}
                        </span>
                      </div>

                      <div className="eticket-pass-seat-row">
                        <div className="eticket-seat-pill">
                          <span className="lbl">Vị trí ghế</span>
                          <span className="val">{ticket.seatNumber || 'Đứng tự do (GA)'}</span>
                        </div>
                        <div className="eticket-seat-pill">
                          <span className="lbl">Giá vé</span>
                          <span className="val price">{formatCurrency(ticket.price)}</span>
                        </div>
                        <div className="eticket-seat-pill">
                          <span className="lbl">Đơn hàng</span>
                          <Link to={`/orders/${ticket.orderId}`} className="val link">
                            #{getShortId(ticket.orderId)} <ExternalLink size={11} />
                          </Link>
                        </div>
                      </div>

                      {ticket.isCheckedIn && ticket.checkedInAt && (
                        <div className="eticket-checked-note">
                          <CheckCircle2 size={14} />
                          Đã check-in lúc {formatDateTime(ticket.checkedInAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tear Line */}
                  <div className="eticket-tear-divider" />

                  {/* Right: QR Stub */}
                  <div className="eticket-pass-stub">
                    <button
                      type="button"
                      className="eticket-qr-thumb"
                      onClick={() => setZoomTicket(ticket)}
                      title="Bấm để phóng to mã QR"
                    >
                      <img src={ticket.ticketQrUrl} alt={`QR ${ticket.ticketCode}`} />
                    </button>

                    <div className="eticket-code-box">
                      <code>{ticket.ticketCode}</code>
                      <button
                        type="button"
                        className="copy-btn"
                        style={{ padding: '4px 8px' }}
                        onClick={() => copyCode(ticket.ticketId, ticket.ticketCode)}
                        title="Sao chép mã vé"
                      >
                        {copiedId === ticket.ticketId ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => setZoomTicket(ticket)}
                    >
                      <Maximize2 size={13} />
                      Phóng to QR
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal phóng to mã QR Check-in */}
      {zoomTicket && (
        <div className="modal-backdrop" onClick={() => setZoomTicket(null)}>
          <div className="modal-card" style={{ maxWidth: 420, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Mã QR Soát Vé</h2>
              <button type="button" className="icon-remove-btn" onClick={() => setZoomTicket(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="vietqr-frame" style={{ margin: '0 auto 16px', maxWidth: 280 }}>
              <img src={zoomTicket.ticketQrUrl} alt={zoomTicket.ticketCode} className="vietqr-img" />
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{zoomTicket.eventName}</h3>
            <p style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 700, marginBottom: 10 }}>
              {zoomTicket.zoneName} · {zoomTicket.seatNumber || 'GA'}
            </p>
            <div className="eticket-code-box" style={{ justifyContent: 'center', marginBottom: 12 }}>
              <code style={{ fontSize: 15, padding: '6px 12px' }}>{zoomTicket.ticketCode}</code>
              <button
                type="button"
                className="copy-btn"
                onClick={() => copyCode('zoom', zoomTicket.ticketCode)}
              >
                {copiedId === 'zoom' ? <Check size={13} /> : <Copy size={13} />}
                {copiedId === 'zoom' ? 'Đã chép' : 'Sao chép'}
              </button>
            </div>

            <span className={`badge ${zoomTicket.isCheckedIn ? 'badge-sold-out' : 'badge-on-sale'}`}>
              {zoomTicket.isCheckedIn
                ? `Đã Check-in (${formatDateTime(zoomTicket.checkedInAt)})`
                : 'Vé hợp lệ · Chưa Check-in'}
            </span>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
