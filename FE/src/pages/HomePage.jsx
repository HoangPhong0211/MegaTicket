/**
 * HomePage - Trang chủ MegaTicket
 * Layout: Navbar → HeroSlider → CategoryBar → EventGrid → Footer
 * Data: Fetch từ GET /api/events (EventController)
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RefreshCw, Ticket, WifiOff } from 'lucide-react'
import Navbar from '../components/Navbar'
import HeroSlider from '../components/HeroSlider'
import CategoryBar from '../components/CategoryBar'
import EventCard from '../components/EventCard'
import Footer from '../components/Footer'
import { eventApi } from '../services/api'

// Dữ liệu demo hiển thị khi BE chưa khởi động
const MOCK_EVENTS = [
  {
    id: 'demo-1',
    name: 'MegaTicket Live Music Concert 2026',
    description: 'Đêm nhạc hội hoành tráng quy tụ các nghệ sĩ hàng đầu.',
    location: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    startTime: '2026-12-20T19:00:00+07:00',
    endTime: '2026-12-20T23:00:00+07:00',
    status: 'ONGOING',
    bannerUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=900',
    seatZones: [
      { id: 'z1', name: 'VIP A', price: 2000000, totalSeats: 50, availableSeats: 18 },
      { id: 'z2', name: 'GA B (Đứng tự do)', price: 800000, totalSeats: 200, availableSeats: 95 },
    ],
  },
  {
    id: 'demo-2',
    name: 'Đêm nhạc Trịnh Công Sơn - Mùa Thu Hà Nội',
    description: 'Không gian âm nhạc sâu lắng giữa lòng thủ đô.',
    location: 'Nhà hát Lớn Hà Nội',
    startTime: '2027-01-05T20:00:00+07:00',
    endTime: '2027-01-05T22:30:00+07:00',
    status: 'UPCOMING',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900',
    seatZones: [{ id: 'z3', name: 'Standard', price: 500000, totalSeats: 100, availableSeats: 42 }],
  },
  {
    id: 'demo-3',
    name: 'Vietnam Football Championship 2026',
    description: 'Trận cầu tâm điểm mùa giải bóng đá quốc gia.',
    location: 'Sân vận động Thống Nhất, TP.HCM',
    startTime: '2027-01-15T18:00:00+07:00',
    endTime: '2027-01-15T20:30:00+07:00',
    status: 'ONGOING',
    bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900',
    seatZones: [
      { id: 'z4', name: 'Khán đài A', price: 500000, totalSeats: 100, availableSeats: 30 },
      { id: 'z5', name: 'Khán đài B', price: 200000, totalSeats: 300, availableSeats: 150 },
    ],
  },
  {
    id: 'demo-4',
    name: 'Lễ hội Ánh sáng & Sân khấu Đà Nẵng 2027',
    description: 'Trình diễn ánh sáng nghệ thuật bên bờ biển Mỹ Khê.',
    location: 'Bãi biển Mỹ Khê, Đà Nẵng',
    startTime: '2027-01-28T18:00:00+07:00',
    endTime: '2027-01-28T23:00:00+07:00',
    status: 'UPCOMING',
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900',
    seatZones: [{ id: 'z6', name: 'GA Khu A', price: 350000, totalSeats: 500, availableSeats: 320 }],
  },
]

const CATEGORY_KEYWORDS = {
  music: ['nhạc', 'music', 'concert', 'live', 'tour', 'ca sĩ', 'pop', 'symphony'],
  sport: ['bóng', 'football', 'sport', 'thể thao', 'chạy', 'marathon', 'race', 'championship'],
  theater: ['sân khấu', 'kịch', 'nhà hát', 'theater', 'nghệ thuật', 'vở'],
  festival: ['lễ hội', 'festival', 'ánh sáng', 'carnival'],
}

export default function HomePage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await eventApi.getAll()
      setEvents(Array.isArray(data) ? data : [])
      setIsDemoMode(false)
    } catch {
      if (!silent) {
        setEvents(MOCK_EVENTS)
        setIsDemoMode(true)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    // Đồng bộ định kỳ mỗi 60s khớp với @Scheduled(fixedDelay = 60_000) trên BE
    const timer = setInterval(() => fetchEvents(true), 60_000)
    return () => clearInterval(timer)
  }, [fetchEvents])

  const filteredEvents = useMemo(() => {
    if (activeCategory === 'all') return events
    if (activeCategory === 'ONGOING' || activeCategory === 'UPCOMING') {
      return events.filter((e) => e.status === activeCategory)
    }
    const keywords = CATEGORY_KEYWORDS[activeCategory] || []
    return events.filter((e) => {
      const text = `${e.name || ''} ${e.description || ''}`.toLowerCase()
      return keywords.some((kw) => text.includes(kw))
    })
  }, [events, activeCategory])

  // Tách nhóm hiển thị theo đúng EventStatus enum của BE: ONGOING, UPCOMING, ENDED
  const ongoingEvents  = filteredEvents.filter((e) => e.status === 'ONGOING')
  const upcomingEvents = filteredEvents.filter((e) => e.status === 'UPCOMING')
  const endedEvents    = filteredEvents.filter((e) => e.status === 'ENDED')

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Hero Banner */}
        <HeroSlider events={!isDemoMode ? events : []} />

        {/* Category Filter */}
        <CategoryBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

        {/* Events Sections */}
        <div className="container" style={{ paddingTop: '36px', paddingBottom: '64px' }}>
          {isDemoMode && (
            <div className="demo-banner" style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WifiOff size={18} style={{ flexShrink: 0 }} />
                <span>
                  Không kết nối được tới máy chủ Backend (<code>localhost:8080</code>). Đang hiển thị dữ liệu demo giao diện.
                </span>
              </div>
              <button type="button" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 12 }} onClick={fetchEvents}>
                <RefreshCw size={13} />
                Thử lại
              </button>
            </div>
          )}

          {loading ? (
            <EventGridSkeleton />
          ) : (
            <>
              {/* Sự kiện đang diễn ra */}
              {ongoingEvents.length > 0 && (
                <section className="events-section" style={{ paddingTop: 0 }}>
                  <div className="section-header">
                    <h2 className="section-title">Đang diễn ra</h2>
                    <Link to="/events?status=ONGOING" className="btn btn-ghost" style={{ fontSize: '13px' }}>
                      Xem tất cả
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="events-grid">
                    {ongoingEvents.map((event, i) => (
                      <EventCard key={event.id} event={event} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Sự kiện sắp diễn ra & đang mở bán */}
              {upcomingEvents.length > 0 && (
                <section className="events-section" style={ongoingEvents.length === 0 ? { paddingTop: 0 } : undefined}>
                  <div className="section-header">
                    <h2 className="section-title">Sắp diễn ra · Đang mở bán</h2>
                    <Link to="/events?status=UPCOMING" className="btn btn-ghost" style={{ fontSize: '13px' }}>
                      Xem tất cả
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="events-grid">
                    {upcomingEvents.map((event, i) => (
                      <EventCard key={event.id} event={event} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Sự kiện đã kết thúc */}
              {endedEvents.length > 0 && (
                <section className="events-section">
                  <div className="section-header">
                    <h2 className="section-title">Đã kết thúc</h2>
                  </div>
                  <div className="events-grid">
                    {endedEvents.map((event, i) => (
                      <EventCard key={event.id} event={event} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {filteredEvents.length === 0 && (
                <div className="empty-state">
                  <Ticket size={56} />
                  <h3>Không tìm thấy sự kiện phù hợp</h3>
                  <p>Thử chọn danh mục khác hoặc xem toàn bộ danh sách sự kiện.</p>
                  {activeCategory !== 'all' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: 8 }}
                      onClick={() => setActiveCategory('all')}
                    >
                      Xem tất cả sự kiện
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function EventGridSkeleton() {
  return (
    <div style={{ paddingTop: '12px' }}>
      <div className="skeleton-bar" style={{ height: 28, width: 220, marginBottom: 24 }} />
      <div className="events-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="event-card skeleton-pulse">
            <div style={{ aspectRatio: '3/4', background: 'var(--bg-card-hover)' }} />
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 16, background: 'var(--bg-card-hover)', borderRadius: 4 }} />
              <div style={{ height: 16, background: 'var(--bg-card-hover)', borderRadius: 4, width: '70%' }} />
              <div style={{ height: 12, background: 'var(--bg-card-hover)', borderRadius: 4, width: '50%', marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
