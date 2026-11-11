/**
 * HeroSlider - Banner slideshow trang chủ
 * Ưu tiên hiển thị các sự kiện thực tế từ API; dùng fallback khi chưa có dữ liệu.
 */
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { EVENT_STATUS_META, formatDateRange } from '../utils/format'

const FALLBACK_SLIDES = [
  {
    id: 'fallback-1',
    title: 'MEGATICKET LIVE MUSIC CONCERT 2026',
    location: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    date: 'Đang mở bán vé chính thức',
    status: 'Sắp diễn ra',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 45%, #e5133a 100%)',
    emoji: '🎤',
    linkTo: '/events',
  },
  {
    id: 'fallback-2',
    title: 'ĐÊM NHẠC TRỊNH CÔNG SƠN - MÙA THU HÀ NỘI',
    location: 'Nhà hát Lớn Hà Nội',
    date: '05 Tháng 1, 2027',
    status: 'Đang mở bán',
    gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 45%, #2c5364 100%)',
    emoji: '🎵',
    linkTo: '/events',
  },
  {
    id: 'fallback-3',
    title: 'VIETNAM FOOTBALL CHAMPIONSHIP 2026',
    location: 'Sân vận động Thống Nhất, TP.HCM',
    date: '15 Tháng 1, 2027',
    status: 'Đang diễn ra',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 45%, #0f3460 100%)',
    emoji: '⚽',
    linkTo: '/events',
  },
]

const SLIDE_GRADIENTS = [
  'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 45%, #e5133a 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 45%, #2c5364 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 45%, #0f3460 100%)',
]

export default function HeroSlider({ events = [] }) {
  const [current, setCurrent] = useState(0)

  const slides = useMemo(() => {
    const active = events.filter((e) => e.status !== 'ENDED').slice(0, 4)
    if (active.length === 0) return FALLBACK_SLIDES

    return active.map((ev, idx) => ({
      id: ev.id,
      title: ev.name,
      location: ev.location,
      date: formatDateRange(ev.startTime, ev.endTime),
      status: EVENT_STATUS_META[ev.status]?.label || 'Đang mở bán',
      bannerUrl: ev.bannerUrl,
      gradient: SLIDE_GRADIENTS[idx % SLIDE_GRADIENTS.length],
      emoji: '🎫',
      linkTo: `/events/${ev.id}`,
    }))
  }, [events])

  const safeCurrent = current < slides.length ? current : 0

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [slides.length])

  function prev() {
    setCurrent((c) => (c - 1 + slides.length) % slides.length)
  }

  function next() {
    setCurrent((c) => (c + 1) % slides.length)
  }

  const slide = slides[safeCurrent] || slides[0]

  return (
    <div className="hero-section">
      {slides.map((s, i) => (
        <div key={s.id} className={`hero-slide ${i === safeCurrent ? 'active' : ''}`}>
          {s.bannerUrl ? (
            <img src={s.bannerUrl} alt={s.title} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: s.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '110px',
              }}
            >
              {s.emoji}
            </div>
          )}
        </div>
      ))}

      <div className="hero-overlay">
        <div className="container" style={{ width: '100%' }}>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              {slide.status}
            </div>
            <h1 className="hero-title">{slide.title}</h1>
            <div className="hero-meta">
              <div className="hero-meta-item">
                <MapPin size={15} />
                <span>{slide.location}</span>
              </div>
              <div className="hero-meta-item">
                <Calendar size={15} />
                <span>{slide.date}</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link to={slide.linkTo} className="btn btn-primary">
                Đặt vé ngay
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/events"
                className="btn btn-outline"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
              >
                Khám phá tất cả
              </Link>
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" className="hero-arrow hero-arrow-prev" onClick={prev} aria-label="Slide trước">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className="hero-arrow hero-arrow-next" onClick={next} aria-label="Slide tiếp">
            <ChevronRight size={20} />
          </button>
          <div className="hero-dots">
            {slides.map((s, i) => (
              <button
                type="button"
                key={s.id}
                className={`hero-dot ${i === safeCurrent ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
