package com.example.demo.repository;

import com.example.demo.entity.Event;
import com.example.demo.entity.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByStatus(EventStatus status);
}
