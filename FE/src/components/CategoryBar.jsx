/**
 * CategoryBar - Thanh lọc danh mục / trạng thái sự kiện
 */
const CATEGORIES = [
  { id: 'all',      label: 'Tất cả',         emoji: '🎫' },
  { id: 'ONGOING',  label: 'Đang diễn ra',   emoji: '🟢' },
  { id: 'UPCOMING', label: 'Sắp diễn ra',    emoji: '🟡' },
  { id: 'music',    label: 'Âm nhạc',        emoji: '🎤' },
  { id: 'sport',    label: 'Thể thao',       emoji: '⚽' },
  { id: 'theater',  label: 'Sân khấu',       emoji: '🎭' },
  { id: 'festival', label: 'Lễ hội',         emoji: '🎪' },
]

export default function CategoryBar({ activeCategory, onCategoryChange }) {
  return (
    <div className="category-bar">
      <div className="category-list" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
