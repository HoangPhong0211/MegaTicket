package com.example.demo.repository;

import com.example.demo.entity.Ticket;
import com.example.demo.entity.enums.OrderStatus;
import com.example.demo.entity.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    /**
     * Khóa vé theo ticketCode khi Admin check-in QR,
     * tránh 2 cổng soát vé quét cùng một mã vé tại cùng thời điểm.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Ticket t WHERE t.ticketCode = :ticketCode")
    Optional<Ticket> findByTicketCodeWithLock(String ticketCode);

    List<Ticket> findByOrderId(UUID orderId);

    /**
     * Lấy toàn bộ vé điện tử (SOLD + đơn PAID) của một user, fetch join để tránh N+1.
     */
    @Query("""
            SELECT t FROM Ticket t
            JOIN FETCH t.zone z
            JOIN FETCH z.event e
            JOIN FETCH t.order o
            WHERE o.user.id = :userId
              AND o.status = :orderStatus
              AND t.status = :ticketStatus
            ORDER BY e.startTime ASC, t.seatNumber ASC
            """)
    List<Ticket> findUserETickets(UUID userId, OrderStatus orderStatus, TicketStatus ticketStatus);

    // Đếm số vé còn trống theo zone (dùng cho EventResponse.availableSeats)
    long countByZoneIdAndStatus(UUID zoneId, TicketStatus status);

    // Thống kê vé toàn hệ thống & theo từng sự kiện
    long countByStatus(TicketStatus status);

    long countByStatusAndIsCheckedInTrue(TicketStatus status);

    long countByZoneEventIdAndStatus(UUID eventId, TicketStatus status);

    long countByZoneEventIdAndStatusAndIsCheckedInTrue(UUID eventId, TicketStatus status);

    @Query("SELECT SUM(t.price) FROM Ticket t WHERE t.zone.event.id = :eventId AND t.status = :status")
    BigDecimal sumTicketRevenueByEventId(UUID eventId, TicketStatus status);

    /**
     * Lấy N vé AVAILABLE của một zone với Pessimistic Write Lock.
     * Lock ngăn các transaction khác đọc/ghi các rows này cùng lúc,
     * giải quyết race condition khi nhiều user cùng chọn ghế một zone.
     *
     * LIMIT truyền qua Spring Data JPA Pageable hoặc native query.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Ticket t WHERE t.zone.id = :zoneId AND t.status = :status")
    List<Ticket> findByZoneIdAndStatusWithLock(UUID zoneId, TicketStatus status,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Khóa các vé cụ thể theo danh sách ID (dùng khi user chọn từng ghế trên sơ đồ).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Ticket t WHERE t.id IN :ticketIds")
    List<Ticket> findAllByIdWithLock(List<UUID> ticketIds);

    // Lấy toàn bộ ghế trong một zone để hiển thị sơ đồ ghế
    List<Ticket> findByZoneIdOrderBySeatNumberAscTicketCodeAsc(UUID zoneId);

    // Lấy vé theo order (dùng để build OrderResponse)
    List<Ticket> findByZoneIdAndStatus(UUID zoneId, TicketStatus status);

    // Kiểm tra & dọn dẹp vé khi xóa Zone hoặc Sự kiện
    boolean existsByZoneEventIdAndOrderIsNotNull(UUID eventId);

    boolean existsByZoneEventIdAndStatusNot(UUID eventId, TicketStatus status);

    boolean existsByZoneIdAndOrderIsNotNull(UUID zoneId);

    boolean existsByZoneIdAndStatusNot(UUID zoneId, TicketStatus status);

    long countByZoneId(UUID zoneId);

    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.zone.event.id = :eventId")
    void deleteByZoneEventId(UUID eventId);

    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.zone.id = :zoneId")
    void deleteByZoneId(UUID zoneId);
}
