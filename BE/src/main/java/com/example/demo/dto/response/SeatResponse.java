package com.example.demo.dto.response;

import com.example.demo.entity.enums.TicketStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO hiển thị sơ đồ ghế của một khu vực (Zone).
 * Không trả về ticketCode để tránh lộ mã check-in trước khi user thanh toán.
 */
@Getter
@Builder
public class SeatResponse {
    private UUID id;
    private String seatNumber;
    private BigDecimal price;
    private TicketStatus status;
}
