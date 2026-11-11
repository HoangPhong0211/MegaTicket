package com.example.demo.controller;

import com.example.demo.dto.response.EventResponse;
import com.example.demo.dto.response.SeatResponse;
import com.example.demo.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller công khai — xem sự kiện (không cần đăng nhập).
 * Đã khai báo permitAll trong SecurityConfig cho GET /api/events/**
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventController {

    private final EventService eventService;

    /** Danh sách tất cả sự kiện */
    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    /** Chi tiết một sự kiện */
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable UUID id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    /** Sơ đồ ghế (trạng thái từng ghế) trong một khu vực của sự kiện */
    @GetMapping("/{eventId}/zones/{zoneId}/seats")
    public ResponseEntity<List<SeatResponse>> getSeatsByZone(
            @PathVariable UUID eventId,
            @PathVariable UUID zoneId) {
        return ResponseEntity.ok(eventService.getSeatsByZone(eventId, zoneId));
    }
}
