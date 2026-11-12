package com.example.demo.service;

import com.example.demo.dto.response.RevenueStatsResponse;
import com.example.demo.entity.Event;
import com.example.demo.entity.enums.OrderStatus;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service thống kê doanh thu & trạng thái đơn hàng cho Admin.
 */
@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final OrderItemRepository orderItemRepository;
    private final EventRepository eventRepository;

    @Transactional(readOnly = true)
    public RevenueStatsResponse getRevenueStats() {
        BigDecimal totalRevenue = orZero(orderRepository.sumTotalAmountByStatus(OrderStatus.PAID));
        long paidOrders = orderRepository.countByStatus(OrderStatus.PAID);
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);

        long totalTicketsSold = ticketRepository.countByStatus(TicketStatus.SOLD);
        long totalTicketsCheckedIn = ticketRepository.countByStatusAndIsCheckedInTrue(TicketStatus.SOLD);

        List<Event> events = eventRepository.findAll();
        List<RevenueStatsResponse.EventRevenueSummary> eventStats = events.stream()
                .map(event -> {
                    long sold = ticketRepository.countByZoneEventIdAndStatus(event.getId(), TicketStatus.SOLD);
                    long checkedIn = ticketRepository.countByZoneEventIdAndStatusAndIsCheckedInTrue(
                            event.getId(), TicketStatus.SOLD);
                    BigDecimal ticketRev = orZero(ticketRepository.sumTicketRevenueByEventId(
                            event.getId(), TicketStatus.SOLD));
                    BigDecimal merchRev = orZero(orderItemRepository.sumMerchandiseRevenueByEventId(
                            event.getId(), OrderStatus.PAID));
                    return RevenueStatsResponse.EventRevenueSummary.builder()
                            .eventId(event.getId())
                            .eventName(event.getName())
                            .ticketsSold(sold)
                            .ticketsCheckedIn(checkedIn)
                            .ticketRevenue(ticketRev)
                            .merchandiseRevenue(merchRev)
                            .totalEventRevenue(ticketRev.add(merchRev))
                            .build();
                })
                .collect(Collectors.toList());

        return RevenueStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(paidOrders + pendingOrders + cancelledOrders)
                .paidOrders(paidOrders)
                .pendingOrders(pendingOrders)
                .cancelledOrders(cancelledOrders)
                .totalTicketsSold(totalTicketsSold)
                .totalTicketsCheckedIn(totalTicketsCheckedIn)
                .eventStats(eventStats)
                .build();
    }

    private BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
