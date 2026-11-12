package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO thống kê đơn hàng & doanh thu dành cho Admin Dashboard.
 */
@Getter
@Builder
public class RevenueStatsResponse {

    private BigDecimal totalRevenue;
    private long totalOrders;
    private long paidOrders;
    private long pendingOrders;
    private long cancelledOrders;
    private long totalTicketsSold;
    private long totalTicketsCheckedIn;

    private List<EventRevenueSummary> eventStats;

    @Getter
    @Builder
    public static class EventRevenueSummary {
        private UUID eventId;
        private String eventName;
        private long ticketsSold;
        private long ticketsCheckedIn;
        private BigDecimal ticketRevenue;
        private BigDecimal merchandiseRevenue;
        private BigDecimal totalEventRevenue;
    }
}
