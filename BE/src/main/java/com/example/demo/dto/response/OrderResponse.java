package com.example.demo.dto.response;

import com.example.demo.entity.enums.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO trả về thông tin đơn hàng.
 * Dùng để hiển thị chi tiết đơn hàng cho user và làm input cho màn hình thanh toán.
 */
@Getter
@Builder
public class OrderResponse {

    private UUID id;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private OffsetDateTime createdAt;
    private OffsetDateTime expiresAt; // thời hạn thanh toán (10 phút sau khi tạo)
    private String qrCodeUrl;         // URL QR code (chỉ có sau khi thanh toán)

    private List<TicketInfo> tickets;
    private List<MerchInfo> merchandises;

    @Getter
    @Builder
    public static class TicketInfo {
        private UUID ticketId;
        private String ticketCode;
        private String seatNumber;
        private String zoneName;
        private BigDecimal price;
    }

    @Getter
    @Builder
    public static class MerchInfo {
        private UUID merchandiseId;
        private String merchandiseName;
        private Integer quantity;
        private BigDecimal price;
    }
}
