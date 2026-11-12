package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/**
 * DTO thống kê tiến độ check-in tại cổng cho một sự kiện.
 */
@Getter
@Builder
public class EventCheckInStatsResponse {

    private UUID eventId;
    private String eventName;
    private long totalSoldTickets;
    private long checkedInTickets;
    private long remainingTickets;
}
