/**
 * Footer - Chân trang
 */
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 12V22H4V12"/>
                <path d="M22 7H2v5h20V7z"/>
                <path d="M12 22V7"/>
                <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
              </svg>
              Mega<span>Ticket</span>
            </div>
            <p>Nền tảng mua bán vé sự kiện hàng đầu Việt Nam. Trải nghiệm đặt vé nhanh chóng, an toàn, tiện lợi.</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42C1 8.14 1 11.75 1 11.75s0 3.61.46 5.33a2.78 2.78 0 001.95 1.96C5.12 19.5 12 19.5 12 19.5s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96C23 15.36 23 11.75 23 11.75s0-3.61-.46-5.33z"/>
                  <polygon fill="white" points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                </svg>
              </a>
              <a href="#" aria-label="TikTok">
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
              <li><a href="#">Âm nhạc & Concert</a></li>
              <li><a href="#">Thể thao</a></li>
              <li><a href="#">Sân khấu & Nghệ thuật</a></li>
              <li><a href="#">Fan Meeting</a></li>
              <li><a href="#">Lễ hội & Triển lãm</a></li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div className="footer-col">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><a href="#">Hướng dẫn mua vé</a></li>
              <li><a href="#">Chính sách đổi trả</a></li>
              <li><a href="#">Câu hỏi thường gặp</a></li>
              <li><a href="#">Liên hệ hỗ trợ</a></li>
              <li><a href="#">Báo cáo sự cố</a></li>
            </ul>
          </div>

          {/* Về chúng tôi */}
          <div className="footer-col">
            <h4>Về chúng tôi</h4>
            <ul>
              <li><a href="#">Giới thiệu</a></li>
              <li><a href="#">Quy chế hoạt động</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản sử dụng</a></li>
              <li><a href="#">Tổ chức sự kiện</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>© 2026 MegaTicket. Được vận hành bởi Công ty Cổ phần MegaTicket Việt Nam.</p>
          <p>🔒 Thanh toán an toàn · VNPAY · MoMo · Thẻ ngân hàng</p>
        </div>
      </div>
    </footer>
  )
}
