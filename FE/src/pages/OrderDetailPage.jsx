/**
 * OrderDetailPage - Chi tiết đơn hàng, Giữ chỗ (Countdown 10 phút), Thanh toán VietQR & Vé điện tử
 * Kết nối BE:
 *   GET    /api/orders/{id}
 *   DELETE /api/orders/{id}/cancel
 *   POST   /api/payments/vietqr/{orderId}
 *   POST   /api/payments/webhook (mô phỏng callback cho dev/test)
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ticket,
  ShoppingBag,
  Printer,
  Trash2,
  Sparkles,
  Building2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CountdownTimer from '../components/CountdownTimer'
import { orderApi, paymentApi, ticketApi } from '../services/api'
import {
  ORDER_STATUS_META,
  formatCurrency,
  formatDateTime,
  getShortId,
  getRemainingSeconds,
} from '../utils/format'

export default function OrderDetailPage() {
  const { id } = useParams()
  const location = useLocation()

  const [order, setOrder] = useState(() => location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)
  const [error, setError] = useState('')

  const [payment, setPayment] = useState(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [qrError, setQrError] = useState('')

  const [copiedKey, setCopiedKey] = useState('')
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [simulatingWebhook, setSimulatingWebhook] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [eTickets, setETickets] = useState([])

  const loadOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const data = await orderApi.getById(id)
      setOrder(data)
      return data
    } catch (err) {
      if (!silent) setError(err.message || 'Không thể tải thông tin đơn hàng.')
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadOrder(Boolean(location.state?.order))
  }, [loadOrder, location.state?.order])

  const initVietQr = useCallback(async () => {
    if (!id) return
    setLoadingQr(true)
    setQrError('')
    try {
      const res = await paymentApi.initVietQr(id)
      setPayment(res)
    } catch (err) {
      setQrError(err.message || 'Không thể khởi tạo mã thanh toán VietQR.')
    } finally {
      setLoadingQr(false)
    }
  }, [id])

  // Khởi tạo VietQR tự động nếu đơn đang PENDING và còn hạn
  useEffect(() => {
    if (!order || order.status !== 'PENDING') return
    if (getRemainingSeconds(order.expiresAt) === 0) return
    if (!payment && !loadingQr && !qrError) {
      initVietQr()
    }
  }, [order, payment, loadingQr, qrError, initVietQr])

  // Auto-polling mỗi 4 giây khi đơn hàng đang PENDING và còn trong thời hạn
  useEffect(() => {
    if (!order || order.status !== 'PENDING') return
    if (getRemainingSeconds(order.expiresAt) === 0) return

    const timer = setInterval(() => {
      loadOrder(true)
    }, 4000)

    return () => clearInterval(timer)
  }, [order, loadOrder])

  // Tải danh sách vé điện tử chi tiết (kèm ticketQrUrl & trạng thái check-in) khi đơn đã PAID
  useEffect(() => {
    if (!order || order.status !== 'PAID') return
    let active = true
    ticketApi
      .getByOrder(order.id)
      .then((list) => {
        if (active && Array.isArray(list)) setETickets(list)
      })
      .catch(() => {
        // Fallback sử dụng order.tickets nếu user hiện tại là Admin xem đơn người khác
      })
    return () => { active = false }
  }, [order])

  const handleTimerExpire = useCallback(() => {
    setActionMessage('Thời gian giữ chỗ 10 phút đã hết. Hệ thống sẽ giải phóng ghế về trạng thái trống.')
    setTimeout(() => loadOrder(true), 2000)
  }, [loadOrder])

  async function handleCheckStatus() {
    setCheckingStatus(true)
    const fresh = await loadOrder(true)
    setCheckingStatus(false)
    if (fresh?.status === 'PENDING') {
      setActionMessage('Hệ thống chưa ghi nhận giao dịch chuyển khoản. Vui lòng đợi vài giây sau khi chuyển.')
    }
  }

  async function handleSimulateWebhook() {
    if (!payment) return
    setSimulatingWebhook(true)
    setActionMessage('')
    try {
      await paymentApi.simulateWebhook({
        content: payment.transferContent,
        transferAmount: Number(payment.amount),
        transactionId: `SIM-${Date.now()}`,
      })
      await loadOrder(true)
    } catch (err) {
      setQrError(err.message || 'Không thể mô phỏng callback webhook.')
    } finally {
      setSimulatingWebhook(false)
    }
  }

  async function handleCancelOrder() {
    setCancelling(true)
    setError('')
    try {
      await orderApi.cancel(id)
      setConfirmCancel(false)
      await loadOrder(true)
    } catch (err) {
      setError(err.message || 'Không thể hủy đơn hàng.')
    } finally {
      setCancelling(false)
    }
  }

  async function copyText(key, value) {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 1800)
    } catch {
      // ignore clipboard errors
    }
  }

  if (loading && !order) {
    return (
      <>
        <Navbar />
        <main className="container" style={{ flex: 1, padding: '40px 24px' }}>
          <div className="skeleton-bar" style={{ height: 96, borderRadius: 16, marginBottom: 24 }} />
          <div className="detail-layout">
            <div className="skeleton-bar" style={{ height: 420, borderRadius: 16 }} />
            <div className="skeleton-bar" style={{ height: 320, borderRadius: 16 }} />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error && !order) {
    return (
      <>
        <Navbar />
        <main className="container" style={{ flex: 1, padding: '60px 24px' }}>
          <div className="empty-state">
            <AlertCircle size={56} style={{ color: 'var(--error)' }} />
            <h3>Không thể tải đơn hàng</h3>
            <p>{error}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <Link to="/orders" className="btn btn-primary">Đơn hàng của tôi</Link>
              <button type="button" className="btn btn-outline" onClick={() => loadOrder(false)}>
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const statusInfo = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.PENDING
  const isExpired = order.status === 'PENDING' && getRemainingSeconds(order.expiresAt) === 0

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
          <Link to="/orders" className="back-link dark">
            <ArrowLeft size={16} />
            Danh sách đơn hàng của tôi
          </Link>

          {/* Order Top Header */}
          <div className="order-header-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 className="order-page-title">Đơn hàng #{getShortId(order.id)}</h1>
                <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
              </div>
              <div className="order-header-meta">
                <span>Mã đầy đủ: <code>{order.id}</code></span>
                <span>·</span>
                <span>Ngày tạo: {formatDateTime(order.createdAt)}</span>
              </div>
            </div>

            <div className="order-header-amount">
              <span className="label">Tổng thanh toán</span>
              <span className="value">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Countdown Banner for PENDING orders */}
          {order.status === 'PENDING' && (
            <div style={{ marginBottom: 24 }}>
              <CountdownTimer expiresAt={order.expiresAt} onExpire={handleTimerExpire} />
            </div>
          )}

          {error && (
            <div className="auth-alert error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {actionMessage && (
            <div className="auth-alert info" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {actionMessage}
            </div>
          )}

          <div className="detail-layout">
            {/* LEFT COLUMN: VietQR Payment OR E-Tickets OR Cancelled Notice */}
            <div className="detail-main">
              {order.status === 'PENDING' && (
                <section className="panel-card">
                  <div className="panel-header-row">
                    <div>
                      <h2 className="panel-title">
                        <QrCode size={20} style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: 8 }} />
                        Thanh toán chuyển khoản VietQR
                      </h2>
                      <p className="panel-sub">
                        Mở ứng dụng ngân hàng bất kỳ, quét mã QR hoặc chuyển khoản đúng nội dung bên dưới
                      </p>
                    </div>
                  </div>

                  {isExpired ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                      <XCircle size={48} style={{ color: 'var(--error)' }} />
                      <h3>Đơn hàng đã hết thời hạn thanh toán</h3>
                      <p>Vui lòng quay lại trang sự kiện để tạo đơn đặt vé mới.</p>
                      <Link to="/events" className="btn btn-primary" style={{ marginTop: 8 }}>
                        Đặt vé lại
                      </Link>
                    </div>
                  ) : loadingQr ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
                      <div className="spinner" style={{ width: 32, height: 32 }} />
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Đang khởi tạo mã VietQR...</span>
                    </div>
                  ) : qrError ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                      <AlertCircle size={40} style={{ color: 'var(--error)' }} />
                      <p>{qrError}</p>
                      <button type="button" className="btn btn-primary" onClick={initVietQr}>
                        <RefreshCw size={14} /> Tạo lại mã VietQR
                      </button>
                    </div>
                  ) : payment ? (
                    <div className="vietqr-grid">
                      {/* Left: QR Frame */}
                      <div className="vietqr-qr-column">
                        <div className="vietqr-frame">
                          <img
                            src={payment.qrDataUrl}
                            alt="Mã thanh toán VietQR"
                            className="vietqr-img"
                          />
                        </div>
                        <div className="vietqr-polling-badge">
                          <span className="pulse-dot" />
                          Đang chờ xác nhận tự động...
                        </div>
                      </div>

                      {/* Right: Bank Transfer Details */}
                      <div className="vietqr-info-column">
                        <div className="bank-detail-list">
                          <div className="bank-detail-row">
                            <span className="bank-detail-label">
                              <Building2 size={14} /> Ngân hàng
                            </span>
                            <span className="bank-detail-value">{payment.bankName}</span>
                          </div>

                          <div className="bank-detail-row">
                            <span className="bank-detail-label">Chủ tài khoản</span>
                            <span className="bank-detail-value">{payment.accountName}</span>
                          </div>

                          <div className="bank-detail-row">
                            <span className="bank-detail-label">Số tài khoản</span>
                            <div className="bank-copy-group">
                              <span className="bank-detail-value mono">{payment.accountNumber}</span>
                              <button
                                type="button"
                                className="copy-btn"
                                onClick={() => copyText('acc', payment.accountNumber)}
                              >
                                {copiedKey === 'acc' ? <Check size={13} /> : <Copy size={13} />}
                                {copiedKey === 'acc' ? 'Đã chép' : 'Sao chép'}
                              </button>
                            </div>
                          </div>

                          <div className="bank-detail-row">
                            <span className="bank-detail-label">Số tiền chính xác</span>
                            <div className="bank-copy-group">
                              <span className="bank-detail-value highlight-amount">
                                {formatCurrency(payment.amount)}
                              </span>
                              <button
                                type="button"
                                className="copy-btn"
                                onClick={() => copyText('amt', Number(payment.amount))}
                              >
                                {copiedKey === 'amt' ? <Check size={13} /> : <Copy size={13} />}
                                {copiedKey === 'amt' ? 'Đã chép' : 'Sao chép'}
                              </button>
                            </div>
                          </div>

                          <div className="bank-detail-row important">
                            <span className="bank-detail-label">Nội dung chuyển khoản</span>
                            <div className="bank-copy-group">
                              <span className="transfer-code-pill">{payment.transferContent}</span>
                              <button
                                type="button"
                                className="copy-btn"
                                onClick={() => copyText('content', payment.transferContent)}
                              >
                                {copiedKey === 'content' ? <Check size={13} /> : <Copy size={13} />}
                                {copiedKey === 'content' ? 'Đã chép' : 'Sao chép'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="vietqr-warning-note">
                          Lưu ý: Vui lòng giữ nguyên <strong>Nội dung chuyển khoản</strong> (<code>{payment.transferContent}</code>) để hệ thống tự động đối soát và xuất vé điện tử ngay lập tức.
                        </p>

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCheckStatus}
                            disabled={checkingStatus}
                          >
                            <RefreshCw size={15} className={checkingStatus ? 'spin' : ''} />
                            {checkingStatus ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản · Kiểm tra ngay'}
                          </button>
                        </div>

                        {/* Dev Simulator Box */}
                        <div className="dev-simulator-box">
                          <div className="dev-simulator-header">
                            <Sparkles size={15} />
                            <span>Kiểm thử Webhook (Dev / Sandbox)</span>
                          </div>
                          <p>
                            Môi trường local chưa kết nối biến động số dư ngân hàng thật? Bấm nút dưới đây để gửi webhook giả lập (<code>POST /api/payments/webhook</code>) xác nhận đã nhận đủ tiền.
                          </p>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '8px 16px', fontSize: 13 }}
                            onClick={handleSimulateWebhook}
                            disabled={simulatingWebhook}
                          >
                            {simulatingWebhook ? 'Đang xử lý webhook...' : 'Giả lập thanh toán thành công'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </section>
              )}

              {order.status === 'PAID' && (
                <section className="panel-card">
                  <div className="paid-success-banner">
                    <CheckCircle2 size={28} />
                    <div>
                      <h2>Thanh toán thành công! Vé điện tử đã sẵn sàng</h2>
                      <p>Xuất trình mã QR bên dưới tại quầy check-in của sự kiện để vào cổng.</p>
                    </div>
                  </div>

                  {/* Electronic Ticket Master QR + Individual Tickets */}
                  <div className="eticket-layout">
                    {order.qrCodeUrl && (
                      <div className="eticket-qr-box">
                        <div className="vietqr-frame" style={{ padding: 14 }}>
                          <img src={order.qrCodeUrl} alt="QR Check-in Vé điện tử" className="eticket-qr-img" />
                        </div>
                        <div className="eticket-qr-caption">MÃ QR CHECK-IN ĐƠN HÀNG</div>
                        <div className="eticket-order-code">#{getShortId(order.id)}</div>
                      </div>
                    )}

                    <div className="eticket-stubs">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                          Danh sách vé của bạn ({(eTickets.length > 0 ? eTickets : order.tickets || []).length} vé)
                        </h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link
                            to="/tickets"
                            className="btn btn-primary"
                            style={{ padding: '7px 14px', fontSize: 12 }}
                          >
                            <QrCode size={14} />
                            Mở ví Vé điện tử
                          </Link>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '7px 14px', fontSize: 12 }}
                            onClick={() => window.print()}
                          >
                            <Printer size={14} />
                            In vé
                          </button>
                        </div>
                      </div>

                      <div className="ticket-stub-list">
                        {(eTickets.length > 0 ? eTickets : order.tickets || []).map((t) => (
                          <div key={t.ticketId} className="ticket-stub">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                              {t.ticketQrUrl && (
                                <div className="ticket-stub-qr-mini">
                                  <img src={t.ticketQrUrl} alt={`QR ${t.ticketCode}`} />
                                </div>
                              )}
                              <div className="ticket-stub-left">
                                <span className="ticket-stub-zone">{t.zoneName}</span>
                                <div className="ticket-stub-seat">
                                  {t.seatNumber ? `Ghế ${t.seatNumber}` : 'Khu đứng tự do (GA)'}
                                </div>
                                <div className="ticket-stub-code">
                                  Mã vé: <code>{t.ticketCode}</code>
                                </div>
                                {t.isCheckedIn && t.checkedInAt && (
                                  <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>
                                    Đã check-in lúc {formatDateTime(t.checkedInAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="ticket-stub-right">
                              <span className={`badge ${t.isCheckedIn ? 'badge-sold-out' : 'badge-on-sale'}`}>
                                {t.isCheckedIn ? 'Đã Check-in' : 'Hợp lệ'}
                              </span>
                              <span className="ticket-stub-price">{formatCurrency(t.price)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {order.status === 'CANCELLED' && (
                <section className="panel-card">
                  <div className="empty-state" style={{ padding: '36px 20px' }}>
                    <XCircle size={56} style={{ color: 'var(--text-muted)' }} />
                    <h3>Đơn hàng đã bị hủy</h3>
                    <p>
                      Đơn hàng này đã được hủy hoặc quá hạn giữ chỗ 10 phút. Toàn bộ ghế và vật phẩm đã được hoàn trả về hệ thống.
                    </p>
                    <Link to="/events" className="btn btn-primary" style={{ marginTop: 10 }}>
                      Khám phá sự kiện khác
                    </Link>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: Order Summary & Cancel Action */}
            <aside className="detail-sidebar">
              <div className="summary-card">
                <h3 className="summary-title">Chi tiết đơn hàng</h3>

                {/* Tickets */}
                <div className="summary-section-label">
                  <Ticket size={14} />
                  Vé tham dự ({order.tickets?.length || 0})
                </div>
                <div className="summary-items" style={{ marginBottom: 16 }}>
                  {(order.tickets || []).map((t) => (
                    <div key={t.ticketId} className="summary-line">
                      <div className="summary-line-main">
                        <div className="summary-line-title">{t.zoneName}</div>
                        <div className="summary-line-sub">
                          {t.seatNumber ? `Ghế ${t.seatNumber}` : 'Vé đứng tự do (GA)'}
                          {order.status === 'PAID' && t.ticketCode ? ` · ${t.ticketCode}` : ''}
                        </div>
                      </div>
                      <span className="summary-line-price">{formatCurrency(t.price)}</span>
                    </div>
                  ))}
                </div>

                {/* Merchandise */}
                {order.merchandises && order.merchandises.length > 0 && (
                  <>
                    <div className="summary-section-label">
                      <ShoppingBag size={14} />
                      Vật phẩm lưu niệm
                    </div>
                    <div className="summary-items" style={{ marginBottom: 16 }}>
                      {order.merchandises.map((m) => (
                        <div key={m.merchandiseId} className="summary-line">
                          <div className="summary-line-main">
                            <div className="summary-line-title">
                              {m.merchandiseName} <span className="summary-qty">x{m.quantity}</span>
                            </div>
                            <div className="summary-line-sub">{formatCurrency(m.price)} / sản phẩm</div>
                          </div>
                          <span className="summary-line-price">
                            {formatCurrency(Number(m.price) * m.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="summary-divider" />

                <div className="summary-total-row">
                  <span>Tổng cộng</span>
                  <span className="summary-total-amount">{formatCurrency(order.totalAmount)}</span>
                </div>

                {/* Cancel Order for PENDING */}
                {order.status === 'PENDING' && !isExpired && (
                  <div style={{ marginTop: 20 }}>
                    {!confirmCancel ? (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}
                        onClick={() => setConfirmCancel(true)}
                      >
                        <Trash2 size={15} />
                        Hủy đơn & Giải phóng ghế
                      </button>
                    ) : (
                      <div className="confirm-cancel-box">
                        <p>Hủy đơn này sẽ trả toàn bộ ghế về trạng thái trống. Tiếp tục?</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1, justifyContent: 'center', padding: '9px 12px', fontSize: 13 }}
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                          >
                            {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '9px 12px', fontSize: 13 }}
                            onClick={() => setConfirmCancel(false)}
                            disabled={cancelling}
                          >
                            Giữ lại
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
