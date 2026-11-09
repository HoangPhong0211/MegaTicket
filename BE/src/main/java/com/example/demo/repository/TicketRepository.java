package com.example.demo.repository;

import com.example.demo.entity.Ticket;
import com.example.demo.entity.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    Optional<Ticket> findByTicketCode(String ticketCode);
    List<Ticket> findByZoneIdAndStatus(UUID zoneId, TicketStatus status);
    List<Ticket> findByOrderId(UUID orderId);
}
