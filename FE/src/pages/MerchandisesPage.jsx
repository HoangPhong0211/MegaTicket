/**
 * MerchandisesPage - Trang danh mục Vật phẩm lưu niệm chính thức theo sự kiện
 * Kết nối BE:
 *   GET /api/events
 *   GET /api/events/{eventId}/merchandises
 *   GET /api/merchandises/{id}
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Search,
  RefreshCw,
  ArrowRight,
  Calendar,
  X,
  Eye,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { eventApi, merchandiseApi } from '../services/api'
import { formatCurrency } from '../utils/format'

export default function MerchandisesPage() {
  const [events, setEvents] = useState([])
  const [merchandises, setMerchandises] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('ALL')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [detailItem, setDetailItem] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const eventList = await eventApi.getAll()
      const safeEvents = Array.isArray(eventList) ? eventList : []
      setEvents(safeEvents)

      // Fetch merchandise theo từng sự kiện qua GET /api/events/{eventId}/merchandises
      const nested = await Promise.all(
        safeEvents.map(async (ev) => {
          try {
            return await merchandiseApi.getByEvent(ev.id)
          } catch {
            return (ev.merchandises || []).map((m) => ({
              ...m,
              eventId: ev.id,
              eventName: ev.name,
            }))
          }
        })
      )
      setMerchandises(nested.flat())
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách vật phẩm lưu niệm.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  async function openDetail(merchId) {
    setLoadingDetail(true)
    try {
      const item = await merchandiseApi.getById(merchId)
      setDetailItem(item)
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết vật phẩm.')
    } finally {
      setLoadingDetail(false)
    }
  }

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return merchandises.filter((m) => {
      if (selectedEventId !== 'ALL' && m.eventId !== selectedEventId) return false
      if (onlyInStock && (m.stockQuantity ?? 0) <= 0) return false
      if (!q) return true
      return `${m.name || ''} ${m.eventName || ''}`.toLowerCase().includes(q)
    })
  }, [merchandises, selectedEventId, onlyInStock, query])

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="page-header-strip">
          <div className="container">
            <h1 className="page-title">Vật phẩm lưu niệm (Merchandise)</h1>
            <p className="page-subtitle">Sưu tầm áo, lightstick và phụ kiện chính thức — đặt mua kèm vé sự kiện</p>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
          <div className="events-toolbar">
            <div className="events-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm tên vật phẩm hoặc sự kiện..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" className="navbar-search-clear" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="events-toolbar-right">
              <select
                className="form-input"
                style={{ width: 'auto', padding: '9px 14px', borderRadius: 999 }}
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="ALL">Tất cả sự kiện</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>

              <button
                type="button"
                className={`filter-tab ${onlyInStock ? 'active' : ''}`}
                onClick={() => setOnlyInStock((v) => !v)}
              >
                Chỉ xem còn hàng
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-alert error" style={{ marginBottom: 20, justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={loadInitial}>
                <RefreshCw size={13} /> Thử lại
              </button>
            </div>
          )}

          {loading ? (
            <div className="events-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-bar" style={{ height: 320, borderRadius: 14 }} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={56} />
              <h3>Chưa có vật phẩm nào</h3>
              <p>Không tìm thấy vật phẩm lưu niệm phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            <div className="events-grid">
              {filteredItems.map((item) => {
                const inStock = (item.stockQuantity ?? 0) > 0
                return (
                  <div key={item.id} className="merch-catalog-card">
                    <div className="merch-catalog-img">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} loading="lazy" />
                      ) : (
                        <div className="event-card-image-placeholder">
                          <ShoppingBag size={42} />
                        </div>
                      )}
                      <div className="event-card-status">
                        <span className={`badge ${inStock ? 'badge-on-sale' : 'badge-sold-out'}`}>
                          {inStock ? `Còn ${item.stockQuantity}` : 'Hết hàng'}
                        </span>
                      </div>
                    </div>

                    <div className="merch-catalog-body">
                      <div className="merch-catalog-event">
                        <Calendar size={12} />
                        <span className="truncate">{item.eventName}</span>
                      </div>
                      <h3 className="event-card-name">{item.name}</h3>

                      <div className="event-card-price" style={{ marginTop: 'auto' }}>
                        <span className="amount">{formatCurrency(item.price)}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            onClick={() => openDetail(item.id)}
                            disabled={loadingDetail}
                          >
                            <Eye size={13} /> Chi tiết
                          </button>
                          <Link
                            to={`/events/${item.eventId}`}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                          >
                            Đặt kèm vé
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {detailItem && (
        <div className="modal-backdrop" onClick={() => setDetailItem(null)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết vật phẩm</h2>
              <button type="button" className="icon-remove-btn" onClick={() => setDetailItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="merch-detail-preview">
              {detailItem.imageUrl ? (
                <img src={detailItem.imageUrl} alt={detailItem.name} />
              ) : (
                <ShoppingBag size={52} />
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <span className="badge badge-upcoming" style={{ marginBottom: 8 }}>
                {detailItem.eventName}
              </span>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{detailItem.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                  {formatCurrency(detailItem.price)}
                </span>
                <span className={`badge ${(detailItem.stockQuantity ?? 0) > 0 ? 'badge-on-sale' : 'badge-sold-out'}`}>
                  {(detailItem.stockQuantity ?? 0) > 0 ? `Còn ${detailItem.stockQuantity} sản phẩm` : 'Hết hàng'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
                Vật phẩm lưu niệm chính thức được bán kèm khi bạn đặt vé tham dự sự kiện này.
              </p>

              <Link
                to={`/events/${detailItem.eventId}`}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Đến trang sự kiện để đặt mua
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
