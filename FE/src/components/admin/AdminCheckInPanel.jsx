/**
 * AdminCheckInPanel - Cổng soát vé & Check-in QR cho Admin
 * Kết nối BE:
 *   POST /api/admin/tickets/check-in        -> CheckInResponse
 *   GET  /api/admin/events/{id}/check-in-stats -> EventCheckInStatsResponse
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Camera,
  CameraOff,
  RefreshCw,
  Ticket,
  User,
  Clock,
  Sparkles,
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { formatDateTime } from '../../utils/format'

export default function AdminCheckInPanel({ events = [], initialEventId = '' }) {
  const [ticketCode, setTicketCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null) // { ok: boolean, data?: CheckInResponse, error?: string, code: string }
  const [scanHistory, setScanHistory] = useState([])

  // Event check-in stats
  const [selectedEventId, setSelectedEventId] = useState(
    () => initialEventId || events[0]?.id || ''
  )
  const [eventStats, setEventStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Camera QR Scanner (BarcodeDetector)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId)
    } else if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id)
    }
  }, [initialEventId, events, selectedEventId])

  const loadStats = useCallback(async (evId) => {
    if (!evId) return
    setLoadingStats(true)
    try {
      const stats = await adminApi.getEventCheckInStats(evId)
      setEventStats(stats)
    } catch {
      setEventStats(null)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      loadStats(selectedEventId)
    }
  }, [selectedEventId, loadStats])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const submitCheckIn = useCallback(async (rawCode) => {
    const code = (rawCode || '').trim()
    if (!code || scanning) return

    setScanning(true)
    try {
      const data = await adminApi.checkInTicket(code)
      const entry = {
        id: Date.now(),
        ok: true,
        code: data.ticketCode,
        data,
        time: new Date().toISOString(),
      }
      setLastResult(entry)
      setScanHistory((prev) => [entry, ...prev].slice(0, 15))
      setTicketCode('')

      if (data.eventId) {
        setSelectedEventId(data.eventId)
        loadStats(data.eventId)
      } else if (selectedEventId) {
        loadStats(selectedEventId)
      }
    } catch (err) {
      const entry = {
        id: Date.now(),
        ok: false,
        code,
        error: err.message || 'Check-in thất bại.',
        time: new Date().toISOString(),
      }
      setLastResult(entry)
      setScanHistory((prev) => [entry, ...prev].slice(0, 15))
    } finally {
      setScanning(false)
      inputRef.current?.focus()
    }
  }, [scanning, selectedEventId, loadStats])

  async function startCamera() {
    setCameraError('')
    if (!('BarcodeDetector' in window)) {
      setCameraError('Trình duyệt hiện tại chưa hỗ trợ quét QR trực tiếp (BarcodeDetector API). Bạn có thể nhập mã vé hoặc dùng đầu đọc QR gắn ngoài.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setCameraActive(true)

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 100)

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      let lastScanned = ''
      let lastScanAt = 0

      const scanLoop = async () => {
        if (!streamRef.current || !videoRef.current) return
        try {
          if (videoRef.current.readyState >= 2) {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              const val = codes[0].rawValue?.trim()
              const now = Date.now()
              if (val && (val !== lastScanned || now - lastScanAt > 3500)) {
                lastScanned = val
                lastScanAt = now
                setTicketCode(val)
                submitCheckIn(val)
              }
            }
          }
        } catch {
          // ignore frame detection glitch
        }
        if (streamRef.current) {
          requestAnimationFrame(scanLoop)
        }
      }
      requestAnimationFrame(scanLoop)
    } catch (err) {
      setCameraError(err.message || 'Không thể mở camera thiết bị.')
      stopCamera()
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault()
    submitCheckIn(ticketCode)
  }

  const pct =
    eventStats && eventStats.totalSoldTickets > 0
      ? Math.round((eventStats.checkedInTickets / eventStats.totalSoldTickets) * 100)
      : 0

  return (
    <div className="detail-layout">
      {/* LEFT: Check-in Scanner + Instant Result + History */}
      <div className="detail-main">
        <section className="panel-card">
          <div className="panel-header-row">
            <div>
              <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <QrCode size={20} style={{ color: 'var(--primary)' }} />
                Quét mã QR / Nhập mã vé Check-in
              </h2>
              <p className="panel-sub">
                Hỗ trợ đầu đọc mã vạch/QR USB (tự Enter), camera trình duyệt hoặc nhập thủ công <code>ticketCode</code>
              </p>
            </div>
            <button
              type="button"
              className={`btn ${cameraActive ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 14px', fontSize: 13 }}
              onClick={cameraActive ? stopCamera : startCamera}
            >
              {cameraActive ? <CameraOff size={15} /> : <Camera size={15} />}
              {cameraActive ? 'Tắt Camera' : 'Bật Camera QR'}
            </button>
          </div>

          {cameraError && (
            <div className="auth-alert error" style={{ marginBottom: 16 }}>
              <XCircle size={16} style={{ flexShrink: 0 }} />
              {cameraError}
            </div>
          )}

          {cameraActive && (
            <div className="camera-scanner-box">
              <video ref={videoRef} muted playsInline className="camera-video" />
              <div className="camera-reticle" />
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="checkin-input-row">
            <input
              ref={inputRef}
              className="form-input checkin-code-input"
              placeholder="Nhập hoặc quét mã vé (vd: TICK-2026-VIP-001 hoặc MT-...)"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!ticketCode.trim() || scanning}
            >
              {scanning ? 'Đang kiểm tra...' : 'Xác nhận Check-in'}
            </button>
          </form>

          {/* Instant Check-in Result */}
          {lastResult && (
            <div className={`checkin-result-card ${lastResult.ok ? 'success' : 'error'}`}>
              <div className="checkin-result-header">
                {lastResult.ok ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                <div>
                  <h3>{lastResult.ok ? lastResult.data.message : 'Check-in không hợp lệ'}</h3>
                  <p>Mã vé: <code>{lastResult.code}</code></p>
                </div>
              </div>

              {lastResult.ok ? (
                <div className="checkin-result-details">
                  <div>
                    <span className="lbl"><Ticket size={13} /> Sự kiện</span>
                    <span className="val">{lastResult.data.eventName}</span>
                  </div>
                  <div>
                    <span className="lbl">Khu vực / Ghế</span>
                    <span className="val">
                      {lastResult.data.zoneName} · {lastResult.data.seatNumber || 'GA'}
                    </span>
                  </div>
                  <div>
                    <span className="lbl"><User size={13} /> Chủ vé</span>
                    <span className="val">
                      {lastResult.data.ownerFullName} ({lastResult.data.ownerEmail})
                    </span>
                  </div>
                  <div>
                    <span className="lbl"><Clock size={13} /> Thời gian Check-in</span>
                    <span className="val">{formatDateTime(lastResult.data.checkedInAt)}</span>
                  </div>
                </div>
              ) : (
                <p className="checkin-error-reason">{lastResult.error}</p>
              )}
            </div>
          )}
        </section>

        {/* Session Scan Log */}
        <section className="panel-card">
          <div className="panel-header-row" style={{ marginBottom: 14 }}>
            <div>
              <h2 className="panel-title">Lịch sử quét trong phiên ({scanHistory.length})</h2>
            </div>
            {scanHistory.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => setScanHistory([])}
              >
                Xóa log
              </button>
            )}
          </div>

          {scanHistory.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Chưa có lượt soát vé nào trong phiên làm việc này.
            </p>
          ) : (
            <div className="checkin-log-list">
              {scanHistory.map((item) => (
                <div key={item.id} className="checkin-log-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${item.ok ? 'badge-on-sale' : 'badge-sold-out'}`}>
                      {item.ok ? 'Hợp lệ' : 'Từ chối'}
                    </span>
                    <code>{item.code}</code>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {item.ok ? `${item.data.ownerFullName} · ${item.data.zoneName}` : item.error}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatDateTime(item.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* RIGHT: Event Check-in Progress Stats */}
      <aside className="detail-sidebar">
        <div className="summary-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 className="summary-title" style={{ margin: 0 }}>Tiến độ Check-in</h3>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '5px 8px' }}
              onClick={() => loadStats(selectedEventId)}
              disabled={loadingStats || !selectedEventId}
              title="Làm mới thống kê"
            >
              <RefreshCw size={14} className={loadingStats ? 'spin' : ''} />
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label htmlFor="checkin-event-select">Chọn sự kiện</label>
            <select
              id="checkin-event-select"
              className="form-input"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          {eventStats ? (
            <>
              <div className="checkin-progress-bar-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tỷ lệ vào cổng</span>
                  <strong style={{ color: 'var(--success)' }}>{pct}%</strong>
                </div>
                <div className="zone-progress-track" style={{ height: 10 }}>
                  <div className="zone-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="checkin-stats-mini-grid">
                <div className="checkin-stat-mini">
                  <span className="lbl">Vé đã bán</span>
                  <span className="val">{eventStats.totalSoldTickets}</span>
                </div>
                <div className="checkin-stat-mini success">
                  <span className="lbl">Đã Check-in</span>
                  <span className="val">{eventStats.checkedInTickets}</span>
                </div>
                <div className="checkin-stat-mini warning">
                  <span className="lbl">Còn lại</span>
                  <span className="val">{eventStats.remainingTickets}</span>
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Chọn sự kiện để theo dõi số lượng khách đã check-in tại cổng.
            </p>
          )}

          <div className="summary-hold-note" style={{ marginTop: 18 }}>
            <Sparkles size={15} style={{ flexShrink: 0, color: 'var(--primary)' }} />
            <span>
              Mỗi mã vé được khóa bằng Pessimistic Lock nên không thể check-in trùng tại 2 cổng cùng lúc.
            </span>
          </div>
        </div>
      </aside>
    </div>
  )
}
