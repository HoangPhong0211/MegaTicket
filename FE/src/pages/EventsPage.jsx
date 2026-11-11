/**
 * EventsPage - Trang danh sách tất cả sự kiện, tìm kiếm, lọc trạng thái & sắp xếp
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Ticket, RefreshCw, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import EventCard from '../components/EventCard'
import { eventApi } from '../services/api'

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'UPCOMING', label: 'Sắp diễn ra' },
  { id: 'ONGOING', label: 'Đang diễn ra' },
  { id: 'ENDED', label: 'Đã kết thúc' },
]

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'ALL')
  const [sortBy, setSortBy] = useState('date_asc')

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
    const st = searchParams.get('status')
    if (st && STATUS_TABS.some((t) => t.id === st)) {
      setStatusFilter(st)
    }
  }, [searchParams])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await eventApi.getAll()
      setEvents(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sự kiện từ máy chủ.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  function getMinPrice(ev) {
    if (!ev.seatZones || ev.seatZones.length === 0) return Infinity
    return Math.min(...ev.seatZones.map((z) => Number(z.price) || 0))
  }

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = events.filter((ev) => {
      if (statusFilter !== 'ALL' && ev.status !== statusFilter) return false
      if (!q) return true
      const haystack = `${ev.name || ''} ${ev.location || ''} ${ev.description || ''}`.toLowerCase()
      return haystack.includes(q)
    })

    list = [...list].sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      }
      if (sortBy === 'price_asc') {
        return getMinPrice(a) - getMinPrice(b)
      }
      if (sortBy === 'price_desc') {
        return getMinPrice(b) - getMinPrice(a)
      }
      return 0
    })

    return list
  }, [events, query, statusFilter, sortBy])

  function handleQueryChange(val) {
    setQuery(val)
    const next = new URLSearchParams(searchParams)
    if (val.trim()) next.set('q', val.trim())
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  function handleStatusChange(st) {
    setStatusFilter(st)
    const next = new URLSearchParams(searchParams)
    if (st !== 'ALL') next.set('status', st)
    else next.delete('status')
    setSearchParams(next, { replace: true })
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <div className="page-header-strip">
          <div className="container">
            <h1 className="page-title">Khám phá sự kiện</h1>
            <p className="page-subtitle">Tìm kiếm concert, đại nhạc hội, thể thao và sân khấu nghệ thuật yêu thích</p>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
          {/* Toolbar: Search + Filter Tabs + Sort */}
          <div className="events-toolbar">
            <div className="events-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm theo tên sự kiện, nghệ sĩ, địa điểm..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
              />
              {query && (
                <button type="button" className="navbar-search-clear" onClick={() => handleQueryChange('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="events-toolbar-right">
              <div className="filter-tabs">
                {STATUS_TABS.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    className={`filter-tab ${statusFilter === tab.id ? 'active' : ''}`}
                    onClick={() => handleStatusChange(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="sort-select-wrap">
                <SlidersHorizontal size={14} />
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date_asc">Diễn ra sớm nhất</option>
                  <option value="price_asc">Giá thấp → cao</option>
                  <option value="price_desc">Giá cao → thấp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="auth-alert error" style={{ marginBottom: 24, justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button type="button" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 12 }} onClick={loadEvents}>
                <RefreshCw size={13} />
                Thử lại
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="events-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="event-card skeleton-pulse">
                  <div style={{ aspectRatio: '3/4', background: 'var(--bg-card-hover)' }} />
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ height: 16, background: 'var(--bg-card-hover)', borderRadius: 4 }} />
                    <div style={{ height: 12, background: 'var(--bg-card-hover)', borderRadius: 4, width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Hiển thị <strong style={{ color: 'var(--text)' }}>{filteredEvents.length}</strong> sự kiện
              </div>
              <div className="events-grid">
                {filteredEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Ticket size={56} />
              <h3>Không có sự kiện nào</h3>
              <p>Không tìm thấy sự kiện khớp với bộ lọc hiện tại.</p>
              {(query || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    handleQueryChange('')
                    handleStatusChange('ALL')
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
