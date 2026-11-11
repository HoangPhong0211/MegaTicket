package com.example.demo.repository;

import com.example.demo.entity.Order;
import com.example.demo.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByUserId(UUID userId);

    List<Order> findByStatus(OrderStatus status);

    // Tìm các đơn PENDING đã hết hạn (dùng cho scheduled job giải phóng ghế)
    List<Order> findByStatusAndExpiresAtBefore(OrderStatus status, OffsetDateTime now);
}
