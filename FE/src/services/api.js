/**
 * Centralized API Client cho MegaTicket
 * Kết nối trực tiếp tới Spring Boot Backend (mặc định http://localhost:8080)
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const TOKEN_KEY = 'megaticket_token'
const USER_KEY = 'megaticket_user'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function parseErrorMessage(data, status) {
  if (!data) {
    if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
    if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.'
    return `Lỗi máy chủ (${status})`
  }
  if (typeof data === 'string') return data
  if (data.message) return data.message
  // Spring MethodArgumentNotValidException trả về map { field: message }
  if (typeof data === 'object') {
    const messages = Object.values(data).filter((v) => typeof v === 'string')
    if (messages.length > 0) return messages.join('. ')
  }
  return `Yêu cầu thất bại (${status})`
}

export async function apiFetch(endpoint, options = {}) {
  const { auth = true, headers: customHeaders = {}, body, ...rest } = options
  const headers = { ...customHeaders }

  if (auth) {
    const token = getStoredToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  let preparedBody = body
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    preparedBody = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers,
    body: preparedBody,
  })

  if (res.status === 204) {
    return null
  }

  const rawText = await res.text()
  let data = null
  if (rawText) {
    try {
      data = JSON.parse(rawText)
    } catch {
      data = rawText
    }
  }

  if (!res.ok) {
    const err = new Error(parseErrorMessage(data, res.status))
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

// ===== Event APIs (Public) =====
export const eventApi = {
  getAll: () => apiFetch('/api/events', { auth: false }),
  getById: (id) => apiFetch(`/api/events/${id}`, { auth: false }),
  getZoneSeats: (eventId, zoneId) =>
    apiFetch(`/api/events/${eventId}/zones/${zoneId}/seats`, { auth: false }),
}

// ===== Merchandise APIs (Public) =====
export const merchandiseApi = {
  getByEvent: (eventId) =>
    apiFetch(`/api/events/${eventId}/merchandises`, { auth: false }),
  getById: (id) =>
    apiFetch(`/api/merchandises/${id}`, { auth: false }),
}

// ===== Ticket / E-Ticket APIs (Authenticated) =====
export const ticketApi = {
  getMyETickets: () => apiFetch('/api/tickets/my'),
  getByOrder: (orderId) => apiFetch(`/api/tickets/orders/${orderId}`),
}

// ===== User Profile APIs (Authenticated) =====
export const userApi = {
  getMyProfile: () => apiFetch('/api/users/me'),
  updateMyProfile: (payload) =>
    apiFetch('/api/users/me', { method: 'PUT', body: payload }),
  changePassword: (payload) =>
    apiFetch('/api/users/me/password', { method: 'PUT', body: payload }),
}

// ===== Order APIs (Authenticated) =====
export const orderApi = {
  create: (payload) =>
    apiFetch('/api/orders', { method: 'POST', body: payload }),
  getMyOrders: () => apiFetch('/api/orders/my'),
  getById: (id) => apiFetch(`/api/orders/${id}`),
  cancel: (id) => apiFetch(`/api/orders/${id}/cancel`, { method: 'DELETE' }),
}

// ===== Payment APIs =====
export const paymentApi = {
  initVietQr: (orderId) =>
    apiFetch(`/api/payments/vietqr/${orderId}`, { method: 'POST' }),
  // Dùng để giả lập callback webhook từ VietQR trong môi trường dev/demo
  simulateWebhook: (payload) =>
    apiFetch('/api/payments/webhook', {
      method: 'POST',
      auth: false,
      body: payload,
    }),
}

// ===== Admin APIs (ROLE_ADMIN) =====
export const adminApi = {
  // Sự kiện & Zone
  createEvent: (payload) =>
    apiFetch('/api/admin/events', { method: 'POST', body: payload }),
  addZone: (eventId, payload) =>
    apiFetch(`/api/admin/events/${eventId}/zones`, { method: 'POST', body: payload }),
  updateEvent: (id, payload) =>
    apiFetch(`/api/admin/events/${id}`, { method: 'PUT', body: payload }),
  deleteEvent: (id) =>
    apiFetch(`/api/admin/events/${id}`, { method: 'DELETE' }),

  // Vật phẩm (Merchandise)
  createMerchandise: (eventId, payload) =>
    apiFetch(`/api/admin/events/${eventId}/merchandises`, { method: 'POST', body: payload }),
  updateMerchandise: (id, payload) =>
    apiFetch(`/api/admin/merchandises/${id}`, { method: 'PUT', body: payload }),
  deleteMerchandise: (id) =>
    apiFetch(`/api/admin/merchandises/${id}`, { method: 'DELETE' }),

  // Soát vé / Check-in QR
  checkInTicket: (ticketCode) =>
    apiFetch('/api/admin/tickets/check-in', {
      method: 'POST',
      body: { ticketCode },
    }),
  getEventCheckInStats: (eventId) =>
    apiFetch(`/api/admin/events/${eventId}/check-in-stats`),

  // Đơn hàng & Doanh thu
  getAllOrders: (status) =>
    apiFetch(status ? `/api/admin/orders?status=${encodeURIComponent(status)}` : '/api/admin/orders'),
  getOrderDetail: (id) => apiFetch(`/api/admin/orders/${id}`),
  getRevenueStats: () => apiFetch('/api/admin/revenue'),
}
