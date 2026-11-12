package com.example.demo.dto.response;

import com.example.demo.entity.enums.TicketStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO hiển thị Vé điện tử (E-Ticket) cho khách hàng sau khi thanh toán thành công.
 * Gom đủ thông tin vé, QR check-in và thông tin sự kiện để FE render trực tiếp.
 */
@Getter
@Builder
public class ETicketResponse {

    private UUID ticketId;
    private UUID orderId;
    private String ticketCode;
    private String seatNumber;
    private BigDecimal price;
    private TicketStatus status;
    private Boolean isCheckedIn;
    private OffsetDateTime checkedInAt;

    // QR URL chứa chính ticketCode để nhân viên cổng quét soát vé
    private String ticketQrUrl;
    // QR tổng của đơn hàng (từ Order.qrCodeUrl)
    private String orderQrCodeUrl;

    // Thông tin khu vực ghế & sự kiện
    private String zoneName;
    private UUID eventId;
    private String eventName;
    private String eventLocation;
    private OffsetDateTime eventStartTime;
    private OffsetDateTime eventEndTime;
    private String eventBannerUrl;
}
