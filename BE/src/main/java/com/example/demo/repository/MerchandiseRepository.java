package com.example.demo.repository;

import com.example.demo.entity.Merchandise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MerchandiseRepository extends JpaRepository<Merchandise, UUID> {
    List<Merchandise> findByEventId(UUID eventId);
}
