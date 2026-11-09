package com.example.demo.repository;

import com.example.demo.entity.SeatZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeatZoneRepository extends JpaRepository<SeatZone, UUID> {
    List<SeatZone> findByEventId(UUID eventId);
}
