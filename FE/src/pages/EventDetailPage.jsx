/**
 * EventDetailPage - Chi tiết sự kiện, sơ đồ ghế ngồi (Seat Map) & đặt vé giữ chỗ
 * Kết nối BE:
 *   GET  /api/events/{id}
 *   GET  /api/events/{eventId}/zones/{zoneId}/seats
 *   POST /api/orders
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  ShoppingBag,
  Clock,
  Check,
  AlertCircle,
  Minus,
  Plus,
  Trash2,
  RefreshCw,
  Armchair,
  Users,
  Info,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { eventApi, orderApi } from '../services/api'
import { EVENT_STATUS_META, formatCurrency, formatDateRange, getEventTimePhaseInfo } from '../utils/format'

const MAX_TICKETS_PER_ZONE = 10

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeZoneId, setActiveZoneId] = useState(null)
  const [seatsByZone, setSeatsByZone] = useState({})
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [seatsError, setSeatsError] = useState('')

  // { [zoneId]: { mode: 'seats' | 'quantity', ticketIds: string[], quantity: number } }
  const [zoneSelections, setZoneSelections] = useState({})
  // { [merchId]: number }
  const [merchSelections, setMerchSelections] = useState({})

  const [submitting, setSubmitting] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [seatWarning, setSeatWarning] = useState('')

  const loadEvent = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const data = await eventApi.getById(id)
      setEvent(data)
      if (data?.seatZones?.length > 0) {
        setActiveZoneId((prev) => {
          if (prev && data.seatZones.some((z) => z.id === prev)) return prev
          const availableZone = data.seatZones.find((z) => (z.availableSeats ?? 0) > 0)
          return (availableZone || data.seatZones[0]).id
        })
      }
    } catch (err) {
      if (!silent) setError(err.message || 'Không thể tải thông tin sự kiện.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadEvent()
    // Đồng bộ định kỳ mỗi 60s khớp với Cronjob trạng thái sự kiện trên BE
    const timer = setInterval(() => loadEvent(true), 60_000)
    return () => clearInterval(timer)
  }, [loadEvent])

  const loadZoneSeats = useCallback(async (zoneId) => {
    if (!zoneId) return
    setLoadingSeats(true)
    setSeatsError('')
    try {
      const seats = await eventApi.getZoneSeats(id, zoneId)
      setSeatsByZone((prev) => ({ ...prev, [zoneId]: Array.isArray(seats) ? seats : [] }))
    } catch (err) {
      setSeatsError(err.message || 'Không thể tải sơ đồ ghế.')
    } finally {
      setLoadingSeats(false)
    }
  }, [id])

  useEffect(() => {
    if (activeZoneId) {
      loadZoneSeats(activeZoneId)
      setSeatWarning('')
    }
  }, [activeZoneId, loadZoneSeats])

  const activeZone = useMemo(
    () => event?.seatZones?.find((z) => z.id === activeZoneId) || null,
    [event, activeZoneId]
  )

  const activeSeats = useMemo(
    () => (activeZoneId ? seatsByZone[activeZoneId] || [] : []),
    [seatsByZone, activeZoneId]
  )

  // Zone có đánh số ghế cụ thể hay là GA đứng tự do
  const isSeatedZone = useMemo(
    () => activeSeats.some((s) => Boolean(s.seatNumber)),
    [activeSeats]
  )

  const activeAvailableSeats = useMemo(
    () => activeSeats.filter((s) => s.status === 'AVAILABLE'),
    [activeSeats]
  )

  const activeSelection = useMemo(() => {
    if (!activeZoneId) return { mode: 'seats', ticketIds: [], quantity: 0 }
    const existing = zoneSelections[activeZoneId]
    if (existing) return existing
    return {
      mode: isSeatedZone ? 'seats' : 'quantity',
      ticketIds: [],
      quantity: 0,
    }
  }, [activeZoneId, zoneSelections, isSeatedZone])

  // Nếu zone thực tế là GA mà selection mặc định đang là 'seats', chuyển sang 'quantity'
  useEffect(() => {
    if (!activeZoneId || loadingSeats || activeSeats.length === 0) return
    if (!isSeatedZone && zoneSelections[activeZoneId]?.mode === 'seats') {
      setZoneSelections((prev) => ({
        ...prev,
        [activeZoneId]: { mode: 'quantity', ticketIds: [], quantity: 0 },
      }))
    }
  }, [activeZoneId, isSeatedZone, loadingSeats, activeSeats.length, zoneSelections])

  function switchZoneMode(zoneId, newMode) {
    setSeatWarning('')
    setOrderError('')
    setZoneSelections((prev) => ({
      ...prev,
      [zoneId]: {
        mode: newMode,
        ticketIds: [],
        quantity: 0,
      },
    }))
  }

  function toggleSeat(seat) {
    if (!activeZoneId || seat.status !== 'AVAILABLE' || event?.status === 'ENDED') return
    setSeatWarning('')
    setOrderError('')

    setZoneSelections((prev) => {
      const current = prev[activeZoneId] || { mode: 'seats', ticketIds: [], quantity: 0 }
      const ids = current.mode === 'seats' ? [...(current.ticketIds || [])] : []
      const exists = ids.includes(seat.id)

      if (exists) {
        const nextIds = ids.filter((x) => x !== seat.id)
        return {
          ...prev,
          [activeZoneId]: { mode: 'seats', ticketIds: nextIds, quantity: 0 },
        }
      }

      if (ids.length >= MAX_TICKETS_PER_ZONE) {
        setSeatWarning(`Mỗi khu vực chỉ được đặt tối đa ${MAX_TICKETS_PER_ZONE} vé trong một đơn hàng.`)
        return prev
      }

      return {
        ...prev,
        [activeZoneId]: { mode: 'seats', ticketIds: [...ids, seat.id], quantity: 0 },
      }
    })
  }

  function changeZoneQuantity(zoneId, delta, maxAvail) {
    if (event?.status === 'ENDED') return
    setSeatWarning('')
    setOrderError('')
    const cap = Math.min(MAX_TICKETS_PER_ZONE, maxAvail)

    setZoneSelections((prev) => {
      const current = prev[zoneId]?.quantity || 0
      const nextQty = Math.max(0, Math.min(cap, current + delta))
      return {
        ...prev,
        [zoneId]: { mode: 'quantity', ticketIds: [], quantity: nextQty },
      }
    })
  }

  function clearZoneSelection(zoneId) {
    setZoneSelections((prev) => {
      const copy = { ...prev }
      delete copy[zoneId]
      return copy
    })
  }

  function changeMerchQuantity(merchId, delta, maxStock) {
    if (event?.status === 'ENDED') return
    setOrderError('')
    setMerchSelections((prev) => {
      const cur = prev[merchId] || 0
      const next = Math.max(0, Math.min(maxStock, cur + delta))
      if (next === 0) {
        const copy = { ...prev }
        delete copy[merchId]
        return copy
      }
      return { ...prev, [merchId]: next }
    })
  }

  // Tổng hợp giỏ hàng tạm
  const cartSummary = useMemo(() => {
    if (!event) return { ticketLines: [], merchLines: [], totalTickets: 0, totalAmount: 0 }

    const ticketLines = []
    let totalTickets = 0
    let ticketSubtotal = 0

    for (const zone of event.seatZones || []) {
      const sel = zoneSelections[zone.id]
      if (!sel) continue
      const seatsForZone = seatsByZone[zone.id] || []

      if (sel.mode === 'seats' && sel.ticketIds?.length > 0) {
        const pickedSeats = sel.ticketIds
          .map((tid) => seatsForZone.find((s) => s.id === tid))
          .filter(Boolean)
        const count = sel.ticketIds.length
        const lineTotal = pickedSeats.length === count
          ? pickedSeats.reduce((sum, s) => sum + Number(s.price ?? zone.price), 0)
          : count * Number(zone.price)

        totalTickets += count
        ticketSubtotal += lineTotal
        ticketLines.push({
          zoneId: zone.id,
          zoneName: zone.name,
          count,
          seatLabels: pickedSeats.map((s) => s.seatNumber || 'Ghế'),
          unitPrice: Number(zone.price),
          subtotal: lineTotal,
        })
      } else if (sel.mode === 'quantity' && sel.quantity > 0) {
        const count = sel.quantity
        const lineTotal = count * Number(zone.price)
        totalTickets += count
        ticketSubtotal += lineTotal
        ticketLines.push({
          zoneId: zone.id,
          zoneName: zone.name,
          count,
          seatLabels: null,
          unitPrice: Number(zone.price),
          subtotal: lineTotal,
        })
      }
    }

    const merchLines = []
    let merchSubtotal = 0
    for (const merch of event.merchandises || []) {
      const qty = merchSelections[merch.id] || 0
      if (qty > 0) {
        const sub = qty * Number(merch.price)
        merchSubtotal += sub
        merchLines.push({
          id: merch.id,
          name: merch.name,
          quantity: qty,
          unitPrice: Number(merch.price),
          subtotal: sub,
        })
      }
    }

    return {
      ticketLines,
      merchLines,
      totalTickets,
      ticketSubtotal,
      merchSubtotal,
      totalAmount: ticketSubtotal + merchSubtotal,
    }
  }, [event, zoneSelections, seatsByZone, merchSelections])

  async function handleCreateOrder() {
    if (cartSummary.totalTickets === 0 || event?.status === 'ENDED') return

    if (!isLoggedIn) {
      navigate('/login', { state: { from: location } })
      return
    }

    setSubmitting(true)
    setOrderError('')

    const ticketRequests = Object.entries(zoneSelections)
      .map(([zoneId, sel]) => {
        if (sel.mode === 'seats' && sel.ticketIds?.length > 0) {
          return { zoneId, ticketIds: sel.ticketIds }
        }
        if (sel.mode === 'quantity' && sel.quantity > 0) {
          return { zoneId, quantity: sel.quantity }
        }
        return null
      })
      .filter(Boolean)

    const merchandiseRequests = Object.entries(merchSelections)
      .filter(([, qty]) => qty > 0)
      .map(([merchandiseId, quantity]) => ({ merchandiseId, quantity }))

    try {
      const createdOrder = await orderApi.create({
        ticketRequests,
        ...(merchandiseRequests.length > 0 ? { merchandiseRequests } : {}),
      })
      navigate(`/orders/${createdOrder.id}`, { state: { order: createdOrder } })
    } catch (err) {
      setOrderError(err.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại ghế đã chọn.')
      // Refresh dữ liệu để cập nhật ghế nếu vừa có người khác đặt mất
      loadEvent()
      if (activeZoneId) loadZoneSeats(activeZoneId)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container" style={{ flex: 1, padding: '40px 24px' }}>
          <div className="skeleton-bar" style={{ height: 320, borderRadius: 16, marginBottom: 24 }} />
          <div className="detail-layout">
            <div className="skeleton-bar" style={{ height: 420, borderRadius: 16 }} />
            <div className="skeleton-bar" style={{ height: 340, borderRadius: 16 }} />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <main className="container" style={{ flex: 1, padding: '60px 24px' }}>
          <div className="empty-state">
            <AlertCircle size={56} style={{ color: 'var(--error)' }} />
            <h3>Không tìm thấy sự kiện</h3>
            <p>{error || 'Sự kiện không tồn tại hoặc đã bị xóa.'}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <Link to="/events" className="btn btn-primary">Danh sách sự kiện</Link>
              <button type="button" className="btn btn-outline" onClick={loadEvent}>
                <RefreshCw size={15} /> Thử lại
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const statusInfo = EVENT_STATUS_META[event.status] || EVENT_STATUS_META.UPCOMING
  const phaseInfo = getEventTimePhaseInfo(event)
  const isEnded = event.status === 'ENDED'
  const minPrice = event.seatZones?.length
    ? Math.min(...event.seatZones.map((z) => Number(z.price) || 0))
    : null

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Event Hero Banner */}
        <section className="event-detail-hero">
          {event.bannerUrl ? (
            <img src={event.bannerUrl} alt={event.name} className="event-detail-hero-bg" />
          ) : (
            <div className="event-detail-hero-bg fallback" />
          )}
          <div className="event-detail-hero-overlay" />

          <div className="container event-detail-hero-inner">
            <Link to="/events" className="back-link">
              <ArrowLeft size={16} />
              Quay lại danh sách sự kiện
            </Link>

            <div className="event-detail-hero-content">
              <div className="event-detail-badges">
                <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                {minPrice !== null && (
                  <span className="badge badge-price-pill">
                    Giá từ {formatCurrency(minPrice)}
                  </span>
                )}
              </div>

              <h1 className="event-detail-title">{event.name}</h1>

              <div className="event-detail-meta">
                <div className="event-detail-meta-item">
                  <Calendar size={16} />
                  <span>{formatDateRange(event.startTime, event.endTime)}</span>
                </div>
                <div className="event-detail-meta-item">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
                {phaseInfo.timeHint && (
                  <div className="event-detail-meta-item">
                    <Clock size={16} />
                    <span>{phaseInfo.timeHint}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main 2-column Content */}
        <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
          {isEnded && (
            <div className="auth-alert error" style={{ marginBottom: 24 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              Sự kiện này đã kết thúc. Hệ thống đã ngừng mở bán vé.
            </div>
          )}

          <div className="detail-layout">
            {/* LEFT COLUMN: Description + Zones + Seat Map + Merch */}
            <div className="detail-main">
              {/* Description */}
              {event.description && (
                <section className="panel-card">
                  <h2 className="panel-title">Giới thiệu sự kiện</h2>
                  <p className="event-description-text">{event.description}</p>
                </section>
              )}

              {/* Zones Selector */}
              <section className="panel-card">
                <div className="panel-header-row">
                  <div>
                    <h2 className="panel-title">1. Chọn khu vực vé</h2>
                    <p className="panel-sub">Bạn có thể chọn vé ở một hoặc nhiều khu vực khác nhau (tối đa {MAX_TICKETS_PER_ZONE} vé/khu vực)</p>
                  </div>
                </div>

                {!event.seatZones || event.seatZones.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <Ticket size={40} />
                    <p>Sự kiện này chưa cấu hình khu vực vé.</p>
                  </div>
                ) : (
                  <div className="zone-list">
                    {event.seatZones.map((zone) => {
                      const isActive = zone.id === activeZoneId
                      const avail = zone.availableSeats ?? 0
                      const total = zone.totalSeats || 1
                      const pct = Math.min(100, Math.round((avail / total) * 100))
                      const sel = zoneSelections[zone.id]
                      const pickedCount =
                        sel?.mode === 'seats'
                          ? sel.ticketIds?.length || 0
                          : sel?.quantity || 0

                      return (
                        <button
                          type="button"
                          key={zone.id}
                          className={`zone-card ${isActive ? 'active' : ''} ${avail === 0 ? 'sold-out' : ''}`}
                          onClick={() => setActiveZoneId(zone.id)}
                        >
                          <div className="zone-card-top">
                            <div className="zone-card-name-wrap">
                              <span className="zone-card-name">{zone.name}</span>
                              {pickedCount > 0 && (
                                <span className="zone-picked-badge">
                                  Đã chọn {pickedCount}
                                </span>
                              )}
                            </div>
                            <span className="zone-card-price">{formatCurrency(zone.price)}</span>
                          </div>

                          <div className="zone-card-bottom">
                            <div className="zone-progress-track">
                              <div className="zone-progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="zone-avail-text">
                              {avail > 0 ? `Còn ${avail}/${zone.totalSeats} chỗ` : 'Hết vé'}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Seat Map / Quantity Panel for Active Zone */}
              {activeZone && (
                <section className="panel-card">
                  <div className="panel-header-row">
                    <div>
                      <h2 className="panel-title">
                        2. Chọn ghế · <span style={{ color: 'var(--primary)' }}>{activeZone.name}</span>
                      </h2>
                      <p className="panel-sub">
                        Giá vé: <strong style={{ color: 'var(--text)' }}>{formatCurrency(activeZone.price)}</strong> · Còn{' '}
                        <strong style={{ color: 'var(--success)' }}>{activeAvailableSeats.length}</strong> ghế trống
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {isSeatedZone && activeAvailableSeats.length > 0 && (
                        <div className="mode-toggle">
                          <button
                            type="button"
                            className={`mode-toggle-btn ${activeSelection.mode === 'seats' ? 'active' : ''}`}
                            onClick={() => switchZoneMode(activeZone.id, 'seats')}
                          >
                            <Armchair size={14} />
                            Chọn trên sơ đồ
                          </button>
                          <button
                            type="button"
                            className={`mode-toggle-btn ${activeSelection.mode === 'quantity' ? 'active' : ''}`}
                            onClick={() => switchZoneMode(activeZone.id, 'quantity')}
                          >
                            <Users size={14} />
                            Chọn nhanh SL
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '7px 12px', fontSize: 12 }}
                        onClick={() => loadZoneSeats(activeZone.id)}
                        disabled={loadingSeats}
                        title="Làm mới trạng thái ghế"
                      >
                        <RefreshCw size={14} className={loadingSeats ? 'spin' : ''} />
                        Làm mới
                      </button>
                    </div>
                  </div>

                  {seatWarning && (
                    <div className="auth-alert error" style={{ marginBottom: 16 }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      {seatWarning}
                    </div>
                  )}

                  {seatsError ? (
                    <div className="auth-alert error">
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      {seatsError}
                    </div>
                  ) : loadingSeats ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                      <div className="spinner" style={{ width: 28, height: 28 }} />
                    </div>
                  ) : activeSeats.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                      <Info size={36} />
                      <h3>Chưa có vé phát hành cho khu vực này</h3>
                      <p>Khu vực {activeZone.name} hiện chưa có dữ liệu ghế mở bán trên hệ thống.</p>
                    </div>
                  ) : !isSeatedZone || activeSelection.mode === 'quantity' ? (
                    /* Mode B: Quantity Stepper (GA hoặc chọn nhanh) */
                    <div className="ga-selector-box">
                      <div className="ga-selector-info">
                        <div className="ga-selector-title">
                          {isSeatedZone
                            ? `Chọn nhanh số lượng vé (${activeZone.name})`
                            : `${activeZone.name} · Khu vực đứng tự do (GA)`}
                        </div>
                        <p className="ga-selector-desc">
                          {isSeatedZone
                            ? 'Hệ thống tự động khóa ghế trống tốt nhất bằng Pessimistic Lock khi bạn giữ chỗ.'
                            : 'Khu vực không chia số ghế cố định. Vào cổng theo thứ tự check-in.'}
                        </p>
                      </div>

                      <div className="stepper-control large">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => changeZoneQuantity(activeZone.id, -1, activeAvailableSeats.length)}
                          disabled={isEnded || (activeSelection.quantity || 0) <= 0}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="stepper-value">{activeSelection.quantity || 0}</span>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => changeZoneQuantity(activeZone.id, 1, activeAvailableSeats.length)}
                          disabled={
                            isEnded ||
                            (activeSelection.quantity || 0) >= Math.min(MAX_TICKETS_PER_ZONE, activeAvailableSeats.length)
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Mode A: Interactive Seat Map */
                    <div className="seat-map-wrapper">
                      {/* Stage indicator */}
                      <div className="stage-banner">
                        <div className="stage-arc" />
                        <span>SÂN KHẤU / STAGE</span>
                      </div>

                      {/* Legend */}
                      <div className="seat-legend">
                        <div className="seat-legend-item">
                          <span className="seat-dot available" />
                          <span>Ghế trống</span>
                        </div>
                        <div className="seat-legend-item">
                          <span className="seat-dot selected" />
                          <span>Đang chọn</span>
                        </div>
                        <div className="seat-legend-item">
                          <span className="seat-dot pending" />
                          <span>Đang giữ chỗ</span>
                        </div>
                        <div className="seat-legend-item">
                          <span className="seat-dot sold" />
                          <span>Đã bán</span>
                        </div>
                      </div>

                      {/* Seat Grid */}
                      <div className="seat-grid">
                        {activeSeats.map((seat) => {
                          const isSelected = activeSelection.ticketIds?.includes(seat.id)
                          const statusClass =
                            seat.status === 'SOLD'
                              ? 'sold'
                              : seat.status === 'PENDING'
                              ? 'pending'
                              : isSelected
                              ? 'selected'
                              : 'available'

                          const statusLabel =
                            seat.status === 'SOLD'
                              ? 'Đã bán'
                              : seat.status === 'PENDING'
                              ? 'Đang được giữ chỗ'
                              : isSelected
                              ? 'Bấm để bỏ chọn'
                              : `Ghế ${seat.seatNumber} · ${formatCurrency(seat.price)}`

                          return (
                            <button
                              type="button"
                              key={seat.id}
                              className={`seat-node ${statusClass}`}
                              disabled={isEnded || seat.status !== 'AVAILABLE'}
                              onClick={() => toggleSeat(seat)}
                              title={statusLabel}
                            >
                              <Armchair size={14} />
                              <span>{seat.seatNumber}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Merchandise Section */}
              {event.merchandises && event.merchandises.length > 0 && (
                <section className="panel-card">
                  <div className="panel-header-row">
                    <div>
                      <h2 className="panel-title">3. Vật phẩm lưu niệm kèm theo (Tùy chọn)</h2>
                      <p className="panel-sub">Đặt kèm merchandise chính thức của sự kiện</p>
                    </div>
                  </div>

                  <div className="merch-list">
                    {event.merchandises.map((item) => {
                      const qty = merchSelections[item.id] || 0
                      const outOfStock = (item.stockQuantity ?? 0) <= 0

                      return (
                        <div key={item.id} className="merch-card">
                          <div className="merch-image">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} />
                            ) : (
                              <ShoppingBag size={28} />
                            )}
                          </div>
                          <div className="merch-info">
                            <div className="merch-name">{item.name}</div>
                            <div className="merch-meta">
                              <span className="merch-price">{formatCurrency(item.price)}</span>
                              <span className="merch-stock">
                                {outOfStock ? 'Hết hàng' : `Còn ${item.stockQuantity} sản phẩm`}
                              </span>
                            </div>
                          </div>
                          <div className="stepper-control">
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => changeMerchQuantity(item.id, -1, item.stockQuantity)}
                              disabled={isEnded || qty <= 0}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="stepper-value">{qty}</span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => changeMerchQuantity(item.id, 1, item.stockQuantity)}
                              disabled={isEnded || outOfStock || qty >= item.stockQuantity}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: Sticky Booking Summary */}
            <aside className="detail-sidebar">
              <div className="summary-card">
                <h3 className="summary-title">Thông tin giữ chỗ</h3>

                {orderError && (
                  <div className="auth-alert error" style={{ marginBottom: 16 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    {orderError}
                  </div>
                )}

                {cartSummary.ticketLines.length === 0 && cartSummary.merchLines.length === 0 ? (
                  <div className="summary-empty">
                    <Ticket size={32} />
                    <p>Chưa có vé nào được chọn. Hãy chọn khu vực và ghế ngồi ở bên trái.</p>
                  </div>
                ) : (
                  <div className="summary-items">
                    {/* Ticket lines */}
                    {cartSummary.ticketLines.map((line) => (
                      <div key={line.zoneId} className="summary-line">
                        <div className="summary-line-main">
                          <div className="summary-line-title">
                            {line.zoneName} <span className="summary-qty">x{line.count}</span>
                          </div>
                          <div className="summary-line-sub">
                            {line.seatLabels
                              ? `Ghế: ${line.seatLabels.join(', ')}`
                              : 'Hệ thống tự chọn ghế trống'}
                          </div>
                        </div>
                        <div className="summary-line-right">
                          <span className="summary-line-price">{formatCurrency(line.subtotal)}</span>
                          <button
                            type="button"
                            className="icon-remove-btn"
                            onClick={() => clearZoneSelection(line.zoneId)}
                            title="Bỏ chọn khu vực này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Merch lines */}
                    {cartSummary.merchLines.map((m) => (
                      <div key={m.id} className="summary-line">
                        <div className="summary-line-main">
                          <div className="summary-line-title">
                            {m.name} <span className="summary-qty">x{m.quantity}</span>
                          </div>
                          <div className="summary-line-sub">Vật phẩm lưu niệm</div>
                        </div>
                        <div className="summary-line-right">
                          <span className="summary-line-price">{formatCurrency(m.subtotal)}</span>
                          <button
                            type="button"
                            className="icon-remove-btn"
                            onClick={() => changeMerchQuantity(m.id, -m.quantity, 999)}
                            title="Xóa vật phẩm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="summary-divider" />

                <div className="summary-total-row">
                  <span>Tổng thanh toán</span>
                  <span className="summary-total-amount">{formatCurrency(cartSummary.totalAmount)}</span>
                </div>

                <div className="summary-hold-note">
                  <Clock size={15} style={{ flexShrink: 0, color: 'var(--warning)' }} />
                  <span>
                    Ghế được giữ chỗ trong <strong>10 phút</strong> sau khi tạo đơn để hoàn tất thanh toán VietQR.
                  </span>
                </div>

                <button
                  type="button"
                  className="auth-submit-btn"
                  style={{ marginTop: 16 }}
                  disabled={isEnded || cartSummary.totalTickets === 0 || submitting}
                  onClick={handleCreateOrder}
                >
                  {submitting ? (
                    <>
                      <div className="spinner" />
                      Đang khóa ghế & tạo đơn...
                    </>
                  ) : !isLoggedIn && cartSummary.totalTickets > 0 ? (
                    <>
                      <Check size={16} />
                      Đăng nhập để đặt {cartSummary.totalTickets} vé
                    </>
                  ) : (
                    <>
                      <Ticket size={16} />
                      {cartSummary.totalTickets > 0
                        ? `Đặt ${cartSummary.totalTickets} vé & Thanh toán`
                        : 'Chọn ít nhất 1 vé'}
                    </>
                  )}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
