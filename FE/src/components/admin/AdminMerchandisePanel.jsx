/**
 * AdminMerchandisePanel - Quản lý Vật phẩm lưu niệm (CRUD Merchandise) cho Admin
 * Kết nối BE:
 *   GET    /api/events/{eventId}/merchandises
 *   POST   /api/admin/events/{eventId}/merchandises
 *   PUT    /api/admin/merchandises/{id}
 *   DELETE /api/admin/merchandises/{id}
 */
import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { adminApi, merchandiseApi } from '../../services/api'
import { formatCurrency } from '../../utils/format'

export default function AdminMerchandisePanel({ events = [], onToast }) {
  const [filterEventId, setFilterEventId] = useState('ALL')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modal, setModal] = useState(null) // { mode: 'create' | 'edit', item?: ..., eventId?: ... }
  const [deleteId, setDeleteId] = useState(null)

  const loadMerchandises = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (filterEventId !== 'ALL') {
        const list = await merchandiseApi.getByEvent(filterEventId)
        setItems(Array.isArray(list) ? list : [])
      } else {
        const nested = await Promise.all(
          events.map((ev) => merchandiseApi.getByEvent(ev.id).catch(() => []))
        )
        setItems(nested.flat())
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách vật phẩm.')
    } finally {
      setLoading(false)
    }
  }, [events, filterEventId])

  useEffect(() => {
    if (events.length > 0) {
      loadMerchandises()
    } else {
      setItems([])
      setLoading(false)
    }
  }, [events.length, loadMerchandises])

  async function handleDelete(id) {
    setError('')
    try {
      await adminApi.deleteMerchandise(id)
      setDeleteId(null)
      onToast('Đã xóa vật phẩm thành công.')
      loadMerchandises()
    } catch (err) {
      setDeleteId(null)
      setError(err.message || 'Không thể xóa vật phẩm.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="events-toolbar" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: 260, padding: '9px 14px', borderRadius: 999 }}
            value={filterEventId}
            onChange={(e) => setFilterEventId(e.target.value)}
          >
            <option value="ALL">Tất cả sự kiện ({events.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>

          <button type="button" className="btn btn-outline" style={{ padding: '8px 14px', fontSize: 13 }} onClick={loadMerchandises}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={events.length === 0}
          onClick={() =>
            setModal({
              mode: 'create',
              eventId: filterEventId !== 'ALL' ? filterEventId : events[0]?.id,
            })
          }
        >
          <Plus size={15} />
          Thêm vật phẩm
        </button>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="skeleton-bar" style={{ height: 220, borderRadius: 14 }} />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} />
          <h3>Chưa có vật phẩm lưu niệm nào</h3>
          <p>Thêm áo phông, lightstick hoặc quà tặng lưu niệm cho sự kiện của bạn.</p>
        </div>
      ) : (
        <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vật phẩm</th>
                  <th>Sự kiện</th>
                  <th>Giá bán</th>
                  <th>Tồn kho</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="merch-image" style={{ width: 44, height: 44 }}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} />
                          ) : (
                            <ShoppingBag size={18} />
                          )}
                        </div>
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.eventName}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(item.price)}</td>
                    <td>
                      <span className={`badge ${item.stockQuantity > 0 ? 'badge-on-sale' : 'badge-sold-out'}`}>
                        {item.stockQuantity > 0 ? `Còn ${item.stockQuantity}` : 'Hết hàng (0)'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => setModal({ mode: 'edit', item })}
                        >
                          <Edit3 size={13} /> Sửa
                        </button>
                        {deleteId === item.id ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '6px 10px', fontSize: 12 }}
                              onClick={() => handleDelete(item.id)}
                            >
                              Xóa thật
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '6px 8px', fontSize: 12 }}
                              onClick={() => setDeleteId(null)}
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '6px 10px', fontSize: 12, color: '#fca5a5' }}
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <MerchandiseFormModal
          mode={modal.mode}
          item={modal.item}
          events={events}
          defaultEventId={modal.eventId}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setModal(null)
            onToast(msg)
            loadMerchandises()
          }}
        />
      )}
    </div>
  )
}

function MerchandiseFormModal({ mode, item, events, defaultEventId, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const [eventId, setEventId] = useState(defaultEventId || item?.eventId || events[0]?.id || '')
  const [name, setName] = useState(item?.name || '')
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '299000')
  const [stockQuantity, setStockQuantity] = useState(
    item?.stockQuantity != null ? String(item.stockQuantity) : '50'
  )
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')

    if (!name.trim()) {
      setErr('Tên vật phẩm không được để trống.')
      return
    }
    if (Number(price) < 0 || Number.isNaN(Number(price))) {
      setErr('Giá vật phẩm không được âm.')
      return
    }
    if (Number(stockQuantity) < 0 || Number.isNaN(Number(stockQuantity))) {
      setErr('Số lượng tồn kho không được âm.')
      return
    }

    const payload = {
      name: name.trim(),
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      imageUrl: imageUrl.trim() || null,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminApi.updateMerchandise(item.id, payload)
        onSaved('Cập nhật vật phẩm thành công.')
      } else {
        await adminApi.createMerchandise(eventId, payload)
        onSaved('Thêm vật phẩm mới thành công.')
      }
    } catch (e2) {
      setErr(e2.message || 'Không thể lưu vật phẩm.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Cập nhật vật phẩm' : 'Thêm vật phẩm mới'}</h2>
          <button type="button" className="icon-remove-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="auth-alert error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isEdit && (
            <div className="form-group">
              <label>Thuộc sự kiện *</label>
              <select
                className="form-input"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Tên vật phẩm *</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Áo phông MegaTicket Limited 2026"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Giá bán (VNĐ) *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tồn kho *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Ảnh sản phẩm URL (tùy chọn)</label>
            <input
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
            {imageUrl.trim() && (
              <div className="merch-image" style={{ width: 80, height: 80, marginTop: 8 }}>
                <img src={imageUrl} alt="Preview" />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm vật phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
