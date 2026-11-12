/**
 * AdminRevenuePanel - Bảng thống kê doanh thu & hiệu suất bán vé/vật phẩm theo sự kiện
 * Kết nối BE: GET /api/admin/revenue -> RevenueStatsResponse
 */
import { BarChart3, Ticket, CheckCircle2, ShoppingCart, DollarSign, QrCode } from 'lucide-react'
import { formatCurrency } from '../../utils/format'

export default function AdminRevenuePanel({ revenueStats, onInspectCheckIn }) {
  if (!revenueStats) {
    return (
      <div className="empty-state">
        <BarChart3 size={48} />
        <h3>Chưa có dữ liệu thống kê doanh thu</h3>
        <p>Thống kê sẽ hiển thị khi máy chủ trả về dữ liệu từ /api/admin/revenue.</p>
      </div>
    )
  }

  const {
    totalRevenue = 0,
    totalOrders = 0,
    paidOrders = 0,
    pendingOrders = 0,
    cancelledOrders = 0,
    totalTicketsSold = 0,
    totalTicketsCheckedIn = 0,
    eventStats = [],
  } = revenueStats

  const checkInRate =
    totalTicketsSold > 0 ? Math.round((totalTicketsCheckedIn / totalTicketsSold) * 100) : 0
  const maxEventRev = Math.max(
    1,
    ...eventStats.map((e) => Number(e.totalEventRevenue || 0))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top KPI Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon success"><DollarSign size={20} /></div>
          <div>
            <div className="admin-stat-label">Tổng doanh thu (PAID)</div>
            <div className="admin-stat-value" style={{ color: 'var(--success)' }}>
              {formatCurrency(totalRevenue)}
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon"><ShoppingCart size={20} /></div>
          <div>
            <div className="admin-stat-label">Đơn hàng ({totalOrders})</div>
            <div className="admin-stat-value" style={{ fontSize: 15 }}>
              <span style={{ color: 'var(--success)' }}>{paidOrders} đã TT</span>
              {' · '}
              <span style={{ color: 'var(--warning)' }}>{pendingOrders} chờ</span>
              {' · '}
              <span style={{ color: 'var(--text-muted)' }}>{cancelledOrders} hủy</span>
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon"><Ticket size={20} /></div>
          <div>
            <div className="admin-stat-label">Tổng vé đã bán</div>
            <div className="admin-stat-value">{totalTicketsSold}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon warning"><CheckCircle2 size={20} /></div>
          <div>
            <div className="admin-stat-label">Đã Check-in tại cổng</div>
            <div className="admin-stat-value">
              {totalTicketsCheckedIn} <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>({checkInRate}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Revenue Bar Breakdown */}
      {eventStats.length > 0 && (
        <section className="panel-card">
          <div className="panel-header-row">
            <div>
              <h2 className="panel-title">Tỷ trọng doanh thu theo sự kiện</h2>
              <p className="panel-sub">So sánh nguồn thu từ Vé sự kiện và Vật phẩm lưu niệm</p>
            </div>
            <div className="seat-legend" style={{ margin: 0, padding: 0, border: 'none' }}>
              <div className="seat-legend-item">
                <span className="seat-dot" style={{ background: 'var(--primary)' }} />
                <span>Doanh thu vé</span>
              </div>
              <div className="seat-legend-item">
                <span className="seat-dot" style={{ background: 'var(--accent)' }} />
                <span>Doanh thu vật phẩm</span>
              </div>
            </div>
          </div>

          <div className="revenue-bars-list">
            {eventStats.map((ev) => {
              const tRev = Number(ev.ticketRevenue || 0)
              const mRev = Number(ev.merchandiseRevenue || 0)
              const tot = Number(ev.totalEventRevenue || 0)
              const tWidth = Math.round((tRev / maxEventRev) * 100)
              const mWidth = Math.round((mRev / maxEventRev) * 100)

              return (
                <div key={ev.eventId} className="revenue-bar-item">
                  <div className="revenue-bar-top">
                    <span className="revenue-bar-name">{ev.eventName}</span>
                    <span className="revenue-bar-total">{formatCurrency(tot)}</span>
                  </div>
                  <div className="revenue-bar-track">
                    <div
                      className="revenue-bar-seg ticket"
                      style={{ width: `${tWidth}%` }}
                      title={`Doanh thu vé: ${formatCurrency(tRev)}`}
                    />
                    <div
                      className="revenue-bar-seg merch"
                      style={{ width: `${mWidth}%` }}
                      title={`Doanh thu vật phẩm: ${formatCurrency(mRev)}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Detailed Event Revenue Table */}
      <section className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 12px' }}>
          <h2 className="panel-title">Chi tiết doanh thu & soát vé từng sự kiện</h2>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sự kiện</th>
                <th>Vé đã bán</th>
                <th>Đã Check-in</th>
                <th>Doanh thu vé</th>
                <th>Doanh thu vật phẩm</th>
                <th>Tổng doanh thu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {eventStats.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    Chưa có sự kiện nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                eventStats.map((ev) => {
                  const pct = ev.ticketsSold > 0
                    ? Math.round((ev.ticketsCheckedIn / ev.ticketsSold) * 100)
                    : 0
                  return (
                    <tr key={ev.eventId}>
                      <td style={{ fontWeight: 600 }}>{ev.eventName}</td>
                      <td>{ev.ticketsSold}</td>
                      <td>
                        <span className="badge badge-on-sale" style={{ fontSize: 11 }}>
                          {ev.ticketsCheckedIn}/{ev.ticketsSold} ({pct}%)
                        </span>
                      </td>
                      <td>{formatCurrency(ev.ticketRevenue)}</td>
                      <td>{formatCurrency(ev.merchandiseRevenue)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {formatCurrency(ev.totalEventRevenue)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => onInspectCheckIn(ev.eventId)}
                        >
                          <QrCode size={13} /> Soát vé
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
