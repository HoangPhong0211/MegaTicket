/**
 * MyOrdersPage - Quản lý danh sách đơn hàng & vé của user
 * Kết nối BE:
 *   GET    /api/orders/my
 *   DELETE /api/orders/{id}/cancel
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Ticket,
  QrCode,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Trash2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CountdownTimer from '../components/CountdownTimer'
import { orderApi } from '../services/api'
import {
  ORDER_STATUS_META,
  formatCurrency,
  formatDateTime,
  getShortId,
  getRemainingSeconds,
} from '../utils/format'

const ORDER_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ thanh toán' },
  { id: 'PAID', label: 'Đã thanh toán' },
  { id: 'CANCELLED', label: 'Đã hủy' },
]

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [confirmCancelId, setConfirmCancelId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await orderApi.getMyOrders()
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : []
      setOrders(sorted)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === 'PENDING').length,
      PAID: orders.filter((o) => o.status === 'PAID').length,
      CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return orders
    return orders.filter((o) => o.status === activeTab)
  }, [orders, activeTab])

  async function handleCancel(orderId) {
    setCancellingId(orderId)
    setError('')
    try {
      await orderApi.cancel(orderId)
      setConfirmCancelId(null)
      await loadOrders()
    } catch (err) {
      setError(err.message || 'Không thể hủy đơn hàng.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="page-header-strip">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="page-title">Đơn hàng & Vé của tôi</h1>
              <p className="page-subtitle">Theo dõi giữ chỗ, thanh toán VietQR và quản lý vé điện tử</p>
            </div>
            <button type="button" className="btn btn-outline" onClick={loadOrders} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
          {/* Status Filter Tabs */}
          <div className="filter-tabs" style={{ marginBottom: 24 }}>
            {ORDER_TABS.map((tab) => (
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

          {error && (
            <div className="auth-alert error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-bar" style={{ height: 150, borderRadius: 14 }} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <Ticket size={56} />
              <h3>Chưa có đơn hàng nào</h3>
              <p>
                {activeTab === 'ALL'
                  ? 'Bạn chưa đặt vé sự kiện nào. Khám phá ngay các sự kiện hấp dẫn!'
                  : 'Không có đơn hàng nào ở trạng thái này.'}
              </p>
              <Link to="/events" className="btn btn-primary" style={{ marginTop: 10 }}>
                Khám phá sự kiện
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => {
                const statusInfo = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.PENDING
                const isPending = order.status === 'PENDING'
                const isExpired = isPending && getRemainingSeconds(order.expiresAt) === 0

                return (
                  <div key={order.id} className="order-list-card">
                    <div className="order-list-card-top">
                      <div className="order-list-id-group">
                        <span className="order-list-id">Đơn hàng #{getShortId(order.id)}</span>
                        <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                        {isPending && (
                          <CountdownTimer expiresAt={order.expiresAt} compact />
                        )}
                      </div>
                      <span className="order-list-date">
                        Đặt lúc: {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <div className="order-list-card-body">
                      {/* Tickets chips */}
                      <div className="order-list-items">
                        <div className="order-chips-row">
                          {(order.tickets || []).map((t) => (
                            <span key={t.ticketId} className="order-ticket-chip">
                              <Ticket size={13} />
                              <strong>{t.zoneName}</strong>
                              <span>· {t.seatNumber || 'GA'}</span>
                            </span>
                          ))}
                          {(order.merchandises || []).map((m) => (
                            <span key={m.merchandiseId} className="order-ticket-chip merch">
                              <ShoppingBag size={13} />
                              {m.merchandiseName} x{m.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="order-list-total">
                        <span className="label">Tổng tiền</span>
                        <span className="amount">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="order-list-card-footer">
                      {isPending && !isExpired ? (
                        <>
                          {confirmCancelId === order.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Hủy đơn này?</span>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '7px 14px', fontSize: 12 }}
                                onClick={() => handleCancel(order.id)}
                                disabled={cancellingId === order.id}
                              >
                                {cancellingId === order.id ? 'Đang hủy...' : 'Xác nhận'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                style={{ padding: '7px 12px', fontSize: 12 }}
                                onClick={() => setConfirmCancelId(null)}
                              >
                                Không
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '8px 14px', fontSize: 13, color: '#fca5a5' }}
                              onClick={() => setConfirmCancelId(order.id)}
                            >
                              <Trash2 size={14} />
                              Hủy đơn
                            </button>
                          )}

                          <Link to={`/orders/${order.id}`} className="btn btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}>
                            <QrCode size={15} />
                            Thanh toán VietQR
                          </Link>
                        </>
                      ) : (
                        <Link to={`/orders/${order.id}`} className="btn btn-outline" style={{ padding: '9px 18px', fontSize: 13 }}>
                          {order.status === 'PAID' ? (
                            <>
                              <QrCode size={15} />
                              Xem vé điện tử
                            </>
                          ) : (
                            <>
                              Xem chi tiết
                              <ArrowRight size={14} />
                            </>
                          )}
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
