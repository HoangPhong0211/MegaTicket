/**
 * EventCard - Thẻ hiển thị một sự kiện trong lưới
 * Khớp với Event entity từ BE:
 *   { id, name, description, startTime, endTime, location, bannerUrl, status }
 * status: UPCOMING | ON_SALE | ENDED (enum EventStatus)
 */

// Map EventStatus → badge class + label
const STATUS_MAP = {
  ON_SALE:  { cls: 'badge-on-sale',  label: '🟢 Đang mở bán' },
  UPCOMING: { cls: 'badge-upcoming', label: '🟡 Sắp diễn ra' },
  ENDED:    { cls: 'badge-sold-out', label: '⚫ Đã kết thúc' },
}

// Gradient ngẫu nhiên cho card không có ảnh
const GRADIENTS = [
  'linear-gradient(135deg, #1a0a2e, #2d1b69)',
  'linear-gradient(135deg, #0f2027, #2c5364)',
  'linear-gradient(135deg, #1a1a2e, #0f3460)',
  'linear-gradient(135deg, #200122, #6f0000)',
  'linear-gradient(135deg, #093028, #237a57)',
]

function formatDate(isoString) {
  if (!isoString) return { day: '--', month: '---' }
  const d = new Date(isoString)
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('vi-VN', { month: 'short' }).toUpperCase(),
  }
}

function formatPrice(zones) {
  // zones là seatZones - ta sẽ lấy giá thấp nhất (nếu có)
  if (!zones || zones.length === 0) return 'Liên hệ'
  const minPrice = Math.min(...zones.map(z => z.price || 0))
  if (minPrice === 0) return 'Miễn phí'
  return `Từ ${minPrice.toLocaleString('vi-VN')}đ`
}

export default function EventCard({ event, index = 0 }) {
  const { name, location, startTime, bannerUrl, status, seatZones } = event
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.UPCOMING
  const { day, month } = formatDate(startTime)
  const gradient = GRADIENTS[index % GRADIENTS.length]

  return (
    <div className="event-card">
      {/* Ảnh / Banner */}
      <div className="event-card-image">
        {bannerUrl ? (
          <img src={bannerUrl} alt={name} loading="lazy" />
        ) : (
          <div
            className="event-card-image-placeholder"
            style={{ background: gradient }}
          >
            🎫
          </div>
        )}

        {/* Badge trạng thái */}
        <div className="event-card-status">
          <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
        </div>

        {/* Badge ngày */}
        <div className="event-card-date-badge">
          <span className="day">{day}</span>
          <span className="month">{month}</span>
        </div>
      </div>

      {/* Nội dung */}
      <div className="event-card-body">
        <h3 className="event-card-name">{name}</h3>
        <div className="event-card-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{location}</span>
        </div>

        <div className="event-card-price">
          <span className="label">Giá vé</span>
          <span className="amount">{formatPrice(seatZones)}</span>
        </div>
      </div>
    </div>
  )
}
