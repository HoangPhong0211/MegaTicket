package com.example.demo.controller;

import com.example.demo.dto.response.PaymentInitResponse;
import com.example.demo.entity.User;
import com.example.demo.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller xử lý thanh toán.
 *
 * POST /api/payments/vietqr/{orderId} → Khởi tạo thanh toán, lấy QR code
 * POST /api/payments/webhook          → VietQR server callback (PUBLIC - không cần JWT)
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Khởi tạo thanh toán VietQR cho đơn hàng.
     * Yêu cầu đăng nhập và chỉ chủ đơn hàng mới được khởi tạo thanh toán.
     */
    @PostMapping("/vietqr/{orderId}")
    public ResponseEntity<PaymentInitResponse> initiateVietQrPayment(
            @PathVariable UUID orderId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.initiateVietQrPayment(orderId, currentUser));
    }

    /**
     * Webhook nhận callback từ VietQR khi có giao dịch.
     *
     * QUAN TRỌNG: Endpoint này phải PUBLIC (không cần JWT) vì VietQR server
     * gọi trực tiếp, không có token của user.
     *
     * Đã khai báo permitAll trong SecurityConfig:
     * .requestMatchers("/api/payments/webhook").permitAll()
     *
     * Trong production phải thêm:
     * 1. Verify chữ ký HMAC-SHA256 từ header X-Checksum
     * 2. Whitelist IP của VietQR server
     * 3. Rate limiting
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody Map<String, Object> payload) {
        log.info("Nhận VietQR webhook callback");
        paymentService.handleVietQrWebhook(payload);
        // VietQR yêu cầu trả về { "code": "00" } khi nhận webhook thành công
        return ResponseEntity.ok(Map.of("code", "00", "desc", "success"));
    }
}
