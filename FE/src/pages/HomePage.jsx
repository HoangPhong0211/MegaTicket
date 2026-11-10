/**
 * HomePage - Trang chủ MegaTicket
 * Layout: Navbar → HeroSlider → CategoryBar → EventGrid → Footer
 * Data: Fetch từ GET /api/events (EventController)
 */
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import HeroSlider from '../components/HeroSlider'
import CategoryBar from '../components/CategoryBar'
import EventCard from '../components/EventCard'
import Footer from '../components/Footer'

const API_BASE = 'http://localhost:8080'

// Dữ liệu mẫu khi chưa có BE chạy
const MOCK_EVENTS = [
  { id: '1', name: 'BLACKPINK World Tour 2026', location: 'Sân vận động Mỹ Đình, Hà Nội', startTime: '2026-12-20T19:00:00Z', status: 'ON_SALE', bannerUrl: null, seatZones: [{ price: 1500000 }, { price: 3000000 }] },
  { id: '2', name: 'Đêm nhạc Trịnh Công Sơn - Mùa Thu Hà Nội', location: 'Nhà hát Lớn Hà Nội', startTime: '2027-01-05T20:00:00Z', status: 'UPCOMING', bannerUrl: null, seatZones: [{ price: 500000 }] },
  { id: '3', name: 'Vietnam Football Championship 2026', location: 'Sân vận động Thống Nhất, TP.HCM', startTime: '2027-01-15T18:00:00Z', status: 'ON_SALE', bannerUrl: null, seatZones: [{ price: 200000 }, { price: 500000 }] },
  { id: '4', name: 'BTS FAN MEETING - LOVE YOURSELF TOUR', location: 'GEM Center, TP.HCM', startTime: '2027-02-10T19:30:00Z', status: 'UPCOMING', bannerUrl: null, seatZones: [{ price: 2000000 }] },
  { id: '5', name: 'Lễ hội Ánh sáng Đà Nẵng 2027', location: 'Bãi biển Mỹ Khê, Đà Nẵng', startTime: '2027-01-28T18:00:00Z', status: 'ON_SALE', bannerUrl: null, seatZones: [] },
  { id: '6', name: 'Triển lãm Nghệ thuật Đương đại Hà Nội', location: 'Bảo tàng Mỹ thuật Việt Nam', startTime: '2027-02-01T09:00:00Z', status: 'UPCOMING', bannerUrl: null, seatZones: [{ price: 50000 }] },
  { id: '7', name: 'SOOBIN - Hoàng tử nhạc Pop Tour', location: 'Trung tâm Hội nghị Quốc gia', startTime: '2027-02-20T20:00:00Z', status: 'UPCOMING', bannerUrl: null, seatZones: [{ price: 800000 }] },
  { id: '8', name: 'Formula E - Hà Nội Street Circuit 2027', location: 'Phố Hoàng Diệu, Hà Nội', startTime: '2027-03-05T14:00:00Z', status: 'ON_SALE', bannerUrl: null, seatZones: [{ price: 1000000 }, { price: 2500000 }] },
]

export default function HomePage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`${API_BASE}/api/events`)
        if (!res.ok) throw new Error('API không phản hồi')
        const data = await res.json()
        setEvents(data)
      } catch {
        // Dùng mock data khi BE chưa chạy
        setEvents(MOCK_EVENTS)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Phân nhóm events theo trạng thái
  const onSaleEvents   = events.filter(e => e.status === 'ON_SALE')
  const upcomingEvents = events.filter(e => e.status === 'UPCOMING')

  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Hero Banner */}
        <HeroSlider />

        {/* Category Filter */}
        <CategoryBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

        {/* Events Sections */}
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>

          {error && (
            <div className="auth-alert error" style={{ marginBottom: 24 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Đang mở bán */}
          {loading ? (
            <EventGridSkeleton />
          ) : (
            <>
              {onSaleEvents.length > 0 && (
                <section className="events-section" style={{ paddingTop: 0 }}>
                  <div className="section-header">
                    <h2 className="section-title">Đang mở bán</h2>
                    <button className="btn btn-ghost" style={{ fontSize: '13px' }}>
                      Xem tất cả
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  </div>
                  <div className="events-grid">
                    {onSaleEvents.map((event, i) => (
                      <EventCard key={event.id} event={event} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Sắp diễn ra */}
              {upcomingEvents.length > 0 && (
                <section className="events-section">
                  <div className="section-header">
                    <h2 className="section-title">Sắp diễn ra</h2>
                    <button className="btn btn-ghost" style={{ fontSize: '13px' }}>
                      Xem tất cả
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  </div>
                  <div className="events-grid">
                    {upcomingEvents.map((event, i) => (
                      <EventCard key={event.id} event={event} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {events.length === 0 && (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 12V22H4V12"/>
                    <path d="M22 7H2v5h20V7z"/>
                    <path d="M12 22V7"/>
                  </svg>
                  <h3>Chưa có sự kiện nào</h3>
                  <p>Các sự kiện sắp được cập nhật. Vui lòng quay lại sau!</p>
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

// Skeleton loading khi chờ API
function EventGridSkeleton() {
  return (
    <div style={{ paddingTop: '40px' }}>
      <div style={{
        height: 28, width: 180, background: 'var(--bg-card)',
        borderRadius: 6, marginBottom: 24,
        animation: 'pulse 1.5s ease-in-out infinite alternate'
      }} />
      <div className="events-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="event-card" style={{ animation: 'pulse 1.5s ease-in-out infinite alternate' }}>
      <div style={{ aspectRatio: '3/4', background: 'var(--bg-card-hover)' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 16, background: 'var(--bg-card-hover)', borderRadius: 4 }} />
        <div style={{ height: 16, background: 'var(--bg-card-hover)', borderRadius: 4, width: '70%' }} />
        <div style={{ height: 12, background: 'var(--bg-card-hover)', borderRadius: 4, width: '50%', marginTop: 4 }} />
      </div>
    </div>
  )
}
