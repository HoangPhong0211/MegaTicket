-- ============================================================
-- MEGA TICKET - DATABASE INITIALIZATION SCRIPT (PostgreSQL)
-- ============================================================

-- Kích hoạt extension sinh UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG USERS (Người dùng)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG EVENTS (Sự kiện)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(255) NOT NULL,
    banner_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ONGOING', 'ENDED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG SEAT_ZONES (Khu vực ghế của sự kiện)
CREATE TABLE IF NOT EXISTS seat_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats > 0)
);

-- 4. BẢNG MERCHANDISE (Vật phẩm lưu niệm của sự kiện)
CREATE TABLE IF NOT EXISTS merchandise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT
);

-- 5. BẢNG ORDERS (Đơn đặt hàng)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 6. BẢNG TICKETS (Vé cụ thể)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES seat_zones(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    seat_number VARCHAR(30), -- NULL đối với vé đứng tự do (General Admission - GA)
    price DECIMAL(12, 2) NOT NULL, -- Snapshot giá vé lúc chốt đơn
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'PENDING', 'SOLD')),
    is_checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ
);

-- 7. BẢNG ORDER_ITEMS (Chi tiết quà tặng / vật phẩm trong đơn)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    merch_id UUID NOT NULL REFERENCES merchandise(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12, 2) NOT NULL -- Snapshot giá vật phẩm lúc chốt đơn
);

-- 8. BẢNG PAYMENTS (Lịch sử thanh toán giao dịch)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- VIETQR, MOMO, VISA
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    payment_response JSONB, -- Lưu trọn vẹn JSON Webhook từ cổng thanh toán
    paid_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES TỐI ƯU TRUY VẤN
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tickets_zone_status ON tickets(zone_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
