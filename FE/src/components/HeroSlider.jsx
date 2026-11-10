/**
 * HeroSlider - Banner slideshow trang chủ
 * Hiển thị các sự kiện nổi bật với hiệu ứng chuyển tiếp mượt mà.
 * Tự động chuyển slide mỗi 5 giây.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Dữ liệu mẫu cho slider (sẽ thay bằng API sau)
const HERO_SLIDES = [
  {
    id: 1,
    title: 'BLACKPINK WORLD TOUR 2026',
    location: 'Sân vận động Mỹ Đình, Hà Nội',
    date: '20 Tháng 12, 2026',
    status: 'Đang mở bán',
    // Dùng gradient thay cho ảnh thực tế
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 40%, #11998e 100%)',
    emoji: '🎤',
  },
  {
    id: 2,
    title: 'ĐÊM NHẠC TRỊNH CÔNG SƠN - MÙA THU HÀ NỘI',
    location: 'Nhà hát Lớn Hà Nội',
    date: '05 Tháng 1, 2027',
    status: 'Sắp mở bán',
    gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 40%, #2c5364 100%)',
    emoji: '🎵',
  },
  {
    id: 3,
    title: 'VIETNAM FOOTBALL CHAMPIONSHIP 2026',
    location: 'Sân vận động Thống Nhất, TP.HCM',
    date: '15 Tháng 1, 2027',
    status: 'Đang mở bán',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
    emoji: '⚽',
  },
]

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)

  // Tự động chuyển slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  function prev() {
    setCurrent(c => (c - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  function next() {
    setCurrent(c => (c + 1) % HERO_SLIDES.length)
  }

  const slide = HERO_SLIDES[current]

  return (
    <div className="hero-section">
      {/* Slides */}
      {HERO_SLIDES.map((s, i) => (
        <div key={s.id} className={`hero-slide ${i === current ? 'active' : ''}`}>
          <div style={{
            width: '100%',
            height: '100%',
            background: s.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '120px',
          }}>
            {s.emoji}
          </div>
        </div>
      ))}

      {/* Overlay + Content */}
      <div className="hero-overlay">
        <div className="container" style={{ width: '100%' }}>
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <circle cx="5" cy="5" r="5"/>
              </svg>
              {slide.status}
            </div>
            <h1 className="hero-title">{slide.title}</h1>
            <div className="hero-meta">
              <div className="hero-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {slide.location}
              </div>
              <div className="hero-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {slide.date}
              </div>
            </div>
            <div className="hero-actions">
              <Link to="/events" className="btn btn-primary">
                Mua vé ngay
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button className="hero-arrow hero-arrow-prev" onClick={prev} aria-label="Slide trước">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button className="hero-arrow hero-arrow-next" onClick={next} aria-label="Slide tiếp">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {/* Dots */}
      <div className="hero-dots">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
