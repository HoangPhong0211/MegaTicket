/**
 * Footer - Chân trang MegaTicket
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import InfoModal from './InfoModal'

export default function Footer() {
  const [modalContent, setModalContent] = useState(null)

  const infoData = {
    guide: {
      title: 'Hướng dẫn mua vé trực tuyến',
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>Chỉ với 4 bước đơn giản để sở hữu vé tham gia sự kiện yêu thích:</p>
          <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li style={{ marginBottom: 8 }}><strong>Bước 1:</strong> Chọn sự kiện và xem chi tiết các khu vực ghế hoặc vé đứng tự do.</li>
            <li style={{ marginBottom: 8 }}><strong>Bước 2:</strong> Chọn vị trí ghế trực tiếp trên sơ đồ hoặc chọn số lượng vé nhanh.</li>
            <li style={{ marginBottom: 8 }}><strong>Bước 3:</strong> Chọn thêm vật phẩm lưu niệm chính hãng (nếu có) và nhấn Tạo đơn hàng.</li>
            <li><strong>Bước 4:</strong> Quét mã VietQR chuyển khoản chính xác nội dung trong 10 phút. Vé điện tử và QR Check-in sẽ được cấp tức thì!</li>
          </ol>
        </div>
      )
    },
    refund: {
      title: 'Chính sách đổi trả & Hoàn vé',
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            Nhằm đảm bảo quyền lợi của Ban tổ chức và khán giả, chính sách đổi trả vé tuân thủ các quy tắc sau:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li style={{ marginBottom: 8 }}><strong>Đơn chưa thanh toán:</strong> Tự động hủy sau 10 phút và hoàn lại ghế cho khán giả khác mà không phát sinh phí.</li>
            <li style={{ marginBottom: 8 }}><strong>Sự kiện bị hoãn hoặc hủy:</strong> Khán giả sẽ được hoàn 100% giá trị vé theo thông báo từ Ban tổ chức sự kiện.</li>
            <li><strong>Vé đã xuất:</strong> Không áp dụng hủy/đổi vé theo nhu cầu cá nhân. Vui lòng kiểm tra kỹ sơ đồ và thông tin trước khi thanh toán.</li>
          </ul>
        </div>
      )
    },
    faq: {
      title: 'Câu hỏi thường gặp (FAQ)',
      content: (
        <div>
          <div style={{ marginBottom: 14 }}>
            <h5 style={{ color: 'var(--text)', marginBottom: 4 }}>Q: Tôi có cần in vé giấy không?</h5>
            <p>A: Không cần! Bạn chỉ cần mở mã QR vé điện tử trên điện thoại tại trang <em>Vé của tôi</em> để nhân viên cổng soát vé quét QR.</p>
          </div>
          <div style={{ marginBottom: 14 }}>
            <h5 style={{ color: 'var(--text)', marginBottom: 4 }}>Q: Quét QR thanh toán xong bao lâu thì nhận được vé?</h5>
            <p>A: Hệ thống kết nối webhook ngân hàng tự động 24/7. Ngay khi giao dịch hoàn tất, đơn hàng tự động chuyển sang PAID và vé sẵn sàng ngay lập tức.</p>
          </div>
          <div>
            <h5 style={{ color: 'var(--text)', marginBottom: 4 }}>Q: Một tài khoản mua được bao nhiêu vé?</h5>
            <p>A: Tùy theo giới hạn của từng sự kiện, thông thường tối đa 10 vé mỗi đơn hàng để chống hiện tượng đầu cơ vé.</p>
          </div>
        </div>
      )
    },
    contact: {
      title: 'Liên hệ & Hỗ trợ kỹ thuật',
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>Đội ngũ chăm sóc khách hàng MegaTicket luôn sẵn sàng hỗ trợ bạn:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
            <li style={{ marginBottom: 8 }}><strong>Hotline 24/7:</strong> 1900 6868 (Cước gọi 1.000đ/phút)</li>
            <li style={{ marginBottom: 8 }}><strong>Email tiếp nhận sự cố:</strong> support@megaticket.vn</li>
            <li style={{ marginBottom: 8 }}><strong>Văn phòng:</strong> Tầng 12, Tòa nhà Mega Tower, Phố Liễu Giai, Ba Đình, Hà Nội.</li>
            <li><strong>Thời gian phản hồi:</strong> Dưới 15 phút đối với các yêu cầu xác minh thanh toán trong thời gian diễn ra sự kiện.</li>
          </ul>
        </div>
      )
    },
    about: {
      title: 'Về MegaTicket Việt Nam',
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            MegaTicket là nền tảng phân phối vé điện tử và quản lý sự kiện thông minh, hiện đại hàng đầu Việt Nam.
          </p>
          <p style={{ marginBottom: 12 }}>
            Chúng tôi ứng dụng công nghệ cơ sở dữ liệu khóa chống trùng ghế (Pessimistic Locking), thanh toán VietQR tức thời, cùng hệ thống quét mã QR bảo mật cao tại cổng sự kiện giúp hàng triệu người hâm mộ tiếp cận các concert, đại nhạc hội và sự kiện thể thao nhanh chóng và an toàn tuyệt đối.
          </p>
        </div>
      )
    },
    terms: {
      title: 'Điều khoản sử dụng',
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>Người dùng tham gia đặt vé và sử dụng hệ thống cam kết:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Cung cấp thông tin họ tên, số điện thoại, email chính xác khi đăng ký tài khoản.</li>
            <li style={{ marginBottom: 8 }}>Không sử dụng bot, công cụ cào tự động gây quá tải hệ thống.</li>
            <li>Mọi hành vi sao chép mã QR vé hoặc lừa đảo mua bán vé chợ đen sẽ bị đình chỉ tài khoản và xử lý theo quy định pháp luật.</li>
          </ul>
        </div>
      )
    },
    privacy: {
      title: 'Chính sách bảo mật',
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>
            MegaTicket tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.
          </p>
          <p>
            Mọi thông tin danh tính, lịch sử giao dịch và tài khoản ngân hàng của bạn đều được mã hóa bằng tiêu chuẩn mã hóa tiên tiến và không bao giờ được chuyển giao cho bên thứ ba vì mục đích tiếp thị.
          </p>
        </div>
      )
    }
  }

  function openModal(key) {
    if (infoData[key]) {
      setModalContent(infoData[key])
    }
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 12V22H4V12"/>
                <path d="M22 7H2v5h20V7z"/>
                <path d="M12 22V7"/>
                <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
              </svg>
              Mega<span>Ticket</span>
            </Link>
            <p>Nền tảng mua bán vé sự kiện hàng đầu Việt Nam. Trải nghiệm đặt vé nhanh chóng, an toàn, tiện lợi.</p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42C1 8.14 1 11.75 1 11.75s0 3.61.46 5.33a2.78 2.78 0 001.95 1.96C5.12 19.5 12 19.5 12 19.5s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96C23 15.36 23 11.75 23 11.75s0-3.61-.46-5.33z"/>
                  <polygon fill="white" points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.52v-3.4a4.85 4.85 0 01-1.03-.12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Sự kiện */}
          <div className="footer-col">
            <h4>Khám phá</h4>
            <ul>
              <li><Link to="/">Âm nhạc & Concert</Link></li>
              <li><Link to="/">Thể thao & Giải đấu</Link></li>
              <li><Link to="/">Sân khấu & Nghệ thuật</Link></li>
              <li><Link to="/">Fan Meeting Idol</Link></li>
              <li><Link to="/">Lễ hội & Triển lãm</Link></li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div className="footer-col">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><button type="button" onClick={() => openModal('guide')}>Hướng dẫn mua vé</button></li>
              <li><button type="button" onClick={() => openModal('refund')}>Chính sách đổi trả</button></li>
              <li><button type="button" onClick={() => openModal('faq')}>Câu hỏi thường gặp</button></li>
              <li><button type="button" onClick={() => openModal('contact')}>Liên hệ hỗ trợ</button></li>
            </ul>
          </div>

          {/* Về chúng tôi */}
          <div className="footer-col">
            <h4>Về chúng tôi</h4>
            <ul>
              <li><button type="button" onClick={() => openModal('about')}>Giới thiệu MegaTicket</button></li>
              <li><button type="button" onClick={() => openModal('terms')}>Điều khoản sử dụng</button></li>
              <li><button type="button" onClick={() => openModal('privacy')}>Chính sách bảo mật</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>© 2026 MegaTicket. Được vận hành bởi Công ty Cổ phần MegaTicket Việt Nam.</p>
          <p>🔒 Thanh toán an toàn · VietQR · Chuyển khoản ngân hàng 24/7</p>
        </div>
      </div>

      <InfoModal
        isOpen={Boolean(modalContent)}
        onClose={() => setModalContent(null)}
        title={modalContent?.title || ''}
      >
        {modalContent?.content}
      </InfoModal>
    </footer>
  )
}
