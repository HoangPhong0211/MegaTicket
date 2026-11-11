package com.example.demo.repository;

import com.example.demo.entity.Ticket;
import com.example.demo.entity.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    List<Ticket> findByOrderId(UUID orderId);

    // Đếm số vé còn trống theo zone (dùng cho EventResponse.availableSeats)
    long countByZoneIdAndStatus(UUID zoneId, TicketStatus status);

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
}
