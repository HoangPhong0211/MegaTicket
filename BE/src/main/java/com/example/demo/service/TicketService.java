package com.example.demo.service;

import com.example.demo.dto.response.CheckInResponse;
import com.example.demo.dto.response.ETicketResponse;
import com.example.demo.dto.response.EventCheckInStatsResponse;
import com.example.demo.entity.Event;
import com.example.demo.entity.Order;
import com.example.demo.entity.Ticket;
import com.example.demo.entity.User;
import com.example.demo.entity.enums.EventStatus;
import com.example.demo.entity.enums.OrderStatus;
import com.example.demo.entity.enums.TicketStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý Vé điện tử (E-Ticket) cho Khách hàng và Soát vé (Check-in QR) cho Admin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private static final String QR_API_PREFIX = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=";

    private final TicketRepository ticketRepository;
    private final OrderRepository orderRepository;
    private final EventRepository eventRepository;

    // ========== KHÁCH HÀNG: XEM VÉ ĐIỆN TỬ ==========

    /**
     * Lấy tất cả vé điện tử hợp lệ (đơn PAID, vé SOLD) của user đang đăng nhập.
     */
    @Transactional(readOnly = true)
    public List<ETicketResponse> getMyETickets(User currentUser) {
        return ticketRepository.findUserETickets(
                        currentUser.getId(), OrderStatus.PAID, TicketStatus.SOLD)
                .stream()
                .map(this::toETicketResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách vé điện tử thuộc một đơn hàng cụ thể của user.
     * Chỉ trả về nếu đơn thuộc sở hữu user và đã thanh toán (PAID),
     * tránh lộ ticketCode khi đơn còn PENDING hoặc đã CANCELLED.
     */
    @Transactional(readOnly = true)
    public List<ETicketResponse> getETicketsByOrder(UUID orderId, User currentUser) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đơn hàng ID: " + orderId));

        if (!order.getUser().getId().equals(currentUser.getId())) {
            throw new BusinessException("Bạn không có quyền xem vé của đơn hàng này.");
        }

        if (order.getStatus() != OrderStatus.PAID) {
            throw new BusinessException("Đơn hàng chưa thanh toán thành công, chưa có vé điện tử.");
        }

        return ticketRepository.findByOrderId(orderId)
                .stream()
                .map(this::toETicketResponse)
                .collect(Collectors.toList());
    }

    // ========== ADMIN: SOÁT VÉ / CHECK-IN QR ==========

    /**
     * Soát vé tại cổng bằng mã ticketCode (đọc từ QR code trên vé điện tử).
     *
     * Dùng PESSIMISTIC_WRITE lock để đảm bảo 1 vé không thể check-in đồng thời ở 2 cổng.
     */
    @Transactional
    public CheckInResponse checkInByTicketCode(String rawTicketCode) {
        String ticketCode = rawTicketCode.trim();

        Ticket ticket = ticketRepository.findByTicketCodeWithLock(ticketCode)
                .orElseThrow(() -> new BusinessException("Mã vé không tồn tại: " + ticketCode));

        if (ticket.getStatus() != TicketStatus.SOLD
                || ticket.getOrder() == null
                || ticket.getOrder().getStatus() != OrderStatus.PAID) {
            throw new BusinessException("Vé '" + ticketCode + "' chưa được thanh toán hợp lệ.");
        }

        Event event = ticket.getZone().getEvent();
        if (event.getStatus() == EventStatus.ENDED) {
            throw new BusinessException("Sự kiện '" + event.getName() + "' đã kết thúc, không thể check-in.");
        }

        if (Boolean.TRUE.equals(ticket.getIsCheckedIn())) {
            throw new BusinessException("Vé '" + ticketCode + "' đã được check-in trước đó lúc "
                    + ticket.getCheckedInAt() + ".");
        }

        ticket.setIsCheckedIn(true);
        ticket.setCheckedInAt(OffsetDateTime.now());
        ticketRepository.save(ticket);

        User owner = ticket.getOrder().getUser();
        log.info("Check-in thành công vé {} - Sự kiện: '{}' - Khách: {}",
                ticketCode, event.getName(), owner.getEmail());

        return CheckInResponse.builder()
                .ticketId(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .seatNumber(ticket.getSeatNumber())
                .zoneName(ticket.getZone().getName())
                .eventId(event.getId())
                .eventName(event.getName())
                .ownerFullName(owner.getFullName())
                .ownerEmail(owner.getEmail())
                .isCheckedIn(true)
                .checkedInAt(ticket.getCheckedInAt())
                .message("Check-in hợp lệ! Chào mừng quý khách.")
                .build();
    }

    /**
     * Thống kê tiến độ check-in tại cổng cho một sự kiện.
     */
    @Transactional(readOnly = true)
    public EventCheckInStatsResponse getEventCheckInStats(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sự kiện ID: " + eventId));

        long totalSold = ticketRepository.countByZoneEventIdAndStatus(eventId, TicketStatus.SOLD);
        long checkedIn = ticketRepository.countByZoneEventIdAndStatusAndIsCheckedInTrue(eventId, TicketStatus.SOLD);

        return EventCheckInStatsResponse.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .totalSoldTickets(totalSold)
                .checkedInTickets(checkedIn)
                .remainingTickets(Math.max(0, totalSold - checkedIn))
                .build();
    }

    // ========== PRIVATE HELPER ==========

    private ETicketResponse toETicketResponse(Ticket ticket) {
        Event event = ticket.getZone().getEvent();
        Order order = ticket.getOrder();
        String encodedCode = URLEncoder.encode(ticket.getTicketCode(), StandardCharsets.UTF_8);

        return ETicketResponse.builder()
                .ticketId(ticket.getId())
                .orderId(order.getId())
                .ticketCode(ticket.getTicketCode())
                .seatNumber(ticket.getSeatNumber())
                .price(ticket.getPrice())
                .status(ticket.getStatus())
                .isCheckedIn(ticket.getIsCheckedIn())
                .checkedInAt(ticket.getCheckedInAt())
                .ticketQrUrl(QR_API_PREFIX + encodedCode)
                .orderQrCodeUrl(order.getQrCodeUrl())
                .zoneName(ticket.getZone().getName())
                .eventId(event.getId())
                .eventName(event.getName())
                .eventLocation(event.getLocation())
                .eventStartTime(event.getStartTime())
                .eventEndTime(event.getEndTime())
                .eventBannerUrl(event.getBannerUrl())
                .build();
    }
}
