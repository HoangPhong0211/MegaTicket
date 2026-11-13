package com.example.demo.repository;

import com.example.demo.entity.Merchandise;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchandiseRepository extends JpaRepository<Merchandise, UUID> {
    List<Merchandise> findByEventId(UUID eventId);

    @Modifying
    @Query("DELETE FROM Merchandise m WHERE m.event.id = :eventId")
    void deleteByEventId(UUID eventId);

    /**
     * Khóa vật phẩm khi trừ tồn kho trong transaction đặt hàng,
     * tránh race condition khi nhiều user mua sản phẩm cuối cùng cùng lúc.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Merchandise m WHERE m.id = :id")
    Optional<Merchandise> findByIdWithLock(UUID id);
}
