package com.example.demo.repository;

import com.example.demo.entity.OrderItem;
import com.example.demo.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByOrderId(UUID orderId);

    boolean existsByMerchandiseId(UUID merchandiseId);

    @Query("""
            SELECT SUM(oi.price * oi.quantity)
            FROM OrderItem oi
            WHERE oi.merchandise.event.id = :eventId
              AND oi.order.status = :orderStatus
            """)
    BigDecimal sumMerchandiseRevenueByEventId(UUID eventId, OrderStatus orderStatus);
}
