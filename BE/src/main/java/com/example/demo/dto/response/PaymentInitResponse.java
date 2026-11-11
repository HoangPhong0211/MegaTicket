package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO trả về sau khi khởi tạo thanh toán VietQR.
 * Client dùng qrDataUrl để hiển thị QR code cho user quét.
 */
@Getter
@Builder
public class PaymentInitResponse {

    private UUID paymentId;
    private UUID orderId;
    private BigDecimal amount;

    // Data URL của QR code (base64 PNG) hoặc URL hình ảnh QR từ VietQR API
    private String qrDataUrl;

    // Nội dung chuyển khoản (bank transfer description)
    // Dùng để VietQR webhook nhận dạng và match với đơn hàng nào
    private String transferContent;

    // Thông tin tài khoản ngân hàng để hiển thị cho user
    private String bankName;
    private String accountNumber;
    private String accountName;
}
