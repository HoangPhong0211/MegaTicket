/**
 * EventCard - Thẻ hiển thị một sự kiện trong lưới (Click để xem chi tiết & đặt vé)
 * Khớp với EventResponse DTO từ BE:
 *   { id, name, description, startTime, endTime, location, bannerUrl, status, seatZones, merchandises }
 * status: UPCOMING | ONGOING | ENDED
 */
import { Link } from 'react-router-dom'
import { MapPin, Ticket, Clock } from 'lucide-react'
import { EVENT_STATUS_META, formatCurrency, getEventTimePhaseInfo } from '../utils/format'

const GRADIENTS = [
  'linear-gradient(135deg, #1a0a2e, #2d1b69)',
  'linear-gradient(135deg, #0f2027, #2c5364)',
  'linear-gradient(135deg, #1a1a2e, #0f3460)',
  'linear-gradient(135deg, #200122, #6f0000)',
  'linear-gradient(135deg, #093028, #237a57)',
]

function formatDateBadge(isoString) {
  if (!isoString) return { day: '--', month: '---' }
  const d = new Date(isoString)
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('vi-VN', { month: 'short' }).toUpperCase(),
  }
}

function getMinPriceText(zones) {
  if (!zones || zones.length === 0) return 'Đang cập nhật'
  const minPrice = Math.min(...zones.map((z) => Number(z.price) || 0))
  if (minPrice <= 0) return 'Miễn phí'
  return `Từ ${formatCurrency(minPrice)}`
}

export default function EventCard({ event, index = 0 }) {
  const { id, name, location, startTime, bannerUrl, status, seatZones } = event
  const statusInfo = EVENT_STATUS_META[status] || EVENT_STATUS_META.UPCOMING
  const { day, month } = formatDateBadge(startTime)
  const gradient = GRADIENTS[index % GRADIENTS.length]

  const totalAvailable = Array.isArray(seatZones)
    ? seatZones.reduce((sum, z) => sum + (z.availableSeats ?? 0), 0)
    : null
  const phaseInfo = getEventTimePhaseInfo(event)

  return (
    <Link to={`/events/${id}`} className="event-card">
      {/* Ảnh / Banner */}
      <div className="event-card-image">
        {bannerUrl ? (
          <img src={bannerUrl} alt={name} loading="lazy" />
        ) : (
          <div className="event-card-image-placeholder" style={{ background: gradient }}>
            🎫
          </div>
        )}

        {/* Badge trạng thái */}
        <div className="event-card-status">
          <span className={`badge ${statusInfo.cls}`}>{statusInfo.shortLabel}</span>
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
          <MapPin size={12} />
          <span className="truncate">{location}</span>
        </div>

        {totalAvailable !== null && (
          <div className="event-card-seats">
            <Ticket size={12} />
            <span>
              {totalAvailable > 0 ? `Còn ${totalAvailable} vé` : 'Tạm hết vé'}
            </span>
          </div>
        )}

        {phaseInfo.timeHint && (
          <div className="event-card-seats" style={{ color: status === 'ONGOING' ? 'var(--success)' : 'var(--text-muted)' }}>
            <Clock size={12} />
            <span className="truncate">{phaseInfo.timeHint}</span>
          </div>
        )}

        <div className="event-card-price">
          <span className="label">Giá vé</span>
          <span className="amount">{getMinPriceText(seatZones)}</span>
        </div>
      </div>
    </Link>
  )
}
