/**
 * CountdownTimer - Đếm ngược thời hạn giữ chỗ / thanh toán đơn hàng (10 phút)
 */
import { useState, useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'
import { getRemainingSeconds, formatCountdown } from '../utils/format'

export default function CountdownTimer({ expiresAt, onExpire, compact = false }) {
  const [secondsLeft, setSecondsLeft] = useState(() => getRemainingSeconds(expiresAt))
  const expiredNotified = useRef(false)

  useEffect(() => {
    expiredNotified.current = false
    setSecondsLeft(getRemainingSeconds(expiresAt))

    const timer = setInterval(() => {
      const remaining = getRemainingSeconds(expiresAt)
      setSecondsLeft(remaining)
      if (remaining === 0 && !expiredNotified.current) {
        expiredNotified.current = true
        clearInterval(timer)
        if (onExpire) onExpire()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, onExpire])

  const isExpired = secondsLeft === 0
  const isUrgent = secondsLeft > 0 && secondsLeft <= 120

  if (compact) {
    return (
      <span className={`countdown-chip ${isExpired ? 'expired' : isUrgent ? 'urgent' : ''}`}>
        <Clock size={12} />
        {isExpired ? 'Hết hạn' : formatCountdown(secondsLeft)}
      </span>
    )
  }

  return (
    <div className={`countdown-box ${isExpired ? 'expired' : isUrgent ? 'urgent' : ''}`}>
      <div className="countdown-box-left">
        <Clock size={18} />
        <div>
          <div className="countdown-label">
            {isExpired ? 'Đã hết thời gian giữ chỗ' : 'Thời gian giữ chỗ còn lại'}
          </div>
          <div className="countdown-sub">
            {isExpired
              ? 'Đơn hàng quá hạn sẽ tự động hủy và giải phóng ghế'
              : 'Vui lòng hoàn tất thanh toán VietQR trước khi hết giờ'}
          </div>
        </div>
      </div>
      <div className="countdown-digits">
        {isExpired ? '00:00' : formatCountdown(secondsLeft)}
      </div>
    </div>
  )
}
