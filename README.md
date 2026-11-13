# 🎟️ MegaTicket - Nền Tảng Phân Phối Vé Sự Kiện Trực Tuyến & Soát Vé Thông Minh

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg?style=flat&logo=openjdk)](https://adoptium.net/)
[![Spring Boot 4.1.2](https://img.shields.io/badge/Spring%20Boot-4.1.2-brightgreen.svg?style=flat&logo=springboot)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-blue.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3.6-purple.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue.svg?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7-red.svg?style=flat&logo=redis)](https://redis.io/)
[![Google Gemini AI](https://img.shields.io/badge/Gemini%20AI-Flash%20Lite-blueviolet.svg?style=flat&logo=google)](https://ai.google.dev/)
[![Oxlint](https://img.shields.io/badge/Oxlint-0%20warnings-brightgreen.svg)](https://oxc.rs/)

> **MegaTicket** là hệ thống phân phối vé sự kiện và quản lý soát vé điện tử toàn diện, hiện đại, lấy cảm hứng thiết kế từ các nền tảng bán vé hàng đầu. Hệ thống được tối ưu hóa xử lý đồng thời lưu lượng cao, giải quyết triệt để bài toán tranh chấp ghế (race condition), tích hợp thanh toán VietQR tự động và hỗ trợ trợ lý ảo trí tuệ nhân tạo (Google Gemini AI).

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. 🛡️ Đặt Vé Đồng Thời & Chống Trùng Ghế Tuyệt Đối (Concurrency Safe)
- **Pessimistic Locking (`SELECT ... FOR UPDATE`):** Khóa bản ghi cấp cơ sở dữ liệu khi khách hàng chọn ghế hoặc đặt vé theo số lượng. Ngăn chặn 100% hiện tượng 2 người mua cùng 1 ghế tại cùng một mili-giây.
- **Hỗ trợ 2 chế độ đặt chỗ:**
  - *Sơ đồ ghế trực quan:* Khách hàng chủ động click chọn từng vị trí yêu thích.
  - *Đặt nhanh theo số lượng:* Hệ thống tự động phân bổ và khóa số lượng vé trống khả dụng tốt nhất.

### 2. ⏳ Giữ Chỗ Đơn Hàng 10 Phút & Tự Động Thu Hồi (Redis TTL)
- Mỗi đơn hàng được cấp thời gian thanh toán chính xác **10 phút**, theo dõi bởi Redis TTL.
- **Tự động giải phóng tài nguyên:** Tác vụ nền `@Scheduled` phối hợp Redis tự động hoàn trả vé về trạng thái `AVAILABLE` và phục hồi tồn kho vật phẩm nếu đơn hàng quá hạn mà chưa thanh toán.

### 3. 💳 Thanh Toán VietQR Tự Động 24/7 (VietQR Webhook)
- Tự động sinh mã QR chuyển khoản ngân hàng chuẩn NAPAS247 kèm mã nội dung chuyển khoản định danh (`MTxxxxxxxx`).
- **Webhook tức thời & Bảo mật:** Xác thực số tiền thanh toán, kiểm tra chống thanh toán lặp (Idempotent), tự động hủy và từ chối ghi nhận nếu tiền về sau khi đơn hàng đã hết hạn (`Payment Timeout Guard`).

### 4. 📲 Vé Điện Tử (E-Ticket) & Soát Vé QR Tại Cổng
- Khách hàng sở hữu vé điện tử kèm mã QR cá nhân hóa ngay sau khi thanh toán thành công.
- Mã định danh vé (`ticketCode`) được bảo mật tuyệt đối, chỉ hiển thị sau khi đơn hàng đã chuyển sang `PAID`.
- Ứng dụng soát vé dành riêng cho Ban tổ chức: quét QR bằng camera, áp dụng Pessimistic Lock chống quét lặp lại giữa các cửa soát vé khác nhau.

### 5. 🤖 Trợ Lý Ảo CSKH Thông Minh (Google Gemini AI)
- Tích hợp **Google Gen AI Java SDK** với mô hình `gemini-3.5-flash-lite` tối ưu tốc độ phản hồi cực nhanh.
- Thiết lập `thinking_level=MINIMAL` chuyên dụng cho chatbot giao tiếp người dùng.
- Chatbot tự động nạp ngữ cảnh dữ liệu sự kiện thực tế (giá vé, ngày diễn ra, khu vực ghế, chính sách hoàn hủy) để tư vấn chính xác 24/7.

### 6. 📊 Dashboard Quản Trị Toàn Diện (Admin Panel)
- Quản lý sự kiện, khu vực ghế (tự động cập nhật giá và sinh bù vé khi tăng số lượng ghế).
- Quản lý kho hàng lưu niệm (Merchandise) đi kèm sự kiện.
- Thống kê doanh thu, tỷ lệ lấp đầy ghế và tiến độ check-in theo thời gian thực.

---

## 🏛️ Kiến Trúc Công Nghệ (Tech Stack)

### Backend
- **Ngôn ngữ:** Java 21 (LTS)
- **Framework:** Spring Boot 4.1.2 (Spring Data JPA, Spring Security 7, Spring Validation, Spring WebMVC)
- **ORM / Persistence:** Hibernate 7.4.x, PostgreSQL JDBC Driver
- **Authentication:** Stateless JWT (JSON Web Token - `io.jsonwebtoken:jjwt:0.12.6`), BCrypt Password Hashing
- **Caching & Lock:** Redis 7, Spring Data Redis (`StringRedisTemplate`)
- **AI Integration:** Google Gen AI Java SDK (`com.google.genai:google-genai:1.80.0`)
- **Testing:** JUnit 5, Mockito, Spring Boot Starter Test (20/20 unit tests đạt 100% Pass)

### Frontend
- **Framework:** React 19, Vite 8.3.6
- **Routing:** React Router DOM 7
- **HTTP Client:** Axios với bộ Interceptor tự động gắn JWT Token
- **Kiểu dáng (Styling):** Modern Dark Theme, CSS Variables, Responsive Design
- **Chất lượng mã nguồn:** Oxlint (0 lỗi, 0 cảnh báo)

### Hạ tầng & CSDL
- **RDBMS:** PostgreSQL 16 Alpine
- **In-Memory Cache:** Redis 7 Alpine
- **Containerization:** Docker & Docker Compose

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```text
MegaTicket/
├── BE/                               # Backend Spring Boot 4
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/demo/
│   │   │   │   ├── config/          # SecurityConfig, DataInitializer, GeminiConfig
│   │   │   │   ├── controller/      # Auth, Event, Order, Payment, Ticket, Admin, Chatbot
│   │   │   │   ├── dto/             # Request & Response DTOs
│   │   │   │   ├── entity/          # JPA Entities (User, Event, SeatZone, Ticket, Order, v.v.)
│   │   │   │   ├── exception/       # GlobalExceptionHandler, BusinessException
│   │   │   │   ├── repository/      # Spring Data JPA Repositories
│   │   │   │   └── service/         # Business Logic Layer (Order, Event, Payment, AI, v.v.)
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                    # Unit tests độc lập (Event, Order, Payment, Ticket)
│   ├── .env.example
│   └── pom.xml
├── FE/                               # Frontend React 19 + Vite
│   ├── src/
│   │   ├── components/              # Navbar, Footer, EventCard, InfoModal, ChatbotWidget...
│   │   ├── context/                 # AuthContext
│   │   ├── pages/                   # HomePage, EventsPage, EventDetailPage, AdminPage...
│   │   ├── services/                # API client (Axios)
│   │   └── utils/                   # Định dạng tiền tệ, ngày giờ, helpers
│   ├── .oxlintrc.json
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── init.sql                     # Script khởi tạo Schema PostgreSQL chuẩn hóa
├── ảnh/                             # Sơ đồ Use Case & Sơ đồ ERD thực tế
├── docker-compose.yml               # Cấu hình container PostgreSQL 16 & Redis 7
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### 1. Yêu Cầu Môi Trường (Prerequisites)
- **Java:** JDK 21 trở lên ([Tải OpenJDK 21](https://adoptium.net/))
- **Node.js:** Node 18.x trở lên & npm ([Tải Node.js](https://nodejs.org/))
- **Docker:** Docker Desktop hoặc Docker Engine + Docker Compose ([Tải Docker](https://www.docker.com/))
- **Gemini API Key (Tùy chọn):** Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/apikey) để sử dụng tính năng Chatbot AI.

---

### 2. Khởi Động Cơ Sở Dữ Liệu (PostgreSQL & Redis)

Tại thư mục gốc của dự án, mở Terminal và chạy lệnh:

```bash
docker-compose up -d
```

> Docker sẽ tự động tải và khởi chạy:
> - **PostgreSQL 16**: Cổng `5432` (`POSTGRES_DB=megaticket_db`, `USER=postgres`, `PASSWORD=postgrespassword`). Script `database/init.sql` sẽ được tự động kích hoạt để khởi tạo bảng và chỉ mục.
> - **Redis 7**: Cổng `6379`.

---

### 3. Cấu Hình & Chạy Backend (Spring Boot)

1. Di chuyển vào thư mục `BE`:
   ```bash
   cd BE
   ```

2. *(Tùy chọn)* Cấu hình Gemini AI Chatbot:
   Sao chép file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
   Mở file `.env` và điền khóa API của bạn:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   GEMINI_THINKING_LEVEL=MINIMAL
   ```
   *(Nếu không điền API Key, các tính năng bán vé, đặt chỗ, thanh toán vẫn hoạt động bình thường, Chatbot sẽ hiển thị phản hồi mẫu hướng dẫn).*

3. Khởi chạy Backend bằng Maven Wrapper:
   - **Trên Windows:**
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
   - **Trên Linux/macOS:**
     ```bash
     ./mvnw spring-boot:run
     ```

> Khi khởi động lần đầu, `DataInitializer` sẽ tự động khởi tạo:
> - Tài khoản Quản trị viên mẫu
> - Sự kiện âm nhạc mẫu *"MegaTicket Live Music Concert 2026"*
> - 2 phân khu ghế: **VIP A** (10 ghế) và **GA B** (50 vé đứng tự do)
> - Sản phẩm lưu niệm mẫu
> Backend sẵn sàng lắng nghe tại: `http://localhost:8080`

---

### 4. Cấu Hình & Chạy Frontend (React + Vite)

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục `FE`:
   ```bash
   cd FE
   ```

2. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   npm install
   ```

3. Khởi chạy môi trường phát triển (Dev Server):
   ```bash
   npm run dev
   ```

4. Truy cập giao diện ứng dụng tại:
   👉 **`http://localhost:5173`**

---

## 🔑 Tài Khoản Đăng Nhập Mẫu (Default Credentials)

| Vai trò (Role) | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@megaticket.vn` | `admin123` | Quản lý sự kiện, khu vực vé, kho lưu niệm, quét mã QR check-in, xem doanh thu |
| **Khách hàng (User)** | Tự đăng ký trực tiếp tại trang `/register` | Tùy chọn (từ 6 ký tự) | Xem sự kiện, chọn sơ đồ ghế, đặt vé, mua vật phẩm, quét VietQR, nhận vé điện tử |

---

## 🧪 Kiểm Thử Tự Động & Đảm Bảo Chất Lượng (Testing & QA)

Dự án được trang bị bộ kiểm thử tự động toàn diện:

### 1. Backend Unit Tests
Chạy toàn bộ 20 bài kiểm thử tích hợp Mockito (kiểm tra tạo đơn, hủy đơn, khóa tài nguyên, check-in, webhook):
```bash
cd BE
.\mvnw.cmd test
```
*Kết quả: **20/20 test cases Passed (0 Failures, 0 Errors)**.*

### 2. Frontend Code Quality & Build Check
```bash
cd FE
# Kiểm tra tĩnh không lỗi / cảnh báo
npm run lint

# Biên dịch gói sản phẩm tối ưu (Production Build)
npm run build
```
*Kết quả: **0 warnings, 0 errors**; thời gian build ~1.3s.*

---

## 📋 Danh Sách API Chính (Core RESTful Endpoints)

| Phương thức | Endpoint | Mô tả | Quyền hạn |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Đăng ký tài khoản người dùng mới | Public |
| `POST` | `/api/auth/login` | Đăng nhập nhận JWT Access Token | Public |
| `GET` | `/api/events` | Lấy danh sách sự kiện kèm số lượng vé trống | Public |
| `GET` | `/api/events/{id}` | Xem chi tiết sự kiện và danh sách phân khu | Public |
| `GET` | `/api/events/zones/{zoneId}/seats` | Xem sơ đồ ghế thời gian thực của khu vực | Public |
| `POST` | `/api/orders` | Tạo đơn đặt vé (Áp dụng Pessimistic Lock) | Authenticated |
| `GET` | `/api/orders/my-orders` | Xem lịch sử đơn hàng của bản thân | Authenticated |
| `POST` | `/api/orders/{id}/cancel` | Hủy đơn hàng PENDING & giải phóng ghế | Authenticated |
| `POST` | `/api/payments/vietqr/{orderId}` | Khởi tạo thanh toán VietQR | Authenticated |
| `POST` | `/api/payments/webhook` | Webhook ngân hàng xác nhận giao dịch | Public / Bank |
| `GET` | `/api/tickets/my-tickets` | Lấy danh sách vé điện tử kèm mã QR | Authenticated |
| `POST` | `/api/admin/tickets/check-in` | Soát vé QR tại cổng sự kiện | Admin |
| `GET` | `/api/admin/revenue` | Thống kê doanh thu toàn hệ thống | Admin |
| `POST` | `/api/admin/events` | Tạo mới sự kiện và phân khu ghế | Admin |
| `PUT` | `/api/admin/events/{eId}/zones/{zId}` | Cập nhật tên/giá và mở rộng số ghế | Admin |
| `DELETE`| `/api/admin/events/{id}` | Xóa sự kiện an toàn | Admin |
| `POST` | `/api/chat` | Hỏi đáp trợ lý ảo Gemini AI CSKH | Public |

---

## 📄 Bản Quyền & Tác Giả (License & Author)

- **Tác giả:** [HoangPhong0211](https://github.com/HoangPhong0211)
- **Dự án:** MegaTicket - Nền tảng phân phối vé trực tuyến & quản trị sự kiện thông minh.
- Dự án được phát triển phục vụ mục đích nghiên cứu, học tập và triển khai thực tế. Mọi đóng góp (Pull Request / Issue) đều được chào đón!
