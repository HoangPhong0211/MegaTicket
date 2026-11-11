/**
 * Tiện ích format tiền tệ, ngày giờ, trạng thái sự kiện & đơn hàng
 */

export function formatCurrency(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '0 ₫'
  return `${Number(amount).toLocaleString('vi-VN')} ₫`
}

export function formatDateTime(isoString) {
  if (!isoString) return 'Chưa cập nhật'
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return 'Chưa cập nhật'
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateRange(startIso, endIso) {
  if (!startIso) return 'Chưa cập nhật'
  const start = new Date(startIso)
  const end = endIso ? new Date(endIso) : null
  if (Number.isNaN(start.getTime())) return 'Chưa cập nhật'

  const timeOpts = { hour: '2-digit', minute: '2-digit' }
  const dateOpts = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }

  const startDate = start.toLocaleDateString('vi-VN', dateOpts)
  const startTime = start.toLocaleTimeString('vi-VN', timeOpts)

  if (!end || Number.isNaN(end.getTime())) {
    return `${startTime} · ${startDate}`
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  const endTime = end.toLocaleTimeString('vi-VN', timeOpts)
  if (sameDay) {
    return `${startTime} - ${endTime} · ${startDate}`
  }

  const endDate = end.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${startTime} ${start.toLocaleDateString('vi-VN')} → ${endTime} ${endDate}`
}

export function getShortId(uuid) {
  if (!uuid) return '---'
  return uuid.toString().replace(/-/g, '').slice(0, 8).toUpperCase()
}

export function getRemainingSeconds(expiresAt) {
  if (!expiresAt) return 0
  const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  return Math.max(0, diff)
}

export function formatCountdown(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const EVENT_STATUS_META = {
  ONGOING: {
    cls: 'badge-on-sale',
    label: 'Đang diễn ra',
    shortLabel: 'Đang diễn ra',
  },
  UPCOMING: {
    cls: 'badge-upcoming',
    label: 'Đang mở bán · Sắp diễn ra',
    shortLabel: 'Sắp diễn ra',
  },
  ENDED: {
    cls: 'badge-sold-out',
    label: 'Đã kết thúc',
    shortLabel: 'Đã kết thúc',
  },
}

export const ORDER_STATUS_META = {
  PENDING: {
    cls: 'badge-upcoming',
    label: 'Chờ thanh toán',
  },
  PAID: {
    cls: 'badge-on-sale',
    label: 'Đã thanh toán',
  },
  CANCELLED: {
    cls: 'badge-sold-out',
    label: 'Đã hủy',
  },
}
