package com.example.demo.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.response.PaymentInitResponse;
import com.example.demo.entity.Order;
import com.example.demo.entity.Payment;
import com.example.demo.entity.Ticket;
import com.example.demo.entity.User;
import com.example.demo.entity.enums.OrderStatus;
import com.example.demo.entity.enums.PaymentMethod;
import com.example.demo.entity.enums.PaymentStatus;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.TicketRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.ObjectMapper;

/**
 * Service xử lý thanh toán qua VietQR.
 *
 * Luồng thanh toán VietQR:
 * ┌─────────────────────────────────────────────────────────┐
 * │ 1. User tạo đơn hàng                                    │
 * │ 2. Client gọi POST /api/payments/vietqr/{orderId}       │
 * │    → Server sinh QR code, trả về data URL               │
 * │ 3. User quét QR bằng app ngân hàng, chuyển khoản        │
 * │ 4. VietQR server gọi webhook về POST /api/payments/webhook│
 * │    → Server xác nhận, chuyển đơn → PAID, vé → SOLD     │
 * └─────────────────────────────────────────────────────────┘
 *
 * Nội dung chuyển khoản (transfer content) đóng vai trò như "mã đơn hàng":
 * VietQR dùng nó để match giao dịch ngân hàng với đơn hàng trong hệ thống.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final TicketRepository ticketRepository;
    private final ObjectMapper objectMapper;

    // Thông tin tài khoản ngân hàng nhận tiền (cấu hình trong application.properties)
    @Value("${app.payment.bank-id:BIDV}")
    private String bankId;

    @Value("${app.payment.account-number:1234567890}")
    private String accountNumber;

    @Value("${app.payment.account-name:CONG TY MEGATICKET}")
    private String accountName;

    // VietQR API endpoint công khai
    private static final String VIETQR_API_URL = "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s";

    /**
     * Khởi tạo thanh toán VietQR cho một đơn hàng.
     *
     * - Tạo bản ghi Payment với trạng thái PENDING
     * - Sinh URL QR code từ VietQR API (không cần đăng ký, dùng public API)
     * - Nội dung CK = "MT" + 8 ký tự đầu orderId → dễ nhận dạng, ngắn gọn
     */
    @Transactional
    public PaymentInitResponse initiateVietQrPayment(UUID orderId, User currentUser) {
        Order order = orderService.getOrderRepository().findById(orderId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đơn hàng ID: " + orderId));

        if (!order.getUser().getId().equals(currentUser.getId())) {
            throw new BusinessException("Bạn không có quyền thanh toán đơn hàng này.");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException("Đơn hàng không ở trạng thái chờ thanh toán.");
        }

        // Kiểm tra đơn còn trong thời hạn
        if (order.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("Đơn hàng đã hết thời hạn thanh toán. Vui lòng tạo đơn mới.");
        }

        // Nội dung chuyển khoản: "MT" + 8 ký tự đầu UUID (không dấu)
        // Ví dụ: MT3F4A8B2C → dễ nhận dạng, ngắn gọn
        String transferContent = "MT" + orderId.toString().replace("-", "").substring(0, 8).toUpperCase();

        // Tái sử dụng bản ghi Payment PENDING nếu user bấm tạo lại QR (tránh trùng transactionId)
        Payment payment = paymentRepository.findByTransactionId(transferContent)
                .filter(p -> p.getOrder().getId().equals(orderId) && p.getStatus() == PaymentStatus.PENDING)
                .orElseGet(() -> paymentRepository.save(Payment.builder()
                        .order(order)
                        .amount(order.getTotalAmount())
                        .paymentMethod(PaymentMethod.VIETQR)
                        .status(PaymentStatus.PENDING)
                        .transactionId(transferContent)
                        .build()));

        // Sinh URL QR code từ VietQR Public API
        // Format: https://img.vietqr.io/image/{bankId}-{accountNumber}-compact2.png
        //         ?amount={amount}&addInfo={content}&accountName={name}
        String qrUrl = String.format(VIETQR_API_URL,
                bankId,
                accountNumber,
                order.getTotalAmount().longValue(),
                transferContent,
                accountName.replace(" ", "%20"));

        log.info("Khởi tạo thanh toán VietQR cho đơn {} - Nội dung CK: {}", orderId, transferContent);

        return PaymentInitResponse.builder()
                .paymentId(payment.getId())
                .orderId(orderId)
                .amount(order.getTotalAmount())
                .qrDataUrl(qrUrl)
                .transferContent(transferContent)
                .bankName(bankId)
                .accountNumber(accountNumber)
                .accountName(accountName)
                .build();
    }

    /**
     * Xử lý webhook từ VietQR khi có giao dịch thành công.
     *
     * VietQR server sẽ POST về endpoint này với payload JSON chứa:
     * - transferContent: nội dung chuyển khoản (dùng để match với đơn hàng)
     * - amount: số tiền
     * - transactionId: mã giao dịch ngân hàng
     *
     * QUAN TRỌNG: Trong production phải verify chữ ký (signature) webhook
     * để đảm bảo request đến từ VietQR, không phải kẻ giả mạo!
     *
     * @param payload Map chứa toàn bộ JSON webhook từ VietQR
     */
    @Transactional
    public void handleVietQrWebhook(Map<String, Object> payload) {
        log.info("Nhận VietQR webhook: {}", payload);

        // Lấy thông tin từ webhook payload
        // Tên field phụ thuộc vào VietQR API documentation
        String transferContent = extractString(payload, "content");
        String bankTransactionId = extractString(payload, "transactionId");
        String amountStr = extractString(payload, "transferAmount");
        if (amountStr == null) {
            amountStr = extractString(payload, "amount");
        }

        if (transferContent == null) {
            log.warn("Webhook thiếu transfer content, bỏ qua.");
            return;
        }

        // Tìm Payment theo nội dung chuyển khoản (hoặc mã giao dịch ngân hàng nếu webhook gửi lại)
        Payment payment = paymentRepository.findByTransactionId(transferContent)
                .or(() -> bankTransactionId != null
                        ? paymentRepository.findByTransactionId(bankTransactionId)
                        : java.util.Optional.empty())
                .orElse(null);

        if (payment == null) {
            log.warn("Không tìm thấy payment với transfer content: {}", transferContent);
            return;
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Payment {} đã được xử lý trước đó (idempotency check).", payment.getId());
            return; // Idempotency: webhook có thể gửi lại, không xử lý 2 lần
        }

        Order order = payment.getOrder();
        String jsonPayload = serializePayload(payload);

        // Kiểm tra đơn hàng còn đang chờ thanh toán hay đã bị hủy/hết hạn
        if (order.getStatus() != OrderStatus.PENDING) {
            log.warn("Đơn hàng {} không ở trạng thái PENDING (hiện tại: {}), đánh dấu payment FAILED.",
                    order.getId(), order.getStatus());
            payment.setPaymentResponse(jsonPayload);
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return;
        }

        // Kiểm tra thời hạn thanh toán (order.expiresAt)
        if (order.getExpiresAt() != null && order.getExpiresAt().isBefore(OffsetDateTime.now())) {
            log.warn("Đơn hàng {} đã quá hạn thanh toán ({}), hủy đơn và đánh dấu payment FAILED.",
                    order.getId(), order.getExpiresAt());
            payment.setPaymentResponse(jsonPayload);
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            orderService.releaseOrderResources(order);
            return;
        }

        // Kiểm tra số tiền chuyển khoản (nếu webhook có gửi kèm)
        if (amountStr != null) {
            try {
                BigDecimal paidAmount = new BigDecimal(amountStr);
                if (paidAmount.compareTo(order.getTotalAmount()) < 0) {
                    log.warn("Số tiền chuyển ({}) nhỏ hơn tổng đơn ({}) cho order {}",
                            paidAmount, order.getTotalAmount(), order.getId());
                    payment.setPaymentResponse(jsonPayload);
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                    return;
                }
            } catch (NumberFormatException e) {
                log.warn("Không parse được transferAmount từ webhook: {}", amountStr);
            }
        }

        // Lưu toàn bộ payload JSON hợp lệ để lưu vào cột JSONB (audit trail)
        payment.setPaymentResponse(jsonPayload);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(OffsetDateTime.now());
        if (bankTransactionId != null) payment.setTransactionId(bankTransactionId);
        paymentRepository.save(payment);

        // Xác nhận đơn hàng → PAID
        confirmOrderPaid(order);

        log.info("Thanh toán thành công! Order: {}, Payment: {}", order.getId(), payment.getId());
    }

    /**
     * Xác nhận đơn hàng đã thanh toán:
     * - Order: PENDING → PAID
     * - Ticket: PENDING → SOLD
     * - Sinh QR code vé điện tử
     * - Xóa Redis key timeout
     */
    @Transactional
    public void confirmOrderPaid(Order order) {
        order.setStatus(OrderStatus.PAID);

        // Sinh QR code URL cho vé điện tử
        // (đơn giản: dùng orderId làm QR data, trong production dùng thư viện sinh QR)
        String ticketQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + order.getId();
        order.setQrCodeUrl(ticketQrUrl);
        orderService.getOrderRepository().save(order);

        // Chuyển vé từ PENDING → SOLD
        List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
        tickets.forEach(t -> t.setStatus(TicketStatus.SOLD));
        ticketRepository.saveAll(tickets);

        // Xóa Redis timeout key (đơn đã thanh toán, không cần timeout nữa)
        orderService.getRedisTemplate().delete(orderService.getRedisKeyPrefix() + order.getId());

        log.info("Đơn hàng {} đã chuyển sang PAID, {} vé đã SOLD.", order.getId(), tickets.size());
    }

    // ========== HELPER ==========

    private String extractString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private String serializePayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.warn("Không thể serialize webhook payload sang JSON: {}", e.getMessage());
            return "{}";
        }
    }
}
